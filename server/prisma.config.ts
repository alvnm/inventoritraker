import 'dotenv/config';
import { defineConfig } from 'prisma/config';

/**
 * Configuración del CLI de Prisma (reemplaza al bloque `prisma` de package.json,
 * deprecado desde Prisma 6). Se aplica a todos los comandos: generate, validate,
 * db push, db seed, migrate, studio…
 *
 * Notas:
 * - `migrations.seed` define el comando que ejecuta `prisma db seed`.
 * - No usamos el helper `env()` porque lanza error si la variable no existe, y
 *   esta config se carga también en comandos que no necesitan BD (p. ej. `generate`).
 *   Con `process.env` y fallback vacío, `generate` funciona sin DATABASE_URL.
 * - En local `DIRECT_URL` puede estar vacío (ver server/.env.example); en
 *   producción (Supabase) apunta a la conexión directa para migraciones.
 */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    seed: 'node prisma/seed.js',
  },
  engine: 'classic',
  datasource: {
    url: process.env.DATABASE_URL ?? '',
    // Solo envía directUrl si está definida. Si algún día quitas `directUrl`
    // del schema, esta config deja de enviarla automáticamente.
    ...(process.env.DIRECT_URL ? { directUrl: process.env.DIRECT_URL } : {}),
  },
});
