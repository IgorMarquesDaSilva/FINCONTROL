const menuToggle = document.querySelector('[data-menu-toggle]');
const menuClose = document.querySelector('[data-menu-close]');
const sidebar = document.querySelector('#sidebar');
const navLinks = document.querySelectorAll('.nav__item');
const currentDate = document.querySelector('#current-date');

function setMenuState(open) {
  if (!sidebar || !menuToggle) return;

  sidebar.classList.toggle('is-open', open);
  document.body.classList.toggle('menu-open', open);
  menuToggle.setAttribute('aria-expanded', String(open));
}

menuToggle?.addEventListener('click', () => {
  const isOpen = sidebar?.classList.contains('is-open') ?? false;
  setMenuState(!isOpen);
});

menuClose?.addEventListener('click', () => setMenuState(false));

navLinks.forEach((link) => {
  link.addEventListener('click', () => {
    if (window.matchMedia('(max-width: 900px)').matches) {
      setMenuState(false);
    }
  });
});

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') setMenuState(false);
});

if (currentDate) {
  currentDate.textContent = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  }).format(new Date());
}
