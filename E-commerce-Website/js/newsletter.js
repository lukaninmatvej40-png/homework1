const form = document.querySelector('[data-newsletter-form]');

if (form) {
	const button = form.querySelector('.newsletter__button');
	const input = form.querySelector('.newsletter__input');
	const originalText = button.textContent;

	form.addEventListener('submit', (event) => {
		event.preventDefault();
		button.textContent = 'Спасибо за подписку!';
		input.value = '';
		setTimeout(() => {
			button.textContent = originalText;
		}, 2000);
	});
}
