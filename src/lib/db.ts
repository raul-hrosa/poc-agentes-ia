import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from '../../drizzle/schema'

declare global {
  var _db: ReturnType<typeof Database> | undefined
}

if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL não está configurada. Copie .env.example para .env.local e defina o valor.'
  )
}

const sqlite = global._db ?? new Database(process.env.DATABASE_URL)
if (process.env.NODE_ENV !== 'production') global._db = sqlite

export const db = drizzle(sqlite, { schema })
