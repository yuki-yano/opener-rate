PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_short_links` (
	`key` text PRIMARY KEY NOT NULL,
	`target_url` text NOT NULL,
	`deck_name` text,
	`created_at` integer DEFAULT (strftime('%s','now') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s','now') * 1000) NOT NULL,
	CONSTRAINT "chk_short_links_deck_name_length" CHECK("__new_short_links"."deck_name" is null or length("__new_short_links"."deck_name") <= 100)
);
--> statement-breakpoint
INSERT INTO `__new_short_links`("key", "target_url", "deck_name", "created_at", "updated_at") SELECT "key", "target_url", NULL, "created_at", "updated_at" FROM `short_links`;--> statement-breakpoint
DROP TABLE `short_links`;--> statement-breakpoint
ALTER TABLE `__new_short_links` RENAME TO `short_links`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `idx_short_links_created_at` ON `short_links` (`created_at`);
