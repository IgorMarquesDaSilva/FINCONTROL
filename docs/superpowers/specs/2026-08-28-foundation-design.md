# FINCONTROL — Foundation Design

## Objetivo

Criar a base técnica do FINCONTROL para que duas pessoas consigam desenvolver o sistema de forma previsível, segura e consistente, atendendo às issues #1, #2 e #3.

## Stack padrão

- PHP 8.2+ no backend, sem framework nesta fase.
- MySQL 8.0+ para persistência.
- PDO para acesso ao banco.
- HTML5, CSS3 e JavaScript ES2022+ no frontend.
- Composer para autoload PSR-4 e scripts de desenvolvimento.

A opção evita complexidade prematura e mantém as tecnologias prioritárias do projeto visíveis para fins de aprendizado e manutenção.

## Arquitetura inicial

O repositório é dividido em `frontend`, `backend`, `database` e `docs`. O backend concentra apenas infraestrutura essencial nesta etapa: leitura segura de configuração, configuração do banco e conexão PDO. As regras de negócio entram em módulos nas próximas issues, sem concentrar tudo em um único arquivo.

## Segurança

Segredos ficam apenas no `.env`, ignorado pelo Git. O arquivo `.env.example` contém somente exemplos. Senhas de usuários deverão ser armazenadas futuramente com `password_hash()` e nunca em texto puro.

O banco associa todas as entidades financeiras a `user_id`. Onde uma entidade referencia outra entidade pertencente ao usuário, chaves estrangeiras compostas garantem que registros de usuários diferentes não possam ser associados entre si.

## Modelo de dados inicial

- `users`: identidade e credenciais.
- `categories`: categorias personalizadas por usuário.
- `transactions`: receitas e despesas em uma tabela única, diferenciadas por `type`.
- `budgets`: orçamento mensal de uma categoria do usuário.
- `financial_goals`: metas financeiras do usuário.

Valores monetários usam `DECIMAL(15,2)`. Valores financeiros que representam montantes não podem ser negativos quando isso não fizer sentido de domínio.

## Fluxo de desenvolvimento

A `main` deve receber mudanças por Pull Request. Branches usam prefixos como `feature/`, `fix/`, `docs/` e `chore/`. Commits seguem Conventional Commits. Todo novo segredo deve ser representado apenas por uma chave de exemplo em `.env.example`.

## Validação

A fundação deve possuir testes de configuração executáveis sem banco externo. A conexão real com MySQL é validada por um script explícito após a criação do `.env` e da base local. O schema deve ser idempotente apenas por migration versionada; não será criado automaticamente a cada request.
