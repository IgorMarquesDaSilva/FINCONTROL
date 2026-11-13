(function () {
  const create = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const normalize = (value) => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  async function mount(container) {
    const root = create('div', 'education');
    root.innerHTML = `
      <div class="education-toolbar">
        <label>Buscar conteúdo<input type="search" placeholder="Ex.: crédito, reserva..." data-education-search></label>
        <label>Nível<select data-education-level><option value="">Todos</option><option>Iniciante</option><option>Intermediário</option></select></label>
      </div>
      <p class="education-status" role="status" data-education-status>Carregando conteúdos...</p>
      <div class="education-grid" data-education-grid></div>
      <article class="education-reader" data-education-reader hidden></article>`;
    container.append(root);
    const search = root.querySelector('[data-education-search]');
    const level = root.querySelector('[data-education-level]');
    const status = root.querySelector('[data-education-status]');
    const grid = root.querySelector('[data-education-grid]');
    const reader = root.querySelector('[data-education-reader]');
    const toolbar = root.querySelector('.education-toolbar');
    let articles = [];
    let active = null;

    function renderCatalog() {
      const query = normalize(search.value.trim());
      const matches = articles.filter((article) =>
        (!level.value || article.level === level.value)
        && normalize(`${article.title} ${article.summary} ${article.topic} ${article.level}`).includes(query));
      grid.replaceChildren();
      status.textContent = matches.length
        ? `${matches.length} ${matches.length === 1 ? 'conteúdo encontrado' : 'conteúdos encontrados'}`
        : 'Nenhum conteúdo encontrado. Tente outra busca ou nível.';
      matches.forEach((article) => {
        const card = create('article', 'education-card');
        card.append(create('span', 'education-card__topic', article.topic));
        card.append(create('h2', '', article.title));
        card.append(create('p', '', article.summary));
        card.append(create('small', '', `${article.level} · ${article.minutes} min de leitura`));
        const button = create('button', 'education-card__open', 'Ler conteúdo →');
        button.type = 'button';
        button.addEventListener('click', () => openArticle(article));
        card.append(button);
        grid.append(card);
      });
    }

    function updateReadingProgress() {
      if (!active || reader.hidden) return;
      const rect = reader.getBoundingClientRect();
      const progress = Math.min(100, Math.max(0, Math.round((window.innerHeight - rect.top) / Math.max(1, rect.height) * 100)));
      reader.querySelector('[data-reading-progress]').value = progress;
      reader.querySelector('[data-reading-percent]').textContent = `${progress}%`;
    }

    function openArticle(article) {
      active = article;
      toolbar.hidden = true;
      grid.hidden = true;
      status.hidden = true;
      reader.hidden = false;
      reader.replaceChildren();
      const back = create('button', 'education-back', '← Voltar aos conteúdos');
      back.type = 'button';
      back.addEventListener('click', () => {
        active = null;
        reader.hidden = true;
        toolbar.hidden = false;
        grid.hidden = false;
        status.hidden = false;
        search.focus();
      });
      reader.append(back);
      reader.append(create('span', 'education-card__topic', `${article.topic} · ${article.level}`));
      const title = create('h2', '', article.title);
      title.tabIndex = -1;
      reader.append(title, create('p', 'education-reader__lead', article.summary));
      reader.append(create('p', 'education-reader__meta', `${article.minutes} min de leitura · Revisado em ${new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(`${article.reviewedAt}T00:00:00Z`))}`));
      const progressRow = create('div', 'education-reader__progress');
      const progress = create('progress');
      progress.max = 100;
      progress.value = 0;
      progress.dataset.readingProgress = '';
      const percent = create('span', '', '0%');
      percent.dataset.readingPercent = '';
      progressRow.append(progress, percent);
      reader.append(progressRow);
      article.sections.forEach((section) => {
        const block = create('section', 'education-reader__section');
        block.append(create('h3', '', section.heading), create('p', '', section.text));
        reader.append(block);
      });
      const source = create('p', 'education-reader__source', 'Fonte e leitura adicional: ');
      const link = create('a', '', article.sourceName);
      link.href = article.sourceUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      source.append(link);
      reader.append(source);
      title.focus({ preventScroll: true });
      reader.scrollIntoView({ behavior: 'smooth', block: 'start' });
      updateReadingProgress();
    }

    window.addEventListener('scroll', updateReadingProgress, { passive: true });
    search.addEventListener('input', renderCatalog);
    level.addEventListener('change', renderCatalog);
    try {
      const response = await fetch('/content/articles.v1.json');
      if (!response.ok) throw new Error();
      const content = await response.json();
      articles = content.articles;
      renderCatalog();
    } catch (_error) {
      status.textContent = 'Não foi possível carregar os conteúdos. Atualize a página para tentar novamente.';
    }
  }

  window.FincontrolEducation = { mount };
}());
