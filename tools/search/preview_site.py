"""Read-only preview of both builds, with existing public assets cached in /tmp."""
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import unquote, urlsplit
from urllib.request import urlopen
import argparse
import hashlib

ROOT = Path(__file__).resolve().parent / 'build'
CACHE = Path('/tmp/qiushi-portfolio-preview-assets-20261005')
CACHE.mkdir(exist_ok=True)


class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        path = unquote(urlsplit(self.path).path)
        prefix = '/Qiushi-Portfolio/'
        origin = 'github' if path.startswith(prefix) else 'cn'
        relative = path[len(prefix):] if origin == 'github' else path.lstrip('/')
        target = (ROOT / origin / relative).resolve()
        if not target.is_relative_to(ROOT / origin):
            self.send_error(404); return
        if target.is_dir(): target = target / 'index.html'
        if target.is_file():
            data = target.read_bytes()
            self.send_response(200); self.send_header('Content-Type', self.guess_type(str(target)))
            self.send_header('Content-Length', str(len(data))); self.end_headers(); self.wfile.write(data)
            return
        if relative.startswith('assets/'):
            cached = CACHE / hashlib.sha256(relative.encode()).hexdigest()
            try:
                if not cached.exists():
                    with urlopen('https://qiushi0919.github.io/' + relative, timeout=20) as r:
                        cached.write_bytes(r.read())
                data = cached.read_bytes()
                self.send_response(200); self.send_header('Content-Type', self.guess_type(relative))
                self.send_header('Content-Length', str(len(data))); self.end_headers(); self.wfile.write(data)
            except Exception:
                self.send_error(502)
            return
        self.send_error(404)

    def log_message(self, format, *args):
        if len(args) > 1 and args[1] != '200': super().log_message(format, *args)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(); parser.add_argument('--port', type=int, default=8770)
    args = parser.parse_args()
    print('Preview: http://127.0.0.1:%s/ and /Qiushi-Portfolio/' % args.port, flush=True)
    ThreadingHTTPServer(('127.0.0.1', args.port), Handler).serve_forever()
