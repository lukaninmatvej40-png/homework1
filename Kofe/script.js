const scenarioData = {
  home: {
    label: 'Сценарий 01 · дома',
    title: 'Тёплая пауза на своей кухне',
    text: 'Порция 40 г уже рассчитана на одну чашку. Налейте 170 мл горячей воды, размешайте — и можно возвращаться к своим делам.',
    image: 'assets/cinnamon.webp',
    caption: 'Корица & апельсин',
    badge: '5 секунд\nдо паузы',
    className: 'scenario-home'
  },
  office: {
    label: 'Сценарий 02 · в офисе',
    title: 'Маленький ритуал между задачами',
    text: 'Пакетик хранится компактно и не требует молока или мерной ложки. Поставьте любимый вкус рядом с кофемашиной — остальное уже продумано.',
    image: 'assets/caramel.webp',
    caption: 'Карамель',
    badge: '40 г\nодна порция',
    className: 'scenario-office'
  },
  road: {
    label: 'Сценарий 03 · в дороге',
    title: 'Вкус, который едет с вами',
    text: 'Порционный формат помещается в рюкзак и не привязан к кухне. А если хочется прохлады — попробуйте холодный способ со льдом.',
    image: 'assets/chocolate.webp',
    caption: 'Высший шоколад',
    badge: 'Горячий\nили холодный',
    className: 'scenario-road'
  }
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function showToast(message) {
  const toast = $('.toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('is-visible');
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove('is-visible'), 2800);
}

function initNavigation() {
  const menu = $('[data-menu-toggle]');
  const links = $('[data-nav-links]');
  if (menu && links) menu.addEventListener('click', () => links.classList.toggle('is-open'));
  $$('.nav-links a').forEach(link => link.addEventListener('click', () => links?.classList.remove('is-open')));
}

function initScenario() {
  const tabs = $$('[data-scenario]');
  const panel = $('[data-scenario-panel]');
  if (!tabs.length || !panel) return;
  const label = $('[data-scenario-label]', panel);
  const title = $('[data-scenario-title]', panel);
  const text = $('[data-scenario-text]', panel);
  const image = $('[data-scenario-image]', panel);
  const caption = $('[data-scenario-caption]', panel);
  const badge = $('[data-scenario-badge]', panel);
  const setScenario = key => {
    const data = scenarioData[key];
    tabs.forEach(tab => tab.classList.toggle('is-active', tab.dataset.scenario === key));
    if (!data) return;
    panel.className = `moment-panel ${data.className}`;
    label.textContent = data.label;
    title.textContent = data.title;
    text.textContent = data.text;
    image.src = data.image;
    image.alt = data.caption;
    caption.textContent = data.caption;
    badge.innerHTML = data.badge.replace('\n', '<br>');
  };
  tabs.forEach(tab => tab.addEventListener('click', () => setScenario(tab.dataset.scenario)));
  setScenario('home');
}

function initRecipes() {
  $$('[data-recipe-group]').forEach(group => {
    const buttons = $$('[data-recipe-tab]', group);
    const panels = $$('[data-recipe-panel]', group);
    buttons.forEach(button => button.addEventListener('click', () => {
      const id = button.dataset.recipeTab;
      buttons.forEach(item => item.classList.toggle('is-active', item === button));
      panels.forEach(panel => panel.classList.toggle('is-active', panel.dataset.recipePanel === id));
    }));
  });
}

function initFaq() {
  $$('.faq-question').forEach(question => question.addEventListener('click', () => {
    const item = question.closest('.faq-item');
    const open = item.classList.contains('is-open');
    $$('.faq-item').forEach(other => other.classList.remove('is-open'));
    if (!open) item.classList.add('is-open');
  }));
}

function initFilters() {
  const filters = $$('[data-filter]');
  const cards = $$('[data-product-card]');
  if (!filters.length || !cards.length) return;
  filters.forEach(filter => filter.addEventListener('click', () => {
    const value = filter.dataset.filter;
    filters.forEach(item => item.classList.toggle('is-active', item === filter));
    cards.forEach(card => { card.hidden = value !== 'all' && !card.dataset.category.split(' ').includes(value); });
  }));
}

function initCart() {
  const state = { items: [] };
  const drawer = $('[data-cart-drawer]');
  const count = $('[data-cart-count]');
  const list = $('[data-cart-items]');
  const total = $('[data-cart-total]');
  const render = () => {
    if (!count || !list || !total) return;
    count.textContent = state.items.reduce((sum, item) => sum + item.qty, 0);
    list.innerHTML = state.items.length ? state.items.map(item => `<div class="cart-row"><span>${item.name}<small>${item.qty} × ${item.price.toLocaleString('ru-RU')} ₽</small></span><strong>${(item.price * item.qty).toLocaleString('ru-RU')} ₽</strong></div>`).join('') : '<p class="cart-empty">Пока здесь пусто. Добавьте любимый вкус — это займёт один клик.</p>';
    total.textContent = `${state.items.reduce((sum, item) => sum + item.price * item.qty, 0).toLocaleString('ru-RU')} ₽`;
  };
  $$('[data-add-to-cart]').forEach(button => button.addEventListener('click', () => {
    const item = { name: button.dataset.name, price: Number(button.dataset.price), qty: 1 };
    const existing = state.items.find(entry => entry.name === item.name);
    existing ? existing.qty++ : state.items.push(item);
    render();
    showToast(`${item.name} добавлен в корзину`);
  }));
  $('[data-cart-open]')?.addEventListener('click', () => { drawer?.classList.add('is-open'); document.body.classList.add('is-locked'); });
  $$('[data-cart-close]').forEach(button => button.addEventListener('click', () => { drawer?.classList.remove('is-open'); document.body.classList.remove('is-locked'); }));
  drawer?.addEventListener('click', event => { if (event.target === drawer) { drawer.classList.remove('is-open'); document.body.classList.remove('is-locked'); } });
  render();
}

function initForms() {
  $$('form[data-demo-form]').forEach(form => form.addEventListener('submit', event => {
    event.preventDefault();
    form.reset();
    showToast('Спасибо! Заявка сохранена в демо-режиме.');
  }));
}

function initYear() { $$('[data-year]').forEach(node => node.textContent = new Date().getFullYear()); }

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initScenario();
  initRecipes();
  initFaq();
  initFilters();
  initCart();
  initForms();
  initYear();
});
