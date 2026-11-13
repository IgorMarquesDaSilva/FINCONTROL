USE fincontrol;

CREATE TABLE learning_progress (
    user_id BIGINT UNSIGNED NOT NULL,
    article_id VARCHAR(80) NOT NULL,
    content_version INT UNSIGNED NOT NULL,
    read_at DATETIME NULL,
    quiz_passed_at DATETIME NULL,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, article_id),
    CONSTRAINT fk_learning_progress_user FOREIGN KEY (user_id) REFERENCES users (id)
        ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE learning_challenges (
    user_id BIGINT UNSIGNED NOT NULL,
    challenge_id VARCHAR(80) NOT NULL,
    completed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, challenge_id),
    CONSTRAINT fk_learning_challenges_user FOREIGN KEY (user_id) REFERENCES users (id)
        ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
