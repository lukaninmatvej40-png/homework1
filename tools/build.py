"""Build the static client presentation. Product facts come from the public store snapshot."""
from pathlib import Path
from html import escape, unescape
import concurrent.futures
import io
import json
import re
import urllib.request
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
REF = ROOT / 'reference'
ASSETS = ROOT / 'images'
ASSETS.mkdir(exist_ok=True)
PRODUCTS = json.loads((REF / 'products.json').read_text(encoding='utf-8'))
CATS = json.loads((REF / 'categories.json').read_text(encoding='utf-8'))

def plain(text):
    return unescape(re.sub('<[^>]+>', ' ', text)).strip()

def fetch_image(item):
    name, url = item
    out = ASSETS / f'{name}.webp'
    if out.exists():
        return
    raw = urllib.request.urlopen(url, timeout=45).read()
    img = Image.open(io.BytesIO(raw)).convert('RGB')
    img.thumbnail((1000, 1000))
    img.save(out, 'WEBP', quality=86)

images = {f'product-{p["id"]}': p['images'][0]['src'] for p in PRODUCTS if p['images']}
for p in PRODUCTS:
    for i, photo in enumerate(p.get('images', [])[1:], start=2):
        images.setdefault(f'product-{p["id"]}-{i}', photo['src'])
images.update({f'category-{c["id"]}': c['image']['src'] for c in CATS if c.get('image')})
images.update({
    'labels': 'https://lentyribbony.ru/wp-content/uploads/2023/09/img_0066_burned.png-1-150x150.webp',
    'stickers': 'https://lentyribbony.ru/wp-content/uploads/2023/09/etik1.jpg-1-150x150.webp',
    'hologram': 'https://lentyribbony.ru/wp-content/uploads/2023/09/golograficheskie-naklejki-150x150.jpg',
    'ribbons': 'https://lentyribbony.ru/wp-content/uploads/2026/10/1757341_ccbb4ebb_1.jpeg',
})
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
    for name, result in zip(images, pool.map(fetch_image, images.items())):
        pass

ORDER = [172, 174, 173, 171, 170, 112, 116]
CATEGORIES = [next(c for c in CATS if c['id'] == ident) for ident in ORDER]
for c in CATEGORIES:
    c['file'] = 'category-' + c['slug'] + '.html'
    c['photo'] = f'category-{c["id"]}'
CATEGORIES += [
    {'id': 900, 'name': 'Жаккардовые этикетки', 'slug':'zhakkardovye-etiketki', 'file': 'category-labels.html', 'photo': 'labels', 'count': 0,'parent':0},
    {'id': 901, 'name': 'Этикетки на самоклейке', 'slug':'etiketki-na-samoklejke', 'file': 'category-stickers.html', 'photo': 'stickers', 'count': 0,'parent':0},
    {'id': 902, 'name': 'Голографические наклейки', 'slug':'golograficheskie-naklejki', 'file': 'category-hologram.html', 'photo': 'hologram', 'count': 0,'parent':0},
]
DESCRIPTIONS = {
    172: 'Ленты для составников, размерников и брендирования упаковки.',
    174: 'Плотная лента с аккуратным тканым краем для бирок и этикеток.',
    173: 'Мягкая матовая поверхность для деликатной маркировки.',
    171: 'Прочный материал для печати состава и рекомендаций по уходу.',
    170: 'Полупрозрачные ленты для необычных бирок и размерников.',
    112: 'Красящая лента для термотрансферной печати по текстилю.',
    116: 'Прозрачная упаковка для одежды, текстиля и небольших товаров.',
    900: 'Тканые этикетки с вашим логотипом. Параметры и тираж — по запросу.',
    901: 'Этикетки для маркировки товаров и упаковки. Подбор под вашу задачу.',
    902: 'Голографические наклейки для оформления и маркировки продукции.',
}

