CREATE TABLE `promotions` (
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
	`created_at` text DEFAULT '(datetime())' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `referrals` (
	`id` text PRIMARY KEY NOT NULL,
	`referrer_id` text NOT NULL,
	`referred_user_id` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` text DEFAULT '(datetime())' NOT NULL,
	FOREIGN KEY (`referrer_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`referred_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` text DEFAULT '(datetime())' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tips` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`booking_id` text NOT NULL,
	`amount_points` integer NOT NULL,
	`created_at` text DEFAULT '(datetime())' NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `waitlist` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`service_id` text NOT NULL,
	`date` text NOT NULL,
	`preferred_start_time` text,
	`status` text DEFAULT 'waiting' NOT NULL,
	`created_at` text DEFAULT '(datetime())' NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `users` ADD `referral_code` text;--> statement-breakpoint
ALTER TABLE `users` ADD `referred_by` text;--> statement-breakpoint
ALTER TABLE `users` ADD `no_show_count` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `booking_blocked` integer DEFAULT false NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `users_referral_code_unique` ON `users` (`referral_code`);