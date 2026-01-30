/**
 * Schema Types - Parte 0 del challenge
 *
 * Este módulo define el sistema de schemas de firma que permite configurar
 * reglas complejas de aprobación basadas en grupos y facultades.
 */

// ================================================
// ACCOUNT - La empresa/cliente que usa el sistema
// ================================================

export interface Account {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  signatureSchemaId?: string; // Referencia al schema activo
}

// =========================================
// FACULTIES - Acciones que requieren firma
// =========================================

/**
 * Facultades disponibles en el sistema.
 * Cada facultad representa una acción que requiere aprobación mediante firma.
 *
 * Ejemplos de uso:
 * - CREATE_WIRE: Crear una transferencia bancaria
 * - APPROVE_WIRE: Aprobar una transferencia existente
 * - REQUEST_LOAN: Solicitar un préstamo
 */
export enum Faculty {
  CREATE_WIRE = 'CREATE_WIRE',
  APPROVE_WIRE = 'APPROVE_WIRE',
  REQUEST_LOAN = 'REQUEST_LOAN',
  APPROVE_LOAN = 'APPROVE_LOAN',
  MODIFY_CONTACT_INFO = 'MODIFY_CONTACT_INFO',
  OPEN_ACCOUNT = 'OPEN_ACCOUNT',
  CLOSE_ACCOUNT = 'CLOSE_ACCOUNT',
  MODIFY_LIMITS = 'MODIFY_LIMITS',
}

// ==========================================
// GROUPS - Grupos de firmantes (jerarquías)
// ==========================================

/**
 * Representa un grupo de firmantes dentro de un schema.
 *
 * Ejemplos:
 * - Grupo A = Directores
 * - Grupo B = Gerentes
 * - Grupo C = Analistas
 */
export interface SignerGroup {
  id: string;
  schemaId: string;
  name: string; // "Grupo A", "Directores", etc.
  description?: string;
  createdAt: Date;
}

/**
 * Representa un firmante registrado en la cuenta.
 * Puede pertenecer a uno o varios grupos.
 */
export interface Signer {
  id: string;
  accountId: string;
  name: string;
  email: string;
  groupIds: string[];
  createdAt: Date;
}

// ====================================================
// SIGNATURE_SCHEMA - Configuración de reglas de firma
// ====================================================

/**
 * Schema de firma para una cuenta.
 * Contiene todos los grupos y reglas de aprobación.
 */
