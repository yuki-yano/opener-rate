CREATE TABLE `short_links` (
	`key` text PRIMARY KEY NOT NULL,
	`target_url` text NOT NULL,
	`created_at` integer DEFAULT (strftime('%s','now') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s','now') * 1000) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_short_links_created_at` ON `short_links` (`created_at`);