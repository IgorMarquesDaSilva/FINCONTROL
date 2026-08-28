# FINCONTROL

Aplicação de controle financeiro pessoal construída com PHP, HTML, CSS, JavaScript e MySQL.

## Acesso rápido com XAMPP

A estrutura foi preparada para que o site abra diretamente pela raiz do projeto.

### 1. Coloque o projeto no htdocs

O caminho recomendado no Windows é:

```text
C:\xampp\htdocs\FINCONTROL
```

### 2. Inicie o XAMPP

Abra o XAMPP Control Panel e inicie:

- Apache
- MySQL

### 3. Configure o ambiente

Na raiz do projeto, copie `.env.example` para `.env`.

No PowerShell:

```powershell
Copy-Item .env.example .env
```

O exemplo já usa a configuração padrão do XAMPP:

```text
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=fincontrol
DB_USERNAME=root
DB_PASSWORD=
```

Se o seu MySQL possuir senha, altere somente o arquivo `.env`.

### 4. Crie o banco no phpMyAdmin

Abra:

```text
http://localhost/phpmyadmin/
```

Entre em **Importar**, selecione:

```text
database/fincontrol_xampp.sql
```

O arquivo cria automaticamente o banco `fincontrol` e as tabelas iniciais.

### 5. Abra o FINCONTROL

Acesse diretamente:

```text
http://localhost/FINCONTROL/
```

Não é necessário acessar `/frontend` nem executar `php -S`.

## Estrutura

```text
FINCONTROL/
├── index.php          # entrada principal do site
├── assets/            # CSS e JavaScript do frontend
├── backend/           # API e regras de negócio PHP
├── database/          # banco, migrations e instalador do XAMPP
├── docs/              # documentação técnica
├── .env.example       # configuração local de exemplo
├── .htaccess          # configuração básica do Apache
└── composer.json
```

## Validação pelo PHP do XAMPP

Sem adicionar PHP ao PATH do Windows, use:

```powershell
C:\xampp\php\php.exe backend\tests\run.php
C:\xampp\php\php.exe backend\tests\xampp.php
C:\xampp\php\php.exe backend\scripts\check-database.php
```

## Banco de dados

A base inicial contém:

- `users`;
- `categories`;
- `transactions` para receitas e despesas;
- `budgets`;
- `financial_goals`.

Valores financeiros usam `DECIMAL(15,2)` e as relações com `user_id` ajudam a impedir associação de dados entre usuários diferentes.

## Tecnologias

- PHP 8.2+
- MySQL 8.0+ / MariaDB compatível
- PDO MySQL
- HTML5
- CSS3
- JavaScript
- Apache (XAMPP no ambiente local)

## Desenvolvimento

Consulte `docs/CONTRIBUTING.md` antes de desenvolver novas funcionalidades. O projeto utiliza branches, Pull Requests e Conventional Commits.