export interface SignatureSchema {
  id: string;
  accountId: string;
  name: string; // "Schema Principal", "Schema Operaciones", etc.
  groups: SignerGroup[];
  rules: SignatureRule[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================
// RULES - Reglas por facultad
// ============================

/**
 * Regla de firma para una facultad específica.
 * Define qué combinaciones de firmantes son válidas para aprobar una acción.
 *
 * Ejemplo:
 * Para APPROVE_WIRE (aprobar transferencia):
 * - Combinación 1: 3 del Grupo A (3 directores)
 * - Combinación 2: 1 del Grupo A + 2 del Grupo B (1 director + 2 gerentes)
 */
export interface SignatureRule {
  id: string;
  schemaId: string;
  faculty: Faculty;
  combinations: SignatureCombination[];
  description?: string;
  createdAt: Date;
}

// ==================================================
// COMBINATIONS - Combinaciones válidas de firmantes
// ==================================================

/**
 * Una combinación válida de firmantes.
 * Define cuántos firmantes de cada grupo se necesitan.
 *
 * Ejemplo:
 * Para aprobar un préstamo, una combinación válida podría ser:
 * - 2 firmantes del Grupo A (directores)
 * - 1 firmante del Grupo B (gerentes)
 */
export interface SignatureCombination {
  id: string;
  ruleId: string;
  requirements: GroupRequirement[];
  description?: string; // "2 directores + 1 gerente"
}

/**
 * Requisito de un grupo específico dentro de una combinación.
 */
export interface GroupRequirement {
  groupId: string;
  count: number; // Cantidad de firmantes necesarios de este grupo
}

// ================================================
// SIGNATURE_REQUEST - Solicitud de firma concreta
// ================================================

/**
 * Estados posibles de un documento
 */
export enum DocumentStatus {
  DRAFT = 'DRAFT', // Borrador, no enviado aún
  PENDING = 'PENDING', // Enviado, esperando firmas
  IN_PROGRESS = 'IN_PROGRESS', // Al menos una persona firmó
  COMPLETED = 'COMPLETED', // Combinación válida completada
  EXPIRED = 'EXPIRED', // Expiró el tiempo
  DECLINED = 'DECLINED', // Alguien rechazó firmar
  CANCELLED = 'CANCELLED', // Cancelado por el creador
}

/**
 * Solicitud de firma concreta.
 * Es una instancia de un template que se envía para firmar.
 *
 * Flujo:
 * 1. Se crea la request basada en un template y una facultad
 * 2. Se asignan firmantes específicos con sus grupos
 * 3. El sistema calcula qué combinaciones son válidas
 * 4. A medida que firman, se verifica si alguna combinación se completó
 * 5. Cuando se completa una combinación → status = COMPLETED
 */
export interface SignatureRequest {
  id: string;
  accountId: string;
  templateId: string; // Qué PDF/formulario se está firmando
  faculty: Faculty; // Qué acción requiere (APPROVE_WIRE, etc)

  // Estado y flujo
  status: DocumentStatus;
  signers: SignerAssignment[];

  // Lógica de combinatorias
  validCombinations: SignatureCombination[]; // Qué combinaciones son posibles
  completedCombination?: SignatureCombination; // Si se completó, cuál combinación

  // Firmas recolectadas
  signatures: Signature[];

  // Metadata
  createdBy: string; // Email o ID del creador
  createdAt: Date;
  expiresAt?: Date;
  completedAt?: Date;
  declinedBy?: string;
  declinedAt?: Date;
  declineReason?: string;
  settings?: {
    expirationDays?: number;
    reminderFrequency?: 'daily' | 'weekly' | 'never';
    signingOrder?: 'sequential' | 'parallel';
  };
  combinations?: SignatureCombination[];
}

// ====================================================
// SIGNER_ASSIGNMENT - Firmante asignado a una request
// ====================================================

/**
 * Estados de un firmante individual
 */
export enum SignerStatus {
  PENDING = 'PENDING', // No ha firmado aún
  IN_PROGRESS = 'IN_PROGRESS', // Abrió el documento pero no terminó
  COMPLETED = 'COMPLETED', // Firmó todos sus campos
  DECLINED = 'DECLINED', // Rechazó firmar
}

/**
 * Representa a un firmante asignado a una signature request.
 * Incluye su grupo (importante para las combinatorias).
 */
export interface SignerAssignment {
  id: string;
  requestId: string;

  // Información del firmante
  email: string;
  name: string;
  groupId: string; // A qué grupo pertenece (crucial para combinatorias)

  // Configuración
  order: number; // Si es secuencial, en qué orden firma (1, 2, 3, etc)
  assignedFields: string[]; // IDs de los campos que debe firmar

  // Estado
  status: SignerStatus;
  signedAt?: Date;
  viewedAt?: Date;

  // Audit trail
  ipAddress?: string;
  userAgent?: string;

  // Notificaciones
  lastReminderSentAt?: Date;
  reminderCount: number;
}

// ===========================================
// SIGNATURE - Una firma concreta en un campo
// ===========================================

/**
 * Representa una firma individual en un campo específico.
 * Se usa para el audit trail y para generar el PDF final.
 */
export interface Signature {
  id: string;
  requestId: string;
  signerId: string; // Referencia a SignerAssignment
  fieldId: string; // Qué campo del template firmó

  // Datos de la firma
  signatureData: string; // Base64 de la imagen de firma, o texto, o fecha

  // Audit trail
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  geolocation?: {
    latitude: number;
    longitude: number;
  };
}

// =============
// HELPER TYPES
// =============

/**
 * Resultado de validar si una request está completa
 */
export interface ValidationResult {
  isComplete: boolean;
  matchedCombination?: SignatureCombination;
  remainingCombinations: SignatureCombination[];
  message?: string;
}

/**
 * Para mostrar el progreso de una combinación
 */
export interface CombinationProgress {
  combination: SignatureCombination;
  isPossible: boolean; // Si todavía es posible completarla
  isCompleted: boolean; // Si ya se completó
  progress: {
    groupId: string;
    groupName: string;
    required: number;
    completed: number;
    pending: number;
  }[];
}
