const cartModal = document.getElementById('cart-modal');
const cartOpenButtons = document.querySelectorAll('[data-cart-open]');
const cartCloseElements = cartModal ? cartModal.querySelectorAll('[data-cart-close]') : [];
const cartItemsList = cartModal ? cartModal.querySelector('[data-cart-items]') : null;
const cartEmptyMessage = cartModal ? cartModal.querySelector('[data-cart-empty]') : null;
const body = document.querySelector('.page__body');

const cart = new Map();

function renderCart() {
  if (!cartItemsList || !cartEmptyMessage) return;

  cartItemsList.innerHTML = '';

  if (cart.size === 0) {
    cartEmptyMessage.hidden = false;
    return;
  }

  cartEmptyMessage.hidden = true;
  cart.forEach((item) => {
    const li = document.createElement('li');
    li.className = 'modal__item';
    li.textContent = `${item.name} × ${item.quantity} — ₽${item.price * item.quantity}`;
    cartItemsList.appendChild(li);
  });
}

function openModal() {
  if (!cartModal) return;
  cartModal.classList.add('modal--active');
  body.classList.add('page__body--no-scroll');
}

function closeModal() {
  if (!cartModal) return;
  cartModal.classList.remove('modal--active');
  body.classList.remove('page__body--no-scroll');
}

if (cartModal) {
  cartOpenButtons.forEach((button) => button.addEventListener('click', openModal));
  cartCloseElements.forEach((el) => el.addEventListener('click', closeModal));

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && cartModal.classList.contains('modal--active')) {
      closeModal();
    }
  });
}

const addButtons = document.querySelectorAll('[data-cart-add]');

addButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const name = button.dataset.name;
    const price = Number(button.dataset.price);
    const existing = cart.get(name);

    if (existing) {
      existing.quantity += 1;
    } else {
      cart.set(name, { name, price, quantity: 1 });
    }

    renderCart();

    const originalText = button.textContent;
    button.textContent = 'Добавлено ✓';
    setTimeout(() => {
      button.textContent = originalText;
    }, 1200);
  });
});

renderCart();
