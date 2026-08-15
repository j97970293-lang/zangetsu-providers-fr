var INFO={id:'myvi',name:'Myvi',version:'1.0.0',hosts:['myvi.ru', 'www.myvi.ru']};
function getInfo() { return INFO; }
function pick(h, u) {
  var pats = [/(?:file|src|hls|url)\s*[:=]\s*["'](https?:\/\/[^"']+\.(?:m3u8|mp4)(?:\?[^"']*)?)["']/i, /["'](https?:\/\/[^"']+\.(?:m3u8|mp4)(?:\?[^"']*)?)["']/i];
  for (var i=0;i<pats.length;i++) { var m=(h||'').match(pats[i]); if (m) return m[1].replace(/\\\//g,'/'); }
  return null;
}
function result(url, ref) { if (!url || /\/troll\/|test-videos|big[_-]?buck[_-]?bunny|sample-videos|example\.com|localhost/i.test(url)) return []; var hls=/\.m3u8(?:\?|$)/i.test(url); return [{ url:url, quality:(url.match(/(?:2160|1080|720|480|360)p?/i)||['Unknown'])[0], container:hls?'hls':'mp4', headers:{Referer:ref}, kind:'sub' }]; }
async function extract(url, opts) { try { var h=await fetch(url,{headers:{Referer:url}}); var u=pick(h.body,url); if(!u){var m=url.match(/video\/(?:embed\/)?([A-Za-z0-9_-]+)/i); if(m){var a=await fetch('https://www.myvi.ru/api/video/'+m[1],{headers:{Referer:url}});u=pick(a.body,url);}} return u?result(u,url):[]; } catch (_) { return []; } }
