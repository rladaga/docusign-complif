- _app/admin/accounts/page.tsx_: Manejar gestion de cuentas, grupos y firmantes en la interfaz de administración. Se podria haber movido a un componente separado e importarlo aca, pero al ser tan corto lo dejo aca.

- _app/admin/requests/page.tsx_: Solicitudes de firmas, visualizacion de cada una con su info, posibilidad de descargar el PDF firmado. Manejo de estados y tipos de campos en las firmas. Ademas opcion de configurar reglas de la cuenta desde esta pagina (router te mueve a admin/schema si hay un schema/cuenta activa, sino te manda a admin/schemas donde tenes la opcion de manejar las reglas de todas las cuentas).

- _app/admin/schema/page.tsx_: Configuracion de reglas y grupos de firmantes para la cuenta seleccionada, usamos tab y faculty como search query params para manejar la navegacion entre tabs y facultades. Desde aca se puede crear un nuevo grupo de firmantes o editar las reglas de cada facultad. Se usan los componentes _GroupManager_ y _RuleManager_ para manejar cada uno.

- _app/admin/schemas/page.tsx_: Seccion de esquemas de firma, donde uno selecciona una cuenta y le muestra el schema asociado con todas sus facultades y correspondientes reglas. Desde aca se puede crear un nuevo schema o configurar el existente, que te envia a admin/schema con la cuenta seleccionada y el tab=rules por default. Crear un esquema nuevo elimina el existente.

- _app/admin/templates/page.tsx_: Pagina para administrar las plantillas de documentos que se pueden usar para las firmas. Muestra una lista de plantillas con opciones para editar, duplicar, versionar, exportar el JSON con la config o eliminar cada una. Esquina superior derecha tiene un boton para crear una nueva plantilla. A su vez cada template tiene su boton de enviar a firmar que te lleva a la pagina de creacion de solicitud de firma (_components/signature-flow/CreateRequestModal.tsx_) con esa plantilla ya seleccionada. Al crear un nuevo template convertimos el pdf a Base64 en lugar de Blob URL, esto permite que el PDF sobreviva al "localStorage" y funcione en nuevas pestañas

- _app/admin/layout.tsx_: Layout general con el sidebar de navegacion entre las distintas secciones de admin.

- _app/builder/page.tsx_: Pagina principal del builder de plantillas, donde se muestra el pdf con el componente _PDFViewer_ y los overlays de los campos con _FieldOverlay_. A su vez tiene el toolbar superior (_FieldToolbar_), el panel lateral de firmantes (_SignerPanel_) y el panel de propiedades del campo seleccionado (_FieldProperties_). Maneja el estado de visibilidad de los overlays, el campo seleccionado y la interaccion entre los distintos componentes. Desde aca agregamos todos los campos al PDF y los asignamos a los grupos de firmantes correspondientes.

- _app/sign/[requestId]/page.tsx_: Pagina de firma de documentos, se verifica el estado de la solicitud de la firma y el estado del documento a su vez, se evalua orden de firmantes. Si todo es correcto se muestra el componente _SignatureInterface_ que maneja el flujo de firma, donde el firmante puede ver el documento, navegar entre paginas, completar los campos y firmar, o declinar la firma. Una vez realizada la accion correspondiente se muestra un mensaje de exito o rechazo. Esto se hace en un tab nuevo, al cerrar el tab y volver a la pagina principal se hace el rehydrate() del estado de la solicitud y se muestra el estado actualizado.

- _app/layout.tsx_: Root layout, donde se importa el global.css, el providers, se manejan las fuentes, se ejecuta la configuracion del worker de PDF.js para el rendering. Aca tambien modificamos metadata de la pagina, para cambiar titulo, descripcion y favicon.

- _app/page.tsx_: Pagina principal de la aplicacion, que al instante de cargar rutea a /admin/templates como pagina por default.

- _components/pdf-builder/DraggableField.tsx_: Componente que representa un campo draggable en el PDF, usado en el builder de plantillas. Permite arrastrar y soltar campos sobre el PDF para ubicarlos en la posicion deseada, agrandarlos o achicarlos. Utiliza la libreria dnd para manejar el drag and drop.

- _components/pdf-builder/FieldOverlay.tsx_: Componente gestor o controlador de la capa interactiva que se dibuja encima del PDF. Es el componente padre que coordina todos los campos individuales (DraggableField) y maneja la logica de interaccion, seleccion, posicionamiento y dimensionamiento de los campos.

- _components/pdf-builder/FieldProperties.tsx_: Pequeña seccion del panel lateral que muestra las propiedades del campo seleccionado en el builder de plantillas. Permite editar propiedades el grupo de firmantes asignado y obligatoriedad del campo, y tambien eliminar el campo del PDF.

