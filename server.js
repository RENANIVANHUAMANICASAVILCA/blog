const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const root = __dirname;
const dataFile = path.join(root, 'content', 'site.json');
const sessions = new Map();
const port = Number(process.env.PORT || 8765);
const adminEmail = process.env.ADMIN_EMAIL || 'ivan@admin.com';
const passwordHash = value => crypto.createHash('sha256').update(String(value)).digest('hex');
const adminPasswordHash = process.env.ADMIN_PASSWORD ? passwordHash(process.env.ADMIN_PASSWORD) : '6ae89fd0b856c051aeed004987d6d74ad29c993934c931a85b681811342dd831';
const mime = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.json':'application/json; charset=utf-8', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.svg':'image/svg+xml' };
const json = (res, status, body, headers={}) => { res.writeHead(status, { 'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store', ...headers }); res.end(JSON.stringify(body)); };
const body = req => new Promise((resolve, reject) => { let raw=''; req.on('data', chunk => { raw += chunk; if(raw.length > 2_000_000) req.destroy(); }); req.on('end',()=>{try{resolve(raw?JSON.parse(raw):{})}catch(error){reject(error)}}); req.on('error',reject); });
const cookies = req => Object.fromEntries(String(req.headers.cookie||'').split(';').map(v=>v.trim().split('=')).filter(v=>v.length===2));
const authenticated = req => { const session=sessions.get(cookies(req).ivan_admin); return session && session > Date.now(); };
const safeEqual = (a,b) => { const left=Buffer.from(String(a)),right=Buffer.from(String(b)); return left.length===right.length && crypto.timingSafeEqual(left,right); };
const validContent = value => value && ['posts','homeSlides','homeCards','gallery'].every(key=>Array.isArray(value[key]));
const writeClientData = value => fs.writeFileSync(path.join(root,'content','site-data.js'),`window.IVAN_SITE_DATA=${JSON.stringify(value)};\n`);
writeClientData(JSON.parse(fs.readFileSync(dataFile,'utf8')));

async function api(req,res,url) {
  if(req.method==='POST' && url.pathname==='/api/login') {
    const input=await body(req).catch(()=>({}));
    if(!safeEqual(String(input.email||'').toLowerCase(),adminEmail)||!safeEqual(passwordHash(input.password||''),adminPasswordHash)) return json(res,401,{error:'Credenciales incorrectas.'});
    const token=crypto.randomBytes(32).toString('hex'); sessions.set(token,Date.now()+8*60*60*1000);
    return json(res,200,{email:adminEmail},{'Set-Cookie':`ivan_admin=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800`});
  }
  if(req.method==='POST' && url.pathname==='/api/logout') { const token=cookies(req).ivan_admin; sessions.delete(token); return json(res,200,{ok:true},{'Set-Cookie':'ivan_admin=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'}); }
  if(url.pathname==='/api/session') return authenticated(req)?json(res,200,{authenticated:true,email:adminEmail}):json(res,401,{authenticated:false});
  if(url.pathname==='/api/content' && req.method==='GET') return authenticated(req)?json(res,200,JSON.parse(fs.readFileSync(dataFile,'utf8'))):json(res,401,{error:'No autorizado.'});
  if(url.pathname==='/api/content' && req.method==='PUT') {
    if(!authenticated(req)) return json(res,401,{error:'No autorizado.'});
    const input=await body(req).catch(()=>null); if(!validContent(input)) return json(res,400,{error:'El contenido no tiene el formato esperado.'});
    const normalized={}; for(const key of ['posts','homeSlides','homeCards','gallery']) normalized[key]=input[key].map((item,index)=>({...item,id:String(item.id||`${key}-${Date.now()}-${index}`),published:item.published!==false}));
    const temp=`${dataFile}.tmp`; fs.writeFileSync(temp,JSON.stringify(normalized,null,2)+'\n'); fs.renameSync(temp,dataFile); writeClientData(normalized); return json(res,200,{ok:true});
  }
  return false;
}

const server=http.createServer(async(req,res)=>{
  try {
    const url=new URL(req.url,'http://localhost'); if(url.pathname.startsWith('/api/')) { const handled=await api(req,res,url); if(handled!==false)return; return json(res,404,{error:'No encontrado.'}); }
    let pathname=decodeURIComponent(url.pathname); if(pathname==='/' ) pathname='/index.html';
    const target=path.resolve(root,`.${pathname}`); const blocked=['server.js','package.json'].includes(path.basename(target))||target.startsWith(path.join(root,'scripts')); if(blocked||!target.startsWith(root)||!fs.existsSync(target)||fs.statSync(target).isDirectory()){res.writeHead(404);return res.end('No encontrado');}
    res.writeHead(200,{'Content-Type':mime[path.extname(target).toLowerCase()]||'application/octet-stream','Cache-Control':pathname.startsWith('/content/')?'no-cache':'public, max-age=60'}); fs.createReadStream(target).pipe(res);
  } catch(error) { console.error(error); if(!res.headersSent)json(res,500,{error:'Error interno.'}); else res.end(); }
});
server.listen(port,'127.0.0.1',()=>console.log(`Ivan's Blog: http://127.0.0.1:${port}`));
