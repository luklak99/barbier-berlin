CREATE TABLE `guest_bookings` (
	`id` text PRIMARY KEY NOT NULL,
	`service_id` text NOT NULL,
	`date` text NOT NULL,
	`start_time` text NOT NULL,
	`end_time` text NOT NULL,
	`status` text DEFAULT 'confirmed' NOT NULL,
	`guest_name` text NOT NULL,
	`guest_email` text NOT NULL,
	`guest_phone` text,
	`cancel_token` text NOT NULL,
	`created_at` text DEFAULT (datetime()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `guest_bookings_cancel_token_unique` ON `guest_bookings` (`cancel_token`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_bookings` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`service_id` text NOT NULL,
	`date` text NOT NULL,
	`start_time` text NOT NULL,
	`end_time` text NOT NULL,
	`status` text DEFAULT 'confirmed' NOT NULL,
	`paid_with_points` integer DEFAULT false NOT NULL,
	`points_used` integer DEFAULT 0 NOT NULL,
	`is_walk_in` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT (datetime()) NOT NULL,
	`updated_at` text DEFAULT (datetime()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_bookings`("id", "user_id", "service_id", "date", "start_time", "end_time", "status", "paid_with_points", "points_used", "is_walk_in", "created_at", "updated_at") SELECT "id", "user_id", "service_id", "date", "start_time", "end_time", "status", "paid_with_points", "points_used", "is_walk_in", "created_at", "updated_at" FROM `bookings`;--> statement-breakpoint
DROP TABLE `bookings`;--> statement-breakpoint
ALTER TABLE `__new_bookings` RENAME TO `bookings`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_email_verification_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text DEFAULT (datetime()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_email_verification_tokens`("id", "user_id", "token_hash", "expires_at", "created_at") SELECT "id", "user_id", "token_hash", "expires_at", "created_at" FROM `email_verification_tokens`;--> statement-breakpoint
DROP TABLE `email_verification_tokens`;--> statement-breakpoint
ALTER TABLE `__new_email_verification_tokens` RENAME TO `email_verification_tokens`;--> statement-breakpoint
CREATE TABLE `__new_password_reset_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`expires_at` text NOT NULL,
	`used_at` text,
	`created_at` text DEFAULT (datetime()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_password_reset_tokens`("id", "user_id", "token_hash", "expires_at", "used_at", "created_at") SELECT "id", "user_id", "token_hash", "expires_at", "used_at", "created_at" FROM `password_reset_tokens`;--> statement-breakpoint
DROP TABLE `password_reset_tokens`;--> statement-breakpoint
ALTER TABLE `__new_password_reset_tokens` RENAME TO `password_reset_tokens`;--> statement-breakpoint
CREATE TABLE `__new_points_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`booking_id` text,
	`amount` integer NOT NULL,
	`type` text NOT NULL,
	`description` text,
	`created_at` text DEFAULT (datetime()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_points_transactions`("id", "user_id", "booking_id", "amount", "type", "description", "created_at") SELECT "id", "user_id", "booking_id", "amount", "type", "description", "created_at" FROM `points_transactions`;--> statement-breakpoint
DROP TABLE `points_transactions`;--> statement-breakpoint
ALTER TABLE `__new_points_transactions` RENAME TO `points_transactions`;--> statement-breakpoint
CREATE TABLE `__new_promotions` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`discount_percent` integer NOT NULL,
	`service_ids` text,
	`day_of_week` text,
	`start_time` text,
	`end_time` text,
	`valid_from` text NOT NULL,
	`valid_until` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (datetime()) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_promotions`("id", "name", "description", "discount_percent", "service_ids", "day_of_week", "start_time", "end_time", "valid_from", "valid_until", "active", "created_at") SELECT "id", "name", "description", "discount_percent", "service_ids", "day_of_week", "start_time", "end_time", "valid_from", "valid_until", "active", "created_at" FROM `promotions`;--> statement-breakpoint
DROP TABLE `promotions`;--> statement-breakpoint
ALTER TABLE `__new_promotions` RENAME TO `promotions`;--> statement-breakpoint
CREATE TABLE `__new_push_subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`endpoint` text NOT NULL,
	`p256dh` text NOT NULL,
	`auth` text NOT NULL,
	`created_at` text DEFAULT (datetime()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_push_subscriptions`("id", "user_id", "endpoint", "p256dh", "auth", "created_at") SELECT "id", "user_id", "endpoint", "p256dh", "auth", "created_at" FROM `push_subscriptions`;--> statement-breakpoint
DROP TABLE `push_subscriptions`;--> statement-breakpoint
ALTER TABLE `__new_push_subscriptions` RENAME TO `push_subscriptions`;--> statement-breakpoint
CREATE TABLE `__new_referrals` (
	`id` text PRIMARY KEY NOT NULL,
	`referrer_id` text NOT NULL,
	`referred_user_id` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` text DEFAULT (datetime()) NOT NULL,
	FOREIGN KEY (`referrer_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`referred_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_referrals`("id", "referrer_id", "referred_user_id", "status", "created_at") SELECT "id", "referrer_id", "referred_user_id", "status", "created_at" FROM `referrals`;--> statement-breakpoint
DROP TABLE `referrals`;--> statement-breakpoint
ALTER TABLE `__new_referrals` RENAME TO `referrals`;--> statement-breakpoint
CREATE TABLE `__new_reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`booking_id` text,
	`rating` integer NOT NULL,
	`text` text,
	`created_at` text DEFAULT (datetime()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_reviews`("id", "user_id", "booking_id", "rating", "text", "created_at") SELECT "id", "user_id", "booking_id", "rating", "text", "created_at" FROM `reviews`;--> statement-breakpoint
DROP TABLE `reviews`;--> statement-breakpoint
ALTER TABLE `__new_reviews` RENAME TO `reviews`;--> statement-breakpoint
CREATE TABLE `__new_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text DEFAULT (datetime()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_sessions`("id", "user_id", "token_hash", "expires_at", "created_at") SELECT "id", "user_id", "token_hash", "expires_at", "created_at" FROM `sessions`;--> statement-breakpoint
DROP TABLE `sessions`;--> statement-breakpoint
ALTER TABLE `__new_sessions` RENAME TO `sessions`;--> statement-breakpoint
CREATE TABLE `__new_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` text DEFAULT (datetime()) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_settings`("key", "value", "updated_at") SELECT "key", "value", "updated_at" FROM `settings`;--> statement-breakpoint
DROP TABLE `settings`;--> statement-breakpoint
ALTER TABLE `__new_settings` RENAME TO `settings`;--> statement-breakpoint
CREATE TABLE `__new_tips` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`booking_id` text NOT NULL,
	`amount_points` integer NOT NULL,
	`created_at` text DEFAULT (datetime()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_tips`("id", "user_id", "booking_id", "amount_points", "created_at") SELECT "id", "user_id", "booking_id", "amount_points", "created_at" FROM `tips`;--> statement-breakpoint
DROP TABLE `tips`;--> statement-breakpoint
ALTER TABLE `__new_tips` RENAME TO `tips`;--> statement-breakpoint
CREATE TABLE `__new_users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`name` text NOT NULL,
	`phone` text,
	`role` text DEFAULT 'customer' NOT NULL,
	`totp_secret` text,
	`totp_enabled` integer DEFAULT false NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`points_balance` integer DEFAULT 0 NOT NULL,
	`language` text DEFAULT 'de' NOT NULL,
	`referral_code` text,
	`referred_by` text,
	`no_show_count` integer DEFAULT 0 NOT NULL,
	`booking_blocked` integer DEFAULT false NOT NULL,
	`last_visit_at` text,
	`created_at` text DEFAULT (datetime()) NOT NULL,
	`updated_at` text DEFAULT (datetime()) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_users`("id", "email", "password_hash", "name", "phone", "role", "totp_secret", "totp_enabled", "email_verified", "points_balance", "language", "referral_code", "referred_by", "no_show_count", "booking_blocked", "last_visit_at", "created_at", "updated_at") SELECT "id", "email", "password_hash", "name", "phone", "role", "totp_secret", "totp_enabled", "email_verified", "points_balance", "language", "referral_code", "referred_by", "no_show_count", "booking_blocked", "last_visit_at", "created_at", "updated_at" FROM `users`;--> statement-breakpoint
DROP TABLE `users`;--> statement-breakpoint
ALTER TABLE `__new_users` RENAME TO `users`;--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_referral_code_unique` ON `users` (`referral_code`);--> statement-breakpoint
CREATE TABLE `__new_waitlist` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`service_id` text NOT NULL,
	`date` text NOT NULL,
	`preferred_start_time` text,
	`status` text DEFAULT 'waiting' NOT NULL,
	`created_at` text DEFAULT (datetime()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_waitlist`("id", "user_id", "service_id", "date", "preferred_start_time", "status", "created_at") SELECT "id", "user_id", "service_id", "date", "preferred_start_time", "status", "created_at" FROM `waitlist`;--> statement-breakpoint
DROP TABLE `waitlist`;--> statement-breakpoint
ALTER TABLE `__new_waitlist` RENAME TO `waitlist`;