const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const norm=s=>s.replace(/[\s\u200b\u00a0]+/g,' ').trim();
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const context=await browser.newContext({viewport:{width:1440,height:1000}});
 const page=await context.newPage();
 const fixture=await browser.newPage({javaScriptEnabled:false});
 const entries=JSON.parse(fs.readFileSync(path.join(root,'reference/content.json'),'utf8'));
 const audit=JSON.parse(fs.readFileSync(path.join(root,'reference/content-audit.json'),'utf8'));
 let paragraphs=0,images=0;
 for(const row of audit){
  const entry=entries.find(x=>x.url===row.original);
  await fixture.setContent(entry.html);
  const expected=await fixture.locator('p,h2,h3,h4,h5,.source-review__text').allTextContents();
  await page.goto('http://127.0.0.1:4173/'+row.demo);
  const actual=norm(await page.locator('main').innerText());
  for(const text of expected.map(norm).filter(t=>t.length>=20)){
   // The draft-mail action is intentionally different from the live server submission.
   if(/Подготовить|Отправить|Отправка/.test(text))continue;
   assert(actual.includes(text),`${row.demo}: missing source text: ${text.slice(0,160)}`);paragraphs++;
  }
  const actualImages=await page.locator('main .source-content img').count();
  assert.equal(actualImages,entry.images.length,`${row.demo}: preserve every original image`);images+=actualImages;
  for(const width of [1440,1024,768,390,320]){
   await page.setViewportSize({width,height:950});
   assert(!(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1)),`${row.demo}: overflow at ${width}`);
  }
 }
 for(const file of ['index.html','about.html','category-pechat.html','category-labels.html','payment.html','delivery.html','contacts.html','reviews.html']){
  for(const [name,width,height] of [['desktop',1440,1000],['mobile',390,844]]){
   await page.setViewportSize({width,height});await page.goto('http://127.0.0.1:4173/'+file);
   await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>{i.loading='eager';return i.decode().catch(()=>{});}));});
   await page.screenshot({path:path.join(root,'reference',`${file.replace('.html','')}-${name}.png`),fullPage:true});
  }
 }
 console.log(`PASS: ${audit.length} original pages, ${paragraphs} original text blocks, ${images} original images, 75 responsive checks, 16 screenshots.`);
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
