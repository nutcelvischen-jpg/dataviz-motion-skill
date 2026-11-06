#!/usr/bin/env python3
"""Serve the learning site locally without exposing unrelated project files."""
from argparse import ArgumentParser
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path, PurePosixPath
from urllib.parse import unquote, urlsplit
import sys
import re

ROOT = Path(__file__).resolve().parent.parent
PAGES = {'index.html','learn.html','encyclopedia.html','lab.html','memory.html','security.html','metro.html','mobile.html'}
ASSETS = {
    'css/teaching-diagrams.css',
    'assets/diagrams/agent-flow.svg','assets/diagrams/moe-routing.svg','assets/diagrams/rag-context.svg','assets/diagrams/llm-mindmap.svg',
    'css/learning.css','css/content-layout.css','css/concept-map.css','css/concept-illustration.css',
    'assets/illustrations/context-memory-v1.png',
    'js/learning-data.js','js/learning-progress.js','js/learning.js',
    'js/lab.js','js/lab-legacy-data.js','js/reference.js',
    'js/model-reference-data.js','js/content-navigation.js','js/topic.js',
    'js/catalog.js','js/reference-routes.js','js/concept-reader.js','js/concept-map.js'
}
TOPICS = {'topics/model-adaptation.html','topics/agent-ecosystem.html','topics/agent-incidents.html',
          'topics/ai-economy.html','topics/model-distillation.html','topics/frontier-research.html'}
LEGACY_PAGES = {'dist_public_web/'+name for name in (
    'index.html','encyclopedia.html','lab.html','mobile.html','memory.html','security.html','metro.html',
    '00_LLM_Token與模型全景圖譜.html','00_LLM本質探秘實驗室.html',
    'diagram_arithmetic_code_pipeline.html','diagram_prompt_injection_defense.html',
    'diagram_stateless_memory_sequence.html','diagram_api_security_architecture.html',
    'prompt_injection_metro_case.html')}
COURSE = {
    '00_課程手冊與即時看板/WORKSHOP_BOARD.html',
    '01_Module1_Agent思維與資料分析/README.md',
    '01_Module1_Agent思維與資料分析/API金鑰資安防護與前後端架構圖解.md',
    '01_Module1_Agent思維與資料分析/prompt_injection_metro_case.html',
    '01_Module1_Agent思維與資料分析/real_world_datasets/實戰挑戰_臺灣上市公司營收統計_1088家真實髒資料.csv',
    '01_Module1_Agent思維與資料分析/real_world_datasets/實戰挑戰_113學年度大專校院學生統計_737筆真實髒資料.csv',
    '01_Module1_Agent思維與資料分析/sample_dirty_data.csv',
    '01_Module1_Agent思維與資料分析/diagram_prompt_injection_defense.html',
    '01_Module1_Agent思維與資料分析/diagram_arithmetic_code_pipeline.html',
    '01_Module1_Agent思維與資料分析/diagram_api_security_architecture.html',
    '01_Module1_Agent思維與資料分析/diagram_stateless_memory_sequence.html',
}
CONCEPTS = {'concepts/'+name+'.html' for name in (
    'overview','model','tokens','sampling','time','knowledge','moe','prompt','context',
    'context-engineering','agent','agent-tools','agent-operation','graphics','evidence',
    'verification','injection','api','cost','models','deployment')}
VIDEO_FILES = {
    '數位乩童.mp4','數位乩童開示_AI漏斗.mp4','法器篇EP0_神明的後台.mp4','法器篇EP1_咒語.mp4','法器篇EP2_布壇.mp4','法器篇EP3_起乩循環.mp4','法器篇EP4_宮廟.mp4',
    'videos/ai_blindspots/AI盲點01_草莓與Token.mp4',
    'videos/ai_blindspots/AI盲點02_金魚腦與記憶.mp4',
    'videos/ai_blindspots/AI盲點03_提示詞注入.mp4',
    'videos/ai_blindspots/AI盲點04_幻覺.mp4',
    'videos/ai_blindspots/AI盲點05_Temperature抽籤.mp4',
    'videos/ai_blindspots/AI盲點06_知識截止.mp4',
    'videos/ai_blindspots/AI盲點07_Attention注意力.mp4',
    'videos/ai_blindspots/AI盲點08_Embedding與RAG.mp4',
    'videos/ai_blindspots/AI盲點09_Context塞太滿.mp4',
    'videos/ai_blindspots/AI盲點10_Token與費用_1.mp4',
    'videos/ai_blindspots/AI盲點10_Token與費用.mp4',
    'videos/ai_blindspots/AI盲點11_ToolCalling工具呼叫_1.mp4',
    'videos/ai_blindspots/AI盲點11_ToolCalling工具呼叫.mp4',
    'videos/ai_blindspots/AI盲點12_微調RAG與LoRA_1.mp4',
    'videos/ai_blindspots/AI盲點12_微調RAG與LoRA.mp4'
}
VIDEO_POSTERS = {'assets/video-posters/'+name+'.jpg' for name in ('ep0','ep1','ep2','ep3','ep4','overview','funnel','ep7','ep8','ep9','ep10','ep11','ep12')}
ALLOWED = PAGES | ASSETS | TOPICS | CONCEPTS | COURSE | LEGACY_PAGES | VIDEO_FILES | VIDEO_POSTERS | {'videos.html','css/course-videos.css'}

class Handler(SimpleHTTPRequestHandler):
    def send_head(self):
        self._remaining_range = None
        path = unquote(urlsplit(self.path).path)
        if '\x00' in path or any(part in ('.','..') for part in PurePosixPath(path).parts):
            self.send_error(404); return None
        relative = path.lstrip('/') or 'index.html'
        if relative not in ALLOWED:
            self.send_error(404); return None
        resolved = (ROOT / relative).resolve()
        if not resolved.is_relative_to(ROOT) or not resolved.is_file():
            self.send_error(404); return None
        self.path = '/' + relative
        if relative in VIDEO_FILES:
            size = resolved.stat().st_size
            range_header = self.headers.get('Range')
            start, end = 0, size-1
            if range_header:
                match = re.fullmatch(r'bytes=(\d*)-(\d*)',range_header.strip())
                if not match or not any(match.groups()):
                    return self.invalid_range(size)
                a,b = match.groups()
                if a:
                    start=int(a); end=min(int(b),size-1) if b else size-1
                else:
                    count=int(b)
                    if count <= 0: return self.invalid_range(size)
                    start=max(0,size-count)
                if start >= size or end < start: return self.invalid_range(size)
            stream=resolved.open('rb'); stream.seek(start)
            self.send_response(206 if range_header else 200)
            self.send_header('Content-Type','video/mp4')
            self.send_header('Accept-Ranges','bytes')
            self.send_header('Content-Length',str(end-start+1))
            if range_header: self.send_header('Content-Range',f'bytes {start}-{end}/{size}')
            self.end_headers(); self._remaining_range=end-start+1
            return stream
        return super().send_head()
    def invalid_range(self,size):
        self.send_response(416)
        self.send_header('Content-Range',f'bytes */{size}')
        self.send_header('Content-Length','0')
        self.end_headers()
        return None
    def copyfile(self,source,outputfile):
        if self._remaining_range is None: return super().copyfile(source,outputfile)
        remaining=self._remaining_range
        try:
            while remaining:
                chunk=source.read(min(65536,remaining))
                if not chunk: break
                outputfile.write(chunk); remaining-=len(chunk)
        except (BrokenPipeError,ConnectionResetError):
            pass
    def end_headers(self):
        self.send_header('Cache-Control','no-store')
        self.send_header('X-Content-Type-Options','nosniff')
        super().end_headers()
    def log_message(self, *args):
        pass

if __name__ == '__main__':
    parser=ArgumentParser(description=__doc__)
    parser.add_argument('--port',type=int,default=8765)
    args=parser.parse_args()
    try:
        server=ThreadingHTTPServer(('127.0.0.1',args.port),partial(Handler,directory=str(ROOT)))
    except OSError as e:
        print('無法啟動預覽：'+str(e),file=sys.stderr);sys.exit(1)
    print('本機預覽：http://127.0.0.1:%d/index.html' % args.port,flush=True)
    try:server.serve_forever()
    except KeyboardInterrupt:pass
    finally:server.server_close()
