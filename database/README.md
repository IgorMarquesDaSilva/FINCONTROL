# Banco de dados do FINCONTROL

## XAMPP / phpMyAdmin

Para a primeira instalação local, use o arquivo:

```text
database/fincontrol_xampp.sql
```

Com Apache e MySQL iniciados no XAMPP, abra `http://localhost/phpmyadmin/`, entre em **Importar** e selecione esse arquivo. Ele cria o banco `fincontrol` e todas as tabelas da base inicial usada pelo servidor Node.js.

A configuração padrão correspondente está em `.env.example`:

```text
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=fincontrol
DB_USERNAME=root
DB_PASSWORD=
```

Se a instalação local possuir senha para o usuário `root`, altere apenas o seu `.env`. Valide a conexão com `npm run db:check`.

## Modelo inicial

- `users`: identidade e credenciais; o e-mail é único e a senha é armazenada como hash `bcrypt` pelo backend Node.js.
- `password_reset_tokens`: hashes de tokens temporários, com expiração e registro de uso; nunca armazena o token enviado ao usuário.
- `categories`: categorias pertencentes a um único usuário.
- `transactions`: receitas e despesas unificadas por `type` (`INCOME` ou `EXPENSE`).
- `budgets`: orçamento mensal por categoria.
- `financial_goals`: metas financeiras e progresso.

As FKs compostas entre `(category_id, user_id)` e `categories (id, user_id)` impedem que uma transação ou orçamento associe uma categoria de outro usuário.

## Migrations

`database/migrations/001_initial_schema.sql` é a migration versionada da estrutura inicial. O arquivo `fincontrol_xampp.sql` é o instalador conveniente para uma base nova no XAMPP/phpMyAdmin.

Mudanças futuras no schema devem ser adicionadas como novas migrations numeradas.

## Índices da consulta de movimentações

`002_transaction_filter_indexes.sql` adiciona índices compostos para os filtros por usuário, tipo, categoria, período e valor. A busca por descrição usa correspondência parcial parametrizada; caso o volume cresça significativamente, ela deve migrar para um índice `FULLTEXT` com avaliação específica do MariaDB usado em produção.

`003_password_recovery.sql` adiciona a versão de sessão para encerrar sessões antigas quando a senha muda e a tabela de tokens de recuperação. Execute-a uma vez nos bancos existentes antes de atualizar a aplicação. Em bancos novos, as tabelas e colunas também estão incluídas no instalador do XAMPP e na migration inicial.