ICONS = {
    'arrow': '<path d="M4 12h16m-6-6 6 6-6 6"/>',
    'search': '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
    'bag': '<path d="M5 7h14l1 14H4L5 7Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
    'grid': '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    'phone': '<path d="M7 3H4a1 1 0 0 0-1 1c0 9.4 7.6 17 17 17a1 1 0 0 0 1-1v-3l-5-2-2 2a14 14 0 0 1-7-7l2-2-2-5Z"/>',
    'truck': '<path d="M2 5h12v12H2zm12 5h4l4 4v3h-8"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>',
    'check': '<path d="m5 12 4 4L19 6"/>',
    'layers': '<path d="m12 3 10 5-10 5L2 8l10-5Zm-10 9 10 5 10-5M2 16l10 5 10-5"/>',
    'menu': '<path d="M3 6h18M3 12h18M3 18h18"/>',
    'close': '<path d="m6 6 12 12M6 18 18 6"/>',
    'mail': '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m3 6 9 7 9-7"/>',
    'pin': '<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2"/>',
}

def icon(name):
    return f'<svg class="icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{ICONS[name]}</svg>'

def image(name, alt, cls='', eager=False):
    return f'<img class="{cls}" src="images/{name}.webp" alt="{escape(alt)}" width="700" height="700" {"fetchpriority=high" if eager else "loading=lazy"}>'

def logo():
    return '<a class="logo" href="index.html" aria-label="Ленты и Риббоны — главная"><span class="logo__symbol" aria-hidden="true"><i></i><i></i><i></i></span><span class="logo__wordmark">Ленты <span class="logo__and">&</span> Риббоны<span class="logo__caption">МАТЕРИАЛЫ ДЛЯ ВАШИХ ИДЕЙ</span></span></a>'

def button(text, href, secondary=False):
    return f'<a class="button{" button--secondary" if secondary else ""}" href="{href}">{text}{icon("arrow")}</a>'

def header(active):
    nav = [('index.html','Главная'),('about.html','О компании'),('payment.html','Способы оплаты'),('contacts.html','Контакты'),('reviews.html','Отзывы')]
    links = ''.join(f'<a class="menu__link{" menu__link--active" if active == href else ""}" href="{href}" {"aria-current=page" if active == href else ""}>{label}</a>' for href,label in nav)
    return f'''<a class="skip-link" href="#main">Перейти к содержимому</a><header class="header">
      <div class="header__top"><div class="container header__top-inner"><span>{icon('pin')}Москва, Зеленоград, корпус 2253</span><span>Материалы для маркировки и упаковки</span><a href="mailto:info@lentyribbony.ru">info@lentyribbony.ru</a></div></div>
      <div class="container header__main">{logo()}<form class="search" role="search" action="catalog.html"><label class="visually-hidden" for="site-search">Поиск по каталогу</label><input class="search__input" id="site-search" name="q" placeholder="Например, сатиновая лента 20 мм"><button class="search__button" aria-label="Найти">{icon('search')}</button></form><a class="header__phone" href="tel:88002017050">8 800 201 70 50<span>Бесплатно по России</span></a><a class="header__cart" href="cart.html" aria-label="Открыть список заказа">{icon('bag')}<span class="header__cart-count" data-cart-count>0</span></a><button class="header__mobile" data-menu-toggle aria-expanded="false" aria-controls="site-menu" aria-label="Открыть навигацию">{icon('menu')}</button></div>
      <div class="header__navigation"><div class="container header__navigation-inner"><button class="header__catalog" data-catalog-toggle aria-expanded="false" aria-controls="catalog-menu">{icon('grid')}Каталог продукции{icon('arrow')}</button><nav class="menu" id="site-menu" aria-label="Главная навигация">{links}</nav><a class="header__help" href="contacts.html#request">Помочь с выбором? ↗</a></div></div></header>'''

