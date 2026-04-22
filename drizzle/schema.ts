import { sqliteTable, text, integer, uniqueIndex } from 'drizzle-orm/sqlite-core'

export const links = sqliteTable(
  'links',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    slug: text('slug').notNull(),
    url: text('url').notNull(),
    clickCount: integer('click_count').notNull().default(0),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    slugIdx: uniqueIndex('links_slug_idx').on(table.slug),
  })
)

export type Link = typeof links.$inferSelect
export type NewLink = typeof links.$inferInsert
