CREATE TABLE `short_links` (
  `key` text PRIMARY KEY NOT NULL,
  `target_url` text NOT NULL,
  `created_at` integer NOT NULL DEFAULT (strftime('%s','now') * 1000),
  `updated_at` integer NOT NULL DEFAULT (strftime('%s','now') * 1000)
);

CREATE INDEX `idx_short_links_created_at` ON `short_links` (`created_at`);