def sidebar(active):
    links = f'<a class="catalog-menu__link{" catalog-menu__link--active" if active == "category-pechat.html" else ""}" href="category-pechat.html"><span>Печать на лентах</span><span>↗</span></a>'
    for c in sorted(CATEGORIES, key=lambda c: c['id']==116):
        name=c['name'].replace('Красящая лента (Риббоны)','Термотрансферная лента Textile Resin (Риббоны)')
        links += f'<a class="catalog-menu__link{" catalog-menu__link--active" if active == c["file"] else ""}" href="{c["file"]}"><span>{name}</span><span>›</span></a>'
        if c['id']==116:
            for child in [x for x in CATS if x['parent']==116]:
                links+=f'<a class="catalog-menu__link catalog-menu__link--child" href="category-{child["slug"]}.html"><span>{child["name"]}</span><span>›</span></a>'
    return f'''<aside class="sidebar"><nav class="catalog-menu" id="catalog-menu" aria-label="Разделы каталога">{links}<a class="catalog-menu__all" href="catalog.html">Весь каталог {icon('arrow')}</a></nav><div class="sidebar__help"><span class="eyebrow">НУЖЕН СОВЕТ?</span><h2 class="sidebar__title">Подберём материал<br>для вашей задачи</h2><p class="sidebar__text">Расскажите, на чём и что вы планируете печатать.</p><a class="sidebar__link" href="contacts.html#request">Задать вопрос {icon('arrow')}</a></div></aside>'''

def footer():
    return f'''<footer class="footer"><div class="container footer__grid"><div>{logo()}<p class="footer__description">Ленты, риббоны и этикетки.<br>Всё, что нужно для маркировки<br>и аккуратной упаковки.</p></div><div class="footer__column"><h2 class="footer__title">Покупателям</h2><a href="catalog.html">Каталог продукции</a><a href="payment.html">Оплата и доставка</a><a href="category-pechat.html">Печать на лентах</a><a href="reviews.html">Отзывы</a></div><div class="footer__column"><h2 class="footer__title">О компании</h2><a href="about.html">О нас</a><a href="contacts.html">Контакты и реквизиты</a><a href="privacy.html">Политика конфиденциальности</a></div><div class="footer__column"><h2 class="footer__title">Всегда на связи</h2><a class="footer__phone" href="tel:88002017050">8 800 201 70 50</a><a href="mailto:info@lentyribbony.ru">info@lentyribbony.ru</a><span>Москва, Зеленоград, корпус 2253</span></div></div><div class="container footer__bottom"><span>© 2026 Ленты и Риббоны</span><span>Демонстрация нового оформления · цены из каталога на 05.11.2026</span><div class="palette" aria-label="Цвет оформления"><button class="palette__button palette__button--olive" data-theme="olive" aria-label="Оливковая палитра" aria-pressed="true"></button><button class="palette__button palette__button--graphite" data-theme="graphite" aria-label="Графитовая палитра" aria-pressed="false"></button></div></div></footer><div class="toast" role="status" aria-live="polite" data-toast></div>'''

def crumb(title):
    return f'<nav class="breadcrumbs" aria-label="Хлебные крошки"><a href="index.html">Главная</a><span aria-hidden="true">/</span><span aria-current="page">{escape(title)}</span></nav>'

def page(file, title, body, description='', side=True):
    content=f'<div class="container layout">{sidebar(file)}<main class="layout__main" id="main">{body}</main></div>' if side else f'<main class="container" id="main">{body}</main>'
    html=f'''<!doctype html>
<html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex, nofollow"><title>{escape(title)} — Ленты и Риббоны</title><meta name="description" content="{escape(description or title)}"><meta name="theme-color" content="#485547"><link rel="icon" href="icons/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="css/index.css"><script src="js/theme.js"></script><script src="js/data.js" defer></script><script src="js/site.js" defer></script></head><body>{header(file)}{content}{footer()}</body></html>'''
    html=html.replace('<body>', f'<body class="page--{file.removesuffix(".html")}">')
    (ROOT/file).write_text(html, encoding='utf-8')

def section_head(kicker,title,href='catalog.html',link='Весь каталог'):
    return f'<div class="section-heading"><div><p class="eyebrow">{kicker}</p><h2 class="section-heading__title">{title}</h2></div><a class="text-link" href="{href}">{link} {icon("arrow")}</a></div>'