- _components/pdf-builder/FieldToolbar.tsx_: Barra de herramientas superior en el builder de plantillas, que contiene botones para agregar nuevos campos al PDF (texto, firma, fecha, checkbox).

- _components/pdf-builder/PDFViewer.tsx_: Componente que renderiza el PDF usando PDF.js y muestra las paginas del documento. Es el componente base sobre el cual se dibujan los overlays de los campos interactivos. Utilizamos memo para optimizar el rendimiento y evitar renders innecesarios al arrastrar campos.

- _components/pdf-builder/SignerPanel.tsx_: Panel lateral en el builder de plantillas que permite gestionar los firmantes del documento. Desde aca se pueden agregar nuevos grupos de firmantes, o genericos. Para luego asignar los campos del PDF a los grupos correspondientes. Se muestra sugerencia de agregar varias veces el mismo grupo si necesitas firmas de distintas personas de ese área.

- _components/schema/GroupManager.tsx_: Componente que muestra grupos de firmantes existentes en una cuenta y la posibilidad de agregar nuevos.

- _components/schema/RuleManager.tsx_: Componente que permite seleccionar cada faculty de la cuenta y configurar la o las reglas de aprobacion de cada una de ellas.

- _components/signature-flow/CreateRequestModal.tsx_: Modal que se renderiza al enviar a firmar un template, permite seleccionar tipo de operacion a realizar, orden de firma (secuencial o paralela), expiracion del documento. Informa las combinaciones de firmantes que requiere ese tipo de operacion. Luego permite asignar firmantes a cada grupo de firmantes definido en el template, es decir que si yo puse en los campos del pdf que iban 3 firmas del grupo de gerentes, en este modal me mostrara 3 selectores para elegir firmantes del grupo gerentes, en el dropdown estaran los usuarios cargados en la cuenta como firmantes de gerentes, o puedo agregar uno manualmente, que al enviar a firmar el documento se agregara a la cuenta automaticamente como firmante de ese grupo. En el momento de enviar a firmar si los firmantes asignados no cumplen con las condiciones para aprobar ese tipo de operacion (ejemplo: se necesitan 2 gerentes y solo se asigno 1) se muestra un error y no se puede enviar a firmar hasta corregirlo.

- _components/signature-flow/SignatureInterface.tsx_: Componente que maneja el flujo de firma del documento. Muestra el PDF con los campos interactivos, permite navegar entre paginas, completar campos, firmar o declinar la firma. Maneja el estado de la solicitud y del documento, y muestra mensajes de exito o rechazo segun corresponda.

- _lib/mocks/rules.ts_: Archivo con datos mockeados de reglas de aprobacion para las cuentas para priemr carga, despues se modificaran desde la interfaz de admin y se guardaran en el store.

- _lib/pdf/config.ts_: Configuracion del worker de PDF.js para el rendering de PDFs en la aplicacion.

- _lib/pdf/coordinates.ts_: Funciones utilitarias para convertir coordenadas de campos en el PDF, entre distintas unidades (px, pt, porcentaje) y segun el tamaño del PDF y la resolucion de pantalla.

- _lib/pdf/generator.ts_: Funciones para generar el PDF final con los campos completados y las firmas aplicadas, usando PDF-lib. Se encarga de dibujar los campos en las posiciones correctas, agregar las firmas como imagenes, y exportar el PDF final en Base64 o Blob junto con el Audit Trail.

- _lib/services/notifications.ts_: Servicio para manejar el envio de notificaciones por email a los firmantes cuando se les asigna una firma, mockeado/simulado por ahora, se hace simplemente con un console.log.

- _lib/store/schema-store.ts_: Store de Zustand para manejar el estado de los schemas de firma, maneja grupos de firmantes, reglas de firma y schema activo. Acciones: createSchema, createGroup, updateRule, createSigner, setActiveSchemaId, etc. Mockeamos algunos datos iniciales para la cuenta principal.

- _lib/store/signature-store.ts_: Store de Zustand para manejar el ciclo de vida completo de signature requests:
  - Crear request desde un template
  - Asignar firmantes con sus grupos
  - Calcular combinaciones válidas
  - Procesar firmas
  - Verificar completitud

    Acciones: createRequest, loadRequest, addSigner, updateSigner, removeSigner, signField, sendForSignature, calculateCombinations, etc.

- _lib/store/template-store.ts_: Store de Zustand para manejar el estado de los templates, template activo en el builder, CRUD de los templates y versionado. Acciones: createTemplate, loadTemplate, saveTemplate, duplicateTemplate, createNewVersion, deleteTemplate. Tambien se evaluan acciones sobre campos y firmantes dentro del template.

- _lib/types/schema.ts_: Este módulo define el sistema de schemas de firma que permite configurar reglas complejas de aprobación basadas en grupos y facultades.

