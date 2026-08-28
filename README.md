# FINCONTROL

Aplicação de controle financeiro pessoal construída com foco em PHP, HTML, CSS, JavaScript e MySQL.

## Tecnologias da base

- PHP 8.2+
- MySQL 8.0+
- PDO / PDO MySQL
- HTML5
- CSS3
- JavaScript ES2022+
- Composer para autoload e comandos de projeto

## Estrutura

```text
FINCONTROL/
├── backend/          # API e regras de negócio em PHP
│   ├── public/       # ponto de entrada HTTP
│   ├── scripts/      # comandos de desenvolvimento
│   ├── src/          # código PHP da aplicação
│   └── tests/        # testes automatizados
├── database/         # migrations e documentação MySQL
├── docs/             # padrões e decisões técnicas
├── frontend/         # HTML, CSS e JavaScript
├── .env.example      # exemplo seguro de configuração
└── composer.json
```

## Preparando o ambiente

### 1. Requisitos

Tenha instalados PHP 8.2 ou superior, MySQL 8.0 ou superior e a extensão `pdo_mysql` do PHP. Composer é recomendado para gerar o autoload PSR-4, mas a base possui um fallback simples para desenvolvimento inicial.

### 2. Configure as variáveis locais

Linux/macOS:

```bash
cp .env.example .env
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Edite apenas o `.env`. Ele está ignorado pelo Git e nunca deve ser enviado ao repositório.

### 3. Crie o MySQL

Siga `database/README.md` e aplique:

```bash
mysql -u fincontrol -p fincontrol < database/migrations/001_initial_schema.sql
```

### 4. Valide a configuração PHP

```bash
php backend/tests/run.php
```

Com o banco criado e o `.env` preenchido:

```bash
php backend/scripts/check-database.php
```

### 5. Inicie a API

```bash
php -S localhost:8080 -t backend/public backend/public/index.php
```

Teste em `http://localhost:8080/health`.

Resposta esperada:

```json
{
  "status": "ok",
  "service": "FINCONTROL API"
}
```

### 6. Inicie o frontend

Em outro terminal:

```bash
php -S localhost:5173 -t frontend
```

Abra `http://localhost:5173`.

## Composer

Se utilizar Composer:

```bash
composer install
composer test
composer db:check
composer serve
```

O projeto não depende de framework PHP nesta fase.

## Banco de dados

A primeira migration cria:

- usuários;
- categorias personalizadas;
- transações, unificando receitas e despesas;
- orçamentos mensais;
- metas financeiras.

As FKs compostas entre registros financeiros e categorias ajudam a impedir que um registro de um usuário referencie dados pertencentes a outro usuário.

## Fluxo Git

Não desenvolva diretamente na `main`. Consulte `docs/CONTRIBUTING.md` para padrões de branches, Conventional Commits, Pull Requests e segurança de arquivos sensíveis.

## Issues de fundação

Esta estrutura foi criada como base para:

- #1 — Estruturar repositório e fluxo de desenvolvimento;
- #2 — Preparar ambiente de desenvolvimento;
- #3 — Modelar e criar o banco de dados.
