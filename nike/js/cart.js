const CART_STORAGE_KEY = "nike-cart-count";

export const cart = () => {
  const addButton = document.querySelector('[data-cart="add"]');
  const countElement = document.querySelector('[data-cart="count"]');

  if (!addButton || !countElement) return;

  const getCount = () => Number(localStorage.getItem(CART_STORAGE_KEY)) || 0;

  const renderCount = (count) => {
    countElement.textContent = count;
    countElement.hidden = count === 0;
  };

  const addToCart = () => {
    const nextCount = getCount() + 1;
    localStorage.setItem(CART_STORAGE_KEY, nextCount);
    renderCount(nextCount);
  };

  addButton.addEventListener("click", addToCart);
  renderCount(getCount());
};
