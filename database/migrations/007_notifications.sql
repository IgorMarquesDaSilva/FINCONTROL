USE fincontrol;

CREATE TABLE notification_preferences (
    user_id BIGINT UNSIGNED NOT NULL,
    budget_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    recurrence_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    muted_until DATETIME NULL,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id),
    CONSTRAINT fk_notification_preferences_user FOREIGN KEY (user_id) REFERENCES users (id)
        ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE notifications (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    event_key VARCHAR(191) NOT NULL,
    type ENUM('BUDGET', 'RECURRENCE') NOT NULL,
    title VARCHAR(160) NOT NULL,
    message VARCHAR(255) NOT NULL,
    link VARCHAR(80) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    read_at DATETIME NULL,
    silenced_at DATETIME NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_notifications_event (user_id, event_key),
    KEY idx_notifications_user_visible (user_id, silenced_at, created_at),
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users (id)
        ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
