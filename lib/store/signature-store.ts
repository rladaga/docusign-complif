/**
 * Signature Request Store
 *
 * Maneja el ciclo de vida completo de signature requests:
 * - Crear request desde un template
 * - Asignar firmantes con sus grupos
 * - Calcular combinaciones válidas
 * - Procesar firmas
 * - Verificar completitud
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import {
  SignatureRequest,
  SignerAssignment,
  Signature,
  DocumentStatus,
  SignerStatus,
  Faculty,
  SignatureCombination,
} from '@/lib/types';
import { NotificationService } from '@/lib/services/notifications';

import {
  calculateValidCombinations,
  isRequestComplete,
  getRemainingCombinations,
} from '@/lib/utils/combinatorics';

// ================
// STATE INTERFACE
// ================

interface SignatureState {
  // Data
  requests: SignatureRequest[];
  currentRequest: SignatureRequest | null;

  // Actions - Requests
  createRequest: (
    templateId: string,
    accountId: string,
    faculty: Faculty,
    expirationDays?: number,
    signingOrder?: 'sequential' | 'parallel'
  ) => string;
  loadRequest: (requestId: string) => void;

  // Actions - Reminders
  checkAndSendReminders: () => void;
  sendManualReminder: (requestId: string, signerId: string) => void;

  // Actions - Signers
  addSigner: (
    requestId: string,
    email: string,
    name: string,
    groupId: string,
    assignedFields: string[],
    customOrder?: number
  ) => void;
  updateSigner: (signerId: string, updates: Partial<SignerAssignment>) => void;
  removeSigner: (signerId: string) => void;

  // Actions - Signing
  signField: (requestId: string, signerId: string, fieldId: string, signatureData: string) => void;
  completeSignerSignature: (requestId: string, signerId: string) => void;
  declineRequest: (requestId: string, signerId: string, reason: string) => void;
  sendForSignature: (requestId: string) => void;

  // Actions - Combinations
  calculateCombinations: (
    requestId: string,
    rule: { combinations: SignatureCombination[] }
  ) => void;
  checkCompletion: (requestId: string) => void;

  // Utility
  getRequestsByStatus: (status: DocumentStatus) => SignatureRequest[];
  getSignerRequests: (email: string) => SignatureRequest[];
}

// ======
// STORE
// ======

export const useSignatureStore = create<SignatureState>()(
  persist(
    immer((set, get) => ({
      requests: [],
      currentRequest: null,

      // ================
      // REQUEST ACTIONS
      // ================

      createRequest: (
        templateId,
        accountId,
        faculty,
        expirationDays = 30,
        signingOrder = 'sequential'
      ) => {
        const requestId = nanoid();

        set((state) => {
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + expirationDays);

          const newRequest: SignatureRequest = {
            id: requestId,
            accountId,
            templateId,
            faculty,
            status: DocumentStatus.DRAFT,
            signers: [],
            validCombinations: [],
            signatures: [],
            createdBy: 'current-user',
            createdAt: new Date(),
            expiresAt: expirationDays > 0 ? expiresAt : undefined,
            settings: {
              expirationDays,
              signingOrder,
            },
          };

          state.requests.push(newRequest);
          state.currentRequest = newRequest;
        });

        return requestId;
      },

      loadRequest: (requestId) => {
        set((state) => {
          const request = state.requests.find((r) => r.id === requestId);
          if (request) {
            // Check expiration on load
            if (
              request.status !== DocumentStatus.COMPLETED &&
              request.status !== DocumentStatus.DECLINED &&
              request.status !== DocumentStatus.EXPIRED &&
              request.expiresAt &&
              new Date() > new Date(request.expiresAt)
            ) {
              request.status = DocumentStatus.EXPIRED;
            }
            state.currentRequest = request;
          }
        });
      },

      // ===============
      // SIGNER ACTIONS
      // ===============

      addSigner: (requestId, email, name, groupId, assignedFields, customOrder) => {
        set((state) => {
          const request = state.requests.find((r) => r.id === requestId);
          if (!request) return;

          const newSigner: SignerAssignment = {
            id: nanoid(),
            requestId,
            email,
            name,
            groupId,
            order: customOrder ?? request.signers.length + 1,
            assignedFields,
            status: SignerStatus.PENDING,
            reminderCount: 0,
          };

          request.signers.push(newSigner);
        });
      },

      updateSigner: (signerId, updates) => {
        set((state) => {
          for (const request of state.requests) {
            const signer = request.signers.find((s) => s.id === signerId);
            if (signer) {
              Object.assign(signer, updates);
              break;
            }
          }
        });
      },

      removeSigner: (signerId) => {
        set((state) => {
          for (const request of state.requests) {
            request.signers = request.signers.filter((s) => s.id !== signerId);
          }
        });
      },

      // ================
      // SIGNING ACTIONS
      // ================

      signField: (requestId, signerId, fieldId, signatureData) => {
        set((state) => {
          const request = state.requests.find((r) => r.id === requestId);
          if (!request) return;

          const signer = request.signers.find((s) => s.id === signerId);
          if (!signer) return;

          // Create signature
          const signature: Signature = {
            id: nanoid(),
            requestId,
            signerId,
            fieldId,
            signatureData,
            timestamp: new Date(),
            ipAddress: '0.0.0.0', // TODO: Get real IP
            userAgent: navigator.userAgent,
          };

          request.signatures.push(signature);

          // Update signer status if still pending
          if (signer.status === SignerStatus.PENDING) {
            signer.status = SignerStatus.IN_PROGRESS;
            signer.viewedAt = new Date();
          }

          // Update request status if still pending
          if (request.status === DocumentStatus.PENDING) {
            request.status = DocumentStatus.IN_PROGRESS;
          }
        });

        // Check if request is complete
        get().checkCompletion(requestId);
      },

      completeSignerSignature: (requestId: string, signerId: string) => {
        set((state) => {
          const request = state.requests.find((r) => r.id === requestId);
          if (!request) return;

          const signer = request.signers.find((s) => s.id === signerId);
          if (!signer) return;

          // Marcar signer como completado
          signer.status = SignerStatus.COMPLETED;
          signer.signedAt = new Date();

          // Si es secuencial, invitar a los siguientes en la cadena
          if (request.settings?.signingOrder === 'sequential') {
            const currentOrder = signer.order;
            const sameOrderSigners = request.signers.filter((s) => s.order === currentOrder);
            const allCurrentCompleted = sameOrderSigners.every(
              (s) => s.status === SignerStatus.COMPLETED
            );

            if (allCurrentCompleted) {
              const nextSigners = request.signers.filter((s) => s.order === currentOrder + 1);
              nextSigners.forEach((s) =>
                NotificationService.sendInvitation(s, request.id, request.faculty)
              );
            }
          }

          console.log(`Firmante ${signer.name} marcado como COMPLETED`);
          console.log(
            `Firmantes actuales:`,
            request.signers.map((s) => ({
              name: s.name,
              group: s.groupId,
              status: s.status,
            }))
          );
          console.log(`Combinaciones válidas:`, request.validCombinations);

          // Verificar combinatorias
          const result = isRequestComplete(request.validCombinations, request.signers);

          console.log(`Resultado de validación:`, result);

          if (result.isComplete && result.matchedCombination) {
            // Se satisfizo una combinación válida
            request.status = DocumentStatus.COMPLETED;
            request.completedCombination = result.matchedCombination;
            request.completedAt = new Date();

            console.log(`Request ${requestId} COMPLETADO por combinatoria:`, result.message);
          } else {
            // No se completó ninguna combinación todavía
            request.status = DocumentStatus.IN_PROGRESS;

            const completedCount = request.signers.filter(
              (s) => s.status === SignerStatus.COMPLETED
            ).length;
            console.log(
              `Request ${requestId} en progreso: ${completedCount}/${request.signers.length} firmantes completados`
            );
          }
        });
      },

      declineRequest: (requestId, signerId, reason) => {
        set((state) => {
          const request = state.requests.find((r) => r.id === requestId);
          if (!request) return;

          const signer = request.signers.find((s) => s.id === signerId);
          if (!signer) return;

          signer.status = SignerStatus.DECLINED;
          request.status = DocumentStatus.DECLINED;
          request.declinedBy = signer.email;
          request.declinedAt = new Date();
          request.declineReason = reason;
        });
      },

      // ===============
      // STATUS ACTIONS
      // ===============

      sendForSignature: (requestId) => {
        set((state) => {
          const request = state.requests.find((r) => r.id === requestId);
          if (!request) return;

          if (request.validCombinations.length === 0 && request.signers.length > 0) {
            console.warn(`Request ${requestId} no tiene combinaciones válidas.`);
          }

          request.status = DocumentStatus.PENDING;

          // Enviar invitaciones iniciales
          const isSequential = request.settings?.signingOrder === 'sequential';
          const firstOrder = Math.min(...request.signers.map((s) => s.order));

          request.signers.forEach((signer) => {
            if (!isSequential || signer.order === firstOrder) {
              NotificationService.sendInvitation(signer, request.id, request.faculty);
            }
          });

          console.log(`Enviando solicitud de firma a ${request.signers.length} firmantes`);
        });
      },

      // ===================
      // COMBINATIONS LOGIC
      // ===================

      calculateCombinations: (requestId, rule) => {
        set((state) => {
          const request = state.requests.find((r) => r.id === requestId);
          if (!request) return;

          const validCombinations = calculateValidCombinations(
            {
              ...rule,
              id: 'temp',
              schemaId: 'temp',
              faculty: request.faculty,
              createdAt: new Date(),
            },
            request.signers
          );

          request.validCombinations = validCombinations;

          console.log(
            `Calculadas ${validCombinations.length} combinaciones válidas para la solicitud ${requestId}`
          );
        });
      },

      checkCompletion: (requestId) => {
        set((state) => {
          const request = state.requests.find((r) => r.id === requestId);
          if (!request) return;

          // Check if any combination is satisfied
          const result = isRequestComplete(request.validCombinations, request.signers);

          if (result.isComplete && result.matchedCombination) {
            request.status = DocumentStatus.COMPLETED;
            request.completedCombination = result.matchedCombination;
            request.completedAt = new Date();

            console.log(`Solicitud ${requestId} completada!`, result.message);
          } else {
            // Update remaining combinations
            const completedSigners = request.signers.filter(
              (s) => s.status === SignerStatus.COMPLETED
            );

            const remaining = getRemainingCombinations(
              request.validCombinations,
              completedSigners,
              request.signers
            );

            if (remaining.length === 0 && request.status === DocumentStatus.IN_PROGRESS) {
              console.warn(`Solicitud ${requestId} no tiene combinaciones válidas restantes`);
            }
          }
        });
      },

      // ===================
      // REMINDERS LOGIC
      // ===================

      checkAndSendReminders: () => {
        set((state) => {
          const now = new Date();
          state.requests.forEach((request) => {
            if (
              request.status !== DocumentStatus.PENDING &&
              request.status !== DocumentStatus.IN_PROGRESS
            )
              return;
            if (
              !request.settings?.reminderFrequency ||
              request.settings.reminderFrequency === 'never'
            )
              return;

            request.signers.forEach((signer) => {
              if (
                signer.status !== SignerStatus.PENDING &&
                signer.status !== SignerStatus.IN_PROGRESS
              )
                return;

              // Verificar turno si es secuencial
              if (request.settings?.signingOrder === 'sequential') {
                const previousSigners = request.signers.filter((s) => s.order < signer.order);
                if (previousSigners.some((s) => s.status !== SignerStatus.COMPLETED)) return;
              }

              const lastSent = signer.lastReminderSentAt
                ? new Date(signer.lastReminderSentAt)
                : new Date(request.createdAt);
              const diffDays = (now.getTime() - lastSent.getTime()) / (1000 * 60 * 60 * 24);

              let shouldSend = false;
              switch (request.settings?.reminderFrequency) {
                case 'daily':
                  shouldSend = diffDays >= 1;
                  break;
                case 'weekly':
                  shouldSend = diffDays >= 7;
                  break;
              }

              if (shouldSend) {
                NotificationService.sendReminder(signer, request.id);
                signer.lastReminderSentAt = now;
                signer.reminderCount = (signer.reminderCount || 0) + 1;
              }
            });
          });
        });
      },

      sendManualReminder: (requestId, signerId) => {
        set((state) => {
          const request = state.requests.find((r) => r.id === requestId);
          if (!request) return;
          const signer = request.signers.find((s) => s.id === signerId);
          if (!signer) return;

          NotificationService.sendReminder(signer, request.id);
          signer.lastReminderSentAt = new Date();
          signer.reminderCount = (signer.reminderCount || 0) + 1;
        });
      },

      // ========
      // UTILITY
      // ========

      getRequestsByStatus: (status) => {
        return get().requests.filter((r) => r.status === status);
      },

      getSignerRequests: (email) => {
        return get().requests.filter((r) => r.signers.some((s) => s.email === email));
      },
    })),
    {
      name: 'signature-storage',
    }
  )
);
