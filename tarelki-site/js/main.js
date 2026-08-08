document.addEventListener('DOMContentLoaded', function() {
    var toggle = document.querySelector('.nav-toggle');
    var navList = document.querySelector('.nav-list');

    if (toggle) {
        toggle.addEventListener('click', function() {
            navList.classList.toggle('active');
        });
    }

    if (navList) {
        navList.querySelectorAll('a').forEach(function(link) {
            link.addEventListener('click', function() {
                navList.classList.remove('active');
            });
        });
    }

    var filterBtns = document.querySelectorAll('.filter-btn');
    var cards = document.querySelectorAll('.catalog-card');

    filterBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
            filterBtns.forEach(function(b) { b.classList.remove('active'); });
            btn.classList.add('active');

            var filter = btn.getAttribute('data-filter');
            cards.forEach(function(card) {
                if (filter === 'all' || card.getAttribute('data-category') === filter) {
                    card.style.display = '';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });

    var form = document.getElementById('contactForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            var name = form.querySelector('[name="name"]').value.trim();
            var contact = form.querySelector('[name="contact"]').value.trim();
            var message = form.querySelector('[name="message"]').value.trim();

            // Замените BOT_TOKEN и CHAT_ID
            var BOT_TOKEN = 'YOUR_BOT_TOKEN';
            var CHAT_ID = 'YOUR_CHAT_ID';

            var text = 'Заявка с сайта:\nИмя: ' + name + '\nКонтакт: ' + contact + '\nСообщение: ' + (message || '—');

            if (BOT_TOKEN !== 'YOUR_BOT_TOKEN') {
                fetch('https://api.telegram.org/bot' + BOT_TOKEN + '/sendMessage', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chat_id: CHAT_ID, text: text })
                });
            }

            form.innerHTML = '<div class="form-success">Спасибо! Мы свяжемся с вами.</div>';
        });
    }
});
