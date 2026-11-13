# Guia de contribuição — FINCONTROL

## Fluxo de branches

A branch `main` representa o código estável. Não desenvolver diretamente nela.

Use os prefixos:

- `feature/<descricao>` para funcionalidades;
- `fix/<descricao>` para correções;
- `refactor/<descricao>` para refatorações;
- `docs/<descricao>` para documentação;
- `chore/<descricao>` para manutenção e infraestrutura.

Exemplo: `feature/user-registration`.

## Commits

Adotamos Conventional Commits:

- `feat:` nova funcionalidade;
- `fix:` correção;
- `docs:` documentação;
- `test:` testes;
- `refactor:` refatoração sem alterar comportamento;
- `chore:` manutenção e configuração.

Exemplo: `feat: add user registration endpoint`.

## Pull requests

1. Atualize sua branch com a `main`.
2. Execute os testes e validações locais.
3. Abra um Pull Request descrevendo o objetivo e a forma de validar.
4. Relacione a issue correspondente com `Closes #numero` quando o PR concluir a tarefa.
5. Aguarde revisão antes do merge.

## Segurança

Nunca versionar `.env`, senhas, tokens, chaves de API ou dumps reais de banco. Sempre que uma nova variável de ambiente for necessária, documente-a em `.env.example` com valor fictício.

## Estrutura do repositório

- `public/`: HTML, CSS e JavaScript servidos ao navegador.
- `src/`: servidor Node.js, API e regras de negócio.
- `test/`: testes automatizados executados pelo test runner do Node.js.
- `database/`: migrations e documentação do MySQL.
- `docs/`: decisões, guias e documentação técnica.

## Validação local

Antes de abrir um Pull Request, execute:

```powershell
npm ci
node --check server.js
npm test
npm audit --omit=dev --audit-level=moderate
npm run db:check
```

Use Node.js 24 ou superior. `npm ci` instala exatamente as versões do lockfile. Os testes de integração e `db:check` exigem o MySQL do XAMPP iniciado, o schema do `database/fincontrol_xampp.sql` e um `.env` local configurado. Para reproduzir uma falha da CI, execute os comandos acima nessa ordem e confira também `node --check` para cada arquivo JavaScript alterado.

A branch `main` exige a checagem `Testes e segurança` aprovada. A configuração da proteção está registrada em `docs/branch-protection.json`.
