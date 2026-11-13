USE fincontrol;

CREATE TABLE recurrences (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    category_id BIGINT UNSIGNED NOT NULL,
    type ENUM('INCOME', 'EXPENSE') NOT NULL,
    description VARCHAR(180) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    frequency ENUM('WEEKLY', 'MONTHLY', 'YEARLY') NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NULL,
    schedule_version INT UNSIGNED NOT NULL DEFAULT 1,
    next_cycle_index INT UNSIGNED NOT NULL DEFAULT 0,
    next_run_date DATE NOT NULL,
    status ENUM('ACTIVE', 'PAUSED', 'CANCELED', 'COMPLETED') NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_recurrences_due (status, next_run_date),
    KEY idx_recurrences_user (user_id, status),
    CONSTRAINT fk_recurrences_user FOREIGN KEY (user_id) REFERENCES users (id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_recurrences_category FOREIGN KEY (category_id, user_id) REFERENCES categories (id, user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE transactions
    ADD COLUMN recurrence_id BIGINT UNSIGNED NULL,
    ADD COLUMN recurrence_schedule_version INT UNSIGNED NULL,
    ADD COLUMN recurrence_cycle_index INT UNSIGNED NULL,
    ADD UNIQUE KEY uq_transactions_recurrence_cycle (recurrence_id, recurrence_schedule_version, recurrence_cycle_index),
    ADD CONSTRAINT fk_transactions_recurrence FOREIGN KEY (recurrence_id) REFERENCES recurrences (id)
        ON UPDATE CASCADE ON DELETE SET NULL;
