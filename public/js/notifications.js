(function () {
  let refreshCurrent = async () => {};
  async function request(path, options = {}) {
    const response = await fetch(path, {
      credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, ...options,
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error?.message || 'Não foi possível carregar os avisos.');
    return body;
  }

  function mount(container, format) {
    const root = document.createElement('div');
    root.className = 'notifications-workspace';
    root.innerHTML = `
      <section class="notifications-panel">
        <h2>Seus avisos</h2>
        <p>Limites do orçamento e lançamentos que estão chegando. Os avisos aparecem somente aqui no site.</p>
        <p role="status" data-notifications-status></p>
        <div data-notifications-list></div>
      </section>
      <section class="notifications-panel">
        <h2>Preferências</h2>
        <form data-notifications-preferences>
          <label class="notifications-toggle"><input type="checkbox" name="budgetEnabled"> Avisos de orçamento</label>
          <label class="notifications-toggle"><input type="checkbox" name="recurrenceEnabled"> Avisos de recorrências</label>
          <label class="notifications-mute">Silenciar todos por
            <select name="muteDays"><option value="0">Não silenciar</option><option value="1">1 dia</option><option value="7">7 dias</option><option value="30">30 dias</option></select>
          </label>
          <p data-notifications-muted-until></p>
          <button class="primary-button primary-button--compact" type="submit">Salvar preferências</button>
          <p role="status" data-notifications-preferences-status></p>
        </form>
      </section>`;
    container.append(root);
    const list = root.querySelector('[data-notifications-list]');
    const status = root.querySelector('[data-notifications-status]');
    const preferencesForm = root.querySelector('[data-notifications-preferences]');
    const preferencesStatus = root.querySelector('[data-notifications-preferences-status]');
    const count = document.querySelector('[data-notification-count]');

    async function refresh() {
      try {
        const payload = await request('/api/notifications');
        const { notifications, unreadCount, preferences } = payload;
        count.textContent = unreadCount ? String(unreadCount) : '';
        count.hidden = !unreadCount;
        preferencesForm.elements.namedItem('budgetEnabled').checked = preferences.budgetEnabled;
        preferencesForm.elements.namedItem('recurrenceEnabled').checked = preferences.recurrenceEnabled;
        const muteInfo = root.querySelector('[data-notifications-muted-until]');
        muteInfo.textContent = preferences.mutedUntil
          ? `Silenciado até ${format.date(preferences.mutedUntil.slice(0, 10))}.`
          : '';
        list.replaceChildren();
        status.textContent = notifications.length ? `${notifications.length} aviso(s)` : 'Nenhum aviso no momento.';
        notifications.forEach((notice) => {
          const card = document.createElement('article');
          card.className = `notification-item${notice.read ? '' : ' notification-item--unread'}`;
          const title = document.createElement('h3');
          title.textContent = notice.title;
          const message = document.createElement('p');
          message.textContent = notice.message;
          const date = document.createElement('small');
          date.textContent = format.date(String(notice.createdAt).slice(0, 10));
          const actions = document.createElement('div');
          actions.className = 'notification-item__actions';
          const link = document.createElement('a');
          link.href = notice.link;
          link.textContent = 'Ver contexto →';
          link.addEventListener('click', () => {
            void request(`/api/notifications/${notice.id}/read`, { method: 'POST', body: '{}' }).then(refresh).catch((error) => { status.textContent = error.message; });
          });
          actions.append(link);
          if (!notice.read) {
            const read = document.createElement('button');
            read.type = 'button';
            read.textContent = 'Marcar como lido';
            read.addEventListener('click', () => void request(`/api/notifications/${notice.id}/read`, { method: 'POST', body: '{}' }).then(refresh).catch((error) => { status.textContent = error.message; }));
            actions.append(read);
          }
          const silence = document.createElement('button');
          silence.type = 'button';
          silence.textContent = 'Silenciar este aviso';
          silence.addEventListener('click', () => void request(`/api/notifications/${notice.id}/silence`, { method: 'POST', body: '{}' }).then(refresh).catch((error) => { status.textContent = error.message; }));
          actions.append(silence);
          card.append(title, message, date, actions);
          list.append(card);
        });
      } catch (error) { status.textContent = error.message; }
    }
    refreshCurrent = refresh;

    preferencesForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      preferencesStatus.textContent = '';
      const button = preferencesForm.querySelector('button[type="submit"]');
      button.disabled = true;
      try {
        await request('/api/notifications/preferences', {
          method: 'PUT', body: JSON.stringify({
            budgetEnabled: preferencesForm.elements.namedItem('budgetEnabled').checked,
            recurrenceEnabled: preferencesForm.elements.namedItem('recurrenceEnabled').checked,
            muteDays: Number(preferencesForm.elements.namedItem('muteDays').value),
          }),
        });
        await refresh();
        preferencesStatus.textContent = 'Preferências salvas.';
      } catch (error) { preferencesStatus.textContent = error.message; }
      finally { button.disabled = false; }
    });
  }

  window.FincontrolNotifications = { mount, refresh: () => refreshCurrent() };
}());
