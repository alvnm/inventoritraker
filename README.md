# 🐉 D&D Inventory Tracker

Aplicación web completa para administrar los inventarios de los personajes de una campaña de Dungeons & Dragons, con roles de **Player** y **DM**.

## ✨ Funcionalidades

- **Usuarios y auth**: registro, login, logout, recuperación de contraseña, sesiones persistentes con JWT (access + refresh), contraseñas hasheadas con bcrypt.
- **Roles**: dashboard y navegación distintos para Player y DM.
- **Campañas**: el DM crea campañas con código de invitación; los jugadores se unen con el código. El DM ve/expulsa jugadores.
- **Personajes**: ficha completa (stats D&D, nivel, clase, raza, avatar, capacidad de carga) con página individual.
- **Inventario**: objetos con cantidad, equipado, notas; búsqueda, filtros por categoría, ordenación; inventario dividido en **Equipado** y **Mochila**; barra de peso con estados (dentro / cerca / sobrepasando).
- **Monedas**: PP, GP, EP, SP, CP con total automático en cobre.
- **Biblioteca de objetos**: ~55 objetos D&D precargados + objetos personalizados por usuario (no se duplican: se referencian por ID).
- **Permisos DM**: ve los personajes de su campaña; puede editar inventario/monedas solo si el jugador activa *"Permitir al DM editar mi inventario"*. Puede **entregar objetos** directamente.
- **Extras**: historial de cambios del inventario (con quién lo hizo), transferencia de objetos entre personajes propios, exportar ficha JSON, tema oscuro estilo fantasía, responsive (móvil → PC).

## 🏗️ Stack

| Capa | Tecnología |
|---|---|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS |
| Backend | Node.js + Express |
| Base de datos | PostgreSQL |
| ORM | Prisma |
| Auth | JWT (access 15 min + refresh 30 días) + bcrypt |

## 📁 Estructura

```
├── client/                 # Frontend React + Vite + Tailwind
│   └── src/
│       ├── api/            # Cliente fetch + endpoints tipados
│       ├── components/     # Layout, UI (Modal, Confirm) y Character
│       ├── context/        # AuthContext, ToastContext
│       ├── lib/            # Formateo (categorías, rarezas, monedas)
│       └── pages/          # 15 páginas (auth, dashboards, personajes…)
└── server/                 # Backend Express
    ├── prisma/
    │   ├── schema.prisma   # Users, Campaigns, CampaignMembers, Characters,
    │   │                   # Items, CharacterItems, Currency, InventoryLog, TransferLog
    │   └── seed.js         # Biblioteca global de objetos D&D
    └── src/
        ├── middleware/     # auth (JWT + roles + acceso), errorHandler
        ├── lib/            # tokens (JWT), currency (conversiones)
        └── routes/         # auth, campaigns, characters, items,
                            # characterItems, currency, logs, users
```

## 🚀 Puesta en marcha

### 1. Requisitos

- Node.js 18+
- PostgreSQL 13+ corriendo localmente (o una URL remota)

### 2. Instalar dependencias

```bash
npm install            # herramienta raíz (concurrently)
npm run setup          # instala server y client + genera el cliente Prisma
```

### 3. Configurar variables de entorno

```bash
cp server/.env.example server/.env
```

Edita `server/.env` y ajusta `DATABASE_URL` con tus credenciales de PostgreSQL:

```
DATABASE_URL="postgresql://USUARIO:CONTRASEÑA@localhost:5432/dnd_inventory?schema=public"
```

> En producción usa secretos JWT largos y aleatorios (`JWT_ACCESS_SECRET`, etc.).

### 4. Crear la base de datos y migrar

```bash
# Crea la base de datos (si no existe) — con psql o:
createdb dnd_inventory

# Crea las tablas según el schema (entorno local/desarrollo):
npm --prefix server run prisma:push
```

Para producción con migraciones versionadas:

```bash
cd server && npx prisma migrate dev --name init
```

### 5. Sembrar la biblioteca de objetos

```bash
npm run seed
```

Inserta ~55 objetos comunes de D&D (espadas, armaduras, pociones, herramientas…) en la biblioteca global.

### 6. Arrancar

```bash
npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:4000 (health check en `/api/health`)

El frontend hace proxy de `/api` al backend en desarrollo.

## 🔌 API (resumen)

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/auth/register` · `/login` · `/refresh` · `/logout` | Autenticación |
| POST | `/api/auth/forgot-password` · `/reset-password` | Recuperación |
| GET/PATCH | `/api/auth/me` · `/me/password` | Perfil y contraseña |
| GET/POST/PATCH/DELETE | `/api/campaigns` | Campañas (+ `/join`, `/:id/regenerate-code`, `/:id/members/:userId`, `/:id/leave`) |
| GET/POST/PATCH/DELETE | `/api/characters` | Personajes (+ `/campaign/:id`, `/:id/transfer`) |
| GET | `/api/items` | Biblioteca global + propias (filtros `search`, `category`, `rarity`) |
| POST/PATCH/DELETE | `/api/items` | Objetos personalizados |
| GET/POST/PATCH/DELETE | `/api/character-items/:characterId` | Inventario (+ `/:characterId/grant` para el DM) |
| GET/PATCH | `/api/currency/:characterId` | Monedas (valores absolutos o `delta`) |
| GET | `/api/logs/:characterId` | Historial del inventario |

## 🔒 Seguridad

- Contraseñas con bcrypt (10 rounds).
- Access token de corta vida + refresh token; renuevo automático en el cliente.
- Middleware de autorización por rol y por recurso:
  - Un player solo puede modificar **sus** personajes.
  - El DM solo administra campañas que **posee**.
  - El DM solo edita inventarios ajenos si el jugador lo permite (`allowDmEdit`).
- Validación de datos en todos los endpoints (valores, enums, longitudes).
- Mensajes de error genéricos en recuperación de contraseña (no filtra correos).

## 🧪 Flujo de prueba rápido

1. Registra un usuario como **DM** → crea una campaña → copia el código.
2. En otra sesión/navegador, registra un **Player** → *Campañas → Unirse con código*.
3. El player crea un personaje y agrega objetos desde la **Biblioteca**.
4. En *Configuración*, el player activa *"Permitir al DM editar mi inventario"*.
5. Entra como DM → *Jugadores* → selecciona la campaña → verás al jugador y su personaje; puedes **entregar objetos** y (si hay permiso) editar su inventario.
