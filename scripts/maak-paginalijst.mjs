// Haalt de sitemap van thuisarts.nl op en schrijft de lijst met pagina's naar proxy/public/paginas.json.
// De plugin gebruikt dit bestand, omdat thuisarts.nl de sitemap niet altijd aan Vercel wil geven.
// Draaien: node scripts/maak-paginalijst.mjs
import { writeFile } from 'node:fs/promises';

const SITEMAPS = ['https://www.thuisarts.nl/sitemap.xml?page=1', 'https://www.thuisarts.nl/sitemap.xml?page=2'];

const urls = [];
for (const sitemap of SITEMAPS) {
  const r = await fetch(sitemap, { headers: { 'User-Agent': 'Thuisarts-Figma-plugin (ontwerpteam)' } });
  if (!r.ok) throw new Error('Sitemap ophalen mislukt (' + r.status + '): ' + sitemap);
  const xml = await r.text();
  for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) urls.push(m[1].trim());
}
if (urls.length < 1000) throw new Error('Verdacht weinig pagina\'s gevonden: ' + urls.length);

await writeFile(new URL('../proxy/public/paginas.json', import.meta.url), JSON.stringify({ bijgewerkt: new Date().toISOString(), urls }) + '\n');
console.log(urls.length + " pagina's geschreven");
