USE fincontrol;

ALTER TABLE transactions
  ADD KEY idx_transactions_user_type_date (user_id, type, transaction_date),
  ADD KEY idx_transactions_user_category_date (user_id, category_id, transaction_date),
  ADD KEY idx_transactions_user_amount (user_id, amount);
