/**
 * Template Types - Parte 1 del challenge
 *
 * Define la estructura de templates de documentos PDF con campos configurables.
 * Un template es la definición de un formulario que después se usa para crear
 * signature requests.
 */

// ========================================
// TEMPLATE - Definición de formulario PDF
// ========================================

/**
 * Template principal.
 * Define un formulario PDF con campos arrastrables y configuración de firmantes.
 */
export interface Template {
  id: string;
  name: string;
  description?: string;
  accountId: string; // Vinculación a la cuenta

  // Versionado
  version: number; // Se incrementa cada vez que se modifica
  previousVersionId?: string; // Referencia a la versión anterior

  // PDF
  pdfUrl: string; // URL del PDF original
  pdfFileName: string;
  totalPages: number;

  // Configuración del formulario
  fields: Field[];
  signers: SignerRole[];
  settings: TemplateSettings;

  // Metadata
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  isArchived: boolean;
}

// ===============================
// FIELDS - Campos del formulario
// ===============================

/**
 * Tipos de campos disponibles
 */
export enum FieldType {
  SIGNATURE = 'signature', // Firma dibujada
  INITIALS = 'initials', // Iniciales
  TEXT = 'text', // Texto libre
  DATE = 'date', // Fecha
  CHECKBOX = 'checkbox', // Checkbox
  RADIO = 'radio', // Radio button (nuevo)
  DROPDOWN = 'dropdown', // Select/dropdown (nuevo)
}

/**
 * Campo individual en el PDF
 */
export interface Field {
  id: string;
  type: FieldType;
  position: FieldPosition;
  assignedTo: string; // ID del SignerRole
  required: boolean;
  label?: string;
  placeholder?: string;
  validation?: FieldValidation;
  options?: FieldOption[];

  // Metadata
  createdAt: Date;
  order: number; // Orden de tabulación
}

/**
 * Posición de un campo en el PDF
 */
export interface FieldPosition {
  page: number; // Número de página (1-indexed)
  x: number; // Coordenada X (en puntos PDF)
  y: number; // Coordenada Y (en puntos PDF)
  width: number;
  height: number;
  pageWidth?: number; // NUEVO: Tamaño real de la página PDF
  pageHeight?: number; // NUEVO: Tamaño real de la página PDF
}

/**
 * Validación para campos de texto
 */
export interface FieldValidation {
  pattern?: string; // Regex pattern
  minLength?: number;
  maxLength?: number;
  format?: 'email' | 'phone' | 'number' | 'currency' | 'custom';
  customMessage?: string;
}

/**
 * Opción para dropdown o radio buttons
 */
export interface FieldOption {
  value: string;
  label: string;
  isDefault?: boolean;
}

// =================================================
// SIGNER ROLES - Roles de firmantes en el template
// =================================================

/**
 * Rol de firmante en el template.
 * Cuando se crea una signature request, se asignan personas reales a estos roles.
 */
export interface SignerRole {
  id: string;
  name: string; // "Empleado", "Empleador", "Testigo", etc.
  order: number; // Si es secuencial, en qué orden firma

  // Color para identificar visualmente los campos de este firmante
  color: string; // Hex color, ej: "#3B82F6"

  // Opcional: email y nombre pre-llenados (si ya se conocen)
  defaultEmail?: string;
  defaultName?: string;
  linkedGroupId?: string; // Vinculación con un grupo del Schema (ej: "group-legal")
}

// ===============================================
// TEMPLATE SETTINGS - Configuración del template
// ===============================================

/**
 * Frecuencia de recordatorios
 */
export enum ReminderFrequency {
  NONE = 'none',
  DAILY = 'daily',
  EVERY_2_DAYS = 'every_2_days',
  WEEKLY = 'weekly',
}

/**
 * Orden de firma
 */
export enum SigningOrder {
  SEQUENTIAL = 'sequential', // Uno después del otro
  PARALLEL = 'parallel', // Todos al mismo tiempo
}

/**
 * Configuración global del template
 */
export interface TemplateSettings {
  // Expiración
  expirationDays: number; // Días hasta que expire (0 = no expira)

  // Recordatorios
  reminderFrequency: ReminderFrequency;

  // Orden de firma
  signingOrder: SigningOrder;

  // Opciones
  allowDecline: boolean; // ¿Los firmantes pueden rechazar?
  requireAllFields: boolean; // ¿Todos los campos son obligatorios?

  // Notificaciones
  notifyOnComplete: boolean; // Notificar cuando se complete
  notifyOnDecline: boolean; // Notificar cuando alguien rechace

  // Seguridad
  requireAccessCode: boolean; // ¿Requiere código de acceso?
  accessCode?: string; // Código de 6 dígitos
}

// ====================
// TEMPLATE VERSIONING
// ====================

/**
 * Historial de versiones de un template
 */
export interface TemplateVersion {
  id: string;
  templateId: string;
  version: number;
  createdBy: string;
  createdAt: Date;
  changeDescription?: string; // Qué cambió en esta versión
  fieldsSnapshot: Field[]; // Snapshot de los fields en esta versión
}

// =============
// HELPER TYPES
// =============

/**
 * Para el drag & drop builder
 */
export interface DraggableFieldConfig {
  type: FieldType;
  icon: string; // Lucide icon name
  label: string;
  defaultWidth: number;
  defaultHeight: number;
  color: string; // Para preview
}

/**
 * Estado del builder
 */
export interface BuilderState {
  template: Template | null;
  selectedFieldId: string | null;
  currentPage: number;
  zoom: number;
  isDragging: boolean;
  showGrid: boolean;
}

/**
 * Para convertir coordenadas PDF <-> Screen
 */
export interface CoordinateTransform {
  pdfToScreen: (point: { x: number; y: number }) => { x: number; y: number };
  screenToPdf: (point: { x: number; y: number }) => { x: number; y: number };
}

/**
 * Resultado de validación de un template
 */
export interface TemplateValidationResult {
  isValid: boolean;
  errors: TemplateValidationError[];
  warnings: TemplateValidationWarning[];
}

export interface TemplateValidationError {
  field: 'template' | 'field' | 'signer' | 'settings';
  fieldId?: string;
  message: string;
}

export interface TemplateValidationWarning {
  field: 'template' | 'field' | 'signer' | 'settings';
  fieldId?: string;
  message: string;
}

// ===========================================
// TEMPLATE JSON FORMAT (para import/export)
// ===========================================

/**
 * Formato JSON para exportar/importar templates
 * Este es el formato que se guarda en archivos .json
 */
export interface TemplateJSON {
  templateId: string;
  name: string;
  description?: string;
  version: number;

  // PDF info
  pdfFileName: string;
  totalPages: number;

  // Configuración
  fields: FieldJSON[];
  signers: SignerRoleJSON[];
  settings: TemplateSettings;

  // Metadata
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export interface FieldJSON {
  id: string;
  type: FieldType;
  position: FieldPosition;
  assignedTo: string;
  required: boolean;
  label?: string;
  placeholder?: string;
  validation?: FieldValidation;
  options?: FieldOption[];
  order: number;
}

export interface SignerRoleJSON {
  id: string;
  name: string;
  order: number;
  color: string;
  defaultEmail?: string;
  defaultName?: string;
}
