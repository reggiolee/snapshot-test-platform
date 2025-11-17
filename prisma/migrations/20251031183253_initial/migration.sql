-- CreateTable
CREATE TABLE "task_groups" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "default_threshold" REAL NOT NULL DEFAULT 0.1,
    "default_config" TEXT NOT NULL DEFAULT '{}',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "urls" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "task_group_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "pre_script" TEXT,
    "threshold" REAL,
    "viewport_config" TEXT NOT NULL DEFAULT '{"width": 1920, "height": 1080}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "urls_task_group_id_fkey" FOREIGN KEY ("task_group_id") REFERENCES "task_groups" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "schedules" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "task_group_id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "cron_expression" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Shanghai',
    "retry_count" INTEGER NOT NULL DEFAULT 3,
    "last_execution" DATETIME,
    "next_execution" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "schedules_task_group_id_fkey" FOREIGN KEY ("task_group_id") REFERENCES "task_groups" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "schedule_executions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "schedule_id" TEXT NOT NULL,
    "execution_id" TEXT,
    "trigger_type" TEXT NOT NULL DEFAULT 'scheduled',
    "success" BOOLEAN NOT NULL DEFAULT false,
    "error_message" TEXT,
    "started_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" DATETIME,
    CONSTRAINT "schedule_executions_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "schedules" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "schedule_executions_execution_id_fkey" FOREIGN KEY ("execution_id") REFERENCES "executions" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "executions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "task_group_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "started_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" DATETIME,
    "summary" TEXT NOT NULL DEFAULT '{}',
    CONSTRAINT "executions_task_group_id_fkey" FOREIGN KEY ("task_group_id") REFERENCES "task_groups" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "results" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "execution_id" TEXT NOT NULL,
    "url_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "similarity" REAL,
    "diff_pixels" INTEGER,
    "threshold_used" REAL,
    "threshold_source" TEXT,
    "baseline_screenshot_url" TEXT,
    "current_screenshot_url" TEXT,
    "diff_image_url" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "results_execution_id_fkey" FOREIGN KEY ("execution_id") REFERENCES "executions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "results_url_id_fkey" FOREIGN KEY ("url_id") REFERENCES "urls" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "screenshots" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url_id" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "is_baseline" BOOLEAN NOT NULL DEFAULT false,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "screenshots_url_id_fkey" FOREIGN KEY ("url_id") REFERENCES "urls" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "notification_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "email_host" TEXT,
    "email_port" INTEGER NOT NULL DEFAULT 587,
    "email_user" TEXT,
    "email_password" TEXT,
    "email_from" TEXT,
    "email_to" TEXT,
    "webhook_url" TEXT,
    "notify_on_failure" BOOLEAN NOT NULL DEFAULT true,
    "notify_on_success" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
