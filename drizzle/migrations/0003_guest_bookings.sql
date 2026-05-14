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
	`created_at` text DEFAULT '(datetime())' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `guest_bookings_cancel_token_unique` ON `guest_bookings` (`cancel_token`);
