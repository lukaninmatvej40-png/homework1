export const buyForm = () => {
  const form = document.querySelector(".modal-buy__form");
  const successMessage = document.querySelector(".modal-buy__success");

  if (!form || !successMessage) return;

  const modalWindow = form.closest("[data-modal-window]");
  const closeButton = modalWindow?.querySelector("[data-modal-close]");

  const resetView = () => {
    form.reset();
    form.hidden = false;
    successMessage.hidden = true;
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    form.hidden = true;
    successMessage.hidden = false;

    setTimeout(() => {
      closeButton?.click();
      resetView();
    }, 2000);
  });
};
