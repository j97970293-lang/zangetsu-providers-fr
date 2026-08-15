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
function getInfo() { return { name: 'French-Manga', lang: 'fr', baseUrl: SITE, logo: SITE + '/favicon.ico', type: 'anime', version: '1.0.5' }; }
function search(query, page, opts) { if (!String(query || '').trim()) return Promise.resolve([]); return request('/engine/ajax/search.php', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' }, body: 'query=' + esc(query) + '&page=' + (page || 1) }).then(function (r) { if (!r) return []; var h = responseBody(r), list = cards(h, SITE); if (!list.length) return request('/index.php?do=search&subaction=search&story=' + esc(query), {}).then(function (r2) { return r2 ? cards(responseBody(r2), SITE) : []; }); return list; }); }
function popular(opts) { var q = ['naruto', 'one piece', 'solo leveling']; return search(q[(opts && opts.dateRange || 0) % q.length], 1, opts); }
function getHome(opts) { return popular({ dateRange: 1 }).then(function (items) { return [{ title: 'Anime populaires', items: items || [] }]; }); }
function detailTitle(h, url) { var m = h.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i) || h.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)/i); return clean(m ? m[1] : titleFromUrl(url)).replace(/\s+/g, ' ').trim(); }
function detailData(h, url) { var title = detailTitle(h, url), im = h.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)/i), dm = h.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)/i), yr = (h.match(/(?:19|20)[0-9]{2}/) || [])[0]; return { title: title, cover: im ? abs(im[1], url) : '', description: dm ? clean(dm[1]) : '', year: yr ? String(yr) : undefined, genres: [] }; }
function parseEpisodeJson(data, pageUrl, fallbackTitle) { var out = []; Object.keys(data || {}).forEach(function (lang) { var group = data[lang]; if (!group || typeof group !== 'object') return; Object.keys(group).forEach(function (n) { var ep = group[n], links = []; if (ep && typeof ep === 'object') Object.keys(ep).forEach(function (k) { if (typeof ep[k] === 'string' && /^https?:\/\//i.test(ep[k])) links.push(ep[k]); }); else if (typeof ep === 'string') links.push(ep); if (links.length) out.push({ id: pageUrl + '|s=1|e=' + n + '|lang=' + lang, number: Number(n) || 0, season: 1, title: lang.toUpperCase() + ' · Épisode ' + n, url: pageUrl, sourceId: SOURCE_ID, lang: lang, links: uniq(links), description: fallbackTitle || '' }); }); }); return out; }
function getDetail(url) { return request(url, {}).then(function (r) { if (!r) return null; var h = responseBody(r), d = detailData(h, url), id = idOf(url); return request('/engine/ajax/manga_episodes_api.php?id=' + esc(id), {}).then(function (er) { var data = er ? parseJson(er) : null, eps = data ? parseEpisodeJson(data, url, d.title) : []; return { id: id || url, title: d.title, url: url, cover: d.cover, description: d.description, year: d.year, genres: d.genres, type: /film/i.test(d.title) ? 'movie' : 'anime', sourceId: SOURCE_ID, episodes: eps }; }); }); }
function getEpisodes(url) { return getDetail(url).then(function (d) { return d ? d.episodes || [] : []; }); }
function unpackPacked(s) {
  s = String(s || ''); var start = s.indexOf("}('"); var split = s.indexOf(".split('|')", start); if (start < 0 || split < 0) return s;
  var body = s.slice(start + 3, split).split(String.fromCharCode(92) + "'").join("'"), m = body.match(/,([0-9]+),([0-9]+),'([\s\S]*)'$/); if (!m) return s;
  var payload = body.slice(0, m.index), radix = Number(m[1]), dict = m[3].split('|'); function rN(t) { var n = 0; for (var i = 0; i < t.length; i++) { var c = t.charCodeAt(i); n = n * radix + (c <= 57 ? c - 48 : c >= 97 ? c - 87 : c - 29); } return n; }
  return payload.replace(/[0-9A-Za-z]+/g, function (k) { var i = rN(k); return i < dict.length && dict[i] !== '' ? dict[i] : k; });
}
function directVideo(u, ref) {
  function pick(text, source) {
    var decoded = unpackPacked(text), m = decoded.match(/file\s*:\s*["']([^"']+\.(?:m3u8|mp4)(?:\?[^"']*)?)["']/i) || decoded.match(/sources\s*:\s*\[["']([^"']+\.(?:m3u8|mp4)(?:\?[^"']*)?)["']\]/i) || decoded.match(/["']hls["']\s*:\s*["']([^"']+)["']/i) || decoded.match(/https?:\/\/[^"'\s]+\.(?:m3u8|mp4)(?:\?[^"'\s]*)?/i);
    if (!m) return '';
    var stream = String(m[1] || m[0]).replace(/\\\//g, '/');
    if (stream.indexOf('//') === 0) stream = 'https:' + stream;
    if (stream.charAt(0) === '/') stream = abs(stream, source || u);
    return stream;
  }
  function make(stream, source) {
    if (!stream || stream.indexOf('/troll/') >= 0 || /test-videos|big[_-]?buck[_-]bunny|sample-videos|example\.com|localhost/i.test(stream)) return [];
    if (stream.indexOf('.m3u8') < 0 && stream.indexOf('.mp4') < 0) return [];
    return [{ url: stream, quality: (stream.match(/(?:2160|1080|720|480|360)p?/i) || ['Unknown'])[0], container: stream.indexOf('.m3u8') >= 0 ? 'hls' : 'mp4', headers: { Referer: source || u, 'User-Agent': UA }, kind: 'sub' }];
  }
  return fetch(u, { headers: { Referer: ref || SITE, 'User-Agent': UA }, timeoutMs: 20000 }).then(function (r) {
    if (!r) return [];
    return Promise.resolve(responseBody(r)).then(function (rawBody) {
      var stream = pick(rawBody, u);
      if (stream) return make(stream, u);
      var redirect = rawBody.match(/window\.location\.(?:href|replace)\s*=?\s*\(?["']([^"']+)["']/i) || rawBody.match(/<iframe[^>]+src=["']([^"']+)["']/i);
      if (!redirect || !redirect[1]) return [];
      var next = abs(redirect[1].replace(/\\\//g, '/'), u);
      return fetch(next, { headers: { Referer: u, 'User-Agent': UA }, timeoutMs: 20000 }).then(function (r2) { return r2 ? make(pick(responseBody(r2), next), next) : []; }).catch(function () { return []; });
    });
  }).catch(function () { return []; });
}
function param(raw, key) { var a = String(raw || '').split('|'); for (var i = 0; i < a.length; i++) if (a[i].indexOf(key + '=') === 0) return a[i].slice(key.length + 1); return ''; }
function resolveVideo(u, page) { var x = String(u || ''), host = x.indexOf('://') >= 0 ? x.slice(x.indexOf('://') + 3).split('/')[0].toLowerCase().replace(/^www\./, '') : ''; if (/^(vidzy\.org|vidhsareup\.(?:fun|io)|vidstream\.pro|vidcdn\.|kakaflix\.|luluvdo\.com|lulustream\.com|luluvid\.com)$/.test(host)) return directVideo(u, page); return extractVideo(u, { headers: { Referer: page, 'User-Agent': UA } }).catch(function () { return []; }); }
function getVideoSources(episodeUrl) {
  var raw = String(episodeUrl || ''), page = raw.split('|')[0], lang = param(raw, 'lang') || 'vf', ep = param(raw, 'e') || '1';
  return request('/engine/ajax/manga_episodes_api.php?id=' + esc(idOf(page)), {}).then(function (r) {
    var data = r ? parseJson(r) : null, group = data && data[lang], item = group && group[ep], links = [];
    if (item && typeof item === 'object') Object.keys(item).forEach(function (k) { if (typeof item[k] === 'string' && /^https?:\/\//i.test(item[k])) links.push(item[k]); });
    else if (typeof item === 'string') links.push(item);
    return uniq(links).reduce(function (p, u) { return p.then(function (arr) { return resolveVideo(u, page).then(function (x) { return arr.concat(x || []); }); }); }, Promise.resolve([]));
  });
}
