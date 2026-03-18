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
  migrate: {
    adapter(env) {
      return new PrismaPg({ connectionString: process.env.DATABASE_URL as string })
    },
  },
})
