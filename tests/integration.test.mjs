import test from 'node:test';
import assert from 'node:assert/strict';
import { loadProvider, callProvider, loadExtractor } from '../../zangetsu/js_harness/host.mjs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
for (const id of ['frenchstream', 'french-manga', 'movix']) {
  loadProvider(id, new URL(`../providers/${id}.js`, import.meta.url));
}
for (const name of ['doodstream','mp4upload','okru','streamlare','uqload','vidzy','fsvid','voe','vidoza','vidmoly','sendvid','myvi','sibnet','younetu','streamtape','kokoflix','luluvdo']) {
  loadExtractor(new URL(`../extractors/${name}.js`, import.meta.url));
}

function call(id, method, args) { return callProvider(id, method, args).then(JSON.parse); }

test('manifest providers report French metadata', async () => {
  for (const id of ['frenchstream', 'french-manga', 'movix']) {
    const info = await call(id, 'getInfo', []);
    assert.equal(info.lang, 'fr');
    assert.equal(info.version, '1.0.6');
    assert.ok(info.name && info.baseUrl);
  }
});

test('all providers expose popular and getHome for the Zangetsu home screen', async () => {
  for (const id of ['frenchstream', 'french-manga', 'movix']) {
    const rows = await call(id, 'popular', [{ dateRange: 7 }]);
    assert.ok(Array.isArray(rows), `${id}.popular did not return an array`);
    const home = await call(id, 'getHome', [{ category: 'sub' }]);
    assert.ok(Array.isArray(home), `${id}.getHome did not return an array`);
    assert.ok(home.length > 0 && Array.isArray(home[0].items), `${id}.getHome returned no valid section`);
  }
});

test('French-Manga resolves a real HLS source from an episode', async () => {
  const detail = await call('french-manga', 'getDetail', ['https://w16.french-manga.net/1498700-one-piece-saison-23-1999.html']);
  const episode = detail.episodes.find((e) => e.lang === 'vostfr' && e.number === 2);
  assert.ok(episode, 'French-Manga test episode was not found');
  const sources = await call('french-manga', 'getVideoSources', [episode.id]);
  assert.ok(sources.some((s) => typeof s.url === 'string' && /\.m3u8(?:\?|$)/i.test(s.url)), 'French-Manga returned no HLS source');
});

test('French-Stream search and movie detail are live', async () => {
  const rows = await call('frenchstream', 'search', ['reacher', 1, {}]);
  assert.ok(rows.length > 0, 'French-Stream search returned no results');
  assert.ok(rows[0].url && rows[0].title);
  const detail = await call('frenchstream', 'getDetail', ['https://french-stream.one/index.php?newsid=15134151']);
  assert.equal(detail.type, 'movie');
  assert.ok(detail.year === undefined || typeof detail.year === 'string');
  assert.ok(detail.episodes && detail.episodes.length === 1);
  assert.ok(detail.episodes[0].id.includes('|movie'));
});

test('French-Manga search and episode API are live', async () => {
  const rows = await call('french-manga', 'search', ['one piece', 1, {}]);
  assert.ok(rows.length > 0, 'French-Manga search returned no results');
  const detail = await call('french-manga', 'getDetail', ['https://w16.french-manga.net/index.php?newsid=1498810']);
  assert.equal(detail.sourceId, 'french-manga');
  assert.ok(detail.year === undefined || typeof detail.year === 'string');
  assert.ok(detail.episodes.length > 0, 'French-Manga episode API returned no episodes');
  assert.ok(detail.episodes.some((e) => e.lang === 'vostfr'));
});

test('Movix search and TMDB detail are live', async () => {
  const rows = await call('movix', 'search', ['Dune', 1, {}]);
  assert.ok(rows.length > 0, 'Movix/TMDB search returned no results');
  const detail = await call('movix', 'getDetail', ['movix://movie/693134']);
  assert.equal(detail.type, 'movie');
  assert.ok(detail.year === undefined || typeof detail.year === 'string');
  assert.ok(detail.tmdbId === undefined || detail.title);
  assert.ok(detail.episodes.length === 1);
});

test('all registered French host extractors have contracts', async () => {
  for (const host of ['uqload.com','vidzy.org','fsvid.lol','voe.sx','vidoza.net','vidmoly.me','sendvid.com','myvi.ru','video.sibnet.ru','younetu.org','streamtape.com','kokoflix.lol','luluvdo.com']) {
    assert.ok(globalThis.__extractors[host], `missing extractor for ${host}`);
    assert.equal(typeof globalThis.__extractors[host].extract, 'function');
  }
});
