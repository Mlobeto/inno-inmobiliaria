import { config } from 'dotenv'
import { defineConfig } from 'prisma/config'
import { PrismaPg } from '@prisma/adapter-pg'

config() // Cargar variables de entorno desde .env

const dbUrl = process.env.DATABASE_URL as string

export default defineConfig({
  schema: './prisma/schema.prisma',
  datasource: {
    url: dbUrl,
  },
  // Nota: migrate NO usa adapter — usa la URL directamente con el motor nativo de Prisma.
  // PrismaPg solo se usa en runtime (query engine), no en migraciones.
})
