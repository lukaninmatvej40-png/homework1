const SIZE_STORAGE_KEY = "nike-selected-size";

export const sizes = () => {
  const sizesList = document.querySelector('[data-sizes="list"]');
  const sizesButtons = document.querySelectorAll('[data-sizes="button"]');

  const setActiveButton = (button) => {
    sizesButtons.forEach((btn) =>
      btn.classList.remove("product__sizes-button--active")
    );
    button.classList.add("product__sizes-button--active");
  };

  const handleSizeClick = (event) => {
    const target = event.target;

    if (!target?.classList.contains("product__sizes-button")) return;

    setActiveButton(target);
    localStorage.setItem(SIZE_STORAGE_KEY, target.textContent.trim());
  };

  const restoreSavedSize = () => {
    const savedSize = localStorage.getItem(SIZE_STORAGE_KEY);

    if (!savedSize) return;

    const savedButton = Array.from(sizesButtons).find(
      (button) => button.textContent.trim() === savedSize
    );

    if (savedButton) setActiveButton(savedButton);
  };

  sizesList.addEventListener("click", handleSizeClick);
  restoreSavedSize();
};
