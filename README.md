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
- cadastro e histórico recente de receitas;
- cadastro e histórico recente de despesas, com atualização imediata do saldo;
- edição validada de receitas e despesas, sempre limitada ao usuário autenticado;
- exclusão confirmada de movimentações com recálculo imediato do resumo financeiro;
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

`npm test` executa em sequência os testes unitários e os testes de integração e ponta a ponta. Os testes unitários impõem cobertura mínima de 90% das linhas e 70% dos ramos nas regras financeiras de orçamento, dashboard, metas e insights. Os cenários HTTP cobrem autenticação, movimentações, orçamentos, metas, dashboard, relatório e insights, incluindo isolamento entre usuários.

O comando completo requer MySQL disponível e configuração do banco em `.env` (ou os padrões do XAMPP):

```powershell
npm test
```

Os testes de integração criam usuários e dados temporários exclusivos e os removem ao terminar. Também é possível rodar apenas `npm run test:unit` sem MySQL ou `npm run test:integration` com MySQL ativo.

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
│   └── app.js               # configuração do Express
├── database/                # schema e instruções do phpMyAdmin
├── scripts/                 # utilitários de desenvolvimento
├── test/                    # testes automatizados
├── .env.example
├── package.json
└── server.js                # inicialização do servidor
```

## API disponível

| Método | Rota | Finalidade |
| --- | --- | --- |
| `GET` | `/api/health` | Verificar se a API está ativa |
| `POST` | `/api/auth/register` | Criar usuário e iniciar sessão |
| `POST` | `/api/auth/login` | Autenticar usuário |
| `GET` | `/api/auth/me` | Obter o usuário da sessão |
| `POST` | `/api/auth/logout` | Encerrar a sessão |
| `GET` | `/api/incomes` | Listar receitas recentes do usuário |
| `POST` | `/api/incomes` | Cadastrar uma receita |
| `GET` | `/api/expenses` | Listar despesas recentes do usuário |
| `POST` | `/api/expenses` | Cadastrar uma despesa |
| `GET` | `/api/transactions` | Listar movimentações com filtros, ordenação e paginação |
| `GET` | `/api/dashboard?month=AAAA-MM` | Obter resumo e movimentações recentes do mês |
| `GET/POST` | `/api/goals` | Listar e criar metas financeiras |
| `GET/PUT/DELETE` | `/api/goals/:id` | Consultar, editar ou excluir uma meta |
| `POST` | `/api/goals/:id/contributions` | Registrar aporte em uma meta ativa |
| `PATCH` | `/api/goals/:id/status` | Ativar, concluir ou cancelar uma meta |

`GET /api/transactions` aceita `page`, `pageSize`, `search`, `type`, `categoryId`, `dateFrom`, `dateTo`, `minAmount`, `maxAmount`, `sort` (`date` ou `amount`) e `order` (`asc` ou `desc`). Os filtros podem ser combinados e sempre consideram apenas o usuário autenticado.
| `GET` | `/api/transactions/:id` | Carregar uma movimentação do usuário para edição |
| `PUT` | `/api/transactions/:id` | Atualizar valor, categoria, descrição e data |
| `DELETE` | `/api/transactions/:id` | Excluir uma movimentação do usuário |
| `GET` | `/api/reports/monthly?month=AAAA-MM` | Resumo mensal, comparação com o mês anterior, despesas por categoria e maiores gastos |
| `GET` | `/api/budgets?year=AAAA&month=MM` | Consultar orçamentos do período com valor gasto e status atualizado |
| `GET` | `/api/budgets/categories` | Consultar categorias de despesa do usuário para planejar limites |
| `GET` | `/api/budgets/:id` | Consultar um orçamento do usuário autenticado |
| `POST` | `/api/budgets` | Criar orçamento por categoria e período |
| `PUT` | `/api/budgets/:id` | Alterar categoria, período ou limite do orçamento |
| `DELETE` | `/api/budgets/:id` | Excluir orçamento |
| `GET` | `/api/insights?month=AAAA-MM` | Gerar insights pessoais com evidências para o mês e o anterior |

O relatório mensal exige uma sessão autenticada e consulta as movimentações pelo identificador do usuário da sessão. O parâmetro `month` aceita o formato `AAAA-MM` (anos entre 2000 e 2200).

Os endpoints de orçamento exigem sessão autenticada e aceitam apenas categorias de despesa do próprio usuário. O consumo soma as despesas da categoria dentro do período sempre que um orçamento é consultado; o status é `normal` abaixo de 80%, `attention` a partir de 80% e `exceeded` ao atingir ou ultrapassar o limite. O banco impede mais de um orçamento para a mesma categoria e período do usuário.

Os insights também exigem sessão autenticada e usam somente as movimentações do usuário. As comparações usam períodos equivalentes; no mês atual, comparam o acumulado até o dia atual com o mesmo intervalo do mês anterior. A API informa quando há menos de três movimentações em um dos períodos e evita gerar conclusões nesses casos. Cada orientação inclui os valores que acionaram uma regra transparente; a dispensa fica salva localmente por usuário e mês neste navegador.

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

A área autenticada já está preparada visualmente para receber categorias, metas, conteúdos educativos e demais backlogs ainda não implementadas.
