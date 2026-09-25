# FINCONTROL

Plataforma web de organização financeira para jovens, construída com **HTML, CSS, JavaScript, Node.js, Express e MySQL**.

Esta primeira entrega inclui:

- interface responsiva para celular, tablet e desktop;
- tela de cadastro com validação de campos;
- tela de login;
- criação segura de usuários no MySQL;
- senha protegida com hash `bcrypt`;
- sessão autenticada em cookie `httpOnly`;
- restauração de sessão, área inicial autenticada e logout;
- limite de tentativas nas rotas de autenticação.

## Requisitos

- Node.js 20 ou superior;
- npm;
- XAMPP com MySQL/MariaDB e Apache (o Apache é necessário apenas para abrir o phpMyAdmin).

## Instalação

### 1. Instale as dependências

Na raiz do projeto:

```powershell
npm install
```

### 2. Configure o ambiente

Crie seu arquivo local a partir do exemplo:

```powershell
Copy-Item .env.example .env
```

O padrão já está preparado para o MySQL do XAMPP, com usuário `root` sem senha. Caso sua instalação use outra senha ou porta, altere apenas o arquivo `.env`.

Antes de publicar, defina uma chave longa e aleatória em `JWT_SECRET`.

### 3. Crie o banco pelo phpMyAdmin

1. Inicie **Apache** e **MySQL** no painel do XAMPP.
2. Abra `http://localhost/phpmyadmin/`.
3. Entre na aba **Importar**.
4. Selecione `database/fincontrol_xampp.sql`.
5. Confirme a importação.

O arquivo cria o banco `fincontrol` e as tabelas iniciais.

### 4. Valide a conexão

```powershell
npm run db:check
```

### 5. Inicie o projeto

Durante o desenvolvimento:

```powershell
npm run dev
```

Depois, abra `http://localhost:3000`.

Para executar sem o modo de observação:

```powershell
npm start
```

## Testes

```powershell
npm test
```

Os testes rápidos cobrem a normalização e a validação dos dados de cadastro e login. Com o MySQL do XAMPP em execução, rode também o fluxo completo de cadastro, sessão, logout e login:

```powershell
npm run test:integration
```

O teste integrado cria um usuário temporário e o remove ao terminar.

## Estrutura

```text
FINCONTROL/
├── public/
│   ├── css/styles.css       # identidade visual e responsividade
│   ├── js/app.js            # interação, formulários e sessão no navegador
│   └── index.html           # login, cadastro e área autenticada
├── src/
│   ├── config/              # ambiente e conexão MySQL
│   ├── errors/              # erros esperados da aplicação
│   ├── middleware/          # autenticação e tratamento de erros
│   ├── routes/              # endpoints HTTP
│   ├── services/            # regras de autenticação e usuários
│   ├── validation/          # validações reutilizáveis
│   ├── app.js               # configuração do Express
│   └── server.js            # inicialização do servidor
├── database/                # schema e instruções do phpMyAdmin
├── scripts/                 # utilitários de desenvolvimento
├── test/                    # testes automatizados
├── .env.example
└── package.json
```

## API disponível

| Método | Rota | Finalidade |
| --- | --- | --- |
| `GET` | `/api/health` | Verificar se a API está ativa |
| `POST` | `/api/auth/register` | Criar usuário e iniciar sessão |
| `POST` | `/api/auth/login` | Autenticar usuário |
| `GET` | `/api/auth/me` | Obter o usuário da sessão |
| `POST` | `/api/auth/logout` | Encerrar a sessão |

## Segurança aplicada

- queries parametrizadas contra SQL injection;
- senhas com `bcrypt` e custo 12;
- cookie de sessão inacessível ao JavaScript;
- `SameSite=Lax` e `Secure` automático em produção;
- headers de segurança com Helmet;
- mensagens de login que não revelam se um e-mail existe;
- limitação de requisições nas rotas de login e cadastro;
- `.env` ignorado pelo Git.

## Próximas funcionalidades

A área autenticada já está preparada visualmente para receber movimentações, categorias, metas, conteúdos educativos e demais backlogs. Os botões dessas funcionalidades indicam que elas entram na próxima etapa e ainda não gravam dados.
