import { pgTable, serial, integer, timestamp, text, boolean, real, jsonb, varchar } from 'drizzle-orm/pg-core';

// Users table
export const users = pgTable('users', {
    id: serial('id').primaryKey(),
    username: text('username').notNull().unique(),
    password: text('password').notNull(),
    name: text('name').notNull(),
    email: text('email').notNull(),
    department: text('department'),
    role: text('role').default('user'),
    avatar_color: text('avatar_color'),
    status: text('status').default('offline'),
    last_active: timestamp('last_active'),
    team_id: integer('team_id'),
    organization_id: integer('organization_id'),
    is_agent: boolean('is_agent').default(false)
});

// Teams table
export const teams = pgTable('teams', {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
    owner_id: integer('owner_id').notNull(),
    organization_id: integer('organization_id')
});

// Activities table
export const activities = pgTable('activities', {
    id: serial('id').primaryKey(),
    user_id: integer('user_id').notNull(),
    team_id: integer('team_id'),
    start_time: timestamp('start_time').notNull(),
    end_time: timestamp('end_time').notNull(),
    duration: integer('duration').notNull(),
    application: text('application').notNull(),
    website: text('website'),
    title: text('title'),
    category: text('category'),
    is_active: boolean('is_active').default(true)
});

// App rules table
export const appRules = pgTable('app_rules', {
    id: serial('id').primaryKey(),
    application: text('application').notNull().unique(),
    category: text('category').notNull(),
    is_blocked: boolean('is_blocked').default(false),
    created_at: timestamp('created_at').defaultNow(),
    updated_at: timestamp('updated_at').defaultNow()
});

export interface User {
  id: number;
  username: string;
  password: string;
  name: string;
  email: string;
  department: string | null;
  role: string;
  avatar_color: string;
  status: string;
  last_active: Date;
  team_id: number | null;
  organization_id: number;
  is_agent: boolean;
} 