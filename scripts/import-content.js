const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const blog = fs.readFileSync(path.join(root, 'blog.html'), 'utf8');
const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const gallery = fs.readFileSync(path.join(root, 'images', 'images.html'), 'utf8');
const entities={amp:'&',quot:'"',apos:"'",nbsp:' ',hellip:'…',iquest:'¿',aacute:'á',eacute:'é',iacute:'í',oacute:'ó',uacute:'ú',ntilde:'ñ',Aacute:'Á',Eacute:'É',Iacute:'Í',Oacute:'Ó',Uacute:'Ú',Ntilde:'Ñ'};
const clean = value => String(value || '').replace(/<[^>]*>/g, '').replace(/&(#x[\da-f]+|#\d+|\w+);/gi,(_,entity)=>entity[0]==='#'?(entity[1].toLowerCase()==='x'?String.fromCodePoint(parseInt(entity.slice(2),16)):String.fromCodePoint(parseInt(entity.slice(1),10))):(entities[entity]??`&${entity};`)).replace(/\s+/g, ' ').trim();
const match = (value, pattern) => pattern.exec(value)?.[1] || '';
const items = blog.split('<div class="entry-content-wrapper">').slice(1).filter(part => part.includes('class="blog-details-section"'));
const posts = items.map((part, index) => {
  const type = match(part, /format-(image|gallery|standard)/) || 'standard';
  const title = clean(match(part, /<div class="entry-post-title">[\s\S]*?<h2[^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/));
  const description = clean(match(part, /<div class="entry-content postformat_contents clearfix">[\s\S]*?<\/h2>\s*<\/div>\s*<p>([\s\S]*?)<\/p>/));
  const image = match(part, /<div class="post-format-media">[\s\S]*?<img[^>]*src="([^"]+)"/) || match(part, /<div class="gridblock-slideshow-element">[\s\S]*?<img[^>]*src="([^"]+)"/);
  const images = [...part.matchAll(/<div class="gridblock-slideshow-element">[\s\S]*?<img[^>]*src="([^"]+)"/g)].map(item => item[1]);
  const date = [match(part, /class="the-year">([^<]+)/), match(part, /class="the-month">([^<]+)/), match(part, /class="the-day">([^<]+)/)].join('-');
  const category = clean(match(part, /class="post-meta-category">[\s\S]*?<a[^>]*>([^<]+)/));
  return { id: `legacy-${index + 1}`, title, description, type, category, date, image, images, published: true };
}).filter(post => post.title);
const cards = [...home.matchAll(/<div class="slideshow-box-wrapper">([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/g)].map((item, index) => ({
  id: `card-${index + 1}`, image: match(item[1], /<img[^>]*src="([^"]+)"/), title: clean(match(item[1], /class="slideshow-box-title">[\s\S]*?<a[^>]*>([^<]+)/)), description: clean(match(item[1], /class="slideshow-box-description">([^<]+)/)), link: 'blog.html', published: true
})).filter(card => card.title);
const heroScript = match(home, /jQuery\.supersized\(([\s\S]*?)\);if \(\$\.fn\.swipe\)/);
const slides = [...heroScript.matchAll(/\{image\s*:\s*'([^']+)',\s*alttext\s*:\s*'[^']*',\s*title\s*:\s*'([\s\S]*?)',\s*thumb/g)].map((item, index) => ({
  id: `slide-${index + 1}`, image: item[1], title: clean(match(item[2], /class="slideshow_title[^>]*>([^<]+)/)), description: clean(match(item[2], /<p>([\s\S]*?)<\/p>/)), link: 'blog.html', published: true
}));
const galleryImages = [match(gallery, /--mi-foto:\s*url\('([^']+)'\)/), ...[...gallery.matchAll(/"(https:\/\/[^"\s]+)"/g)].map(item => item[1])].filter(Boolean);
const existing=fs.existsSync(path.join(root,'content','site.json'))?JSON.parse(fs.readFileSync(path.join(root,'content','site.json'),'utf8')):{};
const importedGallery=[...new Set(galleryImages)].map((image, index) => ({ id: `photo-${index + 1}`, image, title: `Foto ${index + 1}`, description: '', published: true }));
const data = { posts, homeSlides: slides, homeCards: cards, gallery: importedGallery.length?importedGallery:(existing.gallery||[]) };
fs.mkdirSync(path.join(root, 'content'), { recursive: true });
fs.writeFileSync(path.join(root, 'content', 'site.json'), JSON.stringify(data, null, 2) + '\n');
fs.writeFileSync(path.join(root, 'content', 'site-data.js'), `window.IVAN_SITE_DATA=${JSON.stringify(data)};\n`);
process.stdout.write(`Importados: ${posts.length} publicaciones, ${slides.length} diapositivas, ${cards.length} tarjetas y ${data.gallery.length} fotos.\n`);
