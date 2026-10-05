"""Notify IndexNow of the published preferred URLs after a successful release.

The key is a public ownership file, not a private account credential.
Run once for each origin whose pages have changed; acceptance is not indexing.
"""
import argparse
from datetime import datetime, timezone
import json
from pathlib import Path
from urllib.parse import urlsplit
from urllib.request import Request, urlopen
from xml.etree import ElementTree

ROOT = Path(__file__).resolve().parent
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--origin', choices=('cn', 'github'), required=True)
args = parser.parse_args()
key = json.loads((ROOT / 'source/search-verification.json').read_text())['indexnow']
sitemap = ElementTree.parse(ROOT / 'build' / args.origin / 'sitemap.xml')
urls = [item.text for item in sitemap.findall('.//{http://www.sitemaps.org/schemas/sitemap/0.9}loc')]
assert urls and all(urlsplit(url).hostname == urlsplit(urls[0]).hostname for url in urls)
host = urlsplit(urls[0]).hostname
key_location = 'https://' + host + '/' + key + '.txt'
with urlopen(key_location, timeout=30) as response:
    assert response.status == 200 and response.read().decode('utf-8').strip() == key
body = {'host': host, 'key': key, 'keyLocation': key_location, 'urlList': urls}
request = Request('https://api.indexnow.org/indexnow', data=json.dumps(body).encode(),
                  headers={'Content-Type': 'application/json; charset=utf-8'}, method='POST')
with urlopen(request, timeout=45) as response:
    result = {'origin': args.origin, 'host': host, 'urls': urls, 'http_status': response.status,
              'submitted_at': datetime.now(timezone.utc).isoformat(),
              'result': 'accepted; indexing not established' if response.status in (200, 202) else 'unexpected response'}
path = ROOT / 'docs' / ('indexnow-' + args.origin + '.json')
path.parent.mkdir(parents=True, exist_ok=True)
path.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
print(json.dumps(result, ensure_ascii=False))
