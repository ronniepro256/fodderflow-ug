CREATE TABLE `alertThresholds` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`animalType` varchar(50) NOT NULL,
	`criticalDays` int NOT NULL DEFAULT 3,
	`warningDays` int NOT NULL DEFAULT 7,
	`notifyEmail` int NOT NULL DEFAULT 1,
	`notifyInApp` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `alertThresholds_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`animalType` varchar(50) NOT NULL,
	`notificationType` enum('critical','warning','info') NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`daysRemaining` int,
	`isRead` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`readAt` timestamp,
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
