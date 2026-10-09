# Thuisarts content – Figma-plugin (prototype)

Vult je ontwerpen in Figma met echte content van thuisarts.nl: titels, intro's, secties, situaties en de afbeelding van een pagina. Je kiest één pagina, of laat de plugin elke geselecteerde kaart met een willekeurige pagina vullen ("Shuffle").

## Waarom er een proxy bij zit

thuisarts.nl stuurt geen CORS-header mee. Een Figma-plugin mag de site daardoor niet direct ophalen. De proxy is een klein script ([proxy/worker.js](proxy/worker.js)) dat op Cloudflare of Vercel draait. Het geeft pagina's, de sitemap en afbeeldingen van **alleen** www.thuisarts.nl door en voegt de header toe. Als het webteam later CORS of JSON:API aanzet in Drupal, kan de proxy weg.

## Installeren (eenmalig)

### 1. Proxy online zetten

Dat kan op Cloudflare (1a) of op Vercel (1b). Beide zijn gratis en gebruiken dezelfde code. Kies er één.

#### 1a. Cloudflare

1. Log in op [dash.cloudflare.com](https://dash.cloudflare.com) (een gratis account is genoeg).
2. Ga naar **Workers & Pages** → **Create** → **Create Worker**. Geef hem de naam `thuisarts-proxy` en klik **Deploy**.
3. Klik **Edit code**, vervang alle code door de inhoud van `proxy/worker.js` en klik **Deploy**.
4. Kopieer het adres van de Worker, bijvoorbeeld `https://thuisarts-proxy.jouwnaam.workers.dev`.

#### 1b. Vercel

1. Op [vercel.com](https://vercel.com): **Add New** → **Project** en importeer deze repository.
2. Zet **Root Directory** op `proxy` en Framework preset op **Other**. Klik **Deploy**.
3. Kopieer het adres van het project, bijvoorbeeld `https://thuisarts-proxy.vercel.app`.

De functie staat in `proxy/api/proxy.js` en draait als Edge Function; `vercel.json` zorgt dat het adres zonder `/api/proxy` ook werkt.

Test (beide varianten): open `<jouw adres>/?url=https://www.thuisarts.nl/buikpijn` in je browser. Je ziet dan de HTML van de pagina.

### 2. Plugin in Figma laden

1. Open de **Figma desktop-app** (plugins in ontwikkeling werken niet in de browser).
2. Menu **Plugins** → **Development** → **Import plugin from manifest…** en kies `plugin/manifest.json`.
3. Start de plugin via **Plugins** → **Development** → **Thuisarts content**.
4. Plak bij **Instellingen** het adres van je proxy. Dit hoef je maar één keer te doen.

Gebruikt de proxy een eigen domein in plaats van `*.workers.dev` of `*.vercel.app`? Voeg dat dan toe aan `allowedDomains` in `manifest.json`.

## Gebruiken

1. Geef lagen in je ontwerp een naam uit de tabel hieronder. Dat kan ook in componenten en instances.
2. Selecteer een of meer frames.
3. Kies een pagina in de lijst en klik **Vul selectie**, of klik **Shuffle**. Shuffle geeft elk geselecteerd frame een andere willekeurige pagina. De zoekterm en de soort (situaties of onderwerpen) tellen daarbij mee.

Geen zin om lagen te hernoemen? **Maak voorbeeldkaart** zet een kaart neer met alle laagnamen al goed.

| Laagnaam | Wat erin komt |
|---|---|
| `#titel` | Paginatitel, bijv. "Ik heb buikpijn" |
| `#onderwerp` | Onderwerp uit het kruimelpad, bijv. "Buikpijn bij volwassenen" |
| `#intro` | Samenvatting: "In het kort" op een situatiepagina, de introtekst op een onderwerppagina |
| `#kop-1`, `#kop-2`, … | Koppen van de secties (zonder "In het kort", dat is de intro) |
| `#tekst-1`, `#tekst-2`, … | Tekst van die secties, met bolletjes voor lijstjes |
| `#sectie-1`, `#sectie-2`, … | Een frame om een kop en tekst heen. Wordt verborgen als de pagina minder secties heeft |
| `#situatie-1`, … | Situaties op een onderwerppagina, bijv. "Ik heb buikpijn" |
| `#afbeelding` | Een vorm of frame die de afbeelding van de pagina als vulling krijgt |
| `#url` | Adres van de pagina, bijv. thuisarts.nl/buikpijn-bij-volwassenen |

Genummerde lagen zonder content (bijv. `#kop-6` bij een pagina met 4 secties) worden verborgen. Hoofdletters in laagnamen maken niet uit. Tekst houdt de opmaak van de laag (lettertype, grootte, kleur).

## Goed om te weten

- De paginalijst komt uit de sitemap (ongeveer 2.450 pagina's). De namen in de lijst zijn afgeleid van het webadres; de echte titel zie je zodra je een pagina kiest.
- Pagina's zonder eigen afbeelding laten `#afbeelding` ongemoeid.
- Het uitlezen gaat op de HTML-classes van de site (`page-title`, `toc-content-block`, `subject-summary`). Verandert het webteam die, dan moet de plugin mee.
- De proxy bewaart antwoorden een uur in de cache, dus een net aangepaste pagina kan even op zich laten wachten.

## Bestanden

- `plugin/manifest.json`, `plugin/code.js`, `plugin/ui.html`: de plugin, zonder bouwstap.
- `proxy/worker.js`: de proxy zelf.
- `proxy/wrangler.toml`: voor Cloudflare. Met de Wrangler-CLI kan het ook via `npx wrangler deploy` in de map `proxy`.
- `proxy/api/proxy.js`, `proxy/vercel.json`, `proxy/package.json`: voor Vercel.
