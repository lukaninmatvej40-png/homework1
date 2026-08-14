// Burger menu toggle
const burger = document.querySelector('.burger');
const menu = document.querySelector('.header__menu');
const body = document.body;

if (burger && menu) {
	const setOpen = (isOpen) => {
		burger.classList.toggle('burger--active', isOpen);
		menu.classList.toggle('header__menu--open', isOpen);
		body.classList.toggle('page__body--no-scroll', isOpen);
		burger.setAttribute('aria-expanded', String(isOpen));
	};

	burger.addEventListener('click', () => {
		setOpen(!burger.classList.contains('burger--active'));
	});

	// Close menu on link click
	const menuLinks = menu.querySelectorAll('.menu__link');
	menuLinks.forEach(link => {
		link.addEventListener('click', () => {
			setOpen(false);
		});
	});
}
