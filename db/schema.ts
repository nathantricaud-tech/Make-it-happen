import { sqliteTable, text, integer, primaryKey, index } from 'drizzle-orm/sqlite-core';
export const records = sqliteTable('records', {id:text('id').primaryKey(), owner:text('owner').notNull(), kind:text('kind').notNull(), payload:text('payload').notNull(), created:text('created').notNull()}, t=>[index('records_owner').on(t.owner,t.kind)]);
export const profiles = sqliteTable('profiles',{id:text('id').primaryKey(),name:text('name').notNull(),code:text('code').notNull().unique()});
export const groups = sqliteTable('groups',{id:text('id').primaryKey(),owner:text('owner').notNull(),name:text('name').notNull(),code:text('code').notNull().unique()});
export const members = sqliteTable('members',{groupId:text('group_id').notNull(),userId:text('user_id').notNull()},t=>[primaryKey({columns:[t.groupId,t.userId]})]);
export const messages = sqliteTable('messages',{id:text('id').primaryKey(),groupId:text('group_id').notNull(),owner:text('owner').notNull(),body:text('body').notNull(),created:text('created').notNull()});
export const friends = sqliteTable('friends',{owner:text('owner').notNull(),peer:text('peer').notNull(),status:text('status').notNull()},t=>[primaryKey({columns:[t.owner,t.peer]})]);
export const usage = sqliteTable('usage',{owner:text('owner').notNull(),day:text('day').notNull(),count:integer('count').notNull()},t=>[primaryKey({columns:[t.owner,t.day]})]);
export const emailAccounts = sqliteTable('email_accounts',{id:text('id').primaryKey(),userId:text('user_id').notNull().unique(),email:text('email').notNull().unique(),name:text('name').notNull(),passwordHash:text('password_hash').notNull(),recoveryHash:text('recovery_hash'),created:integer('created').notNull()});
export const emailSessions = sqliteTable('email_sessions',{tokenHash:text('token_hash').primaryKey(),accountId:text('account_id').notNull().references(()=>emailAccounts.id),expires:integer('expires').notNull()},t=>[index('email_sessions_account').on(t.accountId)]);
export const authAttempts = sqliteTable('auth_attempts',{key:text('key').notNull(),window:integer('window').notNull(),count:integer('count').notNull()},t=>[primaryKey({columns:[t.key,t.window]})]);

export const passwordResets = sqliteTable('password_resets',{tokenHash:text('token_hash').primaryKey(),accountId:text('account_id').notNull().references(()=>emailAccounts.id),passwordSnapshot:text('password_snapshot').notNull(),expires:integer('expires').notNull()},t=>[index('password_resets_account').on(t.accountId)]);
