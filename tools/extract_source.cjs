const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require('playwright');
const root = path.resolve(__dirname, '..');
(async () => {
  const browser = await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
  const page = await browser.newPage({javaScriptEnabled:false});
  await page.route('**/*', route => route.abort());
  const manifest = JSON.parse(fs.readFileSync(path.join(root,'reference/original/manifest.json'),'utf8'));
  const result = [];
  for (const item of manifest) {
    await page.setContent(fs.readFileSync(path.join(root,'reference/original',item.file),'utf8'));
    result.push({...item,...await page.evaluate(() => {
      const main = document.querySelector('.site-content') || document.querySelector('.entry-content');
      if (!main) return {html:'',text:'',images:[]};
      const text = main.innerText;
      const images = [...main.querySelectorAll('img')].map(i=>i.getAttribute('src')).filter(Boolean);
      const title = document.querySelector('h1')?.textContent.trim() || document.title.split(' - ')[0];
      const homeProducts = [...main.querySelectorAll('.product-grid-item')].map(n=>n.getAttribute('data-id'));
      main.querySelectorAll('script,style,link,noscript,.page-title,.sidebar-container,.wpcf7-response-output,.wpcf7-spinner,.screen-reader-response,.swiper-button-prev,.swiper-button-next,.wd-carousel-container > .wd-nav-arrows,.wd-nav-pagin,.star-rating,.shop-loop-head,.woocommerce-result-count,.woocommerce-ordering,.wd-products-per-page,.wd-products-shop-view,.wd-show-sidebar-btn,.woocommerce-breadcrumb,.wd-entities-title + .wd-product-cats,form.woocommerce-product-search').forEach(n=>n.remove());
      main.querySelectorAll('form:has(input[name="s"]),.hidden-fields-container,.woocommerce-no-products-found,img.avatar').forEach(n=>n.remove());
      for (const el of [...main.querySelectorAll('*')]) {
        const old = el.className || '';
        let cls = '';
        if (typeof old === 'string') {
          if (el.classList.contains('vc_row')) cls='source-row';
          if (el.classList.contains('wpb_column')) cls='source-column';
          if (el.classList.contains('vc_col-sm-6')) cls+=' source-column--half';
          if (el.classList.contains('vc_col-sm-4')) cls+=' source-column--third';
          if (el.classList.contains('vc_col-sm-3')) cls+=' source-column--quarter';
          if (el.classList.contains('wd-gallery-item')) cls='source-gallery__item';
          if (el.classList.contains('gallery-images')) cls='source-gallery';
          if (el.classList.contains('testimonial')) cls='source-review';
          if (el.classList.contains('testimonial-content')) cls='source-review__text';
          if (el.classList.contains('counter-value')) cls='source-stat__value';
          if (el.classList.contains('counter-label')) cls='source-stat__label';
          if (el.classList.contains('wd-text-block')) cls='source-text';
          if (el.classList.contains('wd-image')) cls='source-image';
          if (el.classList.contains('title-wrapper')) cls='source-heading';
          if (el.classList.contains('testimonials')) cls='source-reviews';
        }
        const keep = {};
        for (const a of ['href','src','alt','type','name','placeholder','required','rows','cols','value','colspan','rowspan']) if(el.hasAttribute(a)) keep[a]=el.getAttribute(a);
        for (const a of [...el.attributes]) el.removeAttribute(a.name);
        for(const [k,v] of Object.entries(keep)) el.setAttribute(k,v);
        if(cls.trim()) el.className=cls.trim();
        if(el.tagName==='IMG') el.setAttribute('loading','lazy');
        if(el.tagName==='H1') {const h=document.createElement('h2'); h.innerHTML=el.innerHTML;el.replaceWith(h);}
        if(el.tagName==='INPUT' && el.type==='hidden') el.remove();
        if(el.tagName==='FORM') {el.setAttribute('data-source-form',''); el.removeAttribute('action');}
      }
      const walker=document.createTreeWalker(main,NodeFilter.SHOW_COMMENT);const comments=[];while(walker.nextNode()) comments.push(walker.currentNode);comments.forEach(n=>n.remove());
      return {title,html:main.innerHTML,text,images,homeProducts};
    })});
  }
  fs.writeFileSync(path.join(root,'reference/content.json'),JSON.stringify(result,null,2));
  for(const r of result) console.log(r.file,r.title, r.images.length, r.text.replace(/\s+/g,' ').slice(0,200));
  await browser.close();
})();
