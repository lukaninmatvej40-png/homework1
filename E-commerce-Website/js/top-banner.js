const banner = document.querySelector('[data-top-banner]');
const closeBtn = document.querySelector('[data-top-banner-close]');

if (banner && closeBtn) {
	closeBtn.addEventListener('click', () => {
		banner.classList.add('top-banner--hidden');
	});
}
