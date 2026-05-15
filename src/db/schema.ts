import { sql } from 'drizzle-orm';
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
  referralCode: text('referral_code').unique(),
  referredBy: text('referred_by'),
  noShowCount: integer('no_show_count').notNull().default(0),
  bookingBlocked: integer('booking_blocked', { mode: 'boolean' }).notNull().default(false),
  lastVisitAt: text('last_visit_at'),
  createdAt: text('created_at').notNull().default(sql`(datetime())`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime())`),
});

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  tokenHash: text('token_hash').notNull(),
  expiresAt: text('expires_at').notNull(),
  createdAt: text('created_at').notNull().default(sql`(datetime())`),
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
  createdAt: text('created_at').notNull().default(sql`(datetime())`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime())`),
});

export const pointsTransactions = sqliteTable('points_transactions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  bookingId: text('booking_id').references(() => bookings.id),
  amount: integer('amount').notNull(),
  type: text('type', { enum: ['earned', 'redeemed', 'expired'] }).notNull(),
  description: text('description'),
  createdAt: text('created_at').notNull().default(sql`(datetime())`),
});

export const reviews = sqliteTable('reviews', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  bookingId: text('booking_id').references(() => bookings.id),
  rating: integer('rating').notNull(),
  text: text('text'),
  createdAt: text('created_at').notNull().default(sql`(datetime())`),
});

export const passwordResetTokens = sqliteTable('password_reset_tokens', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  tokenHash: text('token_hash').notNull(),
  expiresAt: text('expires_at').notNull(),
  usedAt: text('used_at'),
  createdAt: text('created_at').notNull().default(sql`(datetime())`),
});

export const emailVerificationTokens = sqliteTable('email_verification_tokens', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  tokenHash: text('token_hash').notNull(),
  expiresAt: text('expires_at').notNull(),
  createdAt: text('created_at').notNull().default(sql`(datetime())`),
});

// Gastbuchungen (ohne Konto)
export const guestBookings = sqliteTable('guest_bookings', {
  id: text('id').primaryKey(),
  serviceId: text('service_id').notNull(),
  date: text('date').notNull(),
  startTime: text('start_time').notNull(),
  endTime: text('end_time').notNull(),
  status: text('status', {
    enum: ['confirmed', 'cancelled'],
  }).notNull().default('confirmed'),
  guestName: text('guest_name').notNull(),
  guestEmail: text('guest_email').notNull(),
  guestPhone: text('guest_phone'),
  cancelToken: text('cancel_token').notNull().unique(),
  createdAt: text('created_at').notNull().default(sql`(datetime())`),
});

// Warteliste für ausgebuchte Slots
export const waitlist = sqliteTable('waitlist', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  serviceId: text('service_id').notNull(),
  date: text('date').notNull(),
  preferredStartTime: text('preferred_start_time'),
  status: text('status', { enum: ['waiting', 'notified', 'booked', 'expired'] }).notNull().default('waiting'),
  createdAt: text('created_at').notNull().default(sql`(datetime())`),
});

// Trinkgeld
export const tips = sqliteTable('tips', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  bookingId: text('booking_id').notNull().references(() => bookings.id),
  amountPoints: integer('amount_points').notNull(),
  createdAt: text('created_at').notNull().default(sql`(datetime())`),
});

// Referral-Einladungen
export const referrals = sqliteTable('referrals', {
  id: text('id').primaryKey(),
  referrerId: text('referrer_id').notNull().references(() => users.id),
  referredUserId: text('referred_user_id').references(() => users.id),
  status: text('status', { enum: ['pending', 'completed', 'rewarded'] }).notNull().default('pending'),
  createdAt: text('created_at').notNull().default(sql`(datetime())`),
});

// Saisonale Angebote / Happy Hour
export const promotions = sqliteTable('promotions', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  discountPercent: integer('discount_percent').notNull(),
  serviceIds: text('service_ids'), // JSON array of service IDs, null = all
  dayOfWeek: text('day_of_week'), // 'monday','tuesday', etc. or null = every day
  startTime: text('start_time'), // e.g. '10:00', null = all day
  endTime: text('end_time'),
  validFrom: text('valid_from').notNull(),
  validUntil: text('valid_until').notNull(),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull().default(sql`(datetime())`),
});

// Admin-Einstellungen (Feature-Toggles)
export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: text('updated_at').notNull().default(sql`(datetime())`),
});

export const pushSubscriptions = sqliteTable('push_subscriptions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  endpoint: text('endpoint').notNull(),
  p256dh: text('p256dh').notNull(),
  auth: text('auth').notNull(),
  createdAt: text('created_at').notNull().default(sql`(datetime())`),
});
