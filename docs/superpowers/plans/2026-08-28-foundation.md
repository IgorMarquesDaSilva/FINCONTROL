# FINCONTROL Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar a base das issues #1, #2 e #3 com fluxo Git documentado, ambiente PHP/MySQL reproduzível e schema financeiro seguro por usuário.

**Architecture:** Repositório dividido em frontend, backend, database e docs. O backend usa PHP 8.2+ sem framework, PDO e configuração por ambiente; o frontend usa HTML/CSS/JavaScript puro; o banco usa migrations SQL versionadas.

**Tech Stack:** PHP 8.2+, MySQL 8.0+, PDO, Composer, HTML5, CSS3, JavaScript ES2022+

**Spec:** `docs/superpowers/specs/2026-08-28-foundation-design.md`

## Global Constraints

- Não versionar credenciais ou `.env` real.
- Usar `DECIMAL(15,2)` para valores monetários.
- Toda entidade financeira deve pertencer explicitamente a um usuário.
- Relações entre entidades financeiras devem impedir vínculos entre usuários diferentes.
- Evitar frameworks nesta fundação.

---

### Task 1: Repositório e fluxo

**Files:** `.gitignore`, `.editorconfig`, `.github/PULL_REQUEST_TEMPLATE.md`, `docs/CONTRIBUTING.md`

- [x] Criar padrões de editor e arquivos ignorados.
- [x] Documentar branches e Conventional Commits.
- [x] Criar checklist de Pull Request com verificação de segredos.

### Task 2: Ambiente PHP e MySQL

**Files:** `.env.example`, `composer.json`, `backend/bootstrap.php`, `backend/src/Config/*`, `backend/src/Database/Connection.php`, `backend/tests/run.php`, `backend/scripts/check-database.php`

- [x] Escrever testes de carregamento de ambiente e configuração do DSN.
- [x] Executar os testes antes da implementação e confirmar falha por classes ausentes.
- [x] Implementar configuração mínima e conexão PDO.
- [x] Executar os testes novamente e confirmar sucesso.
- [x] Criar script explícito para validar conexão real com MySQL.

### Task 3: Banco de dados

**Files:** `database/migrations/001_initial_schema.sql`, `database/README.md`

- [x] Criar `users`, `categories`, `transactions`, `budgets` e `financial_goals`.
- [x] Aplicar PKs, FKs, índices, checks e unicidade.
- [x] Usar FKs compostas para garantir propriedade de registros relacionados.
- [x] Documentar criação da base e execução da migration.

### Task 4: Documentação de execução

**Files:** `README.md`

- [x] Documentar requisitos e comandos de instalação.
- [x] Documentar frontend, API de health, testes e criação do banco.
- [x] Preparar Pull Request draft vinculando #1, #2 e #3.
