const track = document.querySelector('[data-reviews-track]');
const prevBtn = document.querySelector('[data-reviews-prev]');
const nextBtn = document.querySelector('[data-reviews-next]');

if (track && prevBtn && nextBtn) {
	const getVisibleCount = () => {
		if (window.innerWidth <= 576) return 1;
		if (window.innerWidth <= 992) return 2;
		return 3;
	};

	const originals = Array.from(track.children);
	const total = originals.length;

	const maxVisible = 3;
	const headClones = originals.slice(-maxVisible).map(el => {
		const clone = el.cloneNode(true);
		clone.setAttribute('aria-hidden', 'true');
		return clone;
	});
	const tailClones = originals.slice(0, maxVisible).map(el => {
		const clone = el.cloneNode(true);
		clone.setAttribute('aria-hidden', 'true');
		return clone;
	});

	headClones.forEach(clone => track.insertBefore(clone, track.firstChild));
	tailClones.forEach(clone => track.appendChild(clone));

	let index = maxVisible;
	let isAnimating = false;

	const getStep = () => {
		const card = track.children[index];
		if (!card) return 0;
		const width = card.getBoundingClientRect().width;
		const gap = parseFloat(getComputedStyle(track).gap) || 20;
		return width + gap;
	};

	const setPosition = (withTransition) => {
		track.style.transition = withTransition ? 'transform 0.4s ease' : 'none';
		track.style.transform = `translateX(${-index * getStep()}px)`;
	};

	const jumpIfNeeded = () => {
		if (index >= total + maxVisible) {
			index -= total;
			setPosition(false);
		} else if (index < maxVisible) {
			index += total;
			setPosition(false);
		}
		isAnimating = false;
	};

	track.addEventListener('transitionend', jumpIfNeeded);

	prevBtn.addEventListener('click', () => {
		if (isAnimating) return;
		isAnimating = true;
		index -= 1;
		setPosition(true);
	});

	nextBtn.addEventListener('click', () => {
		if (isAnimating) return;
		isAnimating = true;
		index += 1;
		setPosition(true);
	});

	window.addEventListener('resize', () => setPosition(false));

	requestAnimationFrame(() => setPosition(false));
}
