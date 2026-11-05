const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const base = 'http://127.0.0.1:4173/';
const files = fs.readdirSync(root).filter(file => file.endsWith('.html') && file !== 'source-site.html');

// Catch missing local resources and accidental links to the discarded designs.
for (const file of files) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  assert.equal((html.match(/<h1(?:\s|>)/g) || []).length, 1, `${file}: one H1`);
  assert(html.includes('lang="ru"'), `${file}: language`);
  assert(html.includes('css/index.css'), `${file}: shared design system`);
  for (const match of html.matchAll(/(?:href|src)="([^"#?]+)(?:[?#][^"]*)?"/g)) {
    const ref = match[1];
    if (!/^(?:https?:|mailto:|tel:|data:)/.test(ref)) assert(fs.existsSync(path.join(root, ref)), `${file}: missing ${ref}`);
  }
  for (const match of html.matchAll(/class="([^"]+)"/g)) {
    for (const token of match[1].split(/\s+/).filter(Boolean)) {
      assert(/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*(?:__[a-z0-9]+(?:-[a-z0-9]+)*)?(?:--[a-z0-9]+(?:-[a-z0-9]+)*)?$/.test(token), `${file}: invalid BEM class ${token}`);
    }
  }
}

(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()}: ${response.url()}`); });
  async function open(file) {
    await page.goto(base + file);
    await page.evaluate(() => document.fonts.ready);
  }
  async function checkLayout(file, width) {
    await page.setViewportSize({ width, height: 900 });
    await open(file);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
    assert(!overflow, `${file} overflows at ${width}px`);
  }
  for (const width of [1440, 1024, 768, 390, 320]) {
    for (const file of ['index.html', 'catalog.html', 'category-pechat.html', 'about.html', 'payment.html', 'contacts.html', 'reviews.html', 'cart.html', 'product-10324.html']) {
      await checkLayout(file, width);
    }
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await open('index.html');
  assert(await page.locator('.catalog-menu').isVisible(), 'Catalog visible on desktop');
  const rect = await page.locator('.catalog-menu').boundingBox();
  assert(rect.y < 250, 'Catalog is above the fold');
  await page.locator('#site-search').fill('нейлон');
  await page.locator('.search__button').click();
  await page.waitForURL('**/catalog.html?q=*');
  assert.equal(await page.locator('.product-card').count(), 5, 'Search finds nylon ribbons and compatible materials');
  await open('catalog.html');
  assert.equal(await page.locator('.product-card').count(), 99);
  await page.selectOption('[data-filter-category]', '173');
  assert.equal(await page.locator('.product-card').count(), 9);
  await page.selectOption('[data-filter-width]', '20');
  assert.equal(await page.locator('.product-card').count(), 3);
  await page.selectOption('[data-sort]', 'price-up');
  const prices = await page.locator('.product-card__price').allTextContents();
  const values = prices.map(price => Number(price.replace(/\D/g, '')));
  assert.deepEqual(values, [...values].sort((a, b) => a - b));
  await page.click('[data-filter-reset]');
  assert.equal(await page.locator('.product-card').count(), 99);
  await open('catalog.html?q=несуществующийтовар');
  assert.equal(await page.locator('.product-card').count(), 0);
  assert(await page.locator('[data-empty]').isVisible());
  await open('product-10324.html');
  await page.fill('[data-detail-quantity]', '3');
  await page.click('[data-detail-add]');
  assert.equal(await page.locator('[data-cart-count]').textContent(), '3');
  assert.equal((await page.locator('[data-cart-total]').textContent()).replace(/\s/g,''),'3000₽');
  await open('cart.html');
  assert.equal(await page.locator('.cart__item').count(), 1);
  assert((await page.locator('.cart__total').textContent()).replace(/\s/g, '').includes('3000'));
  await page.fill('[data-cart-quantity]', '2');
  await page.locator('[data-cart-quantity]').blur();
  assert((await page.locator('.cart__total').textContent()).replace(/\s/g, '').includes('2000'));
  await page.reload();
  assert.equal(await page.locator('[data-cart-count]').textContent(), '2');
  assert.equal((await page.locator('[data-cart-total]').textContent()).replace(/\s/g,''),'2000₽');
  await page.click('[data-remove]');
  assert.equal(await page.locator('.cart__item').count(), 0);
  await page.evaluate(() => localStorage.setItem('lr-cart', '{bad json'));
  await page.reload();
  assert.equal(await page.locator('[data-cart-count]').textContent(), '0');
  await open('index.html');
  await page.click('[data-slide-step="1"]');
  assert.equal(await page.locator('[data-slide="1"]').isVisible(), true);
  await page.click('[data-slide-step="-1"]');
  assert.equal(await page.locator('[data-slide="0"]').isVisible(), true);
  await page.locator('[data-save-list="wishlist"]').first().click();
  await open('wishlist.html');
  assert.equal(await page.locator('.saved-products .product-card').count(), 1);
  await page.locator('[data-save-list="compare"]').first().click();
  await open('compare.html');
  assert.equal(await page.locator('.saved-products .product-card').count(), 1);
  await page.setViewportSize({ width: 390, height: 844 });
  await open('index.html');
  assert(!(await page.locator('.catalog-menu').isVisible()));
  await page.click('[data-catalog-toggle]');
  assert(await page.locator('.catalog-menu').isVisible());
  assert.equal(await page.locator('[data-catalog-toggle]').getAttribute('aria-expanded'), 'true');
  await page.keyboard.press('Escape');
  assert(!(await page.locator('.catalog-menu').isVisible()));
  await page.click('[data-menu-toggle]');
  assert(await page.locator('.menu').isVisible());
  await page.keyboard.press('Escape');
  assert(!(await page.locator('.menu').isVisible()));
  // Capture the design with lazy images loaded, at desktop and phone sizes.
  for (const [name, width, height] of [['desktop', 1440, 1000], ['mobile', 390, 844]]) {
    await page.setViewportSize({ width, height });
    await open('index.html');
    await page.locator('img').evaluateAll(images => images.forEach(image => image.loading = 'eager'));
    await page.evaluate(() => Promise.all([...document.images].map(image => image.decode().catch(() => { throw new Error('Cannot decode '+image.src); }))));
    await page.screenshot({ path: path.join(root, 'reference', `${name}.png`), fullPage: true });
  }
  // Check every generated page for broken images, at a real browser level.
  for (const file of files) {
    await open(file);
    await page.locator('img').evaluateAll(images => images.forEach(image => image.loading = 'eager'));
    await page.evaluate(() => Promise.all([...document.images].map(image => image.decode().catch(() => { throw new Error('Cannot decode '+image.src); }))));
  }
  assert.deepEqual(errors, [], 'Browser errors or missing resources');
  await browser.close();
  console.log(`PASS: ${files.length} pages, local resources, BEM classes, 45 responsive checks, search, filters, sorting, cart, persistence, slider, wishlist, comparison, mobile menus, all image loads.`);
})().catch(error => { console.error(error); process.exit(1); });
