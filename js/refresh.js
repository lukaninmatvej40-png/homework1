(() => {
  'use strict';
  const slides = [...document.querySelectorAll('[data-slide]')];
  let current = 0;
  const slider=document.querySelector('.home-slider');
  const showSlide=(step)=>{ if(!slides.length)return; current=(current+step+slides.length)%slides.length; slides.forEach((slide,i)=>{slide.hidden=i!==current; slide.classList.toggle('is-active',i===current)}); const n=document.querySelector('[data-slide-number]'); if(n)n.textContent=`0${current+1} / 0${slides.length}`; };
  window.__lrSlideStep=showSlide;
  if(slider&&slides.length>1){ let timer=setInterval(()=>showSlide(1),5500); let startX=0; slider.addEventListener('mouseenter',()=>clearInterval(timer)); slider.addEventListener('mouseleave',()=>timer=setInterval(()=>showSlide(1),5500)); slider.addEventListener('pointerdown',e=>{startX=e.clientX; slider.setPointerCapture?.(e.pointerId)}); slider.addEventListener('pointerup',e=>{const dx=e.clientX-startX;if(Math.abs(dx)>45)showSlide(dx<0?1:-1)}); }
  document.querySelectorAll('[data-counter-final]').forEach(el=>{const target=Number(el.dataset.counterFinal); let started=false; const run=()=>{if(started)return;started=true;const t0=performance.now();const tick=t=>{const p=Math.min(1,(t-t0)/1600);el.textContent=Math.round(target*(1-Math.pow(1-p,3)));if(p<1)requestAnimationFrame(tick)};requestAnimationFrame(tick)}; if('IntersectionObserver' in window)new IntersectionObserver(es=>es.forEach(x=>x.isIntersecting&&run()),{threshold:.35}).observe(el);else run();});
  document.querySelectorAll('[data-gallery-src]').forEach(button=>button.addEventListener('click',()=>{
    document.querySelector('[data-gallery-main]').src=button.dataset.gallerySrc;
    document.querySelectorAll('[data-gallery-src]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  }));
  document.querySelectorAll('[data-source-form]').forEach(form => {
    const note = document.createElement('p');
    note.className = 'source-form-note';
    note.textContent = 'В демо форма подготавливает письмо в вашей почтовой программе. Проверьте текст и отправьте его самостоятельно.';
    form.append(note);
    form.querySelectorAll('input[type=email], input[name="your-name"],textarea').forEach(input => { input.required = true; });
    form.addEventListener('submit', event => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const fields = [...form.querySelectorAll('input, textarea')].filter(n => !['submit','checkbox','radio','hidden'].includes(n.type));
      const rating = form.querySelector('[name="rating"]:checked');
      const text = fields.map(n => `${n.closest('label')?.textContent.trim() || n.placeholder || n.name}: ${n.value}`).join('\n\n')+(rating?`\n\nОценка: ${rating.value} из 5`:'');
      location.href = `mailto:info@lentyribbony.ru?subject=${encodeURIComponent(document.querySelector('h1').textContent)}&body=${encodeURIComponent(text)}`;
    });
  });
  const products = window.STORE_PRODUCTS || [];
  const lists = {wishlist:[],compare:[]};
  for(const key of Object.keys(lists)) {
    try {const saved=JSON.parse(localStorage.getItem(`lr-${key}`)||'[]');if(Array.isArray(saved)) lists[key]=saved.filter(id=>products.some(p=>p.id===id));}catch{}
  }
  function updateCounts() {
    document.querySelectorAll('[data-saved-count]').forEach(n=>{n.textContent=lists[n.dataset.savedCount].length;});
    document.querySelectorAll('[data-save-product]').forEach(b=>{b.setAttribute('aria-pressed',String(lists[b.dataset.saveList].includes(Number(b.dataset.saveProduct))));});
  }
  function decorate() {
    document.querySelectorAll('.product-card[data-product]').forEach(card=>{
      if(card.querySelector('.product-tools')) return;
      const tools=document.createElement('div');tools.className='product-tools';
      for(const [key,label] of [['wishlist','♡ В избранное'],['compare','⇄ Сравнить']]) {
        const b=document.createElement('button');b.className='product-tools__button';b.textContent=label;b.dataset.saveProduct=card.dataset.product;b.dataset.saveList=key;b.setAttribute('aria-label',`${label}: ${products.find(p=>p.id===Number(card.dataset.product))?.name}`);tools.append(b);
      }
      card.querySelector('.product-card__body').append(tools);
    });
    updateCounts();
  }
  const escape = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const savedKey = location.pathname.endsWith('/wishlist.html') ? 'wishlist' : location.pathname.endsWith('/compare.html') ? 'compare' : null;
  function renderSaved() {
    if(!savedKey) return;
    const host=document.querySelector('.source-content');if(!host)return;
    const chosen=products.filter(p=>lists[savedKey].includes(p.id));
    if(!chosen.length) {host.innerHTML='<div class="empty-state"><h2>Список пока пуст</h2><p>Добавьте товары из каталога.</p><a class="button" href="catalog.html">Перейти в каталог →</a></div>';return;}
    host.innerHTML='<div class="product-grid saved-products">'+chosen.map(p=>`<article class="product-card" data-product="${p.id}"><a class="product-card__image" href="product-${p.id}.html"><img src="${p.image}" alt="${escape(p.name)}"></a><div class="product-card__body"><h2 class="product-card__title"><a href="product-${p.id}.html">${escape(p.name)}</a></h2>${savedKey==='compare'?Object.entries(p.attrs).map(([k,v])=>`<p>${escape(k)}: ${escape(v)}</p>`).join(''):''}<div class="product-card__bottom"><span class="product-card__price">${p.price.toLocaleString('ru-RU')} ₽</span><button class="product-card__add" data-add="${p.id}" aria-label="Добавить в заказ">+</button></div></div></article>`).join('')+'</div>';
  }
  document.addEventListener('click',event=>{
    const b=event.target.closest('[data-save-product]');if(!b)return;
    const key=b.dataset.saveList,id=Number(b.dataset.saveProduct);
    lists[key]=lists[key].includes(id)?lists[key].filter(x=>x!==id):[...lists[key],id];
    try{localStorage.setItem(`lr-${key}`,JSON.stringify(lists[key]));}catch{}
    renderSaved();decorate();
  });
  renderSaved();decorate();
  const list=document.querySelector('[data-product-list]');
  if(list)new MutationObserver(decorate).observe(list,{childList:true});
})();
