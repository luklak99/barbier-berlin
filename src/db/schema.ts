import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  phone: text('phone'),
  role: text('role', { enum: ['customer', 'admin'] }).notNull().default('customer'),
  totpSecret: text('totp_secret'),
  totpEnabled: integer('totp_enabled', { mode: 'boolean' }).notNull().default(false),
  emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false),
  pointsBalance: integer('points_balance').notNull().default(0),
  language: text('language', { enum: ['de', 'en', 'tr', 'ar'] }).notNull().default('de'),
  lastVisitAt: text('last_visit_at'),
  createdAt: text('created_at').notNull().default('(datetime())'),
  updatedAt: text('updated_at').notNull().default('(datetime())'),
});

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  tokenHash: text('token_hash').notNull(),
  expiresAt: text('expires_at').notNull(),
  createdAt: text('created_at').notNull().default('(datetime())'),
});

export const bookings = sqliteTable('bookings', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  serviceId: text('service_id').notNull(),
  date: text('date').notNull(),
  startTime: text('start_time').notNull(),
  endTime: text('end_time').notNull(),
  status: text('status', {
    enum: ['confirmed', 'cancelled', 'completed', 'no_show'],
  }).notNull().default('confirmed'),
  paidWithPoints: integer('paid_with_points', { mode: 'boolean' }).notNull().default(false),
  pointsUsed: integer('points_used').notNull().default(0),
  isWalkIn: integer('is_walk_in', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull().default('(datetime())'),
  updatedAt: text('updated_at').notNull().default('(datetime())'),
});

export const pointsTransactions = sqliteTable('points_transactions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  bookingId: text('booking_id').references(() => bookings.id),
  amount: integer('amount').notNull(),
  type: text('type', { enum: ['earned', 'redeemed', 'expired'] }).notNull(),
  description: text('description'),
  createdAt: text('created_at').notNull().default('(datetime())'),
});

export const reviews = sqliteTable('reviews', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  bookingId: text('booking_id').references(() => bookings.id),
  rating: integer('rating').notNull(),
  text: text('text'),
  createdAt: text('created_at').notNull().default('(datetime())'),
});

export const passwordResetTokens = sqliteTable('password_reset_tokens', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  tokenHash: text('token_hash').notNull(),
  expiresAt: text('expires_at').notNull(),
  usedAt: text('used_at'),
  createdAt: text('created_at').notNull().default('(datetime())'),
});

export const emailVerificationTokens = sqliteTable('email_verification_tokens', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  tokenHash: text('token_hash').notNull(),
  expiresAt: text('expires_at').notNull(),
  createdAt: text('created_at').notNull().default('(datetime())'),
});

export const pushSubscriptions = sqliteTable('push_subscriptions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  endpoint: text('endpoint').notNull(),
  p256dh: text('p256dh').notNull(),
  auth: text('auth').notNull(),
  createdAt: text('created_at').notNull().default('(datetime())'),
});