def category_card(c):
    return f'<a class="category-card" href="{c["file"]}"><div class="category-card__image">{image(c["photo"],c["name"])}</div><h3 class="category-card__title">{c["name"].replace("Красящая лента (Риббоны)","Термотрансферная лента Textile Resin (Риббоны)")}</h3><span class="category-card__meta">{str(c["count"])+" позиций" if c["count"] else "Под заказ"}</span><span class="category-card__arrow">{icon("arrow")}</span></a>'

def product_data(p):
    attrs={a['name']: ', '.join(t['name'] for t in a['terms']) for a in p.get('attributes',[])}
    return {'id':p['id'],'name':plain(p['name']),'price':int(p['prices']['price'])/(10**p['prices']['currency_minor_unit']),'image':f'images/product-{p["id"]}.webp','cats':[c['id'] for c in p['categories']],'category':p['categories'][0]['name'] if p['categories'] else 'Материалы','attrs':attrs,'stock':p['is_in_stock'],'url':p['permalink']}

DATA=[product_data(p) for p in PRODUCTS]
(ROOT/'js/data.js').write_text('window.STORE_PRODUCTS = '+json.dumps(DATA,ensure_ascii=False)+';',encoding='utf-8')

def product_card(p):
    raw=p
    p=product_data(p) if 'prices' in p else p
    p['image']='images/product-'+str(p['id'])+'.webp'
    price=f'{p["price"]:,.0f}'.replace(',',' ')
    hover=''
    if 'images' in raw and len(raw.get('images',[])) > 1:
        src=raw['images'][1]['src']
        name=next((k for k,v in images.items() if v==src),'')
        if name: hover=f'<img class="product-card__hover-image" src="images/{name}.webp" alt="" loading="lazy" width="700" height="700">'
    return f'''<article class="product-card" data-product="{p['id']}"><a class="product-card__image" href="product-{p['id']}.html">{image('product-'+str(p['id']),p['name'])}{hover}</a><div class="product-card__body"><span class="product-card__category">{p['category']}</span><h3 class="product-card__title"><a href="product-{p['id']}.html">{p['name']}</a></h3><span class="product-card__stock">{'В наличии' if p['stock'] else 'Уточните наличие'}</span><div class="product-card__bottom"><span class="product-card__price">{price} <small>₽</small></span><button class="product-card__add" data-add="{p['id']}" aria-label="Добавить {escape(p['name'])} в заказ">{icon('bag')}</button></div></div></article>'''

def consultation():
    return f'<section class="consultation"><div><span class="eyebrow">ПОДБЕРЁМ ВМЕСТЕ</span><h2 class="consultation__title">Не знаете, какая лента подойдёт?</h2><p class="consultation__text">Поможем разобраться в материалах, размерах и совместимости с печатью.</p></div>{button("Спросить специалиста","contacts.html#request")}</section>'

