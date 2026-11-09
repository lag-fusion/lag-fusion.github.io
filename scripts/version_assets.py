"""Run before publishing: version local resources by content to avoid stale caches."""
from hashlib import sha256
from pathlib import Path
import re
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
page = ROOT / 'index.html'


def version(match):
    attribute, value = match.groups()
    url = urlsplit(value)
    if url.scheme or url.netloc or not url.path:
        return match.group()
    resource = ROOT / url.path
    if not resource.is_file():
        raise FileNotFoundError(resource)
    digest = sha256(resource.read_bytes()).hexdigest()[:12]
    fragment = f'#{url.fragment}' if url.fragment else ''
    return f'{attribute}="{url.path}?v={digest}{fragment}"'


if __name__ == '__main__':
    html = page.read_text()
    html = re.sub(r'(src|poster|href)="([^"]+)"', version, html)
    page.write_text(html)
