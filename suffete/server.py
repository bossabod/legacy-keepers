#!/usr/bin/env python3
"""Demo website with short-lived, tokenized XLSX downloads (no database)."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlsplit
from threading import Lock, Timer
from io import BytesIO
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment
import json, os, secrets, time, re
import idea_api

files = {}
lock = Lock()
TTL = 900
MAX_REQUEST = 1_000_000
PUBLIC_FILES={'/','/index.html','/demo.html','/idea.html','/ideas-admin.html','/upgrade.js','/export.js','/logo.png','/hero.png','/factory-hero.jpeg','/factory-hero-toned.jpg','/barcode-demo.svg'}

class Handler(SimpleHTTPRequestHandler):
    # Keep connections compatible with reverse-proxy preview hosting.
    protocol_version = 'HTTP/1.1'

    def end_headers(self):
        self.send_header('X-Content-Type-Options', 'nosniff')
        if self.path.split('?',1)[0].endswith(('.js', '.html', '/')):
            self.send_header('Cache-Control','no-store')
        super().end_headers()
    def log_message(self, fmt, *args):
        # Download URLs are bearer secrets; never put them in logs.
        if self.path.startswith('/download/') or self.path.startswith('/api/'):
            return
        super().log_message(fmt, *args)
    def send_json(self, status, data):
        raw=json.dumps(data).encode('utf-8')
        self.send_response(status); self.send_header('Content-Type','application/json; charset=utf-8'); self.send_header('Cache-Control','no-store'); self.send_header('Content-Length',str(len(raw))); self.end_headers(); self.wfile.write(raw)
    def do_POST(self):
        if urlsplit(self.path).path == '/api/ideas':
            idea_api.post(self); return
        if urlsplit(self.path).path != '/api/export':
            self.send_error(404); return
        try:
            size=int(self.headers.get('Content-Length','0'))
            if size<=0 or size>MAX_REQUEST: self.send_json(413,{'error':'Request too large'}); return
            body=json.loads(self.rfile.read(size)); rows=body.get('rows'); name=body.get('filename','SUFFETE.xlsx')
            if not isinstance(rows,list) or len(rows)>10000 or not all(isinstance(r,list) and len(r)<=30 for r in rows): raise ValueError('Invalid rows')
            name=re.sub(r'[^a-zA-Z0-9._-]','_',str(name))[:100]
            if not name.lower().endswith('.xlsx'): name+='.xlsx'
            book=Workbook(); sheet=book.active; sheet.title='Inventory'
            sheet.column_dimensions['A'].width=32
            for col in 'BCDEFGHIJKLMNOPQRST': sheet.column_dimensions[col].width=22
            for row in rows:
                cells=[]
                for value in row:
                    if isinstance(value,bool) or value is None: value='' if value is None else str(value)
                    elif isinstance(value,str): value=value[:10000]
                    elif not isinstance(value,(int,float)): value=str(value)[:10000]
                    cells.append(value)
                sheet.append(cells)
                # Treat all text literally, including text beginning with =, +, - or @.
                for cell, value in zip(sheet[sheet.max_row],cells):
                    if isinstance(value,str): cell.data_type='s'
            for cell in sheet[1]:
                cell.font=Font(bold=True,color='FFFFFF'); cell.fill=PatternFill('solid',fgColor='17324B'); cell.alignment=Alignment(vertical='center')
            sheet.freeze_panes='A4'; stream=BytesIO(); book.save(stream); data=stream.getvalue(); token=secrets.token_urlsafe(32)
            with lock:
                now=time.time()
                for k in list(files):
                    if files[k][0]<now: del files[k]
                if len(files)>=200: del files[next(iter(files))]
                files[token]=(now+TTL,data,name)
            def expire():
                with lock: files.pop(token, None)
            timer=Timer(TTL,expire); timer.daemon=True; timer.start()
            self.send_json(200,{'url':'/download/'+token,'expiresSeconds':TTL})
        except (ValueError,TypeError,json.JSONDecodeError): self.send_json(400,{'error':'Invalid request'})
        except Exception: self.send_json(500,{'error':'Could not create file'})
    def do_GET(self):
        path=urlsplit(self.path).path
        if path == '/api/ideas' or path.startswith('/api/ideas/files/'):
            idea_api.get(self,path); return
        if path.startswith('/download/'):
            token=path[len('/download/'):]
            with lock: entry=files.get(token)
            if not entry or entry[0]<time.time(): self.send_error(404,'Download expired'); return
            _,data,name=entry
            self.send_response(200); self.send_header('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'); self.send_header('Content-Disposition',f'attachment; filename="{name}"'); self.send_header('Cache-Control','no-store'); self.send_header('Content-Length',str(len(data))); self.end_headers(); self.wfile.write(data); return
        if path not in PUBLIC_FILES:
            self.send_error(404); return
        super().do_GET()
    def do_HEAD(self):
        if urlsplit(self.path).path not in PUBLIC_FILES:
            self.send_error(404); return
        super().do_HEAD()

if __name__=='__main__':
    port = int(os.environ.get('PORT', '8001'))
    ThreadingHTTPServer(('0.0.0.0', port), Handler).serve_forever()
