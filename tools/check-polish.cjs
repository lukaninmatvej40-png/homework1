const assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const page=await browser.newPage();
 await page.goto('http://127.0.0.1:4173/reviews.html');
 assert.equal(await page.locator('.review-rating[aria-label="Оценка 5 из 5"]').count(),5);
 await page.locator('.rating-input label').nth(3).click();
 assert.equal(await page.locator('[name=rating]:checked').inputValue(),'4');
 await page.screenshot({path:'reference/polish-reviews.png',fullPage:true});
 await page.goto('http://127.0.0.1:4173/category-pechat.html');
 await page.locator('.order-cta').click();
 assert.equal(new URL(page.url()).hash,'#request');
 await page.goto('http://127.0.0.1:4173/account.html');
 assert.equal(await page.locator('.empty-state .button').evaluate(e=>getComputedStyle(e).color),'rgb(255, 255, 255)');
 console.log('PASS: original star ratings, selectable rating, order CTA, button contrast');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
