// Thuisarts content: vult lagen in Figma met echte content van thuisarts.nl.
// De UI (ui.html) haalt de pagina's op en leest ze uit; dit bestand schrijft de content in de lagen.
//
// Laagnamen die de plugin herkent (hoofdletters maakt niet uit):
//   #titel, #onderwerp, #intro, #url
//   #kop-1 ... #kop-n, #tekst-1 ... #tekst-n   (secties van een situatiepagina)
//   #situatie-1 ... #situatie-n                 (situaties op een onderwerppagina)
//   #sectie-1 ... #sectie-n                     (een frame dat wordt verborgen als die sectie niet bestaat)
//   #afbeelding                                 (een vorm of frame dat de afbeelding als vulling krijgt)

figma.showUI(__html__, { width: 360, height: 560, themeColors: true });

figma.clientStorage.getAsync('instellingen').then(function (instellingen) {
  figma.ui.postMessage({ type: 'instellingen', instellingen: instellingen || {} });
});

figma.ui.onmessage = async function (msg) {
  try {
    if (msg.type === 'bewaar-instellingen') {
      await figma.clientStorage.setAsync('instellingen', msg.instellingen);
    } else if (msg.type === 'tel-selectie') {
      figma.ui.postMessage({ type: 'selectie-aantal', aantal: figma.currentPage.selection.length, verzoek: msg.verzoek });
    } else if (msg.type === 'vul-selectie') {
      await vulSelectie(msg.paginas);
    } else if (msg.type === 'maak-voorbeeldkaart') {
      await maakVoorbeeldkaart(msg.pagina);
    } else if (msg.type === 'melding') {
      figma.notify(msg.tekst, { error: !!msg.fout });
    }
  } catch (e) {
    figma.notify('Er ging iets mis: ' + (e && e.message ? e.message : e), { error: true });
  }
  figma.ui.postMessage({ type: 'klaar' });
};

// paginas: één pagina voor alle geselecteerde lagen, of één pagina per geselecteerde laag (shuffle).
async function vulSelectie(paginas) {
  const selectie = figma.currentPage.selection;
  if (selectie.length === 0) {
    figma.notify('Selecteer eerst een of meer frames met lagen als #titel of #intro.');
    return;
  }
  let gevuld = 0;
  for (let i = 0; i < selectie.length; i++) {
    const pagina = paginas.length === 1 ? paginas[0] : paginas[i % paginas.length];
    gevuld += await vulNode(selectie[i], pagina);
  }
  if (gevuld === 0) {
    figma.notify('Geen lagen gevonden met een naam als #titel, #intro of #afbeelding.');
  } else {
    figma.notify(gevuld + ' lagen gevuld met content van thuisarts.nl');
  }
}

async function vulNode(root, pagina) {
  const waarden = maakWaarden(pagina);
  const nodes = [root];
  if ('findAll' in root) {
    for (const n of root.findAll(function (n) { return n.name.trim().charAt(0) === '#'; })) nodes.push(n);
  }

  let afbeeldingHash = null;
  let gevuld = 0;
  for (const node of nodes) {
    const sleutel = node.name.trim().toLowerCase();
    if (sleutel.charAt(0) !== '#') continue;
    const naam = sleutel.slice(1);

    if (naam === 'afbeelding') {
      if (!pagina.afbeelding || !('fills' in node)) continue;
      if (!afbeeldingHash) afbeeldingHash = figma.createImage(pagina.afbeelding).hash;
      node.fills = [{ type: 'IMAGE', scaleMode: 'FILL', imageHash: afbeeldingHash }];
      gevuld++;
      continue;
    }

    const sectie = /^sectie-(\d+)$/.exec(naam);
    if (sectie) {
      node.visible = Number(sectie[1]) <= pagina.secties.length;
      continue;
    }

    if (node.type !== 'TEXT') continue;
    if (!(naam in waarden)) {
      // Een genummerde laag zonder content op deze pagina (bijv. #kop-6 bij 4 secties): verbergen.
      if (/-\d+$/.test(naam)) node.visible = false;
      continue;
    }
    await zetTekst(node, waarden[naam]);
    node.visible = true;
    gevuld++;
  }
  return gevuld;
}

