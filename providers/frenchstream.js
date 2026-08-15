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
function hostOf(u) { var m = String(u || '').match(/^https?:\/\/([^/]+)/i); return m ? m[1].replace(/^www\./i, '').toLowerCase() : ''; }
function hostLabel(h) { var s = String(h || '').toLowerCase(); if (s === 'premium' || /fsvid/.test(s)) return 'FSVID'; if (/vidzy/.test(s)) return 'VIDZY'; if (/uqload/.test(s)) return 'UQLOAD'; if (/dood/.test(s)) return 'DOOD'; if (/voe/.test(s)) return 'VOE'; if (/filmoon|filemoon/.test(s)) return 'FILEMOON'; if (/mixdrop/.test(s)) return 'MIXDROP'; if (/lulu/.test(s)) return 'LULU'; if (/vidshareup|vidhsareup/.test(s)) return 'VIDSHAREUP'; return s ? s.toUpperCase() : 'PLAYER'; }
function langLabel(l) { var s = String(l || '').toLowerCase(); if (s === 'vf' || s === 'default' || s === 'vfq' || s === 'vff') return 'VF'; if (s === 'vostfr' || s === 'vo') return s === 'vo' ? 'VO' : 'VOSTFR'; return s ? s.toUpperCase() : 'VF'; }
function qualityOf(v, fallback) { var s = String(v || '').trim(); if (/^(unknown|auto|default|original|source)$/i.test(s)) s = ''; if (/4k|uhd/i.test(s)) return '2160p'; var m = s.match(/(?:2160|1440|1080|720|576|540|480|360|240)\s*p?/i); if (m) return /p$/i.test(m[0]) ? m[0].toLowerCase() : m[0] + 'p'; if (/full\s*hd|fhd/i.test(s)) return '1080p'; if (/\bhd\b/i.test(s)) return 'HD'; if (/\bsd\b/i.test(s)) return 'SD'; return s || fallback || 'HD'; }
function decorate(source, meta, ref) { var m = meta || {}, server = m.server || hostOf(source && source.url) || 'player', lang = langLabel(m.lang), q = qualityOf(m.quality, qualityOf(source && source.quality, 'HD')); var out = Object.assign({}, source || {}); out.quality = q; out.label = m.label || ('[' + lang + '] ' + hostLabel(server)); out.headers = Object.assign({}, source && source.headers || {}, { Referer: (source && source.headers && source.headers.Referer) || ref || SITE, 'User-Agent': UA }); return out; }
function idOf(u) { var m = String(u || '').match(/[?&]newsid=(\d+)/i) || String(u || '').match(/\/(\d+)-/); return m ? m[1] : ''; }
function request(path, opts) {
  opts = opts || {};
  var targets = BASES.map(function (b) { return String(path).indexOf('http') === 0 ? String(path).replace(/^https?:\/\/[^/]+/, b) : b + (String(path).charAt(0) === '/' ? path : '/' + path); });
  return (function next(i) { if (i >= targets.length) return Promise.resolve(null); return fetch(targets[i], { method: opts.method || 'GET', headers: Object.assign({ 'User-Agent': UA, 'Referer': SITE + '/' }, opts.headers || {}), body: opts.body, timeoutMs: opts.timeoutMs || 12000 }).then(function (r) { if (r && r.status >= 200 && r.status < 400) { SITE = BASES[i]; return r; } return next(i + 1); }).catch(function () { return next(i + 1); }); })(0);
}
function cards(h) {
  var out = [], re = /<a\b[^>]*class=["'][^"']*short-poster[^"']*["'][^>]*href=["']([^"']+)["'][^>]*?(?:alt|title)=["']([^"']*)["'][^>]*>/gi, m;
  while ((m = re.exec(h || ''))) { var chunk = String(h).slice(m.index, m.index + 1700), im = chunk.match(/<img\b[^>]*(?:data-src|src)=["']([^"']+)["']/i), t = clean(m[2]).trim(); if (!t) continue; var u = abs(m[1].replace(/&amp;/g, '&'), SITE); out.push({ id: idOf(u) || u, title: t, url: u, cover: im ? abs(im[1], SITE) : '', type: 'movie', sourceId: SOURCE_ID }); }
  var seen = {}; return out.filter(function (x) { if (seen[x.url]) return false; seen[x.url] = 1; return true; });
}
function getInfo() { return { name: 'French-Stream', lang: 'fr', baseUrl: SITE, logo: SITE + '/favicon.ico', type: 'movie', version: '1.0.7' }; }
function search(query, page, opts) { if (!String(query || '').trim()) return Promise.resolve([]); return request('/index.php?do=search&subaction=search&story=' + enc(query), {}).then(function (r) { return r ? cards(body(r)) : []; }); }
function popular(opts) { var q = ['film', 'série', 'action']; return search(q[(opts && opts.dateRange || 0) % q.length], 1, opts); }
function getHome(opts) { return popular({ dateRange: 1 }).then(function (items) { return [{ title: 'Tendances francophones', items: items || [] }]; }); }
function metadata(h, url) {
  var tm = h.match(/<h1[^>]*id=["']s-title["'][^>]*>([\s\S]*?)<\/h1>/i) || h.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || h.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)/i), im = h.match(/<div[^>]*class=["'][^"']*fposter[^"']*["'][\s\S]*?<img[^>]+(?:src|data-src)=["']([^"']+)/i) || h.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)/i), dm = h.match(/<div[^>]*class=["'][^"']*fdesc[^"']*['"][^>]*>([\s\S]*?)<\/div>/i) || h.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)/i), y = (h.match(/(?:19|20)\d{2}/) || [])[0];
  var gs = [], gm, gr = /class=["'][^"']*(?:genre|tag)[^"']*["'][^>]*>([\s\S]*?)<\//gi; while ((gm = gr.exec(h))) gs.push(clean(gm[1]).trim());
  return { title: clean(tm ? tm[1] : dec(String(url).split('/').pop())).replace(/\s+/g, ' ').trim(), cover: im ? abs(im[1], url) : '', description: dm ? clean(dm[1]).trim() : '', year: y ? String(y) : undefined, genres: uniq(gs).slice(0, 20) };
}
function episodeData(data, url, title) {
  var out = [], info = data && data.info || {};
  ['vf', 'vostfr', 'vo'].forEach(function (lang) { var group = data && data[lang] || {}; Object.keys(group).forEach(function (n) { var links = [], v = group[n]; if (v && typeof v === 'object') Object.keys(v).forEach(function (k) { if (/^https?:\/\//i.test(v[k])) links.push(v[k]); }); else if (typeof v === 'string') links.push(v); var meta = info[n] || {}; if (links.length || meta.title) out.push({ id: url + '|e=' + n + '|lang=' + lang, number: Number(n) || 0, season: 1, title: clean(meta.title || (lang.toUpperCase() + ' · Épisode ' + n)), url: url, sourceId: SOURCE_ID, lang: lang, links: uniq(links), cover: meta.poster || '', description: clean(meta.synopsis || '') }); }); });
  return out.sort(function (a, b) { return a.number - b.number || a.lang.localeCompare(b.lang); });
}
function getDetail(url) {
  return request(url, {}).then(function (r) { if (!r) return null; var h = body(r), d = metadata(h, url), id = idOf(url), series = /episodes-wrapper|serie-config|saison\s*\d+/i.test(h + ' ' + d.title); return request(series ? '/ep-data.php?id=' + enc(id) + '&format=js' : '/engine/ajax/film_api.php?id=' + enc(id), {}).then(function (er) { var p = er ? json(er) : null, eps = series && p ? episodeData(p, url, d.title) : []; if (!series) { var links = []; function walk(v) { if (!v) return; if (typeof v === 'string' && /^https?:\/\//i.test(v)) links.push(v); else if (typeof v === 'object') Object.keys(v).forEach(function (k) { walk(v[k]); }); } walk(p && p.players); eps = [{ id: url + '|movie', number: 1, season: 1, title: 'Film', url: url, sourceId: SOURCE_ID, links: uniq(links) }]; } return { id: id || url, title: d.title, url: url, cover: d.cover, description: d.description, year: d.year, genres: d.genres, type: 'movie', sourceId: SOURCE_ID, episodes: eps }; }); });
}
function getEpisodes(url) { return getDetail(url).then(function (x) { return x ? x.episodes || [] : []; }); }
function bytesFromBase64(s) { try { if (typeof base64ToBytes === 'function') return Array.from(base64ToBytes(s)); if (typeof atob === 'function') { var t = atob(s), a = []; for (var i = 0; i < t.length; i++) a.push(t.charCodeAt(i)); return a; } } catch (_) {} return []; }
function decodeFsvid(h) { var m = String(h || '').match(/var\s+k\s*=\s*\[([0-9,\s]+)]\s*,\s*b\s*=\s*atob\(s\)[\s\S]*?\}\)\(\s*["']([A-Za-z0-9+/_=-]+)["']\s*\)/i); if (!m) return ''; var key = m[1].split(',').map(function (x) { return Number(x.trim()); }).filter(function (x) { return isFinite(x); }), encrypted = bytesFromBase64(m[2]), out = ''; if (!key.length || !encrypted.length) return ''; for (var i = 0; i < encrypted.length; i++) out += String.fromCharCode(encrypted[i] ^ key[i % key.length]); return out.trim(); }
function unpackText(s) {
  s = String(s || '');
  function decode(payload, radix, dict) {
    function rN(t) { var n = 0; for (var i = 0; i < t.length; i++) { var c = t.charCodeAt(i); n = n * radix + (c <= 57 ? c - 48 : c >= 97 ? c - 87 : c - 29); } return n; }
    return payload.replace(/[0-9A-Za-z]+/g, function (k) { var i = rN(k); return i < dict.length && dict[i] !== '' ? dict[i] : k; });
  }
  var m = s.match(/\}\(\s*'((?:\\.|[^'])*)'\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*'((?:\\.|[^'])*)'\.split\('\|'\)/);
  if (!m) return s;
  var payload = m[1].replace(/\\'/g, "'").replace(/\\\\/g, '\\\\');
  var dict = m[4].replace(/\\'/g, "'").replace(/\\\\/g, '\\\\').split('|');
  return decode(payload, Number(m[2]), dict);
}
function directVideo(u, ref, meta) {
  function make(stream, source) { stream = String(stream || '').replace(/\\\//g, '/'); if (stream.indexOf('//') === 0) stream = 'https:' + stream; var allowNoExt = /mixdrop/i.test(u) && /^https?:\/\//i.test(stream); if (!/^https?:\/\//i.test(stream) || /\/troll\/|test-videos|big[_-]?buck[_-]bunny|sample-videos|example\.com|localhost/i.test(stream) || (!allowNoExt && !/\.(?:m3u8|mp4)(?:\?|$)/i.test(stream))) return []; var out = { url: stream, quality: qualityOf((meta || {}).quality, (stream.match(/(?:2160|1440|1080|720|576|540|480|360|240)p?/i) || [])[0]), container: /\.m3u8(?:\?|$)/i.test(stream) ? 'hls' : 'mp4', headers: { Referer: source || ref || SITE, 'User-Agent': UA }, kind: 'sub' }; return [decorate(out, meta, source || ref)]; }
  function pick(h) { var raw = String(h || ''), decoded = decodeFsvid(raw), unpacked = unpackText(raw); if (unpacked === raw && typeof unpackJs === 'function') unpacked = unpackJs(raw); var texts = [decoded, unpacked, raw], re = /(?:file|src|hls|url|sources?\s*\[?0?\]?\.file)\s*[:=]\s*["']([^"']+(?:\.m3u8|\.mp4)(?:\?[^"']*)?)["']/i, any = /https?:\/\/[^"'\s]+\.(?:m3u8|mp4)(?:\?[^"'\s]*)?/i; for (var i = 0; i < texts.length; i++) { var core = texts[i].match(/Core\.wurl\s*=\s*["']([^"']+)["']/i); if (core) return core[1]; var m = texts[i].match(re) || texts[i].match(any); if (m) return m[1] || m[0]; } return ''; }
  function peel(html, source) {
    var stream = pick(html);
    if (stream) return Promise.resolve(make(stream, source));
    var redirect = String(html || '').match(/<iframe[^>]+src=["']([^"']+)["']/i) || String(html || '').match(/(?:window\.location(?:\.href|\.replace)?|location\.href)\s*=?\s*\(?["']([^"']+)["']/i);
    if (!redirect || !redirect[1]) return Promise.resolve([]);
    var next = abs(redirect[1].replace(/\\\//g, '/'), source || u);
    if (!next || next === source) return Promise.resolve([]);
    return resolveVideo(next, source || u, meta);
  }
  return fetch(u, { headers: { Referer: ref || SITE, 'User-Agent': UA }, timeoutMs: 20000 }).then(function (r) { return r ? peel(body(r), u) : []; }).catch(function () { return []; });
}
function randomToken(n) { var a = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', s = ''; for (var i = 0; i < (n || 10); i++) s += a.charAt(Math.floor(Math.random() * a.length)); return s; }
function doodVideo(u, ref, meta) { var embed = String(u || '').replace('/d/', '/e/'); return fetch(embed, { headers: { Referer: ref || SITE, 'User-Agent': UA }, timeoutMs: 20000 }).then(function (r) { var h = body(r), finalUrl = r && r.url || embed, m = h.match(/\/pass_md5\/[^'" ]+/i); if (!m) return []; var base = finalUrl.match(/^https?:\/\/[^/]+/i); if (!base) return []; return fetch(base[0] + m[0], { headers: { Referer: finalUrl, 'User-Agent': UA }, timeoutMs: 12000 }).then(function (p) { var prefix = body(p).trim(); if (!prefix) return []; var out = { url: prefix + randomToken(10) + '?token=' + m[0].slice(m[0].lastIndexOf('/') + 1) + '&expiry=' + Date.now(), quality: qualityOf((meta || {}).quality, 'HD'), container: 'mp4', headers: { Referer: base[0] + '/', 'User-Agent': UA }, kind: 'sub' }; return [decorate(out, meta, finalUrl)]; }); }).catch(function () { return []; }); }
function decorateList(list, meta, ref) { return (list || []).map(function (x) { return decorate(x, meta, ref); }); }
function limited(p, ms) { return Promise.race([p, new Promise(function (resolve) { setTimeout(function () { resolve([]); }, ms || 9000); })]); }
function resolveVideo(u, page, meta) { var x = String(u || ''), host = hostOf(x); if (/^(dood(?:stream)?\.(?:to|so|ws|la|li|cx|sh|wf|yt|pm|re|watch|work)|dsvplay\.com|ds2(?:play|video)\.com|d000d\.com|d0000d\.com|dooood\.com|vide0\.net)$/.test(host)) return doodVideo(u, page, meta); if (/^(fsvid\.(?:lol|in|live)|vidzy\.(?:cc|org|live)|uqload\.(?:is|com|co|to|cx)|vidhsareup\.(?:fun|io)|vidshareup\.(?:fun|io)|kakaflix\.[^/]+|luluvdo\.com|lulustream\.com|luluvdoo\.com|luluvid\.com|voe\.(?:sx|to|st)|mixdrop\.(?:ag|to|co)|filemoon\.(?:sx|in)|vidmoly\.(?:to|me)|bysebuho\.com|embedseek\.com)$/.test(host)) return directVideo(u, page, meta); return extractVideo(u, { headers: { Referer: page, 'User-Agent': UA } }).then(function (x) { return decorateList(x, meta, page); }).catch(function () { return []; }); }
function getVideoSources(episodeUrl) {
  var raw = String(episodeUrl || ''), page = raw.split('|')[0], id = idOf(page), isMovie = /\|movie$/.test(raw), endpoint = isMovie ? '/engine/ajax/film_api.php?id=' + enc(id) : '/ep-data.php?id=' + enc(id) + '&format=js';
  return request(endpoint, {}).then(function (r) { var p = r ? json(r) : null, candidates = [];
    function add(url, server, lang, quality) { if (typeof url === 'string' && /^https?:\/\//i.test(url)) candidates.push({ url: url, server: server || hostOf(url), lang: lang || 'vf', quality: quality || 'HD' }); }
    function readGroup(group, outer) { var outerLang = /^(vf|vff|vfq|vostfr|vo|default)$/i.test(String(outer || '')); if (Array.isArray(group)) { group.forEach(function (item) { if (item && typeof item === 'object') add(item.url, item.server || item.name || item.player || outer, item.lang || item.language || outerLang && outer || 'vf', item.quality); else add(item, outer, outerLang ? outer : 'vf', 'HD'); }); } else if (group && typeof group === 'object') Object.keys(group).forEach(function (k) { var v = group[k]; if (typeof v === 'string') add(v, outerLang ? k : outer, outerLang ? outer : k, 'HD'); else if (v && typeof v === 'object' && typeof v.url === 'string') add(v.url, v.server || v.player || v.name || (outerLang ? k : outer), v.lang || v.language || (outerLang ? outer : k), v.quality); }); }
    if (isMovie) { var players = p && (p.players || p.links) || {}; Object.keys(players).forEach(function (server) { readGroup(players[server], server); }); }
    else { var lang = (raw.match(/\|lang=([^|]+)/i) || [])[1] || 'vf', ep = (raw.match(/\|e=([^|]+)/i) || [])[1] || '1', g = p && p[lang] && p[lang][ep]; readGroup(g, lang); }
    var seen = {}, unique = candidates.filter(function (c) { var key = c.url + '|' + c.server + '|' + c.lang; if (seen[key]) return false; seen[key] = 1; return true; }); return Promise.all(unique.map(function (c) { var meta = { server: c.server, lang: c.lang, quality: c.quality }; return limited(resolveVideo(c.url, page, meta), 9000).catch(function () { return []; }); })).then(function (groups) { return groups.reduce(function (arr, x) { return arr.concat(x || []); }, []); }); });
}
