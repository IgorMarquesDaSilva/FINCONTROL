USE fincontrol;

CREATE TABLE user_preferences (
    user_id BIGINT UNSIGNED NOT NULL,
    currency CHAR(3) NOT NULL DEFAULT 'BRL',
    date_format VARCHAR(12) NOT NULL DEFAULT 'DD/MM/YYYY',
    time_zone VARCHAR(64) NOT NULL DEFAULT 'America/Sao_Paulo',
    month_start_day TINYINT UNSIGNED NOT NULL DEFAULT 1,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id),
    CONSTRAINT fk_user_preferences_user FOREIGN KEY (user_id) REFERENCES users (id)
        ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
