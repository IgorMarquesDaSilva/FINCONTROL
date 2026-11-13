(function () {
  const create = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const normalize = (value) => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  let refreshCurrent = async () => {};

  async function request(path, options = {}) {
    const response = await fetch(path, {
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error?.message || 'Não foi possível salvar seu progresso.');
    return body;
  }

  async function mount(container) {
    const root = create('div', 'education');
    root.innerHTML = `
      <div class="education-tracks" data-education-tracks></div>
      <div class="education-toolbar">
        <label>Buscar conteúdo<input type="search" placeholder="Ex.: crédito, reserva..." data-education-search></label>
        <label>Nível<select data-education-level><option value="">Todos</option><option>Iniciante</option><option>Intermediário</option></select></label>
      </div>
      <p class="education-status" role="status" data-education-status>Carregando conteúdos...</p>
      <div class="education-grid" data-education-grid></div>
      <div class="education-challenges" data-education-challenges></div>
      <article class="education-reader" data-education-reader hidden></article>`;
    container.append(root);
    const search = root.querySelector('[data-education-search]');
    const level = root.querySelector('[data-education-level]');
    const status = root.querySelector('[data-education-status]');
    const grid = root.querySelector('[data-education-grid]');
    const reader = root.querySelector('[data-education-reader]');
    const toolbar = root.querySelector('.education-toolbar');
    const tracks = root.querySelector('[data-education-tracks]');
    const challenges = root.querySelector('[data-education-challenges]');
    let articles = [];
    let active = null;
    let learning = null;

    function renderTracks() {
      tracks.replaceChildren();
      if (!learning) return;
      tracks.append(create('h2', '', 'Suas trilhas'));
      const list = create('div', 'education-tracks__grid');
      learning.tracks.forEach((track) => {
        const completed = track.articleIds.filter((id) => learning.progress[id]?.quizPassed).length;
        const card = create('section', 'education-track');
        card.append(create('h3', '', track.title), create('p', '', track.description));
        card.append(create('small', '', `${completed} de ${track.articleIds.length} conteúdos concluídos`));
        const progress = create('progress');
        progress.max = track.articleIds.length;
        progress.value = completed;
        progress.setAttribute('aria-label', `Progresso da trilha ${track.title}`);
        card.append(progress);
        const steps = create('ol', 'education-track__steps');
        track.articleIds.forEach((id) => {
          const article = articles.find((item) => item.id === id);
          if (!article) return;
          const item = create('li');
          const button = create('button', '', `${learning.progress[id]?.quizPassed ? '✓ ' : ''}${article.title}`);
          button.type = 'button';
          button.addEventListener('click', () => openArticle(article));
          item.append(button);
          steps.append(item);
        });
        card.append(steps);
        list.append(card);
      });
      tracks.append(list);
    }

    function renderChallenges() {
      challenges.replaceChildren();
      if (!learning) return;
      challenges.append(create('h2', '', 'Desafios no seu ritmo'));
      challenges.append(create('p', 'education-challenges__intro', 'Você pode concluir estes desafios sem cadastrar valores ou contratar qualquer produto.'));
      const list = create('div', 'education-challenges__grid');
      learning.challenges.forEach((challenge) => {
        const completed = learning.challengesCompleted.includes(challenge.id);
        const card = create('section', 'education-challenge');
        card.append(create('h3', '', challenge.title), create('p', '', challenge.description));
        const button = create('button', 'secondary-button', completed ? 'Concluído ✓' : 'Marcar como concluído');
        button.type = 'button';
        button.disabled = completed;
        const errorMessage = create('p', 'education-action-error');
        errorMessage.setAttribute('role', 'alert');
        button.addEventListener('click', async () => {
          try {
            button.disabled = true;
            errorMessage.textContent = '';
            await request(`/api/education/challenges/${challenge.id}/complete`, { method: 'POST', body: '{}' });
            learning.challengesCompleted.push(challenge.id);
            renderChallenges();
          } catch (error) {
            button.disabled = false;
            errorMessage.textContent = error.message;
          }
        });
        card.append(button, errorMessage);
        list.append(card);
      });
      challenges.append(list);
    }

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
        if (learning?.progress[article.id]?.quizPassed) card.append(create('small', 'education-card__done', 'Concluído ✓'));
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
      tracks.hidden = true;
      challenges.hidden = true;
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
        tracks.hidden = false;
        challenges.hidden = false;
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
      const readButton = create('button', 'secondary-button', learning?.progress[article.id]?.read ? 'Leitura registrada ✓' : 'Marcar leitura como feita');
      readButton.type = 'button';
      readButton.disabled = !learning || Boolean(learning?.progress[article.id]?.read);
      const readError = create('p', 'education-action-error');
      readError.setAttribute('role', 'alert');
      readButton.addEventListener('click', async () => {
        try {
          readButton.disabled = true;
          readError.textContent = '';
          await request(`/api/education/articles/${article.id}/read`, { method: 'POST', body: '{}' });
          learning.progress[article.id] = { ...learning.progress[article.id], read: true };
          readButton.textContent = 'Leitura registrada ✓';
          renderCatalog();
        } catch (error) {
          readButton.disabled = false;
          readError.textContent = error.message;
        }
      });
      reader.append(readButton, readError);
      const quiz = learning?.quizzes[article.id];
      if (quiz) {
        const quizForm = create('form', 'education-quiz');
        quizForm.append(create('h3', '', 'Confira o que aprendeu'));
        quizForm.append(create('p', '', quiz.question));
        quiz.options.forEach((option, index) => {
          const label = create('label');
          const input = create('input');
          input.type = 'radio';
          input.name = 'answer';
          input.value = String(index);
          label.append(input, document.createTextNode(option));
          quizForm.append(label);
        });
        const feedback = create('p', 'education-quiz__feedback');
        feedback.setAttribute('role', 'status');
        const submit = create('button', 'primary-button primary-button--compact', 'Ver resposta');
        submit.type = 'submit';
        quizForm.append(submit, feedback);
        quizForm.addEventListener('submit', async (event) => {
          event.preventDefault();
          const selected = quizForm.querySelector('input[name="answer"]:checked');
          if (!selected) { feedback.textContent = 'Escolha uma resposta para continuar.'; return; }
          try {
            submit.disabled = true;
            const result = await request(`/api/education/articles/${article.id}/quiz`, {
              method: 'POST', body: JSON.stringify({ answerIndex: Number(selected.value) }),
            });
            feedback.textContent = `${result.message} ${result.explanation} Resposta: ${result.correctAnswer}`;
            if (result.correct) {
              learning.progress[article.id] = { read: true, quizPassed: true };
              renderTracks();
              renderCatalog();
              submit.textContent = 'Concluído ✓';
            } else submit.disabled = false;
          } catch (error) {
            feedback.textContent = error.message;
            submit.disabled = false;
          }
        });
        reader.append(quizForm);
      }
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
    refreshCurrent = async () => {
      try {
        const { learning: result } = await request('/api/education');
        learning = result;
        renderTracks();
        renderChallenges();
        if (articles.length) renderCatalog();
        if (active) openArticle(active);
      } catch (_error) { /* A tela de leitura continua disponível mesmo se o progresso não carregar. */ }
    };
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

  window.FincontrolEducation = { mount, refresh: () => refreshCurrent() };
}());
