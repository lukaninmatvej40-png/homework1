// Product stars rendering
function renderStars() {
	const elements = document.querySelectorAll('[data-rating]');
	console.log('renderStars called, found:', elements.length, 'elements');

	elements.forEach(el => {
		const rating = parseFloat(el.dataset.rating);
		const fullStars = Math.floor(rating);
		const hasHalfStar = rating % 1 >= 0.5;
		const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
		let html = '';

		for (let i = 0; i < fullStars; i++) {
			html += '<span class="star-full">★</span>';
		}
		if (hasHalfStar) {
			html += '<span class="star-half"><span class="star-half-inner">★</span>☆</span>';
		}
		for (let i = 0; i < emptyStars; i++) {
			html += '<span class="star-empty">☆</span>';
		}

		el.innerHTML = html;
	});
}

console.log('product-stars.js loaded, readyState:', document.readyState);
if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', renderStars);
} else {
	renderStars();
}

