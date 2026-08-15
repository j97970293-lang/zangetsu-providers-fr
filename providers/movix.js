var SOURCE_ID = 'movix';
var SITE = 'https://movix.fun';
var API_BASES = ['https://api.movix.fun', 'https://api.movix.show', 'https://api.movix.cash'];
var TMDB = 'https://api.themoviedb.org/3';
var TMDB_KEY = 'f3d757824f08ea2cff45eb8f47ca3a1e';
var IMG = 'https://image.tmdb.org/t/p';
var UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/125 Safari/537.36';
function enc(s) { return encodeURIComponent(String(s || '')); }
function body(r) { return r && (r.body || (typeof r.text === 'function' ? r.text() : '')) || ''; }
function json(r) { try { return JSON.parse(body(r)); } catch (_) { return null; } }
function abs(u, b) { try { return absUrl(u, b); } catch (_) { return u; } }
function clean(s) { return htmlText(String(s || '')); }
function uniq(a) { var o = [], s = {}; (a || []).forEach(function (x) { if (x && !s[x]) { s[x] = 1; o.push(x); } }); return o; }
function image(path, size) { return path ? IMG + '/' + (size || 'w500') + path : ''; }
function tmdb(path, params) { var q = Object.assign({ api_key: TMDB_KEY, language: 'fr-FR', include_image_language: 'fr,en,null' }, params || {}), qs = Object.keys(q).map(function (k) { return enc(k) + '=' + enc(q[k]); }).join('&'); return fetch(TMDB + '/' + String(path).replace(/^\//, '') + '?' + qs, { headers: { 'User-Agent': UA }, timeoutMs: 15000 }).then(function (r) { return r && r.status >= 200 && r.status < 400 ? json(r) : null; }).catch(function () { return null; }); }
function api(path, i) { i = i || 0; if (i >= API_BASES.length) return Promise.resolve(null); return fetch(API_BASES[i] + '/' + String(path).replace(/^\//, ''), { headers: { 'User-Agent': UA, Origin: SITE, Referer: SITE + '/' }, timeoutMs: 12000 }).then(function (r) { if (r && r.status >= 200 && r.status < 400) return json(r); return api(path, i + 1); }).catch(function () { return api(path, i + 1); }); }
function kind(item) { return item.media_type === 'tv' || item.first_air_date != null ? 'tv' : 'movie'; }
function result(x) { var k = kind(x), title = k === 'tv' ? (x.name || x.original_name) : (x.title || x.original_title); return { id: k + '/' + x.id, title: title || 'Movix', url: 'movix://' + k + '/' + x.id, cover: image(x.poster_path), type: 'movie', sourceId: SOURCE_ID, year: String(k === 'tv' ? x.first_air_date || '' : x.release_date || '').slice(0, 4) || undefined, description: clean(x.overview || '') }; }
function getInfo() { return { name: 'Movix', lang: 'fr', baseUrl: SITE, logo: SITE + '/favicon.ico', type: 'movie', version: '1.0.6' }; }
function search(query, page, opts) { if (!String(query || '').trim()) return Promise.resolve([]); return tmdb('search/multi', { query: query, page: page || 1, include_adult: 'false' }).then(function (d) { return (d && d.results || []).filter(function (x) { return x.media_type === 'movie' || x.media_type === 'tv'; }).map(result); }); }
function popular(opts) { return tmdb('trending/all/week', {}).then(function (d) { return (d && d.results || []).filter(function (x) { return x.media_type === 'movie' || x.media_type === 'tv'; }).map(result); }); }
function getHome(opts) { return popular(opts).then(function (items) { return [{ title: 'Tendances Movix', items: items || [] }]; }); }
function movieDetail(d, url) { return { id: 'movie/' + d.id, title: d.title || d.original_title || 'Movix', url: url, cover: image(d.poster_path), background: image(d.backdrop_path, 'w1280'), description: clean(d.overview || ''), year: String(d.release_date || '').slice(0, 4) || undefined, genres: (d.genres || []).map(function (x) { return x.name; }), type: 'movie', sourceId: SOURCE_ID, episodes: [{ id: url + '|movie', number: 1, season: 1, title: 'Film', url: url, sourceId: SOURCE_ID }] }; }
function tvDetail(d, url) { var seasons = (d.seasons || []).map(function (s) { return s.season_number; }).filter(function (n) { return n > 0; }); return seasonChain(d.id, seasons, 0, image(d.poster_path), url, []).then(function (eps) { return { id: 'tv/' + d.id, title: d.name || d.original_name || 'Movix', url: url, cover: image(d.poster_path), background: image(d.backdrop_path, 'w1280'), description: clean(d.overview || ''), year: String(d.first_air_date || '').slice(0, 4) || undefined, genres: (d.genres || []).map(function (x) { return x.name; }), type: 'movie', sourceId: SOURCE_ID, episodes: eps }; }); }
function seasonChain(id, seasons, ix, poster, url, out) { if (ix >= seasons.length) return Promise.resolve(out); return tmdb('tv/' + id + '/season/' + seasons[ix]).then(function (d) { (d && d.episodes || []).forEach(function (e) { if (e.episode_number > 0) out.push({ id: url + '|s=' + seasons[ix] + '|e=' + e.episode_number, number: e.episode_number, season: seasons[ix], title: clean(e.name || ('Épisode ' + e.episode_number)), url: url, sourceId: SOURCE_ID, cover: image(e.still_path) || poster, description: clean(e.overview || '') }); }); return seasonChain(id, seasons, ix + 1, poster, url, out); }); }
function getDetail(url) { var m = String(url).match(/movix:\/\/(movie|tv)\/(\d+)/i) || String(url).match(/\b(movie|tv)\/(\d+)/i); if (!m) return Promise.resolve(null); return tmdb(m[1] + '/' + m[2], { append_to_response: 'credits,videos,images,external_ids,recommendations' }).then(function (d) { return !d ? null : m[1] === 'tv' ? tvDetail(d, url) : movieDetail(d, url); }); }
function getEpisodes(url) { return getDetail(url).then(function (d) { return d ? d.episodes || [] : []; }); }
function collectStrings(v, out) { if (!v) return; if (typeof v === 'string') { if (/^https?:\/\//i.test(v)) out.push(v); return; } if (typeof v === 'object') Object.keys(v).forEach(function (k) { collectStrings(v[k], out); }); }
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
function directMedia(u, ref) {
  function make(stream, source) { stream = String(stream || '').replace(/\\\//g, '/'); if (stream.indexOf('//') === 0) stream = 'https:' + stream; if (!/^https?:\/\//i.test(stream) || /\/troll\/|test-videos|big[_-]?buck[_-]bunny|sample-videos|example\.com|localhost/i.test(stream) || !/\.(?:m3u8|mp4)(?:\?|$)/i.test(stream)) return []; return [{ url: stream, quality: (stream.match(/(?:2160|1080|720|480|360)p?/i) || ['Unknown'])[0], container: /\.m3u8(?:\?|$)/i.test(stream) ? 'hls' : 'mp4', headers: { Referer: source || ref || SITE, Origin: SITE, 'User-Agent': UA }, kind: 'sub' }]; }
  function pick(h) { var raw = String(h || ''), decoded = decodeFsvid(raw), unpacked = unpackText(raw); if (unpacked === raw && typeof unpackJs === 'function') unpacked = unpackJs(raw); var texts = [decoded, unpacked, raw], re = /(?:file|src|hls|url)\s*[:=]\s*["']([^"']+(?:\.m3u8|\.mp4)(?:\?[^"']*)?)["']/i, any = /https?:\/\/[^"'\s]+\.(?:m3u8|mp4)(?:\?[^"'\s]*)?/i; for (var i = 0; i < texts.length; i++) { var m = texts[i].match(re) || texts[i].match(any); if (m) return m[1] || m[0]; } return ''; }
  function peel(html, source) {
    var stream = pick(html);
    if (stream) return Promise.resolve(make(stream, source));
    var redirect = String(html || '').match(/<iframe[^>]+src=["']([^"']+)["']/i) || String(html || '').match(/(?:window\.location(?:\.href|\.replace)?|location\.href)\s*=?\s*\(?["']([^"']+)["']/i);
    if (!redirect || !redirect[1]) return Promise.resolve([]);
    var next = abs(redirect[1].replace(/\\\//g, '/'), source || u);
    if (!next || next === source) return Promise.resolve([]);
    return resolveOne(next, source || u);
  }
  return fetch(u, { headers: { Referer: ref || SITE + '/', Origin: SITE, 'User-Agent': UA }, timeoutMs: 20000 }).then(function (r) { return r ? peel(body(r), u) : []; }).catch(function () { return []; });
}
function resolveOne(u, ref) { var x = String(u || ''), host = x.indexOf('://') >= 0 ? x.slice(x.indexOf('://') + 3).split('/')[0].toLowerCase().replace(/^www\./, '') : ''; if (/^(fsvid\.(?:lol|in)|vidzy\.(?:cc|org)|uqload\.(?:is|com)|vidhsareup\.(?:fun|io)|kakaflix\.|bysebuho\.com|embedseek\.com|mixdrop\.(?:ag|to)|luluvdo\.com|lulustream\.com|luluvid\.com)$/.test(host)) return directMedia(u, ref); return extractVideo(u, { headers: { Referer: ref || SITE + '/', Origin: SITE, 'User-Agent': UA } }).catch(function () { return []; }); }
function resolveLinks(links, ref) { return uniq(links).reduce(function (p, u) { return p.then(function (out) { return resolveOne(u, ref).then(function (x) { return out.concat(x || []); }).catch(function () { return out; }); }); }, Promise.resolve([])); }
function getVideoSources(episodeUrl) { var raw = String(episodeUrl || ''), m = raw.match(/movix:\/\/(movie|tv)\/(\d+)/i), id = m ? m[2] : '', type = m ? m[1] : 'movie', s = (raw.match(/\|s=(\d+)/) || [])[1], e = (raw.match(/\|e=(\d+)/) || [])[1], paths = type === 'tv' ? ['/api/fstream/tv/' + id + '/season/' + s, '/api/wiflix/tv/' + id + '/' + s] : ['/api/fstream/movie/' + id, '/api/links/movie/' + id, '/api/wiflix/movie/' + id];
  function one(ix, collected) { if (ix >= paths.length) return resolveLinks(collected, SITE); return api(paths[ix]).then(function (d) { var got = []; collectStrings(d, got); if (type === 'tv' && e) { var filtered = got.filter(function (u) { return u.indexOf(String(e)) >= 0 || u.indexOf('/e/') >= 0 || u.indexOf('/embed') >= 0; }); if (filtered.length) got = filtered; } return one(ix + 1, collected.concat(got)); }); }
  return one(0, []);
}
