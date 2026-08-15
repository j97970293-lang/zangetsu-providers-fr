var SOURCE_ID = 'french-manga';
var BASES = ['https://w16.french-manga.net', 'https://french-manga.net'];
var SITE = BASES[0];
var UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/125 Safari/537.36';
function dec(s) { try { return decodeURIComponent(String(s || '')); } catch (_) { return String(s || ''); } }
function abs(u, base) { try { return absUrl(u, base); } catch (_) { try { return new URL(u, base).toString(); } catch (_) { return u; } } }
function clean(s) { return htmlText(String(s || '').replace(/<script[\s\S]*?<\/script>/gi, '')); }
function esc(s) { return encodeURIComponent(String(s || '')); }
function parseJson(r) { try { return JSON.parse((r && r.body) || ''); } catch (_) { return null; } }
function responseBody(r) { return r && (r.body || (typeof r.text === 'function' ? r.text() : '')) || ''; }
function uniq(a) { var out = [], seen = {}; (a || []).forEach(function (x) { if (x && !seen[x]) { seen[x] = true; out.push(x); } }); return out; }
function hostOf(u) { var m = String(u || '').match(/^https?:\/\/([^/]+)/i); return m ? m[1].replace(/^www\./i, '').toLowerCase() : ''; }
function hostLabel(h) { var s = String(h || '').toLowerCase(); if (/lulu/.test(s)) return 'LULU'; if (/vidzy/.test(s)) return 'VIDZY'; if (/vidshareup|vidhsareup/.test(s)) return 'VIDSHAREUP'; if (/uqload/.test(s)) return 'UQLOAD'; if (/dood/.test(s)) return 'DOOD'; if (/voe/.test(s)) return 'VOE'; if (/filmoon|filemoon/.test(s)) return 'FILEMOON'; if (/mixdrop/.test(s)) return 'MIXDROP'; return s ? s.toUpperCase() : 'PLAYER'; }
function langLabel(l) { var s = String(l || '').toLowerCase(); if (s === 'vf' || s === 'default' || s === 'vfq' || s === 'vff') return 'VF'; if (s === 'vostfr' || s === 'vo') return s === 'vo' ? 'VO' : 'VOSTFR'; return s ? s.toUpperCase() : 'VF'; }
function qualityOf(v, fallback) { var s = String(v || '').trim(); if (/^(unknown|auto|default|original|source)$/i.test(s)) s = ''; if (/4k|uhd/i.test(s)) return '2160p'; var m = s.match(/(?:2160|1440|1080|720|576|540|480|360|240)\s*p?/i); if (m) return /p$/i.test(m[0]) ? m[0].toLowerCase() : m[0] + 'p'; if (/full\s*hd|fhd/i.test(s)) return '1080p'; if (/\bhd\b/i.test(s)) return 'HD'; if (/\bsd\b/i.test(s)) return 'SD'; return s || fallback || 'HD'; }
function decorate(source, meta, ref) { var m = meta || {}, server = m.server || hostOf(source && source.url) || 'player', lang = langLabel(m.lang), q = qualityOf(m.quality, qualityOf(source && source.quality, 'HD')); var out = Object.assign({}, source || {}); out.quality = q; out.label = m.label || ('[' + lang + '] ' + hostLabel(server)); out.headers = Object.assign({}, source && source.headers || {}, { Referer: (source && source.headers && source.headers.Referer) || ref || SITE, 'User-Agent': UA }); return out; }
function idOf(url) { var m = String(url || '').match(/[?&]newsid=([0-9]+)/i) || String(url || '').match(/\/([0-9]+)-/); return m ? m[1] : ''; }
function titleFromUrl(url) { return dec(String(url || '').split('/').pop().replace(/\.html.*$/, '').replace(/^[0-9]+-/, '').replace(/[+_-]+/g, ' ')); }
function request(path, opts) {
  opts = opts || {};
  var candidates = BASES.map(function (b) { return String(path).indexOf('http') === 0 ? path.replace(/^https?:\/\/[^/]+/, b) : b + (String(path).charAt(0) === '/' ? path : '/' + path); });
  return (function next(i) { if (i >= candidates.length) return Promise.resolve(null); return fetch(candidates[i], { method: opts.method || 'GET', headers: Object.assign({ 'User-Agent': UA, 'Referer': SITE + '/' }, opts.headers || {}), body: opts.body, timeoutMs: opts.timeoutMs || 12000 }).then(function (r) { if (r && r.status >= 200 && r.status < 400) { SITE = BASES[i]; return r; } return next(i + 1); }).catch(function () { return next(i + 1); }); })(0);
}
function cards(html, base) {
  var out = [], re = /short-poster[^>]*href=["']([^"']+)["'][^>]*alt=["']([^"']*)["']/gi, m;
  while ((m = re.exec(html || ''))) { var chunk = String(html).slice(m.index, m.index + 1600), im = chunk.match(/<img[^>]*(?:src|data-src)=["']([^"']+)["']/i), t = clean(m[2]).trim(); if (!t) continue; var url = abs(m[1].replace(/&amp;/g, '&'), base), season = (t.match(/saison\s*([0-9]+)/i) || [])[1]; out.push({ id: idOf(url) || url, title: t, url: url, cover: im ? abs(im[1], base) : '', type: 'anime', sourceId: SOURCE_ID, season: season ? Number(season) : 1 }); }
  if (!out.length) { var sr = /search-item[\s\S]*?location\.href\s*=\s*'([^']+)'[\s\S]*?<img[\s\S]*?alt='([^']+)'/gi, sm; while ((sm = sr.exec(html || ''))) { var su = abs(sm[1], base), sc = String(html).slice(sm.index, sm.index + 700), si = sc.match(/<img[^>]*(?:src|data-src)=["']([^"']+)/i); out.push({ id: idOf(su) || su, title: clean(sm[2]).trim(), url: su, cover: si ? abs(si[1], base) : '', type: 'anime', sourceId: SOURCE_ID }); } }
  var seen = {}; return out.filter(function (x) { if (seen[x.url]) return false; seen[x.url] = true; return true; });
}
function getInfo() { return { name: 'French-Manga', lang: 'fr', baseUrl: SITE, logo: SITE + '/favicon.ico', type: 'anime', version: '1.0.7' }; }
function search(query, page, opts) { if (!String(query || '').trim()) return Promise.resolve([]); return request('/engine/ajax/search.php', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' }, body: 'query=' + esc(query) + '&page=' + (page || 1) }).then(function (r) { if (!r) return []; var h = responseBody(r), list = cards(h, SITE); if (!list.length) return request('/index.php?do=search&subaction=search&story=' + esc(query), {}).then(function (r2) { return r2 ? cards(responseBody(r2), SITE) : []; }); return list; }); }
function popular(opts) { var q = ['naruto', 'one piece', 'solo leveling']; return search(q[(opts && opts.dateRange || 0) % q.length], 1, opts); }
function getHome(opts) { return popular({ dateRange: 1 }).then(function (items) { return [{ title: 'Anime populaires', items: items || [] }]; }); }
function detailTitle(h, url) { var m = h.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i) || h.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)/i); return clean(m ? m[1] : titleFromUrl(url)).replace(/\s+/g, ' ').trim(); }
function detailData(h, url) { var title = detailTitle(h, url), im = h.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)/i), dm = h.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)/i), yr = (h.match(/(?:19|20)[0-9]{2}/) || [])[0]; return { title: title, cover: im ? abs(im[1], url) : '', description: dm ? clean(dm[1]) : '', year: yr ? String(yr) : undefined, genres: [] }; }
function parseEpisodeJson(data, pageUrl, fallbackTitle) { var out = []; Object.keys(data || {}).forEach(function (lang) { var group = data[lang]; if (!group || typeof group !== 'object') return; Object.keys(group).forEach(function (n) { var ep = group[n], links = []; if (ep && typeof ep === 'object') Object.keys(ep).forEach(function (k) { if (typeof ep[k] === 'string' && /^https?:\/\//i.test(ep[k])) links.push(ep[k]); }); else if (typeof ep === 'string') links.push(ep); if (links.length) out.push({ id: pageUrl + '|s=1|e=' + n + '|lang=' + lang, number: Number(n) || 0, season: 1, title: lang.toUpperCase() + ' · Épisode ' + n, url: pageUrl, sourceId: SOURCE_ID, lang: lang, links: uniq(links), description: fallbackTitle || '' }); }); }); return out; }
function getDetail(url) { return request(url, {}).then(function (r) { if (!r) return null; var h = responseBody(r), d = detailData(h, url), id = idOf(url); return request('/engine/ajax/manga_episodes_api.php?id=' + esc(id), {}).then(function (er) { var data = er ? parseJson(er) : null, eps = data ? parseEpisodeJson(data, url, d.title) : []; return { id: id || url, title: d.title, url: url, cover: d.cover, description: d.description, year: d.year, genres: d.genres, type: /film/i.test(d.title) ? 'movie' : 'anime', sourceId: SOURCE_ID, episodes: eps }; }); }); }
function getEpisodes(url) { return getDetail(url).then(function (d) { return d ? d.episodes || [] : []; }); }
function unpackPacked(s) {
  s = String(s || '');
  function decode(payload, radix, dict) {
    function rN(t) { var n = 0; for (var i = 0; i < t.length; i++) { var c = t.charCodeAt(i); n = n * radix + (c <= 57 ? c - 48 : c >= 97 ? c - 87 : c - 29); } return n; }
    return payload.replace(/[0-9A-Za-z]+/g, function (k) { var i = rN(k); return i < dict.length && dict[i] !== '' ? dict[i] : k; });
  }
  var generic = s.match(/\}\(\s*'((?:\\.|[^'])*)'\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*'((?:\\.|[^'])*)'\.split\('\|'\)/);
  if (generic) {
    var gp = generic[1].replace(/\\'/g, "'").replace(/\\\\/g, '\\\\');
    var gd = generic[4].replace(/\\'/g, "'").replace(/\\\\/g, '\\\\').split('|');
    return decode(gp, Number(generic[2]), gd);
  }
  var start = s.indexOf("}('"); var split = s.indexOf(".split('|')", start); if (start < 0 || split < 0) return s;
  var body = s.slice(start + 3, split).split(String.fromCharCode(92) + "'").join("'"), m = body.match(/,([0-9]+),([0-9]+),'([\s\S]*)'$/); if (!m) return s;
  var payload = body.slice(0, m.index), radix = Number(m[1]), dict = m[3].split('|');
  return decode(payload, radix, dict);
}
function directVideo(u, ref, meta) {
  function pick(text, source) { var decoded = unpackPacked(text); var texts = [decoded, String(text || '')], m; for (var i = 0; i < texts.length; i++) { var core = texts[i].match(/Core\.wurl\s*=\s*["']([^"']+)["']/i); if (core) return core[1]; m = texts[i].match(/(?:file|src|hls|url|sources?\s*\[?0?\]?\.file)\s*[:=]\s*["']([^"']+\.(?:m3u8|mp4)(?:\?[^"']*)?)["']/i) || texts[i].match(/https?:\/\/[^"'\s]+\.(?:m3u8|mp4)(?:\?[^"'\s]*)?/i); if (m) break; } if (!m) return ''; var stream = String(m[1] || m[0]).replace(/\\\//g, '/'); if (stream.indexOf('//') === 0) stream = 'https:' + stream; if (stream.charAt(0) === '/') stream = abs(stream, source || u); return stream; }
  function make(stream, source) { stream = String(stream || '').replace(/\\\//g, '/'); if (stream.indexOf('//') === 0) stream = 'https:' + stream; var allowNoExt = /mixdrop/i.test(u) && /^https?:\/\//i.test(stream); if (!stream || /\/troll\/|test-videos|big[_-]?buck[_-]bunny|sample-videos|example\.com|localhost/i.test(stream) || (!allowNoExt && !/\.(?:m3u8|mp4)(?:\?|$)/i.test(stream))) return []; var out = { url: stream, quality: qualityOf((meta || {}).quality, (stream.match(/(?:2160|1440|1080|720|576|540|480|360|240)p?/i) || [])[0]), container: /\.m3u8(?:\?|$)/i.test(stream) ? 'hls' : 'mp4', headers: { Referer: source || ref || SITE, 'User-Agent': UA }, kind: 'sub' }; return [decorate(out, meta, source || ref)]; }
  function peel(html, source) { var stream = pick(html, source); if (stream) return Promise.resolve(make(stream, source)); var redirect = String(html || '').match(/window\.location\.(?:href|replace)\s*=?\s*\(?["']([^"']+)["']/i) || String(html || '').match(/<iframe[^>]+src=["']([^"']+)["']/i); if (!redirect || !redirect[1]) return Promise.resolve([]); var next = abs(redirect[1].replace(/\\\//g, '/'), source || u); if (!next || next === source) return Promise.resolve([]); return resolveVideo(next, source || u, meta); }
  return fetch(u, { headers: { Referer: ref || SITE, 'User-Agent': UA }, timeoutMs: 20000 }).then(function (r) { return r ? peel(responseBody(r), u) : []; }).catch(function () { return []; });
}
function randomToken(n) { var a = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', s = ''; for (var i = 0; i < (n || 10); i++) s += a.charAt(Math.floor(Math.random() * a.length)); return s; }
function param(raw, key) { var a = String(raw || '').split('|'); for (var i = 0; i < a.length; i++) if (a[i].indexOf(key + '=') === 0) return a[i].slice(key.length + 1); return ''; }
function limited(p, ms) { return Promise.race([p, new Promise(function (resolve) { setTimeout(function () { resolve([]); }, ms || 9000); })]); }
function doodVideo(u, ref, meta) { var embed = String(u || '').replace('/d/', '/e/'); return fetch(embed, { headers: { Referer: ref || SITE, 'User-Agent': UA }, timeoutMs: 20000 }).then(function (r) { var h = responseBody(r), finalUrl = r && r.url || embed, m = h.match(/\/pass_md5\/[^'" ]+/i); if (!m) return []; var base = finalUrl.match(/^https?:\/\/[^/]+/i); if (!base) return []; return fetch(base[0] + m[0], { headers: { Referer: finalUrl, 'User-Agent': UA }, timeoutMs: 12000 }).then(function (p) { var prefix = responseBody(p).trim(); if (!prefix) return []; var out = { url: prefix + randomToken(10) + '?token=' + m[0].slice(m[0].lastIndexOf('/') + 1) + '&expiry=' + Date.now(), quality: qualityOf((meta || {}).quality, 'HD'), container: 'mp4', headers: { Referer: base[0] + '/', 'User-Agent': UA }, kind: 'sub' }; return [decorate(out, meta, finalUrl)]; }); }).catch(function () { return []; }); }
function resolveVideo(u, page, meta) { var host = hostOf(u); if (/^(dood(?:stream)?\.(?:to|so|ws|la|li|cx|sh|wf|yt|pm|re|watch|work)|dsvplay\.com|ds2(?:play|video)\.com|d000d\.com|d0000d\.com|dooood\.com|vide0\.net)$/.test(host)) return doodVideo(u, page, meta); if (/^(vidzy\.(?:org|cc|live)|vidhsareup\.(?:fun|io)|vidshareup\.(?:fun|io)|vidstream\.pro|vidcdn\.|kakaflix\.[^/]+|uqload\.(?:is|com|co|to|cx)|luluvdo\.com|lulustream\.com|luluvdoo\.com|luluvid\.com|voe\.(?:sx|to|st)|mixdrop\.(?:ag|to|co)|filemoon\.(?:sx|in)|vidmoly\.(?:to|me)|bysebuho\.com|embedseek\.com)$/.test(host)) return directVideo(u, page, meta); return extractVideo(u, { headers: { Referer: page, 'User-Agent': UA } }).then(function (x) { return (x || []).map(function (s) { return decorate(s, meta, page); }); }).catch(function () { return []; }); }
function getVideoSources(episodeUrl) {
  var raw = String(episodeUrl || ''), page = raw.split('|')[0], lang = param(raw, 'lang') || 'vf', ep = param(raw, 'e') || '1';
  return request('/engine/ajax/manga_episodes_api.php?id=' + esc(idOf(page)), {}).then(function (r) {
    var data = r ? parseJson(r) : null, group = data && data[lang], item = group && group[ep], candidates = [];
    if (item && typeof item === 'object') Object.keys(item).forEach(function (k) { if (typeof item[k] === 'string' && /^https?:\/\//i.test(item[k])) candidates.push({ url: item[k], server: k, lang: lang, quality: 'HD' }); else if (item[k] && typeof item[k] === 'object' && /^https?:\/\//i.test(item[k].url || '')) candidates.push({ url: item[k].url, server: item[k].player || item[k].name || k, lang: lang, quality: item[k].quality || 'HD' }); });
    else if (typeof item === 'string') candidates.push({ url: item, server: hostOf(item), lang: lang, quality: 'HD' });
    var seen = {}, unique = candidates.filter(function (c) { var key = c.url + '|' + c.server + '|' + c.lang; if (seen[key]) return false; seen[key] = 1; return true; }); return Promise.all(unique.map(function (c) { return limited(resolveVideo(c.url, page, { server: c.server, lang: c.lang, quality: c.quality }), 9000).catch(function () { return []; }); })).then(function (groups) { return groups.reduce(function (arr, x) { return arr.concat(x || []); }, []); });
  });
}
