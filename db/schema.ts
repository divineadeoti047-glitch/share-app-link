import { pgTable, text, jsonb, timestamp } from 'drizzle-orm/pg-core';
export const taskWorkspaces = pgTable('task_workspaces', {
  id: text('id').primaryKey(),
  tasks: jsonb('tasks').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const accountWorkspaces = pgTable('account_workspaces', {
  userId: text('user_id').primaryKey(),
  payload: jsonb('payload').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
