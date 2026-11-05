"""Capture public pages for a content-preserving design preview."""
from pathlib import Path
import concurrent.futures
import json
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'reference' / 'original'
OUT.mkdir(exist_ok=True)
pages = json.loads((ROOT / 'reference/pages.json').read_text(encoding='utf-8'))
cats = json.loads((ROOT / 'reference/categories.json').read_text(encoding='utf-8'))
urls = {p['link'] for p in pages}
urls.update(c['permalink'] for c in cats)
urls.update('https://lentyribbony.ru/product-category/' + s + '/' for s in ['pechat-na-lentah-2', 'zhakkardovye-etiketki', 'etiketki-na-samoklejke', 'golograficheskie-naklejki'])
urls.add('https://lentyribbony.ru/')
def capture(url):
    name = url.removeprefix('https://lentyribbony.ru/').strip('/').replace('/', '__') or 'home'
    target = OUT / (name + '.html')
    if not target.exists():
        target.write_bytes(urllib.request.urlopen(url, timeout=50).read())
    return {'url': url, 'file': target.name}
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
    results = list(pool.map(capture, sorted(urls)))
(OUT / 'manifest.json').write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding='utf-8')
print('Captured', len(results), 'public pages')
