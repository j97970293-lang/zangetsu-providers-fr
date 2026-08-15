var SOURCE_ID = 'frenchstream';
var BASES = ['https://french-stream.one', 'https://french-stream.pink', 'https://fstream.info'];
var SITE = BASES[0];
var UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/125 Safari/537.36';
function clean(s) { return htmlText(String(s || '').replace(/<script[\s\S]*?<\/script>/gi, '')); }
function abs(u, b) { try { return absUrl(u, b); } catch (_) { try { return new URL(u, b).toString(); } catch (_) { return u; } } }
function enc(s) { return encodeURIComponent(String(s || '')); }
function dec(s) { try { return decodeURIComponent(String(s || '')); } catch (_) { return String(s || ''); } }
function body(r) { return r && (r.body || (typeof r.text === 'function' ? r.text() : '')) || ''; }
function json(r) { try { return JSON.parse(body(r)); } catch (_) { return null; } }
function uniq(a) { var o = [], s = {}; (a || []).forEach(function (x) { if (x && !s[x]) { s[x] = 1; o.push(x); } }); return o; }
function idOf(u) { var m = String(u || '').match(/[?&]newsid=(\d+)/i) || String(u || '').match(/\/(\d+)-/); return m ? m[1] : ''; }
function request(path, opts) {
  opts = opts || {}; var targets = BASES.map(function (b) { return String(path).indexOf('http') === 0 ? String(path).replace(/^https?:\/\/[^/]+/, b) : b + (String(path).charAt(0) === '/' ? path : '/' + path); });
  return (function next(i) { if (i >= targets.length) return Promise.resolve(null); return fetch(targets[i], { method: opts.method || 'GET', headers: Object.assign({ 'User-Agent': UA, 'Referer': SITE + '/' }, opts.headers || {}), body: opts.body, timeoutMs: opts.timeoutMs || 12000 }).then(function (r) { if (r && r.status >= 200 && r.status < 400) { SITE = BASES[i]; return r; } return next(i + 1); }).catch(function () { return next(i + 1); }); })(0);
}
function cards(h) {
  var out = [], re = /<a\b[^>]*class=["'][^"']*short-poster[^"']*["'][^>]*href=["']([^"']+)["'][^>]*?(?:alt|title)=["']([^"']*)["'][^>]*>/gi, m;
  while ((m = re.exec(h || ''))) { var chunk = String(h).slice(m.index, m.index + 1700), im = chunk.match(/<img\b[^>]*(?:data-src|src)=["']([^"']+)["']/i), t = clean(m[2]).trim(); if (!t) continue; var u = abs(m[1].replace(/&amp;/g, '&'), SITE), series = /saison|series|s-tv/i.test(t + ' ' + u); out.push({ id: idOf(u) || u, title: t, url: u, cover: im ? abs(im[1], SITE) : '', type: series ? 'tv' : 'movie', sourceId: SOURCE_ID }); }
  var seen = {}; return out.filter(function (x) { if (seen[x.url]) return false; seen[x.url] = 1; return true; });
}
function getInfo() { return { name: 'French-Stream', lang: 'fr', baseUrl: SITE, logo: SITE + '/favicon.ico', type: 'movie', version: '1.0.1' }; }
function search(query, page, opts) { if (!String(query || '').trim()) return Promise.resolve([]); return request('/index.php?do=search&subaction=search&story=' + enc(query), {}).then(function (r) { return r ? cards(body(r)) : []; }); }
function popular(opts) { var q = ['film', 'série', 'action']; return search(q[(opts && opts.dateRange || 0) % q.length], 1, opts); }
function metadata(h, url) {
  var tm = h.match(/<h1[^>]*id=["']s-title["'][^>]*>([\s\S]*?)<\/h1>/i) || h.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || h.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)/i), im = h.match(/<div[^>]*class=["'][^"']*fposter[^"']*["'][\s\S]*?<img[^>]+(?:src|data-src)=["']([^"']+)/i) || h.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)/i), dm = h.match(/<div[^>]*class=["'][^"']*fdesc[^"']*["'][^>]*>([\s\S]*?)<\/div>/i) || h.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)/i), y = (h.match(/(?:19|20)\d{2}/) || [])[0];
  var gs = [], gm, gr = /class=["'][^"']*(?:genre|tag)[^"']*["'][^>]*>([\s\S]*?)<\//gi; while ((gm = gr.exec(h))) gs.push(clean(gm[1]).trim());
  return { title: clean(tm ? tm[1] : dec(String(url).split('/').pop())).replace(/\s+/g, ' ').trim(), cover: im ? abs(im[1], url) : '', description: dm ? clean(dm[1]).trim() : '', year: y ? Number(y) : undefined, genres: uniq(gs).slice(0, 20) };
}
function episodeData(data, url, title) {
  var out = [], info = data && data.info || {};
  ['vf', 'vostfr', 'vo'].forEach(function (lang) { var group = data && data[lang] || {}; Object.keys(group).forEach(function (n) { var links = [], v = group[n]; if (v && typeof v === 'object') Object.keys(v).forEach(function (k) { if (/^https?:\/\//i.test(v[k])) links.push(v[k]); }); else if (typeof v === 'string') links.push(v); var meta = info[n] || {}; if (links.length || meta.title) out.push({ id: url + '|e=' + n + '|lang=' + lang, number: Number(n) || 0, season: 1, title: clean(meta.title || (lang.toUpperCase() + ' · Épisode ' + n)), url: url, sourceId: SOURCE_ID, lang: lang, links: uniq(links), cover: meta.poster || '', description: clean(meta.synopsis || '') }); }); });
  return out.sort(function (a, b) { return a.number - b.number || a.lang.localeCompare(b.lang); });
}
function getDetail(url) {
  return request(url, {}).then(function (r) { if (!r) return null; var h = body(r), d = metadata(h, url), id = idOf(url), series = /episodes-wrapper|serie-config|saison\s*\d+/i.test(h + ' ' + d.title), endpoint = series ? '/ep-data.php?id=' + enc(id) + '&format=js' : '/engine/ajax/film_api.php?id=' + enc(id); return request(endpoint, {}).then(function (er) { var p = er ? json(er) : null, eps = series && p ? episodeData(p, url, d.title) : []; if (!series) { var links = []; function walk(v) { if (!v) return; if (typeof v === 'string' && /^https?:\/\//i.test(v)) links.push(v); else if (typeof v === 'object') Object.keys(v).forEach(function (k) { walk(v[k]); }); } walk(p && p.players); eps = [{ id: url + '|movie', number: 1, season: 1, title: 'Film', url: url, sourceId: SOURCE_ID, links: uniq(links) }]; } return { id: id || url, title: d.title, url: url, cover: d.cover, description: d.description, year: d.year, genres: d.genres, type: series ? 'tv' : 'movie', sourceId: SOURCE_ID, episodes: eps }; }); });
}
function getEpisodes(url) { return getDetail(url).then(function (x) { return x ? x.episodes || [] : []; }); }
function getVideoSources(episodeUrl) {
  var raw = String(episodeUrl || ''), page = raw.split('|')[0], id = idOf(page), isMovie = /\|movie$/.test(raw), endpoint = isMovie ? '/engine/ajax/film_api.php?id=' + enc(id) : '/ep-data.php?id=' + enc(id) + '&format=js';
  return request(endpoint, {}).then(function (r) { var p = r ? json(r) : null, links = []; if (isMovie) { function walk(v) { if (typeof v === 'string' && /^https?:\/\//i.test(v)) links.push(v); else if (v && typeof v === 'object') Object.keys(v).forEach(function (k) { walk(v[k]); }); } walk(p && p.players); } else { var lang = (raw.match(/\|lang=([^|]+)/i) || [])[1] || 'vf', ep = (raw.match(/\|e=([^|]+)/i) || [])[1] || '1', g = p && p[lang] && p[lang][ep]; if (g && typeof g === 'object') Object.keys(g).forEach(function (k) { if (/^https?:\/\//i.test(g[k])) links.push(g[k]); }); } return uniq(links).reduce(function (q, u) { return q.then(function (arr) { return extractVideo(u, { headers: { Referer: page, 'User-Agent': UA } }).then(function (x) { return arr.concat(x || []); }).catch(function () { return arr; }); }); }, Promise.resolve([])); });
}