function maakWaarden(pagina) {
  const w = {
    titel: pagina.titel,
    onderwerp: pagina.onderwerp,
    intro: pagina.intro,
    url: pagina.url.replace(/^https:\/\/www\./, ''),
  };
  pagina.secties.forEach(function (s, i) {
    w['kop-' + (i + 1)] = s.kop;
    w['tekst-' + (i + 1)] = s.tekst;
  });
  pagina.situaties.forEach(function (s, i) {
    w['situatie-' + (i + 1)] = s;
  });
  for (const k in w) if (!w[k]) delete w[k];
  return w;
}

async function zetTekst(node, tekst) {
  const fonts = node.characters.length > 0
    ? node.getRangeAllFontNames(0, node.characters.length)
    : [node.fontName];
  await Promise.all(fonts.map(function (f) { return figma.loadFontAsync(f); }));
  node.characters = tekst;
}

async function maakVoorbeeldkaart(pagina) {
  const regular = { family: 'Inter', style: 'Regular' };
  const bold = { family: 'Inter', style: 'Bold' };
  await Promise.all([figma.loadFontAsync(regular), figma.loadFontAsync(bold)]);

  const kaart = figma.createFrame();
  kaart.name = 'Thuisarts-kaart';
  kaart.layoutMode = 'VERTICAL';
  kaart.primaryAxisSizingMode = 'AUTO';
  kaart.counterAxisSizingMode = 'FIXED';
  kaart.resize(400, 100);
  kaart.paddingTop = kaart.paddingBottom = kaart.paddingLeft = kaart.paddingRight = 24;
  kaart.itemSpacing = 12;
  kaart.cornerRadius = 12;
  kaart.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
  kaart.strokes = [{ type: 'SOLID', color: { r: 0.88, g: 0.88, b: 0.86 } }];

  const afbeelding = figma.createRectangle();
  afbeelding.name = '#afbeelding';
  afbeelding.resize(352, 200);
  afbeelding.cornerRadius = 8;
  afbeelding.fills = [{ type: 'SOLID', color: { r: 0.93, g: 0.93, b: 0.91 } }];
  kaart.appendChild(afbeelding);

  function tekst(naam, font, grootte, kleur) {
    const t = figma.createText();
    t.name = naam;
    t.fontName = font;
    t.fontSize = grootte;
    t.characters = naam;
    t.fills = [{ type: 'SOLID', color: kleur }];
    t.layoutAlign = 'STRETCH';
    t.textAutoResize = 'HEIGHT';
    return t;
  }
  const groen = { r: 0.008, g: 0.216, b: 0.161 };
  const grijs = { r: 0.3, g: 0.3, b: 0.3 };

  kaart.appendChild(tekst('#onderwerp', regular, 13, grijs));
  kaart.appendChild(tekst('#titel', bold, 24, groen));
  kaart.appendChild(tekst('#intro', regular, 15, groen));
  for (let i = 1; i <= 3; i++) {
    const sectie = figma.createFrame();
    sectie.name = '#sectie-' + i;
    sectie.layoutMode = 'VERTICAL';
    sectie.primaryAxisSizingMode = 'AUTO';
    sectie.layoutAlign = 'STRETCH';
    sectie.itemSpacing = 4;
    sectie.fills = [];
    sectie.appendChild(tekst('#kop-' + i, bold, 16, groen));
    sectie.appendChild(tekst('#tekst-' + i, regular, 14, grijs));
    kaart.appendChild(sectie);
  }
  kaart.appendChild(tekst('#url', regular, 12, grijs));

  const midden = figma.viewport.center;
  kaart.x = Math.round(midden.x - 200);
  kaart.y = Math.round(midden.y - 300);
  figma.currentPage.appendChild(kaart);
  figma.currentPage.selection = [kaart];
  figma.viewport.scrollAndZoomIntoView([kaart]);

  if (pagina) await vulNode(kaart, pagina);
  figma.notify('Voorbeeldkaart gemaakt. Hernoem lagen in je eigen ontwerp op dezelfde manier.');
}
