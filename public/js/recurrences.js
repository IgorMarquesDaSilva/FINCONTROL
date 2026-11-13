(function () {
  let refreshCurrent = async () => {};
  async function request(path, options = {}) {
    const response = await fetch(path, {
      credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, ...options,
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(body.error?.message || 'Não foi possível salvar a recorrência.');
      error.fields = body.error?.fields || {};
      throw error;
    }
    return body;
  }

  function mount(container, format) {
    const root = document.createElement('div');
    root.className = 'recurrences-workspace';
    root.innerHTML = `
      <section class="recurrences-panel">
        <h2>Movimentações recorrentes</h2>
        <p>Salário, aluguel, assinaturas e outros valores que se repetem. Os lançamentos vencidos são criados automaticamente.</p>
        <p class="recurrences-status" role="status" data-recurrence-status></p>
        <div data-recurrence-list></div>
      </section>
      <section class="recurrences-panel">
        <h2 data-recurrence-form-title>Nova recorrência</h2>
        <form data-recurrence-form novalidate>
          <input type="hidden" name="id">
          <div class="form-field"><label for="recurrence-type">Tipo</label><div class="input-wrap"><select id="recurrence-type" name="type"><option value="EXPENSE">Despesa</option><option value="INCOME">Receita</option></select></div><span class="field-error" data-error-for="type"></span></div>
          <div class="form-field"><label for="recurrence-description">Descrição</label><div class="input-wrap"><input id="recurrence-description" name="description" maxlength="180" required placeholder="Ex.: aluguel"></div><span class="field-error" data-error-for="description"></span></div>
          <div class="recurrences-form-row">
            <div class="form-field"><label for="recurrence-amount">Valor</label><div class="input-wrap"><input id="recurrence-amount" name="amount" type="number" min="0.01" step="0.01" required></div><span class="field-error" data-error-for="amount"></span></div>
            <div class="form-field"><label for="recurrence-category">Categoria</label><div class="input-wrap"><input id="recurrence-category" name="categoryName" maxlength="80" required placeholder="Ex.: moradia"></div><span class="field-error" data-error-for="categoryName"></span></div>
          </div>
          <div class="form-field"><label for="recurrence-frequency">Frequência</label><div class="input-wrap"><select id="recurrence-frequency" name="frequency"><option value="MONTHLY">Mensal</option><option value="WEEKLY">Semanal</option><option value="YEARLY">Anual</option></select></div><span class="field-error" data-error-for="frequency"></span></div>
          <div class="recurrences-form-row">
            <div class="form-field"><label for="recurrence-start">Início</label><div class="input-wrap"><input id="recurrence-start" name="startDate" type="date" required></div><span class="field-error" data-error-for="startDate"></span></div>
            <div class="form-field"><label for="recurrence-end">Término <small>(opcional)</small></label><div class="input-wrap"><input id="recurrence-end" name="endDate" type="date"></div><span class="field-error" data-error-for="endDate"></span></div>
          </div>
          <p class="recurrences-form-error" role="alert" data-recurrence-error></p>
          <div class="recurrences-form-actions"><button type="button" class="secondary-button" data-recurrence-reset>Limpar</button><button type="submit" class="primary-button primary-button--compact" data-recurrence-submit>Salvar recorrência</button></div>
        </form>
      </section>`;
    container.append(root);
    const form = root.querySelector('[data-recurrence-form]');
    const list = root.querySelector('[data-recurrence-list]');
    const status = root.querySelector('[data-recurrence-status]');
    const errorBox = root.querySelector('[data-recurrence-error]');
    let recurrences = [];
    const labels = { WEEKLY: 'Semanal', MONTHLY: 'Mensal', YEARLY: 'Anual', ACTIVE: 'Ativa', PAUSED: 'Pausada', CANCELED: 'Cancelada', COMPLETED: 'Concluída' };

    function reset() {
      form.reset();
      form.elements.namedItem('id').value = '';
      form.elements.namedItem('startDate').value = format.today();
      root.querySelector('[data-recurrence-form-title]').textContent = 'Nova recorrência';
      root.querySelector('[data-recurrence-submit]').textContent = 'Salvar recorrência';
      errorBox.textContent = '';
      root.querySelectorAll('[data-error-for]').forEach((node) => { node.textContent = ''; });
    }

    function render() {
      list.replaceChildren();
      status.textContent = recurrences.length ? `${recurrences.length} recorrência(s) cadastrada(s)` : 'Nenhuma recorrência cadastrada.';
      recurrences.forEach((item) => {
        const card = document.createElement('article');
        card.className = 'recurrence-item';
        const details = document.createElement('div');
        const heading = document.createElement('h3');
        heading.textContent = item.description;
        const meta = document.createElement('p');
        meta.textContent = `${item.category.name} · ${labels[item.frequency]} · ${labels[item.status]}`;
        const date = document.createElement('small');
        date.textContent = item.status === 'ACTIVE' ? `Próximo lançamento: ${format.date(item.nextRunDate)}` : `Início: ${format.date(item.startDate)}`;
        details.append(heading, meta, date);
        const amount = document.createElement('strong');
        amount.textContent = `${item.type === 'EXPENSE' ? '− ' : '+ '}${format.currency(item.amount)}`;
        const actions = document.createElement('div');
        actions.className = 'recurrence-item__actions';
        if (!['CANCELED', 'COMPLETED'].includes(item.status)) {
          const edit = document.createElement('button');
          edit.type = 'button';
          edit.textContent = 'Editar';
          edit.addEventListener('click', () => {
            for (const [name, value] of Object.entries({
              id: item.id, type: item.type, description: item.description,
              amount: item.amount, categoryName: item.category.name, frequency: item.frequency,
              startDate: item.startDate, endDate: item.endDate || '',
            })) form.elements.namedItem(name).value = value;
            root.querySelector('[data-recurrence-form-title]').textContent = 'Editar recorrência';
            root.querySelector('[data-recurrence-submit]').textContent = 'Salvar alterações';
            form.scrollIntoView({ behavior: 'smooth', block: 'start' });
            form.elements.namedItem('description').focus({ preventScroll: true });
          });
          actions.append(edit);
          const toggle = document.createElement('button');
          toggle.type = 'button';
          const action = item.status === 'ACTIVE' ? 'pause' : 'resume';
          toggle.textContent = action === 'pause' ? 'Pausar' : 'Retomar';
          toggle.addEventListener('click', () => void changeStatus(item.id, action));
          actions.append(toggle);
          const cancel = document.createElement('button');
          cancel.type = 'button';
          cancel.textContent = 'Cancelar';
          cancel.addEventListener('click', () => {
            if (cancel.dataset.confirm) { void changeStatus(item.id, 'cancel'); return; }
            cancel.dataset.confirm = 'true';
            cancel.textContent = 'Confirmar cancelamento';
          });
          actions.append(cancel);
        }
        card.append(details, amount, actions);
        list.append(card);
      });
    }

    async function refresh() {
      try {
        const payload = await request('/api/recurrences');
        recurrences = payload.recurrences;
        render();
      } catch (error) { status.textContent = error.message; }
    }
    refreshCurrent = refresh;

    async function changeStatus(id, action) {
      try {
        await request(`/api/recurrences/${id}/${action}`, { method: 'POST', body: '{}' });
        await refresh();
        window.dispatchEvent(new Event('fincontrol:transactions-changed'));
      } catch (error) { status.textContent = error.message; }
    }

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      errorBox.textContent = '';
      root.querySelectorAll('[data-error-for]').forEach((node) => { node.textContent = ''; });
      const data = Object.fromEntries(new FormData(form));
      const id = data.id;
      delete data.id;
      const submit = root.querySelector('[data-recurrence-submit]');
      try {
        submit.disabled = true;
        await request(id ? `/api/recurrences/${id}` : '/api/recurrences', {
          method: id ? 'PUT' : 'POST', body: JSON.stringify(data),
        });
        reset();
        await refresh();
        window.dispatchEvent(new Event('fincontrol:transactions-changed'));
      } catch (error) {
        errorBox.textContent = error.message;
        Object.entries(error.fields || {}).forEach(([name, message]) => {
          const node = [...root.querySelectorAll('[data-error-for]')].find((item) => item.dataset.errorFor === name);
          if (node) node.textContent = message;
        });
      } finally { submit.disabled = false; }
    });
    root.querySelector('[data-recurrence-reset]').addEventListener('click', reset);
    reset();
  }

  window.FincontrolRecurrences = { mount, refresh: () => refreshCurrent() };
}());
