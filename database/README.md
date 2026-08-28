# Banco de dados do FINCONTROL

## Requisitos

- MySQL 8.0 ou superior.
- Charset `utf8mb4`.
- Engine InnoDB para suporte às chaves estrangeiras.

## Modelo inicial

### users

Armazena identidade e credenciais. A coluna `email` é única e a senha deve chegar ao banco já transformada em hash seguro pelo backend.

### categories

Categorias personalizadas pertencem a um único usuário. O par `(id, user_id)` é único para permitir que outras tabelas validem também a propriedade da categoria no próprio banco.

### transactions

Centraliza receitas e despesas. `type` diferencia `INCOME` de `EXPENSE`. Essa escolha evita duplicação entre duas tabelas com praticamente a mesma estrutura e simplifica consultas futuras de dashboard e relatórios.

A FK composta `(category_id, user_id)` garante que uma transação não possa apontar para uma categoria de outro usuário.

### budgets

Representa o limite mensal por categoria. Só pode existir um orçamento para a mesma combinação de usuário, categoria, ano e mês.

A FK composta também impede o uso de categorias pertencentes a outro usuário.

### financial_goals

Armazena metas com valor alvo, valor acumulado, prazo opcional e situação.

## Criando a base local

Entre no MySQL com um usuário administrativo e execute:

```sql
CREATE DATABASE fincontrol
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

CREATE USER 'fincontrol'@'localhost' IDENTIFIED BY 'troque-esta-senha';
GRANT ALL PRIVILEGES ON fincontrol.* TO 'fincontrol'@'localhost';
FLUSH PRIVILEGES;
```

Depois aplique a migration:

```bash
mysql -u fincontrol -p fincontrol < database/migrations/001_initial_schema.sql
```

Cada nova mudança estrutural deve ser adicionada como uma nova migration numerada. Não alterar uma migration já aplicada em ambientes compartilhados.

## Isolamento de usuários

O schema cria barreiras no banco, mas a API também deverá filtrar todas as consultas pelo usuário autenticado. Segurança em múltiplas camadas evita que um erro em uma query exponha dados de outra conta.
