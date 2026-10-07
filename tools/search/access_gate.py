"""Encrypt side-project documents; the build key stays outside public sources."""
import base64
from copy import deepcopy
import json
from pathlib import Path
import secrets

from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from lxml import etree, html

ROOT = Path(__file__).resolve().parent
PRIVATE_CONFIG = ROOT / '.private/side-project-access.json'
ITERATIONS = 240_000
ACCESS_DAYS = 180


def protected_route(route):
    return route == 'projects' or route.startswith('projects/')


def access_config():
    if not PRIVATE_CONFIG.is_file():
        raise RuntimeError('Missing private side-project build key. See README access setup.')
    config = json.loads(PRIVATE_CONFIG.read_text())
    assert len(base64.b64decode(config['key'])) == 32
    assert config['iterations'] == ITERATIONS
    return config


def encrypt_document(document, config, context):
    key = base64.b64decode(config['key'])
    nonce = secrets.token_bytes(12)
    ciphertext = AESGCM(key).encrypt(nonce, document.encode(), context.encode())
    return {'id': config['id'], 'salt': config['salt'], 'iterations': config['iterations'],
            'days': ACCESS_DAYS, 'context': context,
            'nonce': base64.b64encode(nonce).decode(),
            'ciphertext': base64.b64encode(ciphertext).decode()}


def protect_document(tree, language, local_base, route, config):
    # The decrypted document starts the existing runtime normally. This avoids
    # stale gallery/list references and requests no project media before unlock.
    unlocked = deepcopy(tree)
    unlocked.find('head').append(html.fromstring('<meta name="robots" content="noindex,nofollow,noarchive">'))
    unlocked.find('body').append(html.fromstring('<script src="/assets/js/side-project-session.js?v=1"></script>'))
    document = '<!doctype html>\n' + etree.tostring(unlocked, encoding='unicode', method='html') + '\n'
    payload = encrypt_document(document, config, language + ':' + route)
    zh = language == 'zh'
    label = '小项目' if zh else 'Side Projects'
    title = label + (' · 暂不开放 | 谢秋实 Qiushi Xie' if zh else ' · Private collection | Qiushi Xie 谢秋实')
    copy = {
        'label': label, 'title': title,
        'heading': '暂不开放，输入密码后查看' if zh else 'Private collection — enter your password.',
        'password': '访问密码' if zh else 'Access password',
        'placeholder': '请输入密码' if zh else 'Enter your password',
        'show': '显示密码' if zh else 'Show password',
        'unlock': '查看作品' if zh else 'View collection',
        'return': '返回全部作品' if zh else 'Back to All Work',
        'noscript': '请启用 JavaScript 后输入访问密码。' if zh else 'Enable JavaScript to enter your access password.',
    }
    template = html.document_fromstring((ROOT / 'source/side-project-gate.html').read_text())
    template.set('lang', 'zh-CN' if zh else 'en')
    template.set('data-language', language)
    for node in template.xpath('//*[@data-copy]'):
        node.text = copy[node.get('data-copy')]
        node.attrib.pop('data-copy')
    template.find('head/title').text = title
    template.xpath('//meta[@name="description"]')[0].set('content', copy['heading'] + ' · ' + label)
    source_head = tree.find('head')
    for node in source_head.xpath('./link[@rel="canonical" or @rel="alternate" or @rel="icon" or @rel="apple-touch-icon"]'):
        template.find('head').append(deepcopy(node))
    toolbar = deepcopy(tree.xpath('//div[@class="site-toolbar"]')[0])
    placeholder = template.xpath('//*[@id="gate-navigation"]')[0]
    placeholder.getparent().replace(placeholder, toolbar)
    template.xpath('//a[@class="gate-brand"]')[0].set('href', local_base)
    field = template.xpath('//*[@id="access-password"]')[0]
    field.set('placeholder', copy['placeholder'])
    template.xpath('//*[@id="access-show"]')[0].set('aria-label', copy['show'])
    template.xpath('//*[@id="gate-return"]')[0].set('href', local_base + '#all-work')
    for filing in tree.xpath('//footer/p[a[contains(@href,"beian.miit.gov.cn")]]'):
        template.xpath('//footer')[0].append(deepcopy(filing))
    template.xpath('//*[@id="gate-payload"]')[0].text = json.dumps(payload, separators=(',', ':'))
    return '<!doctype html>\n' + etree.tostring(template, encoding='unicode', method='html') + '\n'
