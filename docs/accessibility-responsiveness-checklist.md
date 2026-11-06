# Roteiro de acessibilidade e responsividade

Execute os passos no FINCONTROL com uma conta de teste que tenha receitas, despesas, um orçamento e uma meta. Repita os fluxos principais com teclado e em cada largura indicada.

## Teclado e foco

1. Abra a tela de login e use `Tab` e `Shift+Tab` para percorrer os campos, alternância de senha e ações. O foco deve permanecer visível em todos os controles.
2. Entre e percorra o menu lateral usando `Tab`, `Shift+Tab` e `Enter`. Cada opção deve abrir somente sua tela e atualizar o título da página.
3. Em largura de celular, abra o menu. O foco deve ir para “Fechar menu”; `Tab` deve permanecer no menu enquanto ele estiver aberto; `Escape` deve fechá-lo e devolver o foco ao botão “Abrir menu”.
4. Abra “Receitas” e “Despesas” pelo menu e pelo botão de ação rápida. Confirme que o foco vai para o primeiro campo útil do formulário.
5. Abra uma movimentação para editar, cancele com `Escape` e confirme que o foco retorna ao controle que abriu a janela. Repita para exclusão e aporte de meta.

## Formulários e leitor de tela

1. Envie o login vazio e depois informe um e-mail inválido. Confirme que o campo inválido recebe foco, fica marcado como inválido e sua mensagem é anunciada.
2. Envie os formulários de receita, despesa, orçamento e meta sem os campos obrigatórios. Confirme os rótulos, estado inválido e mensagens associadas aos campos.
3. Navegue pelos gráficos do relatório com leitor de tela. Confirme que a descrição textual anuncia receitas, despesas e categorias sem depender apenas de cor.
4. Percorra saldos e estados de orçamento com leitor de tela; confirme que atenção e limite excedido têm texto e não são indicados somente por cor.

## Responsividade e ampliação

1. Repita as telas Visão geral, Movimentações, Receitas, Despesas, Planejamento, Metas e Aprenda nas larguras de `320`, `375`, `768`, `1024` e `1440` CSS pixels.
2. Em `320` e `375` pixels, confirme que não há rolagem horizontal, campos e botões cabem na tela e o menu abre e fecha.
3. Em `768` pixels, confirme que o menu lateral abre como painel móvel. Em `1024` e `1440`, confirme o menu fixo e o alinhamento das grades e dos cartões.
4. Configure o zoom do navegador em `200%` e repita os principais fluxos. Confirme que texto, formulários, modais e gráficos permanecem utilizáveis sem conteúdo cortado.
5. Ative a opção de reduzir movimento do sistema. Confirme que transições e rolagem animada são reduzidas.

## Histórico e atualização

1. Navegue entre telas e use os botões voltar e avançar do navegador. A tela selecionada e o item ativo do menu devem permanecer sincronizados.
2. Crie ou edite uma receita, despesa, orçamento e meta. Confirme a mensagem de resultado e os valores atualizados sem recarregar a página.
3. Atualize a página em cada rota com hash. Após entrar novamente, a rota deve abrir sem perder ou misturar dados de usuários.