hero=f'''<section class="hero"><div class="hero__content"><p class="eyebrow">ДЛЯ ТЕКСТИЛЯ, БРЕНДОВ И УПАКОВКИ</p><h1 class="hero__title">Маленькие детали.<br><em>Большое впечатление.</em></h1><p class="hero__text">Ленты, риббоны и этикетки, с которых начинается аккуратная маркировка. Выбирайте материалы — остальное подскажем.</p>{button('Перейти в каталог','catalog.html')}<span class="hero__footnote">От материала до печати — в одном месте</span></div><div class="hero__visual">{image('hero-materials','Бордовая и светло-зелёная сатиновые ленты из ассортимента','hero__image',True)}<div class="hero__caption"><span>ФАКТУРА. ЦВЕТ. ВАШ БРЕНД.</span><span>САТИН · НЕЙЛОН · РИББОНЫ</span></div></div></section>'''
benefits='<div class="benefits">'+''.join(f'<div class="benefits__item">{icon(i)}<div><strong>{t}</strong><span>{d}</span></div></div>' for i,t,d in [('layers','Материалы и печать','Всё для вашей маркировки'),('truck','Доставка по России','До транспортной компании — бесплатно'),('phone','Помощь с подбором','На связи по телефону и почте')])+'</div>'
featured_ids=[10324,10251,10226, next(p['id'] for p in PRODUCTS if any(c['id']==171 for c in p['categories']))]
featured=[next(p for p in PRODUCTS if p['id']==i) for i in featured_ids]
home=hero+benefits+'<section class="section">'+section_head('ПРОСТОЙ ВЫБОР','Что вы ищете?')+'<div class="category-grid">'+''.join(category_card(c) for c in [CATEGORIES[i] for i in [0,3,5,6]])+'</div></section>'
home+='<section class="section">'+section_head('ИЗ НАШЕГО АССОРТИМЕНТА','Материалы для ваших задач')+'<div class="product-grid">'+''.join(product_card(p) for p in featured)+'</div></section>'
home+=f'<section class="print-banner"><div><p class="eyebrow">ВАША ИДЕЯ — НА ЛЕНТЕ</p><h2 class="print-banner__title">Составник, размерник<br>или ваш логотип?</h2><p class="print-banner__text">Печатаем на сатине, нейлоне и силиконе. Подберём основу под изделие и требования к уходу.</p><a class="text-link" href="category-pechat.html">Подробнее о печати {icon("arrow")}</a></div>{image("category-171","Лента для печати составников","print-banner__image")}</section>'
home+='<section class="section">'+section_head('ПОДСКАЖЕМ, С ЧЕГО НАЧАТЬ','Материал под вашу задачу','category-pechat.html','О печати на лентах')+'<div class="guide-grid">'+''.join(f'<a class="guide-card" href="{url}"><span class="guide-card__number">0{n}</span><h3 class="guide-card__title">{t}</h3><p class="guide-card__text">{d}</p><span class="guide-card__link">Подобрать материал ↗</span></a>' for n,t,d,url in [(1,'Для бирок на одежду','Нейлон и сатин для состава, размеров и рекомендаций по уходу.',CATEGORIES[3]['file']),(2,'Для вашего бренда','Сатин с тканым краем и жаккардовые этикетки с логотипом.',CATEGORIES[7]['file']),(3,'Для упаковки товаров','Прозрачные пакеты с клеевым клапаном для аккуратной подачи.',CATEGORIES[6]['file'])])+'</div></section>'+consultation()
page('index.html','Ленты, риббоны, этикетки и упаковка',home)

all_cards=''.join(product_card(p) for p in PRODUCTS)
catalog_intro=crumb('Каталог продукции')+'<div class="page-heading"><p class="eyebrow">МАТЕРИАЛЫ ДЛЯ ВАШИХ ИДЕЙ</p><h1 class="page-heading__title">Каталог продукции</h1><p class="page-heading__text">Выберите материал или найдите нужный размер через поиск.</p></div>'
toolbar='''<div class="catalog-toolbar"><p class="catalog-toolbar__count" data-result-count>99 товаров</p><label class="catalog-toolbar__sort">Сортировать<select data-sort><option value="default">По умолчанию</option><option value="price-up">Сначала дешевле</option><option value="price-down">Сначала дороже</option><option value="name">По названию</option></select></label></div>'''
filters='<div class="filters"><label class="filters__field">Материал<select data-filter-category><option value="">Все материалы</option>'+''.join(f'<option value="{c["id"]}">{c["name"]}</option>' for c in CATEGORIES[:7])+'</select></label><label class="filters__field">Ширина<select data-filter-width><option value="">Любая</option><option>15</option><option>20</option><option>30</option><option>40</option></select></label><button class="filters__reset" data-filter-reset>Сбросить фильтры</button></div>'
page('catalog.html','Каталог продукции',catalog_intro+filters+toolbar+f'<div class="product-grid" data-product-list>{all_cards}</div><div class="empty-state" data-empty hidden><h2>Ничего не нашлось</h2><p>Попробуйте другое название или сбросьте фильтры.</p></div>'+consultation())

