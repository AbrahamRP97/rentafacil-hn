# RentaFácil HN

Plataforma web para alquiler de propiedades en Honduras. Permite a propietarios publicar sus propiedades y a inquilinos encontrar y reservar alojamiento de manera fácil y segura.

---

## Integrantes

| Nombre | Rol |

| Abraham | Normalización + Dependencias Funcionales |
| Rubén | Stored Procedures y Consultas Avanzadas |
| Dennise | Transacciones ACID + Control de Concurrencia |

---

## Tecnologías utilizadas

- **Frontend:** React + Vite
- **Backend:** Node.js + Express
- **Base de datos:** Supabase (PostgreSQL)
- **Control de versiones:** Git + GitHub

---

## Estructura del proyecto
rentafacil-hn/

├── frontend/         # Aplicación React

├── backend/          # API REST con Express

├── database/         # Scripts SQL

└── README.md


---

## Requisitos previos

Asegúrate de tener instalado:

- [Node.js](https://nodejs.org) v18 o superior
- [Git](https://git-scm.com)
- Una cuenta en [Supabase](https://supabase.com)

---

## Cómo ejecutar el proyecto

### 1. Clonar el repositorio

```bash
git clone https://github.com/AbrahamRP97/rentafacil-hn.git
cd rentafacil-hn
```

### 2. Configurar el Backend

```bash
cd backend
npm install
```

Crea un archivo `.env` dentro de la carpeta `backend/` con las siguientes variables:
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co

SUPABASE_KEY=tu_clave_anon_publica

PORT=3000

> ⚠️ Solicita las credenciales de Supabase a un integrante del equipo. Nunca se suben al repositorio.

Inicia el servidor:

```bash
npm run dev
```

El backend correrá en `https://rentafacil-hn-production.up.railway.app`

### 3. Configurar el Frontend

Abre una nueva terminal:

```bash
cd frontend
npm install
npm run dev
```

El frontend correrá en `https://rentafacil-hn.vercel.app/`

---

## Endpoints disponibles

| Método | Endpoint | Descripción |

| GET | /api/propiedades | Obtener todas las propiedades |
| GET | /api/propiedades/:id | Obtener una propiedad por ID |
| POST | /api/propiedades | Crear una propiedad |
| PUT | /api/propiedades/:id | Actualizar una propiedad |
| DELETE | /api/propiedades/:id | Eliminar una propiedad |
| GET | /api/propietarios | Obtener todos los propietarios |
| GET | /api/inquilinos | Obtener todos los inquilinos |
| GET | /api/reservas | Obtener todas las reservas |
| GET | /api/contratos | Obtener todos los contratos |
| GET | /api/pagos | Obtener todos los pagos |

---

## Base de datos

El proyecto utiliza **Supabase** como servicio de base de datos (PostgreSQL). El esquema incluye las siguientes tablas:

- `UBICACIONES`
- `PROPIETARIOS`
- `INQUILINOS`
- `PROPIEDADES`
- `IMAGENES_PROPIEDAD`
- `RESERVAS`
- `CONTRATOS`
- `PAGOS`
- `CALIFICACIONES`

Los scripts SQL se encuentran en la carpeta `database/`.

---

## Credenciales de prueba

| Rol | Correo | Contraseña |

| Anfitrión | admin@rentafacil.com | 1234 |
| Inquilino | usuario@rentafacil.com | 1234 |

> Estas credenciales son temporales hasta conectar la autenticación real con Supabase.

---

## Estado del proyecto

- [x] Estructura base del proyecto
- [x] Backend con Express conectado a Supabase
- [x] CRUD completo de entidades principales
- [x] Frontend con React + Vite
- [x] Páginas: Inicio, Propiedades, Detalle, Login, Registro, Panel Admin
- [x] Rutas protegidas por rol
- [x] Autenticación real con Supabase Auth
- [x] Consultas avanzadas implementadas
- [x] Transacciones ACID
- [x] Control de concurrencia