#!/usr/bin/env python3
"""Test local preview boundaries using a temporary loopback server."""
from functools import partial
from http.server import ThreadingHTTPServer
from threading import Thread
from urllib.error import HTTPError
from urllib.request import urlopen
from urllib.parse import quote
from llm_preview import Handler, ROOT, CONCEPTS, LEGACY_PAGES

server=ThreadingHTTPServer(('127.0.0.1',0),partial(Handler,directory=str(ROOT)))
thread=Thread(target=server.serve_forever,daemon=True)
thread.start()
base='http://127.0.0.1:%d/' % server.server_port
def status(path):
    try:
        with urlopen(base+quote(path,safe="/%?=&"),timeout=3) as response:
            response.read()
            return response.status, response.headers.get('Cache-Control')
    except HTTPError as exc:
        return exc.code, exc.headers.get('Cache-Control')
try:
    for path in ['index.html','lab.html','topics/ai-economy.html','js/lab.js?v=4',
                 'dist_public_web/diagram_arithmetic_code_pipeline.html',
                 'dist_public_web/diagram_prompt_injection_defense.html',
                 'encyclopedia.html?q=RAG', 'js/catalog.js', 'js/reference-routes.js', 'js/concept-reader.js',
                 'css/concept-map.css', 'js/concept-map.js',
                 'css/concept-illustration.css', 'assets/illustrations/context-memory-v1.png',
                 *sorted(CONCEPTS), *sorted(LEGACY_PAGES)]:
        code,cache=status(path)
        assert code == 200, (path,code)
        assert cache == 'no-store', (path,cache)
    for path in ['api_key.txt','gemini_api_key.txt','scripts/llm_preview.py','%2e%2e/README.md']:
        code,_=status(path)
        assert code == 404, (path,code)
    print('PASS: loopback preview serves course assets and blocks unrelated files')
finally:
    server.shutdown();server.server_close();thread.join(timeout=3)
