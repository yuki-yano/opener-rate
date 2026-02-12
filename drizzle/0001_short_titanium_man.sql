CREATE TABLE `chat_histories` (
	`key` text PRIMARY KEY NOT NULL,
	`messages_json` text NOT NULL,
	`created_at` integer DEFAULT (strftime('%s','now') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s','now') * 1000) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_chat_histories_created_at` ON `chat_histories` (`created_at`);