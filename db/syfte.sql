CREATE TABLE `users` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `created_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  `updated_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  `deleted_at` datetime,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `username` varchar(60) UNIQUE NOT NULL,
  `email` varchar(255) UNIQUE NOT NULL,
  `email_verified_at` datetime,
  `password_hash` varchar(255),
  `profile_image_url` text,
  `total_saved_chf` decimal(18,2) NOT NULL DEFAULT 0,
  `favorite_goal_id` bigint
);

CREATE TABLE `auth_identities` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `created_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  `provider` ENUM ('password', 'google') NOT NULL,
  `user_id` bigint NOT NULL,
  `provider_uid` varchar(191) UNIQUE NOT NULL,
  `meta_json` json
);

CREATE TABLE `user_settings` (
  `user_id` bigint PRIMARY KEY,
  `timezone` varchar(64) NOT NULL DEFAULT 'Europe/Zurich',
  `daily_push_hour` tinyint NOT NULL DEFAULT 10,
  `daily_push_minute` tinyint NOT NULL DEFAULT 0,
  `locale` varchar(16) NOT NULL DEFAULT 'de-CH'
);

CREATE TABLE `push_subscriptions` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `endpoint` text NOT NULL,
  `p256dh` text NOT NULL,
  `auth_key` text NOT NULL,
  `created_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  `last_used_at` datetime
);

CREATE TABLE `friendships` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `requester_id` bigint NOT NULL,
  `addressee_id` bigint NOT NULL,
  `status` ENUM ('pending', 'accepted', 'blocked') NOT NULL DEFAULT 'pending',
  `created_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  `responded_at` datetime
);

CREATE TABLE `achievements` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `slug` varchar(100) UNIQUE NOT NULL,
  `name` varchar(150) NOT NULL,
  `description` varchar(500),
  `image_url` text,
  `criteria_type` ENUM ('streak_days', 'goal_completed', 'total_saved', 'daily_save', 'custom') NOT NULL,
  `threshold_value` bigint NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `display_order` int NOT NULL DEFAULT 0
);

CREATE TABLE `user_achievements` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `achievement_id` bigint NOT NULL,
  `awarded_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE `goals` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `owner_id` bigint NOT NULL,
  `title` varchar(200) NOT NULL,
  `target_chf` decimal(18,2) NOT NULL,
  `saved_chf` decimal(18,2) NOT NULL DEFAULT 0,
  `image_url` text,
  `is_favorite` tinyint(1) NOT NULL DEFAULT 0,
  `is_shared` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  `updated_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE `goal_members` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `goal_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `role` ENUM ('owner', 'editor', 'viewer') NOT NULL DEFAULT 'editor',
  `joined_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE `actions` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `creator_id` bigint,
  `title` varchar(200) NOT NULL,
  `description` varchar(500),
  `default_chf` decimal(10,2) NOT NULL,
  `image_url` text,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE `goal_actions` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `goal_id` bigint NOT NULL,
  `action_id` bigint NOT NULL
);

CREATE TABLE `savings` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `goal_id` bigint NOT NULL,
  `action_id` bigint,
  `amount_chf` decimal(10,2) NOT NULL,
  `note` varchar(300),
  `occurred_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  `created_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE `daily_aggregates` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `day_date` date NOT NULL,
  `user_id` bigint NOT NULL,
  `goal_id` bigint,
  `amount_chf` decimal(18,2) NOT NULL DEFAULT 0
);

CREATE TABLE `streaks` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `goal_id` bigint,
  `current_count` int NOT NULL DEFAULT 0,
  `longest_count` int NOT NULL DEFAULT 0,
  `last_save_date` date
);

CREATE TABLE `export_jobs` (
  `id` bigint PRIMARY KEY AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `kind` ENUM ('transactions_csv', 'goals_csv', 'full_json') NOT NULL,
  `status` ENUM ('queued', 'running', 'done', 'failed') NOT NULL DEFAULT 'queued',
  `requested_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  `finished_at` datetime,
  `file_url` text,
  `error_message` text
);

CREATE UNIQUE INDEX `uq_friend_pair` ON `friendships` (`requester_id`, `addressee_id`);

CREATE INDEX `friendships_index_1` ON `friendships` (`requester_id`);

CREATE INDEX `friendships_index_2` ON `friendships` (`addressee_id`);

CREATE UNIQUE INDEX `uq_user_achievement` ON `user_achievements` (`user_id`, `achievement_id`);

CREATE INDEX `user_achievements_index_4` ON `user_achievements` (`user_id`);

CREATE INDEX `goals_index_5` ON `goals` (`owner_id`);

CREATE UNIQUE INDEX `uq_goal_user` ON `goal_members` (`goal_id`, `user_id`);

CREATE INDEX `goal_members_index_7` ON `goal_members` (`user_id`);

CREATE INDEX `actions_index_8` ON `actions` (`creator_id`);

CREATE UNIQUE INDEX `uq_goal_action` ON `goal_actions` (`goal_id`, `action_id`);

CREATE INDEX `goal_actions_index_10` ON `goal_actions` (`goal_id`);

CREATE INDEX `goal_actions_index_11` ON `goal_actions` (`action_id`);

CREATE INDEX `savings_index_12` ON `savings` (`user_id`, `occurred_at`);

CREATE INDEX `savings_index_13` ON `savings` (`goal_id`, `occurred_at`);

CREATE INDEX `savings_index_14` ON `savings` (`action_id`);

CREATE UNIQUE INDEX `uq_day_user_goal` ON `daily_aggregates` (`day_date`, `user_id`, `goal_id`);

CREATE INDEX `daily_aggregates_index_16` ON `daily_aggregates` (`user_id`, `day_date`);

CREATE UNIQUE INDEX `uq_streak_user_goal` ON `streaks` (`user_id`, `goal_id`);

CREATE INDEX `streaks_index_18` ON `streaks` (`user_id`);

CREATE INDEX `export_jobs_index_19` ON `export_jobs` (`user_id`);

ALTER TABLE `users` COMMENT = 'Userprofil inkl. Alltime-Summe. favorite_goal_id fuer schnelle Einmal-Sparungen.';

ALTER TABLE `auth_identities` COMMENT = 'OAuth/Passwort Verknuepfungen. Jede Zeile = 1 Identitaet pro Provider.';

ALTER TABLE `user_settings` COMMENT = 'Individuelle App-/Push-Einstellungen, 10:00 Reminder.';

ALTER TABLE `push_subscriptions` COMMENT = 'Web Push (VAPID) Subscriptions fuer PWA-Benachrichtigungen.';

ALTER TABLE `friendships` COMMENT = 'Freundschaften inkl. Pending/Accepted/Blocked. Paar eindeutig. Symmetrie (wer wen eingeladen hat) wird app-seitig oder via View gehandhabt.';

ALTER TABLE `achievements` COMMENT = 'Vordefinierte Auszeichnungen (z. B. Streak 7, Total 100 CHF).';

ALTER TABLE `user_achievements` COMMENT = 'Welche Achievements eine Person bereits erhalten hat.';

ALTER TABLE `goals` COMMENT = 'Sparziele mit Zielbetrag, Fortschritt und Bild. is_shared wird durch Mitgliederanzahl gespiegelt.';

ALTER TABLE `goal_members` COMMENT = 'Mitgliedschaften an Zielen. Best Practice: max. 2 Mitglieder (per Applogik/Trigger).';

ALTER TABLE `actions` COMMENT = 'Sparaktionen (global oder user-spezifisch), z. B. Kaffee ausgelassen.';

ALTER TABLE `goal_actions` COMMENT = 'Welche Aktionen bei einem Ziel zur Auswahl stehen.';

ALTER TABLE `savings` COMMENT = 'Transaktionen (Sparvorgaenge). Treiben Summen, Aggregates und Streaks.';

ALTER TABLE `daily_aggregates` COMMENT = 'Tages-Summen (gesamt und pro Ziel) fuer Diagramme und Projektionen.';

ALTER TABLE `streaks` COMMENT = 'Aktuelle und laengste Sparserie je Ziel und insgesamt.';

ALTER TABLE `export_jobs` COMMENT = 'Asynchrone Exporte (CSV/JSON) mit Status und Ergebnis-URL.';

ALTER TABLE `users` ADD FOREIGN KEY (`favorite_goal_id`) REFERENCES `goals` (`id`);

ALTER TABLE `auth_identities` ADD FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

ALTER TABLE `user_settings` ADD FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

ALTER TABLE `push_subscriptions` ADD FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

ALTER TABLE `friendships` ADD FOREIGN KEY (`requester_id`) REFERENCES `users` (`id`);

ALTER TABLE `friendships` ADD FOREIGN KEY (`addressee_id`) REFERENCES `users` (`id`);

ALTER TABLE `user_achievements` ADD FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

ALTER TABLE `user_achievements` ADD FOREIGN KEY (`achievement_id`) REFERENCES `achievements` (`id`);

ALTER TABLE `goals` ADD FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`);

ALTER TABLE `goal_members` ADD FOREIGN KEY (`goal_id`) REFERENCES `goals` (`id`);

ALTER TABLE `goal_members` ADD FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

ALTER TABLE `users` ADD FOREIGN KEY (`id`) REFERENCES `actions` (`creator_id`);

ALTER TABLE `goal_actions` ADD FOREIGN KEY (`goal_id`) REFERENCES `goals` (`id`);

ALTER TABLE `goal_actions` ADD FOREIGN KEY (`action_id`) REFERENCES `actions` (`id`);

ALTER TABLE `savings` ADD FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

ALTER TABLE `savings` ADD FOREIGN KEY (`goal_id`) REFERENCES `goals` (`id`);

ALTER TABLE `actions` ADD FOREIGN KEY (`id`) REFERENCES `savings` (`action_id`);

ALTER TABLE `daily_aggregates` ADD FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

ALTER TABLE `goals` ADD FOREIGN KEY (`id`) REFERENCES `daily_aggregates` (`goal_id`);

ALTER TABLE `streaks` ADD FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

ALTER TABLE `goals` ADD FOREIGN KEY (`id`) REFERENCES `streaks` (`goal_id`);

ALTER TABLE `export_jobs` ADD FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);
