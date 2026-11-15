"""Preview-only idea intake. SQLite and admin key live outside the static web root."""
import base64, binascii, hmac, json, os, re, secrets, sqlite3, threading, time
from pathlib import Path

PRIVATE = Path('/home/user/suffete_private')
PRIVATE.mkdir(mode=0o700, parents=True, exist_ok=True)
KEYFILE = PRIVATE / 'idea_admin_key.txt'
if not KEYFILE.exists():
    try:
        fd=os.open(KEYFILE, os.O_WRONLY|os.O_CREAT|os.O_EXCL, 0o600)
        with os.fdopen(fd,'w') as f: f.write(secrets.token_urlsafe(30))
    except FileExistsError: pass
KEY=os.environ.get('SUFFETE_IDEA_ADMIN_KEY') or KEYFILE.read_text().strip()
DB=PRIVATE/'ideas.sqlite3'
def db():
    conn=sqlite3.connect(DB,timeout=10); conn.execute('PRAGMA foreign_keys=ON'); return conn
with db() as c:
    c.executescript('''CREATE TABLE IF NOT EXISTS ideas (id INTEGER PRIMARY KEY AUTOINCREMENT, created_at TEXT NOT NULL DEFAULT (datetime('now')), name TEXT NOT NULL, company TEXT, email TEXT NOT NULL, phone TEXT, industry TEXT NOT NULL, title TEXT NOT NULL, description TEXT NOT NULL, outcome TEXT NOT NULL); CREATE TABLE IF NOT EXISTS files (id INTEGER PRIMARY KEY AUTOINCREMENT, idea_id INTEGER NOT NULL REFERENCES ideas(id), filename TEXT NOT NULL, content_type TEXT NOT NULL, data BLOB NOT NULL);''')
try: os.chmod(DB,0o600)
except OSError: pass
limits={}; mutex=threading.Lock()
def limited(ip,kind,max_count,seconds):
    with mutex:
        now=time.time(); key=(ip,kind); old=[v for v in limits.get(key,[]) if v>now-seconds]
        if len(old)>=max_count: limits[key]=old; return True
        old.append(now); limits[key]=old
        if len(limits)>5000:
            for k,v in list(limits.items()):
                if not v or v[-1]<now-3600: del limits[k]
        return False

def admin(h):
    if limited(h.client_address[0],'admin',30,600): h.send_json(429,{'error':'rate_limit'}); return False
    raw=h.headers.get('X-Admin-Key','')
    if not raw or not hmac.compare_digest(raw,KEY): h.send_json(401,{'error':'unauthorized'}); return False
    return True

def post(h):
    if limited(h.client_address[0],'ideas',12,600): h.send_json(429,{'error':'rate_limit'}); return
    try:
        size=int(h.headers.get('Content-Length','0'))
        if size<=0 or size>9_000_000: h.send_json(413,{'error':'size'});return
        data=json.loads(h.rfile.read(size)); assert isinstance(data,dict)
        if data.get('website'): h.send_json(400,{'error':'invalid'});return
        def field(name,maxlen,required=False):
            value=data.get(name,'')
            if not isinstance(value,str): raise ValueError()
            value=value.strip()
            if len(value)>maxlen or (required and not value): raise ValueError()
            return value
        name=field('name',100,True); company=field('company',150); email=field('email',254,True);phone=field('phone',50); industry=field('industry',150,True);title=field('title',200,True); description=field('description',6000,True); outcome=field('outcome',3000,True)
        if not re.fullmatch(r'[^\s@]+@[^\s@]+\.[^\s@]+',email): raise ValueError()
        uploads=data.get('files',[])
        if not isinstance(uploads,list) or len(uploads)>3: raise ValueError()
        attachments=[]
        for f in uploads:
            if not isinstance(f,dict): raise ValueError()
            filename=f.get('name',''); blob=f.get('data','')
            if not isinstance(filename,str) or not isinstance(blob,str) or len(filename)>200 or len(blob)>2_800_000: raise ValueError()
            raw=base64.b64decode(blob,validate=True)
            if not raw or len(raw)>2_000_000: raise ValueError()
            if raw.startswith(b'%PDF-'): mime,ext='application/pdf','pdf'
            elif raw.startswith(b'\x89PNG\r\n\x1a\n'): mime,ext='image/png','png'
            elif raw.startswith(b'\xff\xd8\xff'): mime,ext='image/jpeg','jpg'
            elif len(raw)>12 and raw[:4]==b'RIFF' and raw[8:12]==b'WEBP': mime,ext='image/webp','webp'
            else: raise ValueError()
            # Keep safe basename for display; download uses a fixed safe filename.
            filename=os.path.basename(filename.replace('\\','/')).strip()[:150] or ('attachment.'+ext)
            attachments.append((filename,mime,raw))
        with db() as c:
            cur=c.execute('INSERT INTO ideas(name,company,email,phone,industry,title,description,outcome) VALUES(?,?,?,?,?,?,?,?)',(name,company,email,phone,industry,title,description,outcome)); idea_id=cur.lastrowid
            c.executemany('INSERT INTO files(idea_id,filename,content_type,data) VALUES(?,?,?,?)',[(idea_id,*a) for a in attachments])
        h.send_json(201,{'id':idea_id})
    except (ValueError,AssertionError,TypeError,binascii.Error,json.JSONDecodeError,UnicodeDecodeError): h.send_json(400,{'error':'invalid'})
    except Exception: h.send_json(500,{'error':'server'})

def get(h,path):
    if not admin(h): return
    try:
        with db() as c:
            c.row_factory=sqlite3.Row
            if path=='/api/ideas':
                rows=[dict(r) for r in c.execute('SELECT * FROM ideas ORDER BY id DESC LIMIT 500')]
                ids=[r['id'] for r in rows]
                if ids:
                    placeholders=','.join('?' for _ in ids);attachments=[dict(r) for r in c.execute(f'SELECT id,idea_id,filename,content_type FROM files WHERE idea_id IN ({placeholders})',ids)]
                else: attachments=[]
                h.send_json(200,{'ideas':rows,'files':attachments});return
            m=re.fullmatch(r'/api/ideas/files/(\d+)',path)
            if not m: h.send_json(404,{'error':'not_found'});return
            row=c.execute('SELECT content_type,data FROM files WHERE id=?',(int(m.group(1)),)).fetchone()
            if not row: h.send_json(404,{'error':'not_found'});return
            ext={'application/pdf':'pdf','image/png':'png','image/jpeg':'jpg','image/webp':'webp'}[row['content_type']]
            h.send_response(200);h.send_header('Content-Type','application/octet-stream');h.send_header('Content-Disposition',f'attachment; filename="attachment-{m.group(1)}.{ext}"');h.send_header('Cache-Control','no-store');h.send_header('Content-Length',str(len(row['data'])));h.end_headers();h.wfile.write(row['data'])
    except Exception: h.send_json(500,{'error':'server'})