for c in CATEGORIES:
    relevant=[p for p in PRODUCTS if any(x['id']==c['id'] for x in p['categories'])]
    intro=crumb(c['name'])+f'<div class="page-heading"><p class="eyebrow">КАТАЛОГ ПРОДУКЦИИ</p><h1 class="page-heading__title">{c["name"]}</h1><p class="page-heading__text">{DESCRIPTIONS[c["id"]]}</p></div>'
    if relevant:
        body=intro+toolbar.replace('99 товаров',f'{len(relevant)} позиций')+f'<div class="product-grid" data-product-list data-category="{c["id"]}">'+''.join(product_card(p) for p in relevant)+'</div>'
    else:
        body=intro+f'<div class="service-card"><div>{image(c["photo"],c["name"],"service-card__image")}</div><div><h2 class="service-card__title">Изготовим под вашу задачу</h2><p>Расскажите о размере, цветах, назначении и нужном количестве. Эти параметры помогут согласовать материал и рассчитать стоимость.</p>{button("Обсудить заказ","contacts.html#request")}</div></div>'
    page(c['file'],c['name'],body+consultation())

print_body=crumb('Печать на лентах')+'<div class="page-heading"><p class="eyebrow">МАРКИРОВКА С ВАШИМ ХАРАКТЕРОМ</p><h1 class="page-heading__title">Печать на лентах</h1><p class="page-heading__text">Для составников, размерников, бирок и брендированной упаковки.</p></div>'
print_body+=f'<section class="service-card"><div>{image("category-171","Печать на текстильной ленте","service-card__image")}</div><div><h2 class="service-card__title">Ваш логотип.<br>На подходящей основе.</h2><p>Печатаем на сатине, нейлоне и силиконе специальной красящей лентой для текстиля. Цвет основы и требования к стойкости обсудим перед заказом.</p>{button("Рассчитать печать","contacts.html#request")}</div></section>'
print_body+='<section class="section">'+section_head('ВЫБЕРИТЕ ОСНОВУ','Три материала. Разные задачи.')+'<div class="guide-grid">'+''.join(f'<article class="guide-card"><span class="eyebrow">0{n}</span><h3 class="guide-card__title">{t}</h3><p class="guide-card__text">{d}</p></article>' for n,t,d in [(1,'Сатин','Мягкий материал для брендовых бирок, размерников и подарочной упаковки.'),(2,'Нейлон','Прочная основа для составников и рекомендаций по уходу.'),(3,'Силикон','Полупрозрачный материал для размерников и необычных бирок.')])+'</div></section>'
print_body+='<section class="section"><h2 class="section-heading__title">Что нужно для расчёта?</h2><ol class="steps"><li class="steps__item"><strong>Макет или текст</strong><span>Логотип, состав, символы ухода или пример нужной надписи.</span></li><li class="steps__item"><strong>Размер и материал</strong><span>Ширина ленты, длина этикетки и желаемая основа.</span></li><li class="steps__item"><strong>Количество и задача</strong><span>Нужный тираж и условия использования готовой бирки.</span></li></ol></section>'+consultation()
page('category-pechat.html','Печать на сатине, нейлоне и силиконе',print_body)

for p in PRODUCTS:
    d=product_data(p)
    facts=''.join(f'<div class="product-detail__fact"><dt>{escape(k)}</dt><dd>{escape(v)}</dd></div>' for k,v in d['attrs'].items())
    if p.get('sku'): facts=f'<div class="product-detail__fact"><dt>Артикул</dt><dd>{escape(p["sku"])}</dd></div>'+facts
    desc=plain(p['description'])
    body=crumb(d['category'])+f'''<article class="product-detail"><div class="product-detail__photo">{image('product-'+str(p['id']),d['name'],eager=True)}</div><div class="product-detail__content"><p class="eyebrow">{d['category']}</p><h1 class="product-detail__title">{d['name']}</h1><span class="product-detail__stock">{'В наличии' if d['stock'] else 'Уточните наличие'}</span><dl class="product-detail__facts">{facts}</dl><div class="product-detail__price">{d['price']:,.0f} ₽</div><div class="product-detail__actions"><label class="quantity">Количество<input type="number" value="1" min="1" max="999" data-detail-quantity></label><button class="button" data-add="{p['id']}" data-detail-add>{icon('bag')}В заказ</button></div><p class="product-detail__hint">Добавьте материалы в список заказа, чтобы отправить запрос на почту.</p><a class="text-link" href="payment.html">Оплата и доставка {icon('arrow')}</a></div></article><section class="section"><h2 class="section-heading__title">О материале</h2><p class="prose__text">{escape(desc) if desc else 'Параметры материала и совместимость с вашим оборудованием можно уточнить у специалиста.'}</p></section>'''
    page(f'product-{p["id"]}.html',d['name'],body+consultation(),d['name'])

