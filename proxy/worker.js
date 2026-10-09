// Thuisarts-proxy voor de Figma-plugin.
// Haalt pagina's, de sitemap en afbeeldingen op van www.thuisarts.nl en zet er een CORS-header op,
// zodat de plugin (die vanuit een iframe zonder origin draait) ze mag lezen.
// Alleen www.thuisarts.nl is toegestaan; elk ander adres krijgt een 403.

const TOEGESTANE_HOST = 'www.thuisarts.nl';
const CACHE_SECONDEN = 3600;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });
    if (request.method !== 'GET') return fout(405, 'Alleen GET is toegestaan');

    const doel = new URL(request.url).searchParams.get('url');
    if (!doel) return fout(400, 'Geef een adres mee: ?url=https://www.thuisarts.nl/...');

    let doelUrl;
    try {
      doelUrl = new URL(doel);
    } catch (e) {
      return fout(400, 'Ongeldig adres');
    }
    if (doelUrl.protocol !== 'https:' || doelUrl.hostname !== TOEGESTANE_HOST) {
      return fout(403, 'Alleen https://' + TOEGESTANE_HOST + ' is toegestaan');
    }

    const antwoord = await fetch(doelUrl.toString(), {
      headers: { 'User-Agent': 'Thuisarts-Figma-plugin (ontwerpteam)' },
      redirect: 'follow',
      cf: { cacheTtl: CACHE_SECONDEN, cacheEverything: true },
    });

    const headers = new Headers(CORS);
    headers.set('Content-Type', antwoord.headers.get('Content-Type') || 'application/octet-stream');
    headers.set('Cache-Control', 'public, max-age=' + CACHE_SECONDEN);
    // Het uiteindelijke adres na redirects, zodat de plugin relatieve links goed kan oplossen.
    headers.set('X-Final-Url', antwoord.url || doelUrl.toString());
    headers.set('Access-Control-Expose-Headers', 'X-Final-Url');

    return new Response(antwoord.body, { status: antwoord.status, headers });
  },
};

function fout(status, tekst) {
  return new Response(tekst, { status, headers: Object.assign({ 'Content-Type': 'text/plain; charset=utf-8' }, CORS) });
}
