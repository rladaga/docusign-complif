# Complif - Plataforma de Firmas Electrónicas

Plataforma de gestión de firmas electrónicas y flujos de aprobación complejos. Este proyecto permite crear plantillas de documentos PDF, configurar reglas de aprobación dinámicas (schemas) y gestionar el ciclo de vida completo de una solicitud de firma.

## 🚀 Características Principales

- **Constructor de Plantillas (PDF Builder):** Editor visual con _Drag & Drop_ para colocar campos de firma, texto, fecha y checkboxes sobre documentos PDF.
- **Motor de Reglas de Aprobación:** Sistema avanzado de combinatoria para definir reglas complejas (ej: "Requiere 2 Directores O 1 Director + 1 Gerente").
- **Gestión de Cuentas y Grupos:** Administración de jerarquías de firmantes y facultades por cuenta.
- **Flujo de Firma:** Interfaz para que los usuarios firmen documentos, con validación de orden secuencial o paralelo.
- **API RESTful (Mock):** Endpoints simulados para operaciones CRUD de templates.
- **Persistencia Local:** Uso de `localStorage` y `Zustand` para mantener el estado de la aplicación sin necesidad de una base de datos externa para esta demo.

## 📋 Requisitos Previos

Asegúrate de tener instalado lo siguiente en tu entorno local:

- **Node.js**: Versión 18.17.0 o superior.
- **npm**: (Viene con Node.js) o yarn/pnpm.

## 🛠️ Instalación

1. **Clonar el repositorio:**

   ```bash
   git clone https://github.com/rladaga/docusign-complif.git
   cd docusign-complif
   ```

   o

   ```bash
   git clone git@github.com:rladaga/docusign-complif.git
   cd docusign-complif
   ```

2. **Instalar dependencias:**

   Este proyecto utiliza librerías como `next`, `react`, `zustand`, `dnd-kit`, `pdfjs-dist` y `vitest`.

   ```bash
   npm install
   # o
   yarn install
   ```

## ▶️ Ejecución (Entorno de Desarrollo)

Para iniciar el servidor de desarrollo:

```bash
npm run dev
```

Abre tu navegador y visita http://localhost:3000.

La aplicación te redirigirá automáticamente al panel de administración (`/admin/templates`), donde podrás empezar a crear templates, inicialmente estan mockeadas dos cuentas, cada una con sus reglas y grupos de firmantes, y firmantes creados. Una esta completamente vacía para que puedas probar la creación desde cero.

## 🧪 Testing

El proyecto cuenta con una suite de tests unitarios y de integración utilizando **Vitest** y **React Testing Library**.

- **Ejecutar todos los tests:**

  ```bash
  npm test
  ```

## 📂 Estructura del Proyecto

Un resumen de los directorios más importantes:

- **`app/`**: Rutas de la aplicación (Next.js App Router).
  - `admin/`: Panel de administración (Templates, Requests, Schemas).
  - `builder/`: Editor visual de PDFs.
  - `sign/`: Interfaz pública de firma.
  - `api/`: API Routes simuladas.
- **`components/`**: Componentes de React reutilizables.
  - `pdf-builder/`: Componentes específicos del editor (Canvas, Toolbar, Overlays).
  - `signature-flow/`: Modales y lógica del flujo de firma.
  - `schema/`: Componentes para configuración de reglas y grupos.
- **`lib/`**: Lógica de negocio y utilidades.
  - `store/`: Gestión de estado global con Zustand (`template-store`, `signature-store`, `schema-store`).
  - `pdf/`: Configuración de PDF.js y utilidades de coordenadas.
  - `utils/combinatorics.ts`: Motor lógico para validar reglas de aprobación.
  - `mocks/`: Datos de prueba y base de datos en memoria.
- **`tests/`**: Archivos de test organizados por tipo.

## 📝 Guía de Uso Rápida

1. **Configurar Reglas (Opcional):**
   - Ve a "Configuración de Reglas".
   - Aca podes seleccionar una cuenta, ver el esquema de aprobacion actual e ingresar a configuracion para agregar grupos de firmantes y modificar las reglas de aprobacion.

2. **Configuracion de Cuentas (Opcional):**
   - Ve a "Cuentas".
   - Aca podes seleccionar una cuenta, ver los grupos de firmantes actuales y los firmantes asociadas a la misma. Desde aca tambien podes crear nuevos firmantes y grupos de firmantes.

3. **Crear un Template:**
   - Se podria empezar desde este paso ya que hay data mockeada para poder crear solicitudes de firma.
   - Ve a "Templates" y haz clic en "Nuevo Template".
   - Sube un PDF o usa el ejemplo.
   - Usa el botón "Editar" para abrir el Builder.
   - Arrastra campos al documento y asígnalos a grupos de firmantes.

4. **Enviar a Firmar:**
   - Desde la lista de Templates, haz clic en "Enviar a Firmar".
   - Asigna personas reales a los grupos de firmantes del template.
   - El sistema validará si los firmantes cumplen con las reglas de la facultad seleccionada.

5. **Firmar:**
   - En "Solicitudes de Firma", usa el enlace de simulación (icono externo) para firmar como cada usuario.

## 🤖 Desarrollo Asistido por AI

Este repositorio está optimizado para trabajar con agentes de AI (Cursor, Devin, Copilot).

- **`.cursorrules`**: Contiene las reglas de codificación, stack tecnológico y directrices específicas para el editor Cursor.
- **`docs/AI_CONTEXT.md`**: Documentación técnica profunda sobre la arquitectura, el modelo de datos y la lógica de negocio (Combinatoria, PDF Coordinates) para dar contexto a los agentes.

Si utilizas una herramienta de AI, asegúrate de que tenga acceso a estos archivos para obtener los mejores resultados.

---

Challenge Complif 2026
