"""Verify video byte ranges and explicit media allowlist on a temporary server."""
from functools import partial
from http.server import ThreadingHTTPServer
from threading import Thread
from urllib.request import Request,urlopen
from urllib.error import HTTPError
from urllib.parse import quote
from llm_preview import Handler,ROOT,VIDEO_FILES
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Handler,directory=str(ROOT)))
t=Thread(target=server.serve_forever,daemon=True);t.start()
base=f'http://127.0.0.1:{server.server_port}/'
try:
 for name in VIDEO_FILES:
  data=(ROOT/name).read_bytes();url=base+quote(name)
  for header,start,end in [('bytes=0-31',0,31),('bytes=1024-2047',1024,2047),('bytes=-32',len(data)-32,len(data)-1),('bytes=1024-',1024,len(data)-1)]:
   with urlopen(Request(url,headers={'Range':header})) as r:
    assert r.status==206
    assert r.headers['Content-Range']==f'bytes {start}-{end}/{len(data)}'
    assert r.read()==data[start:end+1]
  with urlopen(Request(url,method='HEAD')) as r:
   assert r.status==200 and int(r.headers['Content-Length'])==len(data)
   assert r.headers['Accept-Ranges']=='bytes'
  for header in ['bytes=999999999999-','bytes=5-1','bytes=-0','bytes=0-1,4-5','bytes=-']:
   try:urlopen(Request(url,headers={'Range':header}));raise AssertionError(header)
   except HTTPError as e:assert e.code==416
 try:urlopen(base+'not-a-course-video.mp4');raise AssertionError('unlisted media')
 except HTTPError as e:assert e.code==404
 print('PASS: seven videos, exact byte ranges, suffix/open ranges, HEAD, invalid ranges and media allowlist')
finally:
 server.shutdown();server.server_close();t.join()
