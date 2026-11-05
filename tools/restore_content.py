"""Rebuild the preview from captured public content, preserving page sections."""
from pathlib import Path
from html import escape, unescape
import concurrent.futures
import hashlib
import io
import json
import re
import urllib.request
from urllib.parse import urlsplit
from PIL import Image

def restore(env):
    root = env['ROOT']
    entries = json.loads((root/'reference/content.json').read_text(encoding='utf-8'))
    source = {p['file']:p for p in entries}
    cats = env['CATS']
    products = env['PRODUCTS']
    page, crumb, icon = env['page'], env['crumb'], env['icon']
    mappings = {
      'home':'index.html','home-base':'index.html','about-us-3':'about.html',
      'sposoby-oplaty':'payment.html','dostavka':'delivery.html','contact-us':'contacts.html',
      'otzyvy':'reviews.html','privacy-policy':'privacy.html', 'shop':'catalog.html',
      'usloviya-vozvrata-denezhnyh-sredstv':'refund.html','refund_returns':'returns.html',
      'polzovatelskoe-soglashenie':'terms.html','zhakardovye-etiketki':'jacquard.html',
      'krasyashhaya-lenta-ribbon-dlya-termotransfernoj-pechati':'ribbon-info.html',
      'pechat-na-lentah':'category-pechat.html','wishlist':'wishlist.html','compare':'compare.html',
      'my-account':'account.html','checkout':'checkout.html','cart':'cart.html',
      'pomoshh':'help.html','portfolio':'portfolio.html','blog':'news.html',
      'product-category/pechat-na-lentah-2':'category-pechat.html',
      'product-category/zhakkardovye-etiketki':'category-labels.html',
      'product-category/etiketki-na-samoklejke':'category-stickers.html',
      'product-category/golograficheskie-naklejki':'category-hologram.html',
    }
    for c in cats: mappings[urlsplit(c['permalink']).path.strip('/')] = 'category-'+c['slug']+'.html'
    for p in products: mappings[urlsplit(p['permalink']).path.strip('/')] = f'product-{p["id"]}.html'
    selected = ['about-us-3','sposoby-oplaty','contact-us','otzyvy','dostavka','privacy-policy',
      'polzovatelskoe-soglashenie','refund_returns','usloviya-vozvrata-denezhnyh-sredstv',
      'zhakardovye-etiketki','krasyashhaya-lenta-ribbon-dlya-termotransfernoj-pechati',
      'product-category__pechat-na-lentah-2','product-category__zhakkardovye-etiketki',
      'product-category__etiketki-na-samoklejke','product-category__golograficheskie-naklejki']
    slider = json.loads((root/'reference/slider.json').read_text(encoding='utf-8'))
    urls=set()
    for slug in selected+['blog','wishlist','compare','portfolio','pomoshh']:
        content = source[slug+'.html']['html']
        urls.update(re.findall(r'(?:src|href)="(https://lentyribbony.ru/[^"?]+\.(?:png|jpe?g|webp))"',content,re.I))
    urls.update(s['params']['bg']['image'] for s in slider['slides'])
    for p in products:
        urls.update(image['src'] for image in p['images'])
        urls.update(re.findall(r'src="(https://lentyribbony.ru/[^"?]+\.(?:png|jpe?g|webp))"',p.get('description','')+p.get('short_description',''),re.I))
    local={url:'images/original-'+hashlib.sha256(url.encode()).hexdigest()[:14]+'-paper.webp' for url in urls}
    product_images={image['src']:root/f'images/product-{p["id"]}.webp' for p in products if p['images'] for image in p['images'][:1]}
    def on_paper(raw):
        rgba=Image.open(io.BytesIO(raw)).convert('RGBA')
        paper=Image.new('RGBA',rgba.size,(250,248,245,255));paper.alpha_composite(rgba)
        return paper.convert('RGB')
    def download(url):
        out=root/local[url]
        if not out.exists():
            if url in product_images and product_images[url].exists():
                local[url]=product_images[url].relative_to(root).as_posix()
                return
            error=None
            for attempt in range(2):
                try:
                    raw=urllib.request.urlopen(url,timeout=12).read()
                    img=on_paper(raw);img.thumbnail((1600,1600));img.save(out,'WEBP',quality=90)
                    return
                except Exception as exc:
                    error=exc
            if url in product_images:
                local[url]=product_images[url].relative_to(root).as_posix()
                return
            print('Optional source image unavailable:',url,error)
            local.pop(url,None)
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool: list(pool.map(download,sorted(urls)))
    marker=root/'reference/product-transparency-fixed.json'
    if not marker.exists():
        fixes=[]
        for p in products:
            if p['images'] and '.png' in p['images'][0]['src'].lower():
                raw=urllib.request.urlopen(p['images'][0]['src'],timeout=50).read()
                img=on_paper(raw);img.thumbnail((1000,1000));img.save(root/f'images/product-{p["id"]}.webp','WEBP',quality=90)
                # Use the intact source photograph instead of the earlier derived thumbnail.
                fixes.append(p['id'])
        marker.write_text(json.dumps(fixes),encoding='utf-8')
    # Neutralize the pale blue backgrounds of the original banners, preserving their artwork.
    for slide in slider['slides']:
        url=slide['params']['bg']['image']; original=root/local[url]
        warm=original.with_name(original.stem+'-warm.webp')
        if not warm.exists():
            im=Image.open(original).convert('RGB'); pixels=[]
            for r,g,b in im.getdata():
                factor=max(0,min(1,(b-r-3)/16))*max(0,min(1,(min(r,g,b)-130)/55))
                pixels.append((round(r+(b-r)*factor),round(g+((r+g+b)/3-g)*factor),round(b-(b-r)*factor*.6)))
            im.putdata(pixels);im.save(warm,'WEBP',quality=93)
        local[url]=warm.relative_to(root).as_posix()
    def clean(content):
        for url,file in local.items(): content=content.replace(url,file)
        def link(m):
            href=unescape(m.group(1)); parsed=urlsplit(href)
            if parsed.netloc in ('lentyribbony.ru','www.lentyribbony.ru'):
                key=parsed.path.strip('/')
                if key in mappings: return 'href="'+mappings[key]+('#'+parsed.fragment if parsed.fragment else '')+'"'
                if not key: return 'href="index.html"'
            return m.group(0)
        content=re.sub(r'href="([^"]*)"',link,content)
        content=re.sub(r'<input[^>]*type="submit"[^>]*>', '<button class="button" type="submit">Подготовить письмо ↗</button>',content)
        content=content.replace('data-source-form=""','data-source-form="" id="request"')
        content=re.sub(r'<form([^>]*)data-source-form=""([^>]*)>',r'<form\1data-source-form=""\2>',content)
        content=re.sub(r'\[[^\]]*\]','',content)
        return '<div class="source-content">'+content+'</div>'
    audit=[]
    for slug in selected:
        entry=source[slug+'.html'];target=mappings[urlsplit(entry['url']).path.strip('/')]
        title=entry['title']
        body=crumb(title)+f'<div class="page-heading"><h1 class="page-heading__title">{escape(title)}</h1></div>'+clean(entry['html'])
        page(target,title,body)
        audit.append({'original':entry['url'],'demo':target,'images':len(entry['images']),'source_text':entry['text']})
    # Product categories retain their original descriptions and package subcategories.
    for c in cats:
        relevant=[p for p in products if any(x['id']==c['id'] for x in p['categories'])]
        description=unescape(c.get('description',''))
        description=''.join('<p>'+line+'</p>' for line in re.split(r'\r?\n\s*\r?\n',description) if line.strip())
        children=[x for x in cats if x['parent']==c['id']]
        body=crumb(c['name'])+f'<div class="page-heading"><h1 class="page-heading__title">{c["name"]}</h1></div><div class="source-content source-content--description">{description}</div>'
        if children:
            body+='<div class="package-types">'+''.join(f'<a href="category-{x["slug"]}.html">{x["name"]} {icon("arrow")}</a>' for x in children)+'</div>'
        body+=env['toolbar'].replace('99 товаров',f'{len(relevant)} позиций')+f'<div class="product-grid" data-product-list data-category="{c["id"]}">'+''.join(env['product_card'](p) for p in relevant)+'</div>'
        page('category-'+c['slug']+'.html',c['name'],body)
    # The original catalog begins with categories; the existing searchable product list stays below.
    catalog=(root/'catalog.html').read_text(encoding='utf-8')
    cards='<div class="category-grid catalog-categories">'+''.join(env['category_card'](c) for c in env['CATEGORIES'][:7])+'</div>'
    catalog=catalog.replace('<div class="filters">',cards+'<div class="filters">',1)
    (root/'catalog.html').write_text(catalog,encoding='utf-8')
    slides=''.join(f'<div class="home-slider__slide" {"hidden" if i else ""} data-slide="{i}"><img src="{local[s["params"]["bg"]["image"]]}" alt="Ленты и риббоны — ассортимент материалов, слайд {i+1}" width="1920" height="920" {"fetchpriority=high" if i==0 else "loading=lazy"}></div>' for i,s in enumerate(slider['slides']))
    home='<h1 class="visually-hidden">Ленты и Риббоны</h1><section class="home-slider" aria-label="Предложения компании">'+slides+'<div class="home-slider__controls"><button data-slide-step="-1" aria-label="Предыдущий слайд">←</button><span data-slide-number>01 / 03</span><button data-slide-step="1" aria-label="Следующий слайд">→</button></div></section>'
    popular=[next(c for c in env['CATEGORIES'] if c['id']==i) for i in [112,116]]
    home+='<section class="section">'+env['section_head']('Сувенирная продукция','Популярные категории')+'<div class="category-grid category-grid--popular">'+''.join(env['category_card'](c) for c in popular)+'</div></section>'
    home+='<section class="section">'+env['section_head']('','Популярные товары')+'<div class="product-grid">'+''.join(env['product_card'](p) for p in products[:12])+'</div></section>'
    page('index.html','Главная',home)
    for p in products:
        file=root/f'product-{p["id"]}.html'
        html=file.read_text(encoding='utf-8')
        photos=[photo for photo in p['images'] if photo['src'] in local]
        if photos:
            gallery='<div class="product-gallery"><div class="product-detail__photo"><img data-gallery-main src="'+local[photos[0]['src']]+'" alt="'+escape(env['plain'](p['name']))+'" width="1000" height="1000" fetchpriority="high"></div>'
            gallery+='<div class="product-gallery__thumbs">'+''.join(f'<button class="product-gallery__thumb" data-gallery-src="{local[photo["src"]]}" aria-label="Фотография {i+1}: {escape(env["plain"](p["name"]))}" aria-pressed="{str(i==0).lower()}"><img src="{local[photo["src"]]}" alt="" loading="lazy" width="100" height="100"></button>' for i,photo in enumerate(photos))+'</div></div>'
            html=re.sub(r'<div class="product-detail__photo">.*?</div>(?=<div class="product-detail__content">)',lambda m:gallery,html,count=1,flags=re.S)
        description=p.get('description','')
        if description:
            html=re.sub(r'<section class="section"><h2 class="section-heading__title">О материале</h2>.*?</section>',lambda m:'<section class="section"><h2 class="section-heading__title">Описание</h2>'+clean(description)+'</section>',html,count=1,flags=re.S)
        if p.get('short_description'):
            html=html.replace('<div class="product-detail__actions">','<div class="product-detail__excerpt">'+clean(p['short_description'])+'</div><div class="product-detail__actions">',1)
        file.write_text(html,encoding='utf-8')
    # Public utility pages remain reachable without collecting account credentials in the preview.
    for slug in ['wishlist','compare','my-account','checkout','pomoshh','portfolio','blog']:
        entry=source[slug+'.html'];target=mappings[slug]
        if slug in ['my-account','checkout']:
            body=f'<div class="empty-state"><h2>{entry["title"]}</h2><p>Эта функция доступна на действующем сайте.</p><a class="button" href="{entry["url"]}">Перейти на lentyribbony.ru ↗</a></div>'
        else: body=clean(entry['html'])
        page(target,entry['title'],crumb(entry['title'])+f'<div class="page-heading"><h1 class="page-heading__title">{entry["title"]}</h1></div>'+body)
    extra_footer='<a href="delivery.html">Доставка</a><a href="refund.html">Условия возврата денежных средств</a><a href="returns.html">Политика возврата</a><a href="terms.html">Пользовательское соглашение</a>'
    utilities='<nav class="utility-links" aria-label="Личный кабинет и подбор"><a href="account.html">Вход / Регистрация</a><a href="wishlist.html">♡ Избранное <span data-saved-count="wishlist">0</span></a><a href="compare.html">⇄ Сравнить <span data-saved-count="compare">0</span></a></nav>'
    for file in root.glob('*.html'):
        html=file.read_text(encoding='utf-8')
        html=html.replace('<a href="payment.html">Оплата и доставка</a>','<a href="payment.html">Способы оплаты</a>'+extra_footer)
        html=html.replace('<span>Материалы для маркировки и упаковки</span>',utilities)
        html=html.replace('<script src="js/site.js" defer></script>','<script src="js/site.js" defer></script><script src="js/refresh.js" defer></script>')
        file.write_text(html,encoding='utf-8')
    (root/'reference/content-audit.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2),encoding='utf-8')
    (root/'reference/url-map.json').write_text(json.dumps(mappings,ensure_ascii=False,indent=2),encoding='utf-8')
    print('Restored original sections:',len(audit),'pages;',len(local),'local source images')