- _lib/types/template.ts_: Define la estructura de templates de documentos PDF con campos configurables. Un template es la definición de un formulario que después se usa para crear signature requests.

- _lib/utils/combinatorics.ts_: Motor de validacion de combinaciones. Define qué combinaciones son válidas dada una lista de firmantes, si un documento está completo, qué combinaciones todavía son posibles y el progreso de cada combinación.

- _lib/mocks/mock-db.ts_: Simula una base de datos en memoria para almacenar datos de cuentas, usuarios, templates, schemas y solicitudes de firma. Permite realizar operaciones CRUD básicas para pruebas y desarrollo sin necesidad de una base de datos real. Se usa para probar la API de CRUD de templates en _admin/api/templates/_

## Decisiones Técnicas y Suposiciones

### Decisiones de Arquitectura

1.  **Gestión de Estado (Zustand + Immer):**
    - **Por qué:** Se eligió Zustand por su simplicidad y bajo boilerplate comparado con Redux. El middleware `immer` permite mutar el estado de forma directa (draft state), lo que simplifica enormemente la lógica compleja de los reducers (especialmente para estructuras anidadas como `templates -> fields`).
    - **Persistencia:** Se utilizó el middleware `persist` para guardar todo el estado en `localStorage`. Esto permite que la demo sea funcional y persistente entre recargas sin necesidad de levantar una base de datos real (Docker/Postgres), facilitando la evaluación del challenge.

2.  **Manejo de PDFs (PDF.js + PDF-lib):**
    - **Visualización:** Se usó `pdfjs-dist` para renderizar el PDF en un `<canvas>`. Es el estándar de la industria, aunque complejo de implementar en Next.js debido a los Web Workers (se configuró en `lib/pdf/config.ts`).
    - **Edición/Generación:** Se usó `pdf-lib` para estampar las firmas y generar el documento final. Esta librería permite modificar PDFs existentes en el navegador (Client-Side) de manera eficiente.

3.  **Sistema de Coordenadas:**
    - **El Problema:** El DOM del navegador usa coordenadas con origen en la esquina superior izquierda (px). Los PDFs usan coordenadas con origen en la esquina inferior izquierda (pt).
    - **La Solución:** Se implementó una capa de abstracción en `lib/pdf/coordinates.ts` (`screenToPDF`, `pdfToScreen`) que normaliza estas diferencias y maneja el factor de escala (zoom), asegurando que lo que el usuario ve en pantalla es exactamente donde se estampa la firma en el archivo final.
    - **Limitacion**: Problemas de posicionamiento al tener un PDF en posicion landscape o rotado. Se asume que todos los PDFs estaran en orientacion portrait para simplificar el challenge.

4.  **Motor de Combinatoria (Lógica de Aprobación):**
    - **Decisión:** En lugar de hardcodear reglas ("si es manager, entonces..."), se construyó un motor genérico en `lib/utils/combinatorics.ts`.
    - **Funcionamiento:** Evalúa reglas basadas en "Facultades" y "Combinaciones" (ej: 2 del Grupo A **O** 1 del Grupo A + 1 del Grupo B). Esto hace que el sistema sea escalable y configurable desde el UI sin tocar código.

5.  **API Mockeada:**
    - **Decisión:** Para cumplir con el requerimiento de "API para CRUD", se implementaron Route Handlers en Next.js (`app/api/...`) respaldados por una base de datos en memoria (`lib/mocks/mock-db.ts`).
    - **Beneficio:** Permite probar el comportamiento de una API REST real (códigos de estado HTTP, métodos GET/POST/DELETE) sin la complejidad de configurar un backend real.

### Suposiciones (Assumptions)

1.  **Seguridad y Autenticación:**
    - Se asume que en un entorno productivo existiría una capa de autenticación (Auth0/NextAuth). Para este challenge, la identidad del usuario se simula o se selecciona mediante dropdowns (ej: "Firmar como Juan").
    - Las firmas se guardan como Base64. En producción, esto requeriría certificados digitales reales para tener validez legal estricta.

2.  **Concurrencia:**
    - Al ser una demo basada en `localStorage` y estado en memoria, se asume un entorno monousuario. No se manejan conflictos de edición simultánea (ej: dos admins editando el mismo template a la vez).

3.  **Persistencia de Archivos:**
    - Los archivos PDF se convierten a Base64 para almacenarlos en el store/localStorage. Se asume que los archivos de prueba son pequeños (<5MB). En producción, esto se subiría a un S3/Blob Storage y solo se guardarían las URLs.

4.  **Notificaciones:**
    - El envío de correos electrónicos es simulado (`console.log`). Se asume que la integración con un proveedor como SendGrid o AWS SES sería trivial de agregar en el servicio `NotificationService`.