about=crumb('О компании')+'''<div class="page-heading"><p class="eyebrow">ЛЕНТЫ И РИББОНЫ</p><h1 class="page-heading__title">Хорошие вещи начинаются<br>с внимания к деталям.</h1><p class="page-heading__text">Помогаем подобрать материалы для маркировки одежды, брендирования и упаковки товаров.</p></div>'''
about+=f'<section class="service-card"><div>{image("hero-materials","Цветные ленты из ассортимента","service-card__image")}</div><div><p class="eyebrow">НАША МИССИЯ</p><h2 class="service-card__title">Делать качественно,<br>своевременно, стильно.</h2><p>В каталоге — сатиновые, нейлоновые и силиконовые ленты, риббоны, этикетки и полипропиленовые пакеты. Здесь можно подобрать основу и обсудить печать в одном месте.</p><p>Не уверены в материале или ширине? Расскажите о задаче: поможем сориентироваться в ассортименте.</p>{button("Посмотреть материалы","catalog.html")}</div></section>'+benefits+consultation()
page('about.html','О компании',about)

payment=crumb('Оплата и доставка')+'<div class="page-heading"><p class="eyebrow">ПОКУПАТЕЛЯМ</p><h1 class="page-heading__title">Всё понятно.<br>От заказа до получения.</h1><p class="page-heading__text">Способы оплаты и доставки, указанные на сайте компании.</p></div>'
payment+='<div class="info-grid">'+''.join(f'<section class="info-card">{icon(i)}<h2 class="info-card__title">{t}</h2><p>{d}</p></section>' for i,t,d in [('bag','Банковская карта','На действующем сайте оплата банковской картой проходит через платёжный шлюз Сбербанка.'),('pin','Наличные при самовывозе','Оплатить заказ наличными можно при самовывозе. Перед приездом согласуйте готовность заказа.'),('truck','Доставка по России','Доставка до транспортной компании — бесплатно. По информации компании, при заказе от 50 000 ₽ доставка по России бесплатная.'),('phone','Уточнение заказа','Сроки подготовки и стоимость доставки для вашего города уточняйте по телефону 8 800 201 70 50.')])+'</div><section class="section"><h2 class="section-heading__title">Частые вопросы</h2><div class="faq">'+''.join(f'<details class="faq__item"><summary>{q}</summary><p>{a}</p></details>' for q,a in [('Можно забрать заказ самостоятельно?','Да. Адрес: Москва, Зеленоград, корпус 2253. Время визита и готовность заказа согласуйте с компанией.'),('Как выбрать риббон для моей ленты?','Сообщите модель принтера, материал и ширину ленты. Специалист подскажет, какие параметры проверить перед заказом.'),('Как узнать итоговую стоимость?','Добавьте материалы в список заказа и подготовьте письмо с количеством и городом доставки. Компания уточнит итоговую стоимость и наличие.')])+'</div></section>'+consultation()
page('payment.html','Оплата и доставка',payment)

