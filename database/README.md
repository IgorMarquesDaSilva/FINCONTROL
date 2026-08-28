# Banco de dados do FINCONTROL

## XAMPP / phpMyAdmin

Para a primeira instalação local, use o arquivo:

```text
database/fincontrol_xampp.sql
```

Com Apache e MySQL iniciados no XAMPP, abra `http://localhost/phpmyadmin/`, entre em **Importar** e selecione esse arquivo. Ele cria o banco `fincontrol` e todas as tabelas da base inicial.

A configuração padrão correspondente está em `.env.example`:

```text
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=fincontrol
DB_USERNAME=root
DB_PASSWORD=
```

Se a instalação local possuir senha para o usuário `root`, altere apenas o seu `.env`.

## Modelo inicial

- `users`: identidade e credenciais; o e-mail é único e a senha deve ser armazenada como hash.
- `categories`: categorias pertencentes a um único usuário.
- `transactions`: receitas e despesas unificadas por `type` (`INCOME` ou `EXPENSE`).
- `budgets`: orçamento mensal por categoria.
- `financial_goals`: metas financeiras e progresso.

As FKs compostas entre `(category_id, user_id)` e `categories (id, user_id)` impedem que uma transação ou orçamento associe uma categoria de outro usuário.

## Migrations

`database/migrations/001_initial_schema.sql` continua sendo a migration versionada da estrutura inicial. O arquivo `fincontrol_xampp.sql` é apenas um instalador conveniente para uma base nova no XAMPP/phpMyAdmin.

Mudanças futuras no schema devem ser adicionadas como novas migrations numeradas.
