(() => {
  'use strict';
  const products = window.STORE_PRODUCTS || [];
  const byId = new Map(products.map(product => [product.id, product]));
  const money = value => `${new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(value)} ₽`;
  const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const bag = '<svg class="icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M5 7h14l1 14H4L5 7Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>';
  let cart = {};
  try {
    const stored = JSON.parse(localStorage.getItem('lr-cart') || '{}');
    if (stored && typeof stored === 'object' && !Array.isArray(stored)) {
      for (const [id, value] of Object.entries(stored)) {
        if (byId.has(Number(id)) && Number.isInteger(value) && value > 0 && value <= 999) cart[id] = value;
      }
    }
  } catch { /* Start with an empty list if storage is unavailable or malformed. */ }

  let toastTimer;
  function toast(message) {
    const node = document.querySelector('[data-toast]');
    if (!node) return;
    node.textContent = message;
    node.classList.add('toast--visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => node.classList.remove('toast--visible'), 2800);
  }
  function persist() {
    try { localStorage.setItem('lr-cart', JSON.stringify(cart)); } catch { toast('Список сохранится только до закрытия страницы.'); }
    document.querySelectorAll('[data-cart-count]').forEach(node => {
      const count = Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);
      node.textContent = count;
      node.closest('a').setAttribute('aria-label', `Открыть список заказа, товаров: ${count}`);
    });
    const total = Object.entries(cart).reduce((sum, [id, quantity]) => sum + byId.get(Number(id)).price * quantity, 0);
    document.querySelectorAll('[data-cart-total]').forEach(node => { node.textContent = money(total); });
  }
  persist();

  const menuButton = document.querySelector('[data-menu-toggle]');
  const menu = document.querySelector('#site-menu');
  const catalogButton = document.querySelector('[data-catalog-toggle]');
  const catalog = document.querySelector('#catalog-menu');
  function closeMenus() {
    menu?.classList.remove('menu--open');
    catalog?.classList.remove('catalog-menu--open');
    menuButton?.setAttribute('aria-expanded', 'false');
    catalogButton?.setAttribute('aria-expanded', 'false');
  }
  menuButton?.addEventListener('click', () => {
    const opened = menu?.classList.toggle('menu--open');
    menuButton.setAttribute('aria-expanded', String(Boolean(opened)));
  });
  catalogButton?.addEventListener('click', () => {
    if (window.matchMedia('(max-width: 900px)').matches) {
      const opened = catalog?.classList.toggle('catalog-menu--open');
      catalogButton.setAttribute('aria-expanded', String(Boolean(opened)));
      if (opened) catalog?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    } else {
      window.location.href = 'catalog.html';
    }
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeMenus();
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.header, .sidebar')) closeMenus();
  });

  function renderPalette() {
    const selected = document.documentElement.dataset.theme || 'olive';
    document.querySelectorAll('[data-theme]').forEach(button => {
      if (button.tagName === 'BUTTON') button.setAttribute('aria-pressed', String(button.dataset.theme === selected));
    });
  }
  renderPalette();
  document.querySelectorAll('button[data-theme]').forEach(button => button.addEventListener('click', () => {
    document.documentElement.dataset.theme = button.dataset.theme;
    try { localStorage.setItem('lr-theme', button.dataset.theme); } catch { /* Palette still applies to this page. */ }
    renderPalette();
  }));

  document.addEventListener('click', event => {
    const button = event.target.closest('[data-add]');
    if (!button) return;
    const id = Number(button.dataset.add);
    if (!byId.has(id)) return;
    const quantityInput = document.querySelector('[data-detail-quantity]');
    if (button.hasAttribute('data-detail-add') && quantityInput && !quantityInput.reportValidity()) return;
    const quantity = button.hasAttribute('data-detail-add') ? Number(quantityInput.value) : 1;
    cart[id] = Math.min(999, (cart[id] || 0) + quantity);
    persist();
    toast('Добавлено в заказ. Список — в корзине вверху страницы.');
  });

  function productCard(product) {
    return `<article class="product-card" data-product="${product.id}"><a class="product-card__image" href="product-${product.id}.html"><img src="${product.image}" alt="${escape(product.name)}" width="700" height="700" loading="lazy"></a><div class="product-card__body"><span class="product-card__category">${escape(product.category)}</span><h3 class="product-card__title"><a href="product-${product.id}.html">${escape(product.name)}</a></h3><span class="product-card__stock">${product.stock ? 'В наличии' : 'Уточните наличие'}</span><div class="product-card__bottom"><span class="product-card__price">${money(product.price)}</span><button class="product-card__add" data-add="${product.id}" aria-label="Добавить ${escape(product.name)} в заказ">${bag}</button></div></div></article>`;
  }
  const productList = document.querySelector('[data-product-list]');
  if (productList) {
    const params = new URLSearchParams(window.location.search);
    const query = (params.get('q') || '').trim();
    const search = document.querySelector('#site-search');
    if (search) search.value = query;
    const normalize = value => value.toLocaleLowerCase('ru-RU').replaceAll('ё', 'е').replaceAll('×', 'х');
    const terms = normalize(query).split(/\s+/).filter(Boolean);
    const categorySelect = document.querySelector('[data-filter-category]');
    const widthSelect = document.querySelector('[data-filter-width]');
    const sortSelect = document.querySelector('[data-sort]');
    const initialCategory = Number(productList.dataset.category) || 0;
    function filterProducts() {
      const category = initialCategory || Number(categorySelect?.value) || 0;
      const width = widthSelect?.value;
      let results = products.filter(product => {
        const haystack = normalize(`${product.name} ${product.category} ${Object.values(product.attrs).join(' ')}`);
        const categoryMatches = !category || product.cats.includes(category);
        const widthMatches = !width || new RegExp(`(?:^|\\D)${width}\\s*(?:мм|mm)`, 'i').test(haystack);
        return categoryMatches && widthMatches && terms.every(term => haystack.includes(term));
      });
      if (sortSelect?.value === 'price-up') results.sort((a, b) => a.price - b.price);
      if (sortSelect?.value === 'price-down') results.sort((a, b) => b.price - a.price);
      if (sortSelect?.value === 'name') results.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
      productList.innerHTML = results.map(productCard).join('');
      const count = document.querySelector('[data-result-count]');
      if (count) count.textContent = `${query ? `По запросу «${query}»: ` : ''}${results.length} позиций`;
      const empty = document.querySelector('[data-empty]');
      if (empty) empty.hidden = results.length > 0;
    }
    [categorySelect, widthSelect, sortSelect].forEach(select => select?.addEventListener('change', filterProducts));
    document.querySelector('[data-filter-reset]')?.addEventListener('click', () => {
      if (query) { window.location.href = 'catalog.html'; return; }
      if (categorySelect) categorySelect.value = '';
      if (widthSelect) widthSelect.value = '';
      if (sortSelect) sortSelect.value = 'default';
      filterProducts();
    });
    filterProducts();
  }

  document.querySelector('[data-inquiry]')?.addEventListener('submit', event => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const body = `Здравствуйте!\n\n${data.get('message')}\n\nИмя: ${data.get('name')}\nПочта: ${data.get('email')}\nТелефон: ${data.get('phone') || 'Не указан'}`;
    const draft = document.createElement('a');
    draft.href = `mailto:info@lentyribbony.ru?subject=${encodeURIComponent('Запрос на подбор материалов')}&body=${encodeURIComponent(body)}`;
    draft.click();
    toast('Письмо подготовлено. Отправьте его из почтовой программы.');
  });

  const cartNode = document.querySelector('[data-cart]');
  function makeOrderText() {
    let total = 0;
    const lines = Object.entries(cart).map(([id, quantity]) => {
      const product = byId.get(Number(id));
      total += product.price * quantity;
      return `${product.name}\nКоличество: ${quantity}. Цена: ${money(product.price)}. Сумма: ${money(product.price * quantity)}\n${product.url}`;
    });
    return `Здравствуйте! Прошу подтвердить наличие и рассчитать доставку.\n\n${lines.join('\n\n')}\n\nМатериалы: ${money(total)}\n\nМоё имя: \nТелефон: \nГород доставки: `;
  }
  function renderCart() {
    if (!cartNode) return;
    const entries = Object.entries(cart);
    if (!entries.length) {
      cartNode.innerHTML = '<div class="empty-state"><h2>Пока ничего не выбрано</h2><p>Добавьте нужные материалы из каталога — они появятся здесь.</p><a class="button" href="catalog.html">Выбрать материалы →</a></div>';
      return;
    }
    const total = entries.reduce((sum, [id, quantity]) => sum + byId.get(Number(id)).price * quantity, 0);
    cartNode.innerHTML = entries.map(([id, quantity]) => {
      const product = byId.get(Number(id));
      return `<article class="cart__item"><img class="cart__image" src="${product.image}" alt="${escape(product.name)}"><a class="cart__title" href="product-${id}.html">${escape(product.name)}</a><input class="cart__quantity" type="number" min="1" max="999" value="${quantity}" data-cart-quantity="${id}" aria-label="Количество: ${escape(product.name)}"><span class="cart__price">${money(product.price * quantity)}</span><button class="cart__remove" data-remove="${id}" aria-label="Убрать ${escape(product.name)} из заказа">×</button></article>`;
    }).join('') + `<section class="cart__summary"><h2 class="cart__total">Материалы: ${money(total)}</h2><p class="cart__note">Это предварительная сумма без доставки. Проверьте список и дополните письмо контактами. Письмо откроется в вашей почтовой программе для самостоятельной отправки.</p><label for="order-draft">Ваш запрос</label><textarea class="cart__message" id="order-draft" data-order-text>${escape(makeOrderText())}</textarea><div class="cart__actions"><button class="button" data-order-email>Открыть письмо ↗</button><button class="button button--secondary" data-order-copy>Скопировать запрос</button></div><p class="inquiry__note">Адрес для отправки: info@lentyribbony.ru</p></section>`;
  }
  renderCart();
  cartNode?.addEventListener('change', event => {
    if (!event.target.matches('[data-cart-quantity]')) return;
    const input = event.target;
    if (!input.reportValidity()) return;
    cart[input.dataset.cartQuantity] = Number(input.value);
    persist();
    renderCart();
  });
  cartNode?.addEventListener('click', async event => {
    const remove = event.target.closest('[data-remove]');
    if (remove) {
      delete cart[remove.dataset.remove];
      persist();
      renderCart();
      return;
    }
    const text = cartNode.querySelector('[data-order-text]');
    if (event.target.closest('[data-order-email]')) {
      window.location.href = `mailto:info@lentyribbony.ru?subject=${encodeURIComponent('Запрос на заказ материалов')}&body=${encodeURIComponent(text.value)}`;
    }
    if (event.target.closest('[data-order-copy]')) {
      try {
        await navigator.clipboard.writeText(text.value);
        toast('Запрос скопирован. Его можно отправить по почте.');
      } catch {
        text.focus();
        text.select();
        toast('Текст выделен — скопируйте его сочетанием Ctrl+C.');
      }
    }
  });
})();
