import { SignerAssignment } from '@/lib/types';

export const NotificationService = {
  // Simula envío de invitación
  sendInvitation: (signer: SignerAssignment, documentId: string, faculty: string) => {
    const link = `http://localhost:3000/sign/${documentId}?signerId=${signer.id}`;

    console.group(`📧 [MOCK EMAIL] Invitación a Firmar`);
    console.log(`To: ${signer.name} <${signer.email}>`);
    console.log(`Subject: Solicitud de firma para: ${faculty}`);
    console.log(`Body: Hola ${signer.name}, se requiere su firma. Acceda aquí: ${link}`);
    console.groupEnd();
  },

  // Simula envío de recordatorio
  sendReminder: (signer: SignerAssignment, documentId: string) => {
    console.log(
      `⏰ [MOCK REMINDER] Enviado a ${signer.email} para documento ${documentId.slice(0, 8)}...`
    );
  },

  // Simula aviso de expiración
  sendExpirationNotice: (signer: SignerAssignment, documentId: string) => {
    console.log(
      `🚫 [MOCK EXPIRATION] Aviso enviado a ${signer.email}: El documento ${documentId.slice(0, 8)} ha expirado.`
    );
  },
};
