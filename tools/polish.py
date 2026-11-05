"""Presentation changes requested after the content restoration."""
import re

def polish(root):
    def svg(paths):
        return '<svg class="action-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+paths+'</svg>'
    user=svg('<circle cx="12" cy="8" r="4"/><path d="M4 22v-3a8 8 0 0 1 16 0v3"/>')
    heart=svg('<path d="M20 5c-3-3-6-1-8 1-2-2-5-4-8-1-5 5 3 11 8 15 5-4 13-10 8-15Z"/>')
    compare=svg('<path d="M5 20V10m7 10V4m7 16V7M2 22h20"/>')
    bag=svg('<path d="M4 7h16l1 14H3L4 7Z"/><path d="M8 8V5a4 4 0 0 1 8 0v3"/>')
    actions=f'''<nav class="shop-actions" aria-label="Личный кабинет и покупки"><a class="shop-actions__link" href="account.html">{user}<span>Вход /<br>регистрация</span></a><a class="shop-actions__link" href="wishlist.html">{heart}<span>Мой список<br>желаний</span><b class="shop-actions__badge" data-saved-count="wishlist">0</b></a><a class="shop-actions__link" href="compare.html">{compare}<span>Сравнение<br>товаров</span><b class="shop-actions__badge" data-saved-count="compare">0</b></a><a class="shop-actions__link shop-actions__link--cart" href="cart.html">{bag}<span>Корзина<strong data-cart-total>0 ₽</strong></span><b class="shop-actions__badge" data-cart-count>0</b></a></nav>'''
    for file in root.glob('*.html'):
        html=file.read_text(encoding='utf-8')
        html=re.sub(r'<nav class="utility-links".*?</nav>', '', html, flags=re.S)
        html=re.sub(r'<a class="header__cart".*?</a>',lambda m:actions,html,flags=re.S)
        # Make original popup triggers useful in the static version.
        html=re.sub(r'<a\b[^>]*>\s*(Заказать|Оставить заявку)\s*</a>',r'<a class="button order-cta" href="#request">\1 <span aria-hidden="true">→</span></a>',html)
        html=html.replace('</head>','<link rel="stylesheet" href="css/blocks/polish.css"></head>')
        if file.name=='payment.html':
            cash=svg('<rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M5 9h1m12 6h1"/>')
            card=svg('<rect x="2" y="4" width="20" height="16" rx="3"/><path d="M2 10h20M6 16h5"/>')
            visuals=f'''<section class="payment-methods" aria-label="Варианты оплаты"><article class="payment-method"><div class="payment-art payment-art--cash">{cash}<span>₽</span></div><span class="payment-method__number">01 / ПРИ ПОЛУЧЕНИИ</span><h2>Наличный расчёт</h2><p>Оплата наличными при самовывозе.</p><a class="text-link" href="contacts.html">Адрес и карта →</a></article><article class="payment-method"><div class="payment-art payment-art--card">{card}<span>Банковская карта</span></div><span class="payment-method__number">02 / НА САЙТЕ</span><h2>Банковской картой</h2><p>Через платёжный шлюз ПАО СБЕРБАНК.</p><div class="payment-brands" aria-label="Платёжные системы из условий магазина"><span>МИР</span><span>VISA</span><span>Mastercard</span><span>JCB</span></div></article></section><h2 class="payment-details-title">Порядок и условия оплаты</h2>'''
            html=html.replace('<div class="source-content">',visuals+'<div class="source-content">',1)
        if file.name=='contacts.html':
            map_block='''<section class="contact-map"><div class="contact-map__heading"><div><span class="eyebrow">КАК НАС НАЙТИ</span><h2>Москва, Зеленоград, корпус 2253</h2></div><a class="button" href="https://yandex.ru/maps/?text=Москва%20Зеленоград%20корпус%202253" target="_blank" rel="noopener">Открыть маршрут ↗</a></div><iframe title="Карта расположения: Зеленоград, корпус 2253" src="https://yandex.ru/map-widget/v1/?um=constructor%3A5ca0a8e32dd55e6e354c5ad640255c7a875188f4860ff885809572ac25af3461&amp;source=constructor" width="100%" height="440" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe><p>Если карта не загрузилась, воспользуйтесь кнопкой «Открыть маршрут».</p></section>'''
            html=html.replace('<div class="source-content">',map_block+'<div class="source-content">',1)
        if file.name=='reviews.html':
            original=(root/'reference/original/otzyvy.html').read_text(encoding='utf-8')
            ratings=iter(re.findall(r'class="star-rating"[^>]*>\s*<span style="width:(\d+)%"',original))
            def review_rating(match):
                value=round(int(next(ratings,'0'))/20)
                return '<div class="source-review"><div class="review-rating" aria-label="Оценка '+str(value)+' из 5"><span aria-hidden="true">'+'★'*value+'☆'*(5-value)+'</span><small>'+str(value)+'.0 / 5</small></div>'
            html=re.sub(r'<div class="source-review">',review_rating,html)
            # Restore ratings from original markup and accept a rating for new feedback.
            rating='<fieldset class="rating-input"><legend>Ваша оценка</legend><div>'+''.join(f'<label><input type="radio" name="rating" value="{i}" aria-label="{i} из 5"><span aria-hidden="true">★</span><small>{i}</small></label>' for i in range(1,6))+'</div></fieldset>'
            html=html.replace('<form data-source-form="" id="request">','<form data-source-form="" id="request">'+rating)
        if file.name=='about.html':
            if 'about-success__image' not in html:
                html=html.replace('<div class="source-heading">\n\t\t\t\t\t\t\t<div>МЫ ЗНАЕМ, КАК ДОБИТЬСЯ УСПЕХА</div>', '<div class="about-success__image"><img src="images/original-031df8e76a406f-paper.webp" alt="Ленты и материалы компании" loading="lazy"></div><div class="source-heading">\n\t\t\t\t\t\t\t<div>МЫ ЗНАЕМ, КАК ДОБИТЬСЯ УСПЕХА</div>', 1)
            html=re.sub(r'<div class="source-stat__value">(\d+)</div>', lambda m: '<div class="source-stat__value" data-counter-final="'+m.group(1)+'">0</div>', html)
        file.write_text(html,encoding='utf-8')
