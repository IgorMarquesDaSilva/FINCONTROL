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
- `user_preferences`: moeda, formato de data, fuso horário e dia inicial do mês financeiro por usuário.
- `learning_progress` e `learning_challenges`: leitura, quiz e desafios, isolados por conta.
- `password_reset_tokens`: hashes de tokens temporários, com expiração e registro de uso; nunca armazena o token enviado ao usuário.
- `categories`: categorias pertencentes a um único usuário.
- `transactions`: receitas e despesas unificadas por `type` (`INCOME` ou `EXPENSE`).
- `recurrences`: regras semanais, mensais e anuais; movimentações geradas guardam a versão e o ciclo para impedir duplicidade.
- `budgets`: orçamento mensal por categoria.
- `financial_goals`: metas financeiras e progresso.

As FKs compostas entre `(category_id, user_id)` e `categories (id, user_id)` impedem que uma transação ou orçamento associe uma categoria de outro usuário.

## Migrations

`database/migrations/001_initial_schema.sql` é a migration versionada da estrutura inicial. O arquivo `fincontrol_xampp.sql` é o instalador conveniente para uma base nova no XAMPP/phpMyAdmin.

Mudanças futuras no schema devem ser adicionadas como novas migrations numeradas.

## Índices da consulta de movimentações

`002_transaction_filter_indexes.sql` adiciona índices compostos para os filtros por usuário, tipo, categoria, período e valor. A busca por descrição usa correspondência parcial parametrizada; caso o volume cresça significativamente, ela deve migrar para um índice `FULLTEXT` com avaliação específica do MariaDB usado em produção.

`003_password_recovery.sql` adiciona a versão de sessão para encerrar sessões antigas quando a senha muda e a tabela de tokens de recuperação. Execute-a uma vez nos bancos existentes antes de atualizar a aplicação. Em bancos novos, as tabelas e colunas também estão incluídas no instalador do XAMPP e na migration inicial.

`004_user_preferences.sql` adiciona as preferências do perfil. Execute-a uma vez em bancos existentes. Em instalações novas, a tabela já faz parte de `fincontrol_xampp.sql`. A troca da moeda altera a unidade exibida, sem converter valores históricos por uma taxa de câmbio.

`005_learning_progress.sql` adiciona o progresso das trilhas e desafios. Execute-a uma vez em bancos existentes; instalações novas já incluem as tabelas no instalador do XAMPP.

`006_recurrences.sql` adiciona recorrências e o vínculo opcional às movimentações. Execute-a uma vez em bancos existentes. O servidor verifica vencimentos ao iniciar, a cada 15 minutos e em requisições autenticadas. Pausar ou cancelar a regra não remove lançamentos anteriores.
