<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="FINCONTROL — controle financeiro pessoal.">
  <title>FINCONTROL | Dashboard</title>
  <link rel="stylesheet" href="assets/css/style.css">
</head>
<body>
  <div class="app-shell">
    <aside class="sidebar" id="sidebar" aria-label="Menu principal">
      <div class="sidebar__brand">
        <span class="brand-mark" aria-hidden="true">F</span>
        <div>
          <strong>FINCONTROL</strong>
          <span>Controle financeiro</span>
        </div>
      </div>

      <nav class="nav" aria-label="Navegação principal">
        <a class="nav__item nav__item--active" href="#dashboard" aria-current="page">
          <span class="nav__icon" aria-hidden="true">⌂</span>
          <span>Dashboard</span>
        </a>
        <a class="nav__item" href="#transacoes">
          <span class="nav__icon" aria-hidden="true">↕</span>
          <span>Transações</span>
        </a>
        <a class="nav__item" href="#categorias">
          <span class="nav__icon" aria-hidden="true">▦</span>
          <span>Categorias</span>
        </a>
        <a class="nav__item" href="#orcamentos">
          <span class="nav__icon" aria-hidden="true">◫</span>
          <span>Orçamentos</span>
        </a>
        <a class="nav__item" href="#metas">
          <span class="nav__icon" aria-hidden="true">◎</span>
          <span>Metas</span>
        </a>
        <a class="nav__item" href="#relatorios">
          <span class="nav__icon" aria-hidden="true">▥</span>
          <span>Relatórios</span>
        </a>
      </nav>

      <div class="sidebar__footer">
        <a class="nav__item" href="#configuracoes">
          <span class="nav__icon" aria-hidden="true">⚙</span>
          <span>Configurações</span>
        </a>
        <div class="profile-card">
          <span class="profile-card__avatar" aria-hidden="true">FC</span>
          <div>
            <strong>Conta de demonstração</strong>
            <span>Ambiente local</span>
          </div>
        </div>
      </div>
    </aside>

    <button class="sidebar-backdrop" type="button" data-menu-close aria-label="Fechar menu"></button>

    <div class="app-content">
      <header class="topbar">
        <button class="icon-button menu-button" type="button" data-menu-toggle aria-controls="sidebar" aria-expanded="false" aria-label="Abrir menu principal">
          <span></span><span></span><span></span>
        </button>
        <div class="topbar__title">
          <span class="mobile-brand">FINCONTROL</span>
          <span id="current-date">Visão financeira</span>
        </div>
        <div class="topbar__actions">
          <button class="icon-button notification-button" type="button" aria-label="Notificações">
            <span aria-hidden="true">●</span>
          </button>
          <span class="topbar__avatar" aria-hidden="true">FC</span>
        </div>
      </header>

      <main class="dashboard" id="dashboard">
        <section class="page-heading" aria-labelledby="page-title">
          <div>
            <span class="demo-badge">Dados de demonstração</span>
            <h1 id="page-title">Visão geral</h1>
            <p>Acompanhe sua vida financeira em um só lugar.</p>
          </div>
          <div class="quick-actions" aria-label="Ações rápidas">
            <button class="button button--ghost" type="button">+ Receita</button>
            <button class="button button--primary" type="button">+ Despesa</button>
          </div>
        </section>

        <section class="summary-grid" aria-label="Resumo financeiro">
          <article class="summary-card summary-card--balance">
            <div class="summary-card__header">
              <span>Saldo atual</span>
              <span class="summary-card__icon" aria-hidden="true">$</span>
            </div>
            <strong>R$ 8.420,50</strong>
            <small>Disponível neste mês</small>
          </article>

          <article class="summary-card">
            <div class="summary-card__header">
              <span>Receitas</span>
              <span class="trend trend--positive">↑ 12,4%</span>
            </div>
            <strong>R$ 12.750,00</strong>
            <small>Agosto de 2026</small>
          </article>

          <article class="summary-card">
            <div class="summary-card__header">
              <span>Despesas</span>
              <span class="trend trend--negative">↑ 4,2%</span>
            </div>
            <strong>R$ 4.329,50</strong>
            <small>Agosto de 2026</small>
          </article>

          <article class="summary-card">
            <div class="summary-card__header">
              <span>Economia do mês</span>
              <span class="summary-card__icon" aria-hidden="true">%</span>
            </div>
            <strong>66%</strong>
            <small>R$ 8.420,50 poupados</small>
          </article>
        </section>

        <section class="dashboard-grid">
          <article class="panel panel--wide" id="transacoes">
            <div class="panel__header">
              <div>
                <span class="panel__eyebrow">Movimentações</span>
                <h2>Transações recentes</h2>
              </div>
              <a href="#transacoes" class="text-link">Ver todas</a>
            </div>

            <div class="transaction-list">
              <div class="transaction-row">
                <span class="transaction-icon transaction-icon--expense" aria-hidden="true">⌂</span>
                <div class="transaction-info">
                  <strong>Aluguel</strong>
                  <span>Moradia · 10 ago</span>
                </div>
                <strong class="transaction-value transaction-value--expense">- R$ 1.850,00</strong>
              </div>
              <div class="transaction-row">
                <span class="transaction-icon transaction-icon--income" aria-hidden="true">↗</span>
                <div class="transaction-info">
                  <strong>Salário</strong>
                  <span>Receita · 05 ago</span>
                </div>
                <strong class="transaction-value transaction-value--income">+ R$ 8.500,00</strong>
              </div>
              <div class="transaction-row">
                <span class="transaction-icon transaction-icon--expense" aria-hidden="true">●</span>
                <div class="transaction-info">
                  <strong>Supermercado</strong>
                  <span>Alimentação · 03 ago</span>
                </div>
                <strong class="transaction-value transaction-value--expense">- R$ 486,70</strong>
              </div>
              <div class="transaction-row">
                <span class="transaction-icon transaction-icon--expense" aria-hidden="true">◆</span>
                <div class="transaction-info">
                  <strong>Internet</strong>
                  <span>Assinaturas · 01 ago</span>
                </div>
                <strong class="transaction-value transaction-value--expense">- R$ 119,90</strong>
              </div>
            </div>
          </article>

          <article class="panel" id="orcamentos">
            <div class="panel__header">
              <div>
                <span class="panel__eyebrow">Planejamento</span>
                <h2>Orçamentos</h2>
              </div>
              <a href="#orcamentos" class="text-link">Gerenciar</a>
            </div>

            <div class="budget-list">
              <div class="budget-item">
                <div class="budget-item__line"><strong>Alimentação</strong><span>R$ 720 / R$ 1.000</span></div>
                <div class="progress" aria-label="72% do orçamento de alimentação utilizado"><span style="width:72%"></span></div>
              </div>
              <div class="budget-item">
                <div class="budget-item__line"><strong>Transporte</strong><span>R$ 310 / R$ 650</span></div>
                <div class="progress" aria-label="48% do orçamento de transporte utilizado"><span style="width:48%"></span></div>
              </div>
              <div class="budget-item">
                <div class="budget-item__line"><strong>Lazer</strong><span>R$ 420 / R$ 500</span></div>
                <div class="progress progress--warning" aria-label="84% do orçamento de lazer utilizado"><span style="width:84%"></span></div>
              </div>
            </div>
          </article>

          <article class="panel" id="metas">
            <div class="panel__header">
              <div>
                <span class="panel__eyebrow">Objetivos</span>
                <h2>Metas financeiras</h2>
              </div>
              <a href="#metas" class="text-link">Ver metas</a>
            </div>

            <div class="goal-card">
              <div class="goal-card__top">
                <div>
                  <span>Reserva de emergência</span>
                  <strong>R$ 12.600 de R$ 20.000</strong>
                </div>
                <span class="goal-percent">63%</span>
              </div>
              <div class="progress progress--goal" aria-label="63% da meta concluída"><span style="width:63%"></span></div>
              <small>Faltam R$ 7.400,00 para concluir</small>
            </div>
          </article>

          <article class="panel panel--insight" id="relatorios">
            <span class="panel__eyebrow">Insight do mês</span>
            <h2>Você gastou menos com alimentação</h2>
            <p>Suas despesas com alimentação caíram 8% em relação ao mês anterior. Continue acompanhando seus hábitos.</p>
            <a class="text-link" href="#relatorios">Abrir relatório →</a>
          </article>
        </section>

        <section class="coming-soon" id="categorias" aria-label="Categorias">
          <span>Categorias, relatórios completos e integrações serão conectados ao banco nas próximas issues.</span>
        </section>
      </main>
    </div>
  </div>

  <script src="assets/js/app.js" defer></script>
</body>
</html>
