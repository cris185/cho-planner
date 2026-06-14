<div align="center">

# CHO Planner

**Gestor de tareas y notas personal con un asistente de IA intercambiable y sincronización opcional con Google Calendar.**

Arquitectura *local-first*, *Bring Your Own Keys*, mobile-first. Pensado para uso cotidiano y de trabajo.

<br />

![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?style=flat-square&logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Auth.js](https://img.shields.io/badge/Auth.js-5-000000?style=flat-square&logo=auth0&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-22c55e?style=flat-square)

</div>

---

## Tabla de contenidos

- [Visión](#visión)
- [Características](#características)
- [Capturas](#capturas)
- [Arquitectura](#arquitectura)
- [Capa de IA intercambiable](#capa-de-ia-intercambiable)
- [Stack tecnológico](#stack-tecnológico)
- [Modelo de datos](#modelo-de-datos)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Puesta en marcha](#puesta-en-marcha)
- [Integraciones opcionales](#integraciones-opcionales)
- [Seguridad](#seguridad)
- [Hoja de ruta](#hoja-de-ruta)
- [Créditos y licencias](#créditos-y-licencias)
- [Licencia](#licencia)

---

## Visión

CHO Planner es un gestor de tareas y notas en la línea de Linear o ClickUp, pero deliberadamente más simple, que sirve tanto para la vida cotidiana como para el trabajo. Su rasgo distintivo es un **asistente de IA personalizable** —con avatar, nombre y personalidad propios— que descompone objetivos en subtareas con pesos de prioridad y, opcionalmente, sincroniza el trabajo con **Google Calendar**.

El diseño parte de cuatro principios:

| Principio | Qué significa |
|-----------|---------------|
| **Local-first / self-hosted** | La aplicación funciona al 100 % sin servicios externos. Las integraciones son aditivas, nunca requisito. |
| **Bring Your Own Keys (BYOK)** | Cada usuario aporta sus propias credenciales (cuenta de Google, API key de LLM). Se guardan cifradas; el operador no es custodio de credenciales de terceros. |
| **Mobile-first responsive** | Una sola base de código web que se adapta a teléfono, tablet y escritorio. Sin React Native ni puerto nativo. |
| **IA intercambiable** | El usuario elige el proveedor (Claude, GPT, Gemini…). Cambiar de modelo no cambia la **estructura** de lo que se genera, solo la redacción. |

---

## Características

**Núcleo (funciona sin integraciones externas)**

- Autenticación por credenciales (email + contraseña) con saludo personalizado.
- Workspaces con nombre, descripción, color e icono propios.
- Board Kanban con drag and drop entre columnas (Por hacer / En progreso / Hecho), persistiendo el orden.
- Tareas con título, descripción, peso de prioridad (1–10), estado y fecha límite.
- Subtareas atómicas y ligeras (título + nota corta opcional + peso + estado).
- Sprints: agrupación de tareas en periodos con objetivo y fechas.
- Notas en Markdown, dentro de un workspace o independientes, con recordatorio opcional.

**Generación con IA**

- Asistente personalizable: avatar (DiceBear), nombre y *persona* inyectada en el system prompt.
- Planes de trabajo: el asistente descompone un objetivo en subtareas con pesos y fechas sugeridas.
- Multi-proveedor: el usuario configura las API keys de distintos LLM y elige cuál usar.
- Toda salida de IA se valida contra un esquema (Zod) con reintentos antes de tocar la base de datos.

**Integración opcional (Google Calendar)**

- Conexión mediante OAuth 2.0 con la cuenta del propio usuario.
- Tareas, sprints y notas con recordatorio pueden subirse a Google Calendar, siempre con confirmación explícita.

---

## Capturas

> Sustituye estas referencias por tus propias imágenes en `docs/screenshots/`.

<div align="center">

| Board Kanban | Asistente de IA |
|:---:|:---:|
| <img src="docs/screenshots/board.png" width="420" alt="Board Kanban" /> | <img src="docs/screenshots/chat.png" width="420" alt="Chat con el asistente" /> |

</div>

---

## Arquitectura

Todo el backend vive **dentro de Next.js** (Server Actions y Route Handlers); no hay servidor separado. La instancia es autónoma: las integraciones externas son opcionales y se suman cuando el usuario lo decide.

```
┌──────────────────────────────────────────────┐      ┌────────────────────────┐
│  TU INSTANCIA (funciona sin nada externo)      │ ───▶ │  Google Calendar       │
│                                                 │      │  opcional · OAuth 2.0  │
│   ┌───────────┐      ┌────────────────┐        │      └────────────────────────┘
│   │ Next.js   │      │ PostgreSQL     │        │
│   │ UI + API  │◀────▶│ tus datos      │        │      ┌────────────────────────┐
│   │ (RSC,     │      │                │        │ ───▶ │  Proveedor LLM         │
│   │  Actions) │      └────────────────┘        │      │  opcional · tu API key │
│   └───────────┘                                 │      │  Claude / GPT / Gemini │
│   ┌───────────────────────────────┐            │      └────────────────────────┘
│   │ Bóveda de credenciales         │            │
│   │ API keys y refresh token       │            │
│   │ cifrados con AES-256-GCM        │            │
│   │ nunca salen de la instancia     │            │
│   └───────────────────────────────┘            │
└──────────────────────────────────────────────┘
```

Cualquiera clona el repositorio, configura su `.env`, levanta Postgres con Docker y obtiene un gestor de tareas funcional. Calendar y LLM se añaden cuando el usuario aporta sus credenciales.

---

## Capa de IA intercambiable

El modelo **nunca** decide el formato ni ejecuta acciones directamente: solo rellena una estructura definida en el código (un esquema **Zod**). El código valida la salida contra ese esquema antes de usarla y, si no cumple, reintenta reinyectando el error de validación. Así, un roadmap generado por Gemini tiene exactamente los mismos campos que uno de Claude.

```
La app define el contrato (prompt + esquema Zod)
        │
        ▼
Adaptador único (AI SDK de Vercel) ──▶ enruta al proveedor elegido por el usuario
        │        ├─▶ Claude  (tool use nativo)
        │        ├─▶ GPT     (structured outputs)
        │        └─▶ Gemini  (response schema)
        ▼
Validación contra el esquema Zod ──▶ ¿cumple? si no, reintenta (máx. 3)
        ▼
Datos idénticos en estructura ──▶ DB · board · Calendar
```

Cada modelo se declara en un `MODEL_REGISTRY` con su nivel de soporte de salida estructurada (`full` / `partial`), de modo que la UI solo ofrece para generación los modelos fiables.

---

## Stack tecnológico

### Frontend

| Herramienta | Rol |
|-------------|-----|
| **Next.js 16** (App Router) + **React 19** + **TypeScript** | Framework y tipado |
| **Tailwind CSS 4** | Estilos responsive mobile-first |
| **shadcn/ui** + **Radix UI** | Primitivas de componentes accesibles, estilizadas a medida |
| **dnd-kit** | Drag and drop con sensores táctiles |
| **next-themes** | Modo claro/oscuro sin parpadeo |
| **DiceBear** | Generación de avatares del asistente |
| **react-markdown** + **remark-gfm** | Renderizado de notas en Markdown |
| **sonner** | Notificaciones |

### Backend (dentro de Next.js)

| Herramienta | Rol |
|-------------|-----|
| **Server Actions** | CRUD de todas las entidades |
| **Route Handlers** | Streaming del chat, callback OAuth de Google, sincronización |
| **Prisma 6** | ORM |
| **PostgreSQL 17** | Base de datos |
| **Auth.js (NextAuth v5)** | Autenticación por credenciales |
| **bcryptjs** | Hash de contraseñas |

### Inteligencia artificial

| Herramienta | Rol |
|-------------|-----|
| **AI SDK de Vercel** (`ai`) | Adaptador único multi-proveedor |
| `@ai-sdk/anthropic` · `@ai-sdk/openai` · `@ai-sdk/google` | Proveedores LLM |
| **Zod** | Contrato de salida estructurada y validación |

### Google Calendar y seguridad

| Herramienta | Rol |
|-------------|-----|
| **googleapis** | Cliente oficial; OAuth 2.0 con `syncToken` incremental |
| **AES-256-GCM** | Cifrado de API keys y refresh tokens en reposo |

### Infraestructura

| Herramienta | Rol |
|-------------|-----|
| **Docker Compose** | Postgres local para desarrollo |
| **Vercel** + base gestionada (Neon / Supabase) | Despliegue de demo (sugerido) |

---

## Modelo de datos

El modelo gira en torno a `User`, dueño de todo en cascada. Diez entidades cubren la identidad, el contenido y las integraciones.

| Entidad | Propósito |
|---------|-----------|
| **User** | Cuenta. `firstName`/`lastName` separados para el saludo personalizado. |
| **Assistant** | Identidad del asistente de IA: nombre, estilo de avatar, `avatarConfig` (JSON) y `persona`. Entidad propia porque agrupa identidad + comportamiento. |
| **ApiKey** | API key de un proveedor LLM, cifrada (AES-256-GCM). Única por `(userId, provider)`. |
| **GoogleAccount** | Vínculo OAuth: refresh token cifrado, `scope`, `calendarId` y `syncToken`. |
| **Workspace** | Contenedor de trabajo con nombre, descripción, color e icono. |
| **Sprint** | Agrupación temporal de tareas con objetivo y fechas. |
| **Task** | Tarea con `title` (qué) + `description` (cómo), `weight` 1–10, estado, `aiGenerated` y `position`. |
| **Subtask** | Unidad atómica ligera: título + nota corta + peso + `done`. |
| **Note** | Nota Markdown, ligada a un workspace o independiente, con recordatorio opcional. |
| **CalendarEvent** | Evento reutilizable por Task, Sprint o Note; guarda el `googleEventId` para actualizar/borrar en Google. |

**Decisiones de diseño destacadas**

- `Assistant` guarda el aspecto visual como **JSON** (`avatarConfig`) porque sus parámetros cambian según la librería de avatares; una tabla rígida obligaría a migrar el esquema al cambiar de estilo.
- `Task` separa **título (qué)** de **descripción (cómo)**; las subtareas se mantienen ligeras a propósito (si una subtarea necesita descripción larga, debería ser una tarea).
- `CalendarEvent` es una **tabla separada** para reutilizarse entre Task, Sprint y Note y conservar el `googleEventId`.
- `position` persiste el orden del drag and drop; `aiGenerated` marca las tarjetas creadas por el asistente.

### Diagrama entidad-relación

```mermaid
erDiagram
    User ||--o| Assistant : tiene
    User ||--o{ Workspace : posee
    User ||--o{ Note : escribe
    User ||--o{ ApiKey : configura
    User ||--o| GoogleAccount : conecta
    Workspace ||--o{ Task : contiene
    Workspace ||--o{ Sprint : contiene
    Workspace ||--o{ Note : agrupa
    Sprint ||--o{ Task : agrupa
    Task ||--o{ Subtask : descompone
    Task ||--o| CalendarEvent : sincroniza
    Sprint ||--o| CalendarEvent : sincroniza
    Note ||--o| CalendarEvent : sincroniza

    User {
        string id PK
        string email UK
        string firstName
        string lastName
        string defaultProvider
    }
    Task {
        string id PK
        string title
        string description
        int weight
        enum status
        boolean aiGenerated
        int position
        datetime dueDate
    }
    Subtask {
        string id PK
        string title
        string note
        int weight
        boolean done
    }
    CalendarEvent {
        string id PK
        string googleEventId UK
        datetime startsAt
        boolean synced
    }
```

El esquema completo de Prisma vive en [`prisma/schema.prisma`](prisma/schema.prisma).

---

## Estructura del proyecto

```
cho-planner/
├── prisma/
│   ├── schema.prisma          # 10 modelos + enum TaskStatus
│   └── seed.ts                # datos de ejemplo (usuario demo)
├── src/
│   ├── app/
│   │   ├── (auth)/            # login y registro
│   │   ├── (dashboard)/       # board, sprints, notes, chat, settings
│   │   └── api/               # chat (streaming), google (OAuth), calendar (sync)
│   ├── components/            # ui, board, chat, assistant, note
│   ├── lib/
│   │   ├── crypto.ts          # cifrar/descifrar AES-256-GCM
│   │   ├── ai/                # registry, schemas (Zod), generate, provider
│   │   └── google/            # oauth, calendar
│   ├── server/actions/        # Server Actions (CRUD por entidad)
│   └── validations/           # esquemas de entrada
├── docker-compose.yml         # Postgres local
├── .env.example               # plantilla de variables (sin secretos)
└── package.json
```

---

## Puesta en marcha

### Requisitos

- **Node.js 20+**
- **Docker Desktop** (para la base de datos local)

### 1. Clonar e instalar

```bash
git clone https://github.com/<TU-USUARIO>/cho-planner.git
cd cho-planner
npm install
```

### 2. Configurar variables de entorno

Copia la plantilla y rellena los valores:

```bash
cp .env.example .env
```

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | Cadena de conexión a Postgres. Con el `docker-compose` incluido: `postgresql://taskmanager:taskmanager@localhost:5433/taskmanager` |
| `AUTH_SECRET` | Secreto de Auth.js. Genera uno con `openssl rand -base64 32` |
| `AUTH_URL` | URL base de la app. En local: `http://localhost:3000` |
| `ENCRYPTION_KEY` | Clave de 32 bytes en hex para cifrar credenciales. Genera con `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Opcionales — solo para Google Calendar (ver más abajo) |
| `DEFAULT_LLM_PROVIDER` / `DEFAULT_LLM_API_KEY` | Opcionales — LLM por defecto de la demo |

> El archivo `.env` está en `.gitignore` y **nunca** debe subirse. Las API keys de cada usuario no van aquí: se capturan en la app y se guardan cifradas en la base de datos.

### 3. Levantar la base de datos

```bash
docker compose up -d
```

> El contenedor publica Postgres en el **puerto 5433** del host para no chocar con una instalación nativa en el 5432. Si cambias el puerto, actualiza `DATABASE_URL`.

### 4. Aplicar el esquema y (opcional) cargar datos de ejemplo

```bash
npx prisma migrate dev      # crea las tablas
npm run db:seed             # carga un workspace de ejemplo (opcional)
```

El seed crea un usuario de prueba:

```
Email:    demo@choplanner.local
Password: demo1234
```

### 5. Arrancar en desarrollo

```bash
npm run dev
```

Abre **http://localhost:3000**, regístrate o entra con la cuenta demo, y empieza a crear workspaces y tareas. La IA y Google Calendar funcionan en cuanto añades tus credenciales (siguiente sección).

---

## Integraciones opcionales

### Asistente de IA (LLM)

1. Entra en **Settings** dentro de la app.
2. Añade la API key del proveedor que prefieras (Anthropic, OpenAI o Google).
3. La clave se cifra con AES-256-GCM y se guarda en la base de datos; nunca vuelve al frontend.
4. Elige el modelo en el chat o en el generador de planes.

### Google Calendar

1. Crea un proyecto en [Google Cloud Console](https://console.cloud.google.com/), configura la pantalla de consentimiento OAuth y obtén `client_id` y `client_secret`.
2. Añade como URI de redirección autorizada: `http://localhost:3000/api/google/callback`.
3. Usa el **scope mínimo** `https://www.googleapis.com/auth/calendar.events`.
4. Rellena `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` en `.env`.
5. En **Settings**, pulsa *Conectar Google Calendar*. El refresh token se guarda cifrado y cada subida de evento pide confirmación explícita.

---

## Seguridad

- API keys y refresh tokens se almacenan **cifrados con AES-256-GCM**, nunca en texto plano.
- Las credenciales jamás se envían al frontend; el chat y la generación corren en el servidor.
- Las contraseñas se guardan con hash **bcrypt**.
- Toda operación CRUD está acotada al `userId` de la sesión.
- Google Calendar usa OAuth 2.0 con scope mínimo y confirmación explícita antes de cualquier acción.

---

## Hoja de ruta

- [x] Base: Next.js + Prisma + Postgres + Auth.js
- [x] Workspaces y tareas con board Kanban
- [x] Drag and drop con persistencia de orden
- [x] Subtareas, sprints y notas
- [x] Asistente de IA multi-proveedor con salida validada
- [x] Avatar y persona del asistente
- [x] Integración con Google Calendar
- [x] Pulido responsive y datos de ejemplo
- [ ] PWA (instalable, offline parcial) — opcional

---

## Créditos y licencias

Los avatares del asistente se generan con **[DiceBear](https://www.dicebear.com/)** (librería bajo licencia MIT, por Florian Körner). Cada estilo de avatar tiene su propio autor y licencia. Los estilos `Adventurer`, `Micah` y `Fun Emoji` se publican bajo **CC BY 4.0**, que exige atribución; este proyecto la cumple con la siguiente tabla:

| Estilo | Autor | Licencia | Fuente original |
|--------|-------|----------|-----------------|
| **Notionists** | Zoish | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) | <https://heyzoish.gumroad.com/l/notionists> |
| **Lorelei** | Lisa Wischofsky | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) | <https://www.figma.com/community/file/1198749693280469639> |
| **Adventurer** | Lisa Wischofsky | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | <https://www.figma.com/community/file/1184595184137881796> |
| **Micah** (*Avatar Illustration System*) | Micah Lanier | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | <https://www.figma.com/community/file/829741575478342595> |
| **Fun Emoji** (*Fun Emoji Set*) | Davis Uche | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | <https://www.figma.com/community/file/968125295144990435> |
| **Bottts** | Pablo Stanley | Free for personal and commercial use | <https://bottts.com/> |

---

## Licencia

Este proyecto se distribuye bajo licencia **MIT**. Consulta el archivo [LICENSE](LICENSE).

<div align="center">
<sub>Construido como proyecto de portafolio. Local-first, sin custodia de credenciales de terceros.</sub>
</div>