form='''<form class="inquiry" id="request" data-inquiry><p class="eyebrow">РАССКАЖИТЕ О ЗАДАЧЕ</p><h2 class="inquiry__title">Подберём решение вместе</h2><div class="inquiry__fields"><label class="inquiry__label">Ваше имя<input class="inquiry__input" name="name" autocomplete="name" required placeholder="Как к вам обращаться"></label><label class="inquiry__label">Электронная почта<input class="inquiry__input" name="email" type="email" autocomplete="email" required placeholder="you@company.ru"></label><label class="inquiry__label">Телефон, если удобнее созвониться<input class="inquiry__input" name="phone" type="tel" autocomplete="tel" placeholder="+7"></label><label class="inquiry__label">Что вам нужно?<textarea class="inquiry__input inquiry__input--textarea" name="message" required placeholder="Материал, размеры, количество. Можно просто описать задачу."></textarea></label></div><label class="inquiry__consent"><input type="checkbox" required>Соглашаюсь с <a href="privacy.html">политикой конфиденциальности</a></label><button class="button" type="submit">Подготовить письмо ↗</button><p class="inquiry__note">Откроется ваша почтовая программа с заполненным письмом. Вы сможете проверить и отправить его самостоятельно.</p></form>'''
contacts=crumb('Контакты')+'<div class="page-heading"><p class="eyebrow">ДАВАЙТЕ ОБСУДИМ ВАШУ ЗАДАЧУ</p><h1 class="page-heading__title">На связи.</h1><p class="page-heading__text">Поможем выбрать материал и ответим на вопросы о заказе.</p></div>'
contacts+='<div class="contact-grid"><div><div class="contact-list">'+''.join(f'<div class="contact-list__item">{icon(i)}<div><span class="contact-list__label">{t}</span>{v}</div></div>' for i,t,v in [('phone','Бесплатно по России','<a class="contact-list__value" href="tel:88002017050">8 800 201 70 50</a>'),('mail','Для вопросов и макетов','<a class="contact-list__value" href="mailto:info@lentyribbony.ru">info@lentyribbony.ru</a>'),('pin','Адрес','<span class="contact-list__value">Москва, Зеленоград,<br>корпус 2253</span><a class="text-link" href="https://yandex.ru/maps/?text=Москва%20Зеленоград%20корпус%202253" target="_blank" rel="noopener">Открыть на карте ↗</a>')])+'</div><section class="requisites"><h2 class="requisites__title">Реквизиты</h2><p>ИП Попов М. Р.<br>ИНН 774399997954</p><p class="requisites__note">Актуальные реквизиты для оплаты запрашивайте у компании.</p></section></div>'+form+'</div>'
page('contacts.html','Контакты',contacts)

reviews=crumb('Отзывы')+'<div class="page-heading"><p class="eyebrow">ВАШ ОПЫТ ВАЖЕН</p><h1 class="page-heading__title">Обратная связь</h1><p class="page-heading__text">Расскажите, какие материалы вы заказывали и как они показали себя в работе.</p></div><section class="empty-state"><h2>Здесь будут отзывы покупателей</h2><p>Публикуем отзывы после проверки заказа. Если вы уже работали с нами, поделитесь впечатлениями и укажите номер заказа.</p>'+button('Написать отзыв','contacts.html#request')+'</section>'+consultation()
page('reviews.html','Отзывы покупателей',reviews)
cart=crumb('Ваш заказ')+'<div class="page-heading"><p class="eyebrow">ВСЁ НУЖНОЕ — В ОДНОМ СПИСКЕ</p><h1 class="page-heading__title">Ваш заказ</h1><p class="page-heading__text">Проверьте количество и подготовьте запрос. Наличие и доставку подтвердит компания.</p></div><div class="cart" data-cart></div>'
page('cart.html','Ваш заказ',cart)
privacy=crumb('Конфиденциальность')+'<div class="page-heading"><h1 class="page-heading__title">Конфиденциальность</h1></div><div class="prose"><p>Это демонстрационная версия оформления. Формы подготавливают письмо в вашей почтовой программе и не отправляют данные на сервер.</p><p>Список выбранных товаров и выбранная палитра сохраняются в локальном хранилище вашего браузера. Платёжные данные в этой версии не запрашиваются.</p><p>Перед отправкой запроса ознакомьтесь с <a href="https://lentyribbony.ru/privacy-policy/">политикой конфиденциальности компании на действующем сайте</a>.</p></div>'
page('privacy.html','Конфиденциальность',privacy)
from restore_content import restore
restore(globals())
from polish import polish
polish(ROOT)
print(f'Built {len(list(ROOT.glob("*.html")))} pages, {len(PRODUCTS)} products, {len(images)} product images.')
