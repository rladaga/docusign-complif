# AI Context & Architecture Documentation

Este documento proporciona el contexto técnico necesario para que un Agente de AI entienda la arquitectura, el modelo de datos y los flujos críticos de **Complif**.

## 1. Visión General

Esto es una plataforma de firma electrónica especializada en **flujos de aprobación complejos**. Permite definir reglas lógicas (Combinatoria) para aprobar documentos (ej: "Se requieren 2 Directores de Grupo A").

## 2. Arquitectura de Datos (Core Domain)

El modelo de datos se divide en tres dominios principales definidos en `lib/types/`:

### A. Templates (`lib/types/template.ts`)

Define la estructura de un documento PDF preparado para firma.

- **Field:** Un campo (Firma, Texto, Fecha) con posición (x, y, page).
- **SignerRole:** Un "rol" abstracto (ej: "Empleado", "RRHH") que luego será ocupado por una persona real.

### B. Schemas & Reglas (`lib/types/schema.ts`)

Define la lógica de negocio para las aprobaciones corporativas.

- **Account:** La empresa cliente.
- **SignerGroup:** Grupos jerárquicos (ej: "Directores", "Gerentes").
- **Faculty:** Tipo de operación (ej: `APPROVE_WIRE`, `REQUEST_LOAN`).
- **SignatureRule:** Contiene una lista de `SignatureCombination`.
- **SignatureCombination:** Define requisitos específicos (ej: `{ groupId: 'directores', count: 2 }`).

### C. Requests (`lib/types/schema.ts` - SignatureRequest)

Es la instancia viva de un proceso de firma.

- Vincula un `Template` con una `Faculty`.
- Los usuarios reales (`SignerAssignment`) se asignan a los roles del template.
- El sistema valida si los usuarios asignados cumplen con alguna `SignatureCombination` válida.

## 3. Gestión de Estado (Zustand)

La aplicación no usa base de datos real. Todo el estado persiste en `localStorage` mediante tres stores principales:

1.  **`template-store.ts`**:
    - Maneja la creación/edición de templates.
    - Interactúa con `TemplateService` para operaciones CRUD (API).
    - Controla el UI del Builder (zoom, página actual, campo seleccionado).
    - Acciones clave: `addField`, `updateField`, `saveTemplate`.

2.  **`signature-store.ts`**:
    - Maneja el ciclo de vida de las solicitudes.
    - Contiene la lógica crítica de cambio de estado (`DRAFT` -> `PENDING` -> `IN_PROGRESS` -> `COMPLETED`).
    - Integra el motor de combinatoria para verificar completitud (`checkCompletion`).

3.  **`schema-store.ts`**:
    - Maneja la configuración administrativa (Cuentas, Grupos, Reglas).
    - Inicializado con datos mock (`lib/mocks/rules.ts`).

## 4. Capa de Servicios y API

Para simular un entorno real y separar responsabilidades:

- **`lib/services/template-service.ts`**: Abstrae las llamadas HTTP (`fetch`) a la API.
- **`app/api/templates/`**: Route Handlers de Next.js que actúan como backend.
- **`lib/mocks/mock-db.ts`**: Base de datos en memoria que respalda a la API.

## 5. Módulos Críticos

### Motor de Combinatoria (`lib/utils/combinatorics.ts`)

Es el cerebro lógico de la aplicación.

- **`calculateValidCombinations`**: Determina qué caminos de aprobación son posibles dados los firmantes actuales.
- **`isRequestComplete`**: Verifica si las firmas recolectadas satisfacen alguna combinación válida.
- **`getRemainingCombinations`**: Calcula qué falta para completar el documento.

### Sistema de Coordenadas (`lib/pdf/coordinates.ts`)

Resuelve la discrepancia entre el sistema de coordenadas del navegador y el de los PDFs.

- **PDF:** Origen (0,0) en esquina inferior izquierda. Unidades en Puntos (pt).
- **Pantalla:** Origen (0,0) en esquina superior izquierda. Unidades en Píxeles (px).
- **Funciones:** `screenToPDF` y `pdfToScreen` manejan la conversión y el factor de escala (zoom).

### Generador de PDF (`lib/pdf/generator.ts`)

- Usa `pdf-lib` para estampar las firmas (imágenes Base64) sobre el PDF original.
- Agrega una página de "Audit Trail" al final del documento con los metadatos de la firma.

## 6. Flujos de Usuario Clave

### Flujo: Crear Solicitud (`CreateRequestModal.tsx`)

1. Usuario selecciona un Template y una Facultad.
2. Sistema recupera las reglas para esa Facultad.
3. Usuario asigna personas a los roles.
4. **Validación:** El sistema simula si esa combinación de personas _podría_ llegar a cumplir la regla. Si es imposible (ej: se piden 2 gerentes y solo se asignó 1), bloquea la creación.

### Flujo: Firmar Documento (`SignatureInterface.tsx`)

1. Verifica estado (Expirado, Rechazado, Orden Secuencial).
2. Renderiza PDF con `PDFViewer`.
3. Permite completar campos.
4. Al finalizar, llama a `completeSignerSignature` en el store.
5. El store verifica si con esa nueva firma se completó el documento (`isRequestComplete`).

## 7. Testing

El proyecto tiene una cobertura de tests robusta en `tests/`.

- **Unitarios:** Para `combinatorics.ts` y `coordinates.ts`.
- **Integración:** Para los Stores (`template-store`, `signature-store`).
- **API:** Tests para los endpoints simulados en `app/api/`.

---

_Este archivo debe actualizarse si se realizan cambios estructurales importantes en la arquitectura._
