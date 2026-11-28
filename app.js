'use strict';
const $ = (s, r = document) => r.querySelector(s);
let E = null, marca = null, version = null, universo = [], porT = new Map();
// la version con la que se cargo ESTE fichero
const MIA = document.currentScript?.src ? new URL(document.currentScript.src).searchParams.get('v') : null;
let motor = null, mio = { yo: null, alarmas: [], seguidas: [] };
let ruta = { v: 'inicio', t: null };
const op = { pag: {}, franja: 'pre', plazo: 'hoy', ptab: 'resumen', cuenta: 'todas', peques: false, suelo: 'normales', filtro: 'mercado', orden: 'cap_desc', sector: '', tam: 'todos', busca: '', vista: 'fav', quien: 'todos', rango: 'd1', sobre: 'foto', explorar: 'mov', mov: 'sube', etf: 'btc', periodo: 'mes', semana: 0, agtipo: 'todo', agtodas: '' };
let idea = null, viendo = null, graf = null; // idea que se esta dibujando / idea que se esta mirando
let mensajes = [], ultimoId = 0, adjunto = { imagen: null, t: null }, chatCargado = false;

// ---------- utiles ----------
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fin = (x) => typeof x === 'number' && Number.isFinite(x);
const sg = (x, d = 2) => (fin(x) ? (x > 0 ? '+' : '') + x.toFixed(d) + '%' : '—');
const cls = (x) => (!fin(x) ? 'mut' : x >= 0 ? 'up' : 'dn');
const col = (x) => (x >= 0 ? 'var(--up)' : 'var(--dn)');
const tono = (x) => (x > 0 ? 'var(--up)' : x < 0 ? 'var(--dn)' : 'var(--gold)');
const dinero = (x) => {
  if (x === null || x === '' || !Number.isFinite(+x)) return '—';
  const n = +x, d = Math.abs(n) >= 10000 ? 0 : Math.abs(n) < 1 ? 4 : Math.abs(n) < 10 ? 3 : 2;
  return n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
};
const SIN_DOLAR = /^(NQ=F|ES=F|\^VIX|VIX|BONO10|DXY|NQ|ES|\^TNX|DX-Y\.NYB)$/;
const usd = (x, t) => { const d = dinero(x); return d === '—' || (t && SIN_DOLAR.test(t)) ? d : d.startsWith('-') ? '-$' + d.slice(1) : '$' + d; };
const corto = (x) => { if (!fin(x)) return '—'; const a = Math.abs(x), s = x < 0 ? '-' : ''; return s + (a >= 1e12 ? (a / 1e12).toFixed(2) + '\u00a0B' : a >= 1e9 ? (a / 1e9).toFixed(a >= 1e10 ? 0 : 1) + '\u00a0mil\u00a0M' : a >= 1e6 ? (a / 1e6).toFixed(0) + '\u00a0M' : Math.round(a).toLocaleString(LOC)); };
const hace = (ts) => { const m = Math.round((Date.now() - ts) / 60000); return m < 1 ? 'ahora' : m < 60 ? `hace ${m} min` : m < 1440 ? `hace ${Math.round(m / 60)} h` : `hace ${Math.round(m / 1440)} d`; };
const falta = (ts) => { const m = Math.round((ts - Date.now()) / 60000); return m <= 0 ? 'ya salió' : m < 60 ? `en ${m} min` : m < 1440 ? `en ${Math.floor(m / 60)} h ${m % 60} m` : `en ${Math.round(m / 1440)} días`; };
const hue = (t) => [...String(t)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 360, 7);
const hhmm = (d) => d.toLocaleTimeString(LOC, { hour: '2-digit', minute: '2-digit' });
const diaLargo = (d) => d.toLocaleDateString(LOC, { weekday: 'long', day: 'numeric', month: 'long' });
const diaCorto = (d) => d.toLocaleDateString(LOC, { day: 'numeric', month: 'short' });
const mayus = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const animoTxt = (a) => (a >= 35 ? 'Muy positivo' : a >= 10 ? 'Positivo' : a > -10 ? 'Neutro' : a > -35 ? 'Negativo' : 'Muy negativo');
const animoTono = (a) => (a >= 10 ? 1 : a <= -10 ? -1 : 0);
const miedoTxt = (v) => (v < 25 ? 'Miedo extremo' : v < 45 ? 'Miedo' : v <= 55 ? 'Neutral' : v <= 75 ? 'Codicia' : 'Codicia extrema');
const miedoCol = (v) => (v < 25 ? '#ff5236' : v < 45 ? '#ff9a3d' : v <= 55 ? '#ffd23d' : v <= 75 ? '#bfe45a' : '#6fe36b');
const RUTA_ID = /^[A-Z0-9][A-Z0-9.=-]{0,11}$/;

// ---------- iconos ----------
const TRAZOS = {
  copa: 'M8 4h8v5a4 4 0 0 1-8 0zM8 6H4v1a4 4 0 0 0 4 4M16 6h4v1a4 4 0 0 1-4 4M12 13v4M8 21h8M10 17h4v4h-4z',
  casa: 'M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10', campana: 'M6 9a6 6 0 0 1 12 0c0 6 2.5 7 2.5 7h-17S6 15 6 9M10 20a2.2 2.2 0 0 0 4 0',
  ojo: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', rayo: 'M13 2L4 14h7l-1 8 9-12h-7z',
  calendario: 'M4 5h16v16H4zM4 10h16M8 3v4M16 3v4', chat: 'M21 12a8 8 0 0 1-8 8H4l2-3.2A8 8 0 1 1 21 12z',
  lupa: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4', clip: 'M4 5h16v14H4zM8.5 11a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM5 18l5-5 3 3 3-3 4 4',
  enviar: 'M4 12l16-8-6 16-3-6z', x: 'M6 6l12 12M18 6L6 18', basura: 'M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13', mas: 'M12 5v14M5 12h14',
  grafica: 'M4 19V5M4 19h16M7 15l4-5 3 3 5-7', resultados: 'M5 20V10M12 20V4M19 20v-7', sector: 'M3 21V10l6 4v-4l6 4V4h5v17z',
  ventas: 'M3 4h3l2.5 11h10L21 7H7M9 20h.01M17 20h.01', analistas: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 12h.01',
  acuerdos: 'M8 12l3 3a2 2 0 0 0 3 0l5-5-4-4-3 2-3-2-6 5 3 4M9 18l-2-2', legal: 'M12 3v18M6 21h12M5 7h14M5 7l-3 7a3 3 0 0 0 6 0zM19 7l-3 7a3 3 0 0 0 6 0z',
  directivos: 'M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0', dinero: 'M12 3v18M16 7.5C15 6 13.5 5.5 12 5.5c-2.2 0-4 1.2-4 3s1.5 2.6 4 3.2 4 1.5 4 3.3-1.8 3.2-4 3.2c-1.7 0-3.3-.7-4.2-2',
  producto: 'M12 3c4 2 6 5.500 6 10l-3 3H9l-3-3c0-4.500 2-8 6-10zM12 11h.01M9 17l-1 4 4-2 4 2-1-4', competencia: 'M5 3l14 14M19 3L5 17M3 19l2 2M21 19l-2 2',
  mercado: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c6 6 6 12 0 18-6-6-6-12 0-18', nota: 'M6 3h9l4 4v14H6zM9 12h7M9 16h7',
  fuego: 'M12 22c4 0 7-2.7 7-7 0-5-5-7-4-12-4 2-6 6-5 9-1.5-.5-2-2-2-3-2 2-3 4-3 6 0 4.3 3 7 7 7z', pulso: 'M3 12h4l2.5-7 5 14 2.5-7h4',
  lapiz: 'M4 20l1-4L16 5l3 3L8 19zM14 7l3 3', linea: 'M5 19L19 5M5 19h.01M19 5h.01', flecha: 'M5 19L18 6M10 6h8v8', nivel: 'M3 12h18M3 7h2M19 17h2', zona: 'M4 7h16v10H4z', texto: 'M5 6h14M12 6v13', deshacer: 'M9 7L4 12l5 5M4 12h10a6 6 0 0 1 0 12',
  gente: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 6.500M17.500 14a6.500 6.500 0 0 1 4 6',
  estrella: 'M12 3l2.7 5.8 6.3.7-4.7 4.3 1.3 6.2L12 16.8 6.4 20l1.3-6.2L3 9.5l6.3-.7z',
  // engranaje de Lucide (licencia ISC)
  ajustes: 'M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2zM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z',
  moneda: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.5 8h4a2 2 0 0 1 0 4h-4zm0 4h4.500a2 2 0 0 1 0 4H9.500zM11 6v2m0 8v2',
};
const ico = (n) => `<svg class="ico" viewBox="0 0 24 24"><path d="${TRAZOS[n] || TRAZOS.nota}"/></svg>`;

// ---------- datos ----------
const P = () => E?.pulso || {};
const activo = (id) => (P().activos || []).find((a) => a.id === id);
const monedaDe = (s) => (P().cripto?.monedas || []).find((c) => c.s === s);
const ACTIVO_ALARMA = { NQ: 'NQ=F', ES: 'ES=F', BTC: 'BTC-USD', ETH: 'ETH-USD', ORO: 'GC=F', CRUDO: 'CL=F' };
const alias = (t) => Object.keys(ACTIVO_ALARMA).find((k) => ACTIVO_ALARMA[k] === t) || (t.endsWith('-USD') ? t.slice(0, -4) : t);
const enlace = (t) => { if (t.endsWith('-USD')) { const s = t.slice(0, -4); return activo(s) ? '#activo/' + s : '#moneda/' + s; } const a = alias(t); return a !== t ? '#activo/' + a : '#accion/' + t; };
const fichaDe = (t) => {
  if (E?.fichas?.[t]) return E.fichas[t];
  const u = porT.get(t);
  return u ? { logo: u[2], cap: u[5], semana: u[7], mes: u[8], ytd: u[9], sector: u[10], per: u[11], rvol: u[12] } : {};
};
function empresa(t) {
  const q = E?.quotes?.[t], r = (E?.radar || []).find((x) => x.t === t), u = porT.get(t), f = fichaDe(t);
  const a = alias(t) !== t ? activo(alias(t)) : null, m = t.endsWith('-USD') ? monedaDe(t.slice(0, -4)) : null;
  return {
    t, q, f, corto: alias(t),
    nombre: m?.nombre || a?.nombre || q?.nombre || r?.nombre || f.nombre || u?.[1] || t,
    precio: q?.ultimo ?? a?.precio ?? m?.precio ?? r?.precio ?? u?.[3] ?? null,
    pct: q?.pct ?? a?.pct ?? m?.dia ?? r?.pct ?? u?.[4] ?? null,
    cerebro: E?.cerebro?.[t] || r?.cerebro || null,
    velas: q?.velas || a?.velas || null,
  };
}
function logo(t, extra = '') {
  const m = t.endsWith('-USD') ? monedaDe(t.slice(0, -4)) : null;
  const l = fichaDe(t).logo || porT.get(t)?.[2] || (P().resultados || []).find((r) => r.t === t)?.logo || [...(P().etf?.btc || []), ...(P().etf?.eth || [])].find((f) => f.t === t)?.logo || '';
  const src = m && /^https:\/\/[a-z0-9.-]*coingecko\.com\//.test(m.img) ? m.img : /^[a-z0-9-]+$/.test(l) ? `https://s3-symbol-logo.tradingview.com/${l}--big.svg` : '';
  const txt = esc(alias(t).slice(0, 4));
  return `<span class="emp ${extra}" data-t="${txt}" style="--h:${hue(t)}">${src ? `<img src="${esc(src)}" alt="" loading="lazy" onerror="this.parentNode.textContent=this.parentNode.dataset.t">` : txt}</span>`;
}
const alarmasDe = (t) => mio.alarmas.filter((a) => a.t === t && !a.disparada);
const activas = () => mio.alarmas.filter((a) => !a.disparada);
const seguida = (t) => mio.seguidas.find((s) => s.t === t);
const mias = () => [...new Set([...(E?.orden || []), ...mio.seguidas.map((x) => x.t), ...activas().map((x) => x.t), ...(mio.cartera || []).filter((x) => !x.vendida).map((x) => x.t), ...(mio.opciones || []).filter((o) => !o.cerrada).map((o) => o.t), ...(mio.perfiles || []).flatMap((p) => (Array.isArray(p.favoritas) ? p.favoritas : []))])];
const distancia = (a) => { const p = empresa(a.t).precio; return p ? ((+a.nivel - p) / p) * 100 : null; };

// ---------- perfiles ----------
const perfil = (q) => (mio.perfiles || []).find((p) => p.nombre === q) || {};
const apodo = (q) => perfil(q).apodo || q || '';
const colorDe = (q) => (/^#[0-9a-f]{6}$/i.test(perfil(q).color || '') ? perfil(q).color : `hsl(${hue(q || '?')} 62% 68%)`);
const fotoValida = (f) => /^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(f || '');
const logoDe = (f) => (/^logo:(crypto\/XTVC[A-Z0-9]+|[a-z0-9-]+)$/.test(f || '') ? `https://s3-symbol-logo.tradingview.com/${f.slice(5)}--big.svg` : null);
function dentroAvatar(q, foto) {
  if (fotoValida(foto)) return `<img src="${foto}" alt="">`;
  if (!monoDe(foto) && logoDe(foto)) return `<img src="${logoDe(foto)}" alt="">`;
  return esc((apodo(q) || '?')[0].toUpperCase());
}
const claseMono = (f) => (monoDe(f) ? 'mono mono-' + monoDe(f) : '');
const avatar = (q, tam = '') => `<span class="ava ${tam} ${claseMono(perfil(q).foto)}" style="--c:${colorDe(q)}" title="${esc(apodo(q))}">${dentroAvatar(q, perfil(q).foto)}</span>`;
// portadas: fotos libres (Unsplash) y obras de dominio publico (cuadros y telescopios, via Wikimedia Commons)
const TEMAS = { jets: 'Jets y yates', coches: 'Supercoches', lujo: 'Vida de lujo', mansiones: 'Mansiones', japon: 'Japón y neón', espacio: 'Espacio', arte: 'Cuadros', ciudades: 'Ciudades', naturaleza: 'Naturaleza', mercados: 'Mercados' };
// [clave, nombre, foto, encuadre vertical en %]: el encuadre evita que la banda ancha corte lo importante
const FOTOS = Object.fromEntries(Object.entries({
  jets: [['jet-sol', 'Jet al atardecer', '1474302770737-173ee21bab63', 32], ['jet', 'Jet privado', '1540962351504-03099e0a754b', 35], ['pista-sol', 'Pista al atardecer', '1542296332-2e4473faf563', 18], ['aterriza', 'Aterrizaje de noche', '1520437358207-323b43b50729', 58], ['ala-sol', 'Ala al sol', '1506012787146-f92b2d7d6d96'], ['nubes-oro', 'Nubes de oro', '1500835556837-99ac94a94552'], ['ventanilla', 'Desde la ventanilla', '1488085061387-422e29b40080'], ['yate', 'Yate', '1567899378494-47b22a2ae96a', 38], ['megayate', 'Megayate', '1569263979104-865ab7cd8d13', 45], ['puerto', 'Puerto deportivo', '1562281302-809108fd533c', 35], ['estela', 'Estela al atardecer', '1593351415075-3bac9f45c877'], ['lancha-sol', 'Lancha en el lago', '1520255870062-bd79d3865de7'], ['lancha', 'Alta mar', '1605281317010-fe5ffe798166', 40]],
  coches: [['r8-sol', 'Audi R8 al atardecer', '1493238792000-8113da705763'], ['f8-sol', 'Ferrari al sol', '1592198084033-aade902d1aae', 66], ['monaco', 'Mónaco', '1617814076367-b759c7d7e738'], ['huracan-sombra', 'Huracán en la sombra', '1519245659620-e859806a8d3b', 66], ['bentley', 'Bentley', '1618418721668-0d1f72aa4bab'], ['mercedes-negro', 'Mercedes en negro', '1485291571150-772bcfc10da5'], ['aston', 'Aston bajo el puente', '1535732820275-9ffd998cac22', 86], ['aston-cabrio', 'Aston descapotable', '1469285994282-454ceb49e63c', 76], ['amg-franja', 'AMG', '1514316454349-750a7fd3da3a'], ['bugatti-noche', 'Chiron de noche', '1544636331-e26879cd4d9b', 56], ['bugatti-blanco', 'Bugatti blanco', '1627454820516-dc767bcb4d3e', 55], ['bugatti-frente', 'Chiron de frente', '1600712242805-5f78671b24da', 76], ['rolls', 'Rolls en Dubái', '1631295868223-63265b40d9e4', 66], ['f8', 'Ferrari F8', '1614200187524-dc4b892acf16', 62], ['laferrari', 'LaFerrari', '1583121274602-3e2820c69888', 66], ['ferrari-amarillo', 'Ferrari amarillo', '1503736334956-4c8f8e92946d'], ['aventador-azul', 'Aventador azul', '1621135802920-133df287f89c'], ['aventador-naranja', 'Aventador naranja', '1532581140115-3e355d1ed1de'], ['aventador', 'Aventador en el bosque', '1525609004556-c46c7d6cf023', 64], ['huracan', 'Huracán amarillo', '1511919884226-fd3cad34687c', 64], ['huracan-blanco', 'Huracán blanco', '1544829099-b9a0c07fad1a'], ['huracan-ruta', 'Huracán en ruta', '1580414057403-c5f451f30e1c'], ['porsche', 'Panamera', '1503376780353-7e6692767b70'], ['clasico', 'Mustang clásico', '1584345604476-8ec5e12e42dd'], ['coleccion', 'La colección', '1526726538690-5cbf956ae2fd']],
  lujo: [['submariner', 'Rolex', '1587836374828-4dbafa94cf0e'], ['relojes', 'La colección de relojes', '1609587312208-cea54be969e7'], ['reloj-mar', 'Reloj frente al mar', '1533139502658-0198f920d8e8', 84], ['old-fashioned', 'Old fashioned', '1470337458703-46ad1756a187'], ['brindis', 'Brindis', '1519671482749-fd09be7ccebf'], ['suite-vistas', 'Suite con vistas', '1578683010236-d716f9a3f461'], ['suite-clasica', 'Suite clásica', '1590490360182-c33d57733427'], ['terraza', 'Terraza al amanecer', '1445019980597-93fa8acb246c'], ['maldivas', 'Maldivas', '1573843981267-be1999ff37cd'], ['villas-mar', 'Villas sobre el mar', '1514282401047-d79a71a590e8'], ['santorini', 'Santorini', '1533105079780-92b9be482077'], ['golf', 'Golf', '1535131749006-b7f58c99034b', 28]],
  mansiones: [['resort-rosa', 'Cielo rosa', '1551882547-ff40c63fe5fa'], ['mansion-noche', 'Mansión de noche', '1564501049412-61c2a3083791'], ['villa-curva', 'Villa en la colina', '1622015663319-e97e697503ee'], ['casa-negra', 'Casa de autor', '1600585154526-990dced4db0d', 40], ['mansion-mar', 'Villa con piscina', '1580587771525-78b9dba3b914'], ['casa-piscina', 'Casa blanca', '1602343168117-bb8ffe3e2e9f', 66], ['infinita', 'Piscina infinita', '1540541338287-41700207dee6'], ['deck', 'Atardecer en la piscina', '1582719508461-905c673771fd'], ['palmas', 'Palmeras y agua', '1610641818989-c2051b5e2cfd'], ['palmeral', 'Resort tropical', '1520250497591-112f2f40a3f4'], ['resort', 'Resort', '1566073771259-6a8506099945', 40], ['salon', 'Salón', '1600566753086-00f18fb6b3ea', 56]],
  japon: [['tokio-neon', 'Tokio de neón', '1540959733332-eab4deabeeaf'], ['tokio-carteles', 'Carteles de Shinjuku', '1503899036084-c55cdd92da26'], ['tokio-calle', 'Cruce en Tokio', '1542051841857-5f90071e7989'], ['farolillos', 'Farolillos', '1528360983277-13d401cdc186'], ['callejon', 'Callejón', '1554797589-7241bb691973'], ['kioto', 'Kioto', '1493976040374-85c8e12f0c0e'], ['pagoda', 'Pagoda', '1545569341-9eb8b30979d9'], ['torii', 'Torii en el lago', '1492571350019-22de08371fd3', 38], ['torre-tokio', 'Torre de Tokio', '1513407030348-c983a97b98d8'], ['fuji', 'Monte Fuji', '1490806843957-31f4c9a91c65', 76]],
  espacio: [['webb-acantilados', 'Acantilados cósmicos (Webb)', 'w:NASA%E2%80%99s_Webb_Reveals_Cosmic_Cliffs,_Glittering_Landscape_of_Star_Birth.jpg'], ['webb-pilares', 'Pilares de la creación (Webb)', 'w:Pillars_of_Creation_(NIRCam_Image).jpg'], ['cielo', 'Vía Láctea', '1502134249126-9f3755a50d78'], ['nucleo', 'Centro de la galaxia', '1538370965046-79c0d6907d47'], ['estrellas', 'Cielo violeta', '1419242902214-272b3f66ee7a'], ['polvo', 'Polvo de estrellas', '1465101162946-4377e57745c3'], ['via', 'Observador', '1444703686981-a3abbc4d4fe3'], ['luces-tierra', 'Luces desde el espacio', '1446776653964-20c1d3a81b06'], ['nebulosa', 'Nebulosa', '1462331940025-496dfbfc7564'], ['tierra', 'La Tierra', '1451187580459-43490279c0fa'], ['galaxia', 'Noche estrellada', '1519681393784-d120267933ba']],
  arte: [['gran-ola', 'La gran ola · Hokusai', 'w:Tsunami_by_hokusai_19th_century.jpg', 42], ['fuji-rojo', 'Fuji rojo · Hokusai', 'w:Red_Fuji_southern_wind_clear_morning.jpg', 32], ['noche-vangogh', 'La noche estrellada · Van Gogh', 'w:Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg'], ['trigal', 'Trigal con cuervos · Van Gogh', 'w:Vincent_van_Gogh_-_Wheatfield_with_crows_-_Google_Art_Project.jpg'], ['sol-naciente', 'Sol naciente · Monet', 'w:Claude_Monet,_Impression,_soleil_levant.jpg', 30], ['caminante', 'El caminante · Friedrich', 'w:Caspar_David_Friedrich_-_Wanderer_above_the_sea_of_fog.jpg', 18], ['temerario', 'El Temerario · Turner', 'w:Turner,_J._M._W._-_The_Fighting_T%C3%A9m%C3%A9raire_tugged_to_her_last_Berth_to_be_broken.jpg', 60], ['tormenta', 'Tormenta en el mar · Rembrandt', 'w:Rembrandt_Christ_in_the_Storm_on_the_Lake_of_Galilee.jpg'], ['babel', 'Torre de Babel · Bruegel', 'w:Pieter_Bruegel_the_Elder_-_The_Tower_of_Babel_(Vienna)_-_Google_Art_Project_-_edited.jpg'], ['domingo', 'Domingo en el parque · Seurat', 'w:A_Sunday_on_La_Grande_Jatte,_Georges_Seurat,_1884.jpg', 44]],
  ciudades: [['hongkong', 'Hong Kong', '1536599018102-9f803c140fc1'], ['ny-naranja', 'Nueva York al atardecer', '1534430480872-3498386e7856'], ['empire', 'Empire State', '1485871981521-5b1fd3805eee', 40], ['dubai', 'Dubái', '1512453979798-5ea266f8880c'], ['burj', 'Burj Al Arab', '1518684079-3c830dcef090'], ['singapur', 'Singapur', '1565967511849-76a60a516170'], ['paris', 'París', '1502602898657-3e91760cbb34', 40], ['londres', 'Londres', '1513635269975-59663e0ac1ad'], ['ciudad-noche', 'Ciudad de noche', '1444723121867-7a241cacace9'], ['neon', 'Calle de neón', '1519608487953-e999c86e7455'], ['manhattan', 'Manhattan', '1480714378408-67cf0d13bc1b'], ['rascacielos', 'Rascacielos', '1514565131-fce0801e5785'], ['avenida', 'Avenida', '1449824913935-59a10b8d2000']],
  naturaleza: [['aurora-boreal', 'Aurora boreal', '1531366936337-7c912a4589a7'], ['aurora-verde', 'Aurora sobre el bosque', '1483347756197-71ef80e95f73'], ['alaska', 'Valle nevado', '1464822759023-fed622ff2c3b'], ['bosque', 'Bosque', '1441974231531-c6227db76b6e'], ['sierras', 'Sierras en la niebla', '1500534314209-a25ddb2bd429'], ['oleaje', 'Oleaje desde arriba', '1505142468610-359e7d316be0'], ['cascada', 'Cascada', '1433086966358-54859d0ed716'], ['cumbres', 'Cumbres', '1506905925346-21bda4d32df4'], ['lago', 'Lago', '1493246507139-91e8fad9978e'], ['valle', 'Valle', '1472214103451-9374bd1c798e'], ['atardecer', 'Atardecer', '1542281286-9e0a16bb7366'], ['playa', 'Playa', '1507525428034-b723cf961d3e'], ['niebla', 'Niebla', '1470071459604-3b5ec3a7fe05']],
  mercados: [['criptomonedas', 'Criptomonedas', '1621504450181-5d356f61d307'], ['oro', 'Lingotes', '1610375461246-83df859d849d'], ['movil-bolsa', 'La bolsa en la mano', '1624996379697-f01d168b1a52'], ['velas', 'Velas', '1611974789855-9c2a0a7236a3'], ['pantalla', 'Pantallas', '1590283603385-17ffb3a7f29f'], ['bitcoin', 'Bitcoin', '1518546305927-5a555bb7020d', 86], ['circuito', 'Circuito', '1550751827-4bd374c3f58b']],
}).flatMap(([tema, l]) => l.map(([k, n, src, pos]) => [k, { tema, n, src, pos: pos ?? 50 }])));
const POR_DEFECTO = 'webb-acantilados';
const fotoUrl = (k, ancho = 1600) => {
  const { src } = FOTOS[k] || FOTOS[POR_DEFECTO];
  return src.startsWith('w:') ? `https://commons.wikimedia.org/wiki/Special:FilePath/${src.slice(2)}?width=${ancho <= 330 ? 330 : ancho <= 960 ? 960 : 1920}` : `https://images.unsplash.com/photo-${src}?w=${ancho}&q=75&auto=format&fit=crop`;
};
const nombrePortada = (v) => { const n = String(v || '').slice(6); return FOTOS[n] ? n : POR_DEFECTO; };
const encuadre = (k) => `center ${(FOTOS[k] || FOTOS[POR_DEFECTO]).pos}%`;
const fondoDe = (p) => { const propia = fotoValida(p?.portada), k = nombrePortada(p?.portada); return { clase: '', estilo: `background-image:url('${propia ? p.portada : fotoUrl(k)}');background-position:${propia ? 'center' : encuadre(k)}` }; };
// la foto de cada apartado
const CABECERA = { inicio: 'hongkong', empresas: 'ny-naranja', explorar: 'tokio-carteles', cripto: 'criptomonedas', calendario: 'kioto', miedo: 'tormenta', alarmas: 'webb-acantilados', seguimiento: 'webb-pilares', ideas: 'gran-ola', analisis: 'gran-ola', cartera: 'jet-sol', nuestro: 'cielo' };
// recorta una imagen en banda ancha; pos (0 a 1) elige que parte se queda
function recortarPortada(img, pos) {
  const FORMA = 3.2;
  const ancha = img.width / img.height > FORMA;
  const w = ancha ? img.height * FORMA : img.width, h = ancha ? img.height : img.width / FORMA;
  const x = ancha ? (img.width - w) * pos : 0, y = ancha ? 0 : (img.height - h) * pos;
  let ancho = Math.min(1400, Math.round(w)), calidad = 0.9, url = '';
  for (let i = 0; i < 14; i++) {
    const c = document.createElement('canvas'), g = c.getContext('2d');
    c.width = ancho; c.height = Math.round(ancho / FORMA);
    g.imageSmoothingQuality = 'high'; g.drawImage(img, x, y, w, h, 0, 0, c.width, c.height);
    url = c.toDataURL('image/webp', calidad);
    if (!url.startsWith('data:image/webp')) url = c.toDataURL('image/jpeg', calidad);
    if (url.length <= 200000) return url;
    if (calidad > 0.66) calidad -= 0.08; else ancho = Math.round(ancho * 0.86);
  }
  throw new Error('La imagen es demasiado grande');
}
let alPegar = null;
document.addEventListener('paste', (e) => {
  if (!alPegar || !$('#ed')) return;
  const f = [...(e.clipboardData?.files || [])].find((x) => x.type.startsWith('image/'));
  if (f) { e.preventDefault(); alPegar(f); }
});
// monogramas para quien no quiera foto
const MONOS = ['grafito', 'zafiro', 'esmeralda', 'vino', 'bronce', 'perla'];
const monoDe = (f) => (/^logo:mono-[a-z]+$/.test(f || '') && MONOS.includes(f.slice(10)) ? f.slice(10) : null);
const favoritas = (q) => (Array.isArray(perfil(q).favoritas) ? perfil(q).favoritas.filter((t) => RUTA_ID.test(t)) : []);
const perfilVacio = () => ({ apodo: '', frase: '', color: null, foto: null, portada: 'fondo:grafico', favoritas: [], ...perfil(mio.yo) });
async function guardarPerfil(cambios) {
  const { apodo: n, frase, color, foto, portada, favoritas: f, detalles } = { ...perfilVacio(), ...cambios };
  const sobre = Object.fromEntries(Object.entries(detalles || {}).filter(([, v]) => v !== undefined && v !== ''));
  await motor.perfilGuardar({ apodo: n || '', frase: frase || '', color, foto, portada, favoritas: (f || []).slice(0, 30), ...(hayDetalles() ? { detalles: sobre } : {}) });
  await refrescarMio(true);
}
// reduce una imagen hasta que quepa
async function comprimir(archivo, lado, tope, cuadrada) {
  const img = await createImageBitmap(archivo);
  let calidad = 0.9, url = '';
  for (let i = 0; i < 12; i++) {
    const c = document.createElement('canvas'), g = c.getContext('2d');
    if (cuadrada) { const m = Math.min(img.width, img.height); c.width = c.height = Math.min(lado, m); g.drawImage(img, (img.width - m) / 2, (img.height - m) / 2, m, m, 0, 0, c.width, c.height); }
    else { const k = Math.min(1, lado / Math.max(img.width, img.height)); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.imageSmoothingQuality = 'high'; g.drawImage(img, 0, 0, c.width, c.height); }
    url = c.toDataURL('image/webp', calidad);
    if (!url.startsWith('data:image/webp')) url = c.toDataURL('image/jpeg', calidad);
    if (url.length <= tope) return url;
    lado *= 0.85; calidad = Math.max(0.6, calidad - 0.05);
  }
  throw new Error('La imagen es demasiado grande');
}
const COLORES_PERFIL = ['#5aa9ff', '#36c48f', '#f0a67a', '#c98bdb', '#e2b65c', '#e06a7e', '#8fa3bd', '#e9edf3'];
function editarPerfil(seccion) {
  if (E?.db && !motor.nube) return pedirClave();
  const p = perfilVacio();
  p.detalles = { ...detallesDe(mio.yo) };
  const secciones = [['identidad', 'directivos', 'Identidad'], ['portada', 'clip', 'Portada'], ...(hayDetalles() ? [['sobre', 'nota', 'Sobre mí']] : []), ['favoritas', 'estrella', 'Favoritas']];
  const mias2 = () => guarda.leer('mis-portadas', []).filter(fotoValida);
  let tab = secciones.some(([k]) => k === seccion) ? seccion : 'identidad', tema = fotoValida(p.portada) ? 'mias' : FOTOS[nombrePortada(p.portada)].tema;
  let paraQue = 'foto', recorte = null, pos = 0.5;
  const m = abrir('<div id="ed"></div>');
  $('.ventana', m).classList.add('ancha');
  const vista = () => {
    const f = fondoDe(p), d = p.detalles, l = [ESTILOS[d.estilo], d.riesgo != null ? RIESGOS[d.riesgo] : null, d.lugar].filter(Boolean);
    $('#ed-vista', m).innerHTML = `<div class="ev-portada" style="${f.estilo}"></div><span class="ev-ava"><span class="ava xl ${claseMono(p.foto)}" style="--c:${p.color || colorDe(mio.yo)}">${dentroAvatar(mio.yo, p.foto)}</span></span><b>${esc(p.apodo || mio.yo)}</b><p>${esc(p.frase || 'Tu frase aparecerá aquí')}</p>
      <div class="pf-chips">${l.map((x) => `<span>${esc(x)}</span>`).join('')}</div>${d.bio ? `<small>${esc(d.bio)}</small>` : ''}<div class="ev-favs">${(p.favoritas || []).slice(0, 6).map((t) => logo(t, 's')).join('')}</div>`;
  };
  const paneles = {
    identidad: () => `<label class="etq" for="p-apodo">Cómo te llamas aquí</label><input class="campo" id="p-apodo" maxlength="24" value="${esc(p.apodo)}" placeholder="${esc(mio.yo)}">
      <label class="etq" for="p-frase">Tu frase</label><input class="campo" id="p-frase" maxlength="160" value="${esc(p.frase)}" placeholder="Por ejemplo: aquí se compra con miedo">
      <label class="etq">Foto</label><div class="opciones"><button class="btn peq pri" data-pf="subir">Subir una foto</button><button class="btn peq" data-pf="quitar">Quitar foto</button></div>
      <div class="opciones">${MONOS.map((n) => `<button class="mono-m mono-${n} ${p.foto === 'logo:mono-' + n ? 'act' : ''}" data-mono="${n}" title="${n}">${esc((p.apodo || mio.yo || '?')[0].toUpperCase())}</button>`).join('')}</div>
      <input class="campo" id="p-logo" placeholder="…o el logo de una empresa o moneda" autocomplete="off"><div id="p-logos" class="ed-lista" hidden></div>
      <label class="etq">Tu color</label><div class="opciones">${COLORES_PERFIL.map((c) => `<button class="muestra ${p.color === c ? 'act' : ''}" data-pcolor="${c}" style="--c:${c}"></button>`).join('')}</div>`,
    portada: () => `<div class="opciones"><button class="btn peq pri" data-pf="portada">Subir imagen</button><span class="dim">o copia cualquier imagen y pégala con Ctrl+V</span></div>${recorte ? `<label class="recorte">Qué parte se ve<input type="range" id="p-pos" min="0" max="100" value="${Math.round(pos * 100)}"></label>` : ''}
      <div class="ed-temas">${[['mias', 'Mis imágenes'], ...Object.entries(TEMAS)].map(([k, n]) => `<button data-tema="${k}" class="${tema === k ? 'act' : ''}">${n}</button>`).join('')}</div>
      ${tema === 'mias' ? (mias2().length || fotoValida(p.portada) ? `<div class="fotos-m">${[...new Set([...(fotoValida(p.portada) ? [p.portada] : []), ...mias2()])].map((u, i) => `<button class="${p.portada === u ? 'act' : ''}" data-mia="${i}" style="background-image:url('${u}')"></button>`).join('')}</div>` : '<p class="nota-c">Copiad una imagen de Pinterest o de donde queráis y pegadla aquí con Ctrl+V. Se queda guardada.</p>') : `<div class="fotos-m">${Object.entries(FOTOS).filter(([, x]) => x.tema === tema).map(([k, x]) => `<button class="${!fotoValida(p.portada) && nombrePortada(p.portada) === k ? 'act' : ''}" data-pfondo="${k}" style="background-image:url('${fotoUrl(k, 330)}');background-position:${encuadre(k)}"><span>${x.n}</span></button>`).join('')}</div>`}`,
    sobre: () => { const d = p.detalles; return `<label class="etq" for="p-bio">Sobre ti</label><textarea class="campo" id="p-bio" maxlength="280" rows="3" placeholder="Qué buscas, qué te gusta, qué has aprendido">${esc(d.bio || '')}</textarea>
      <label class="etq">Tu estilo</label><div class="opciones">${Object.entries(ESTILOS).map(([k, n]) => `<button class="elige ${d.estilo === k ? 'act' : ''}" data-estilo="${k}">${n}</button>`).join('')}</div>
      <label class="etq">Cuánto te arriesgas</label><div class="opciones">${RIESGOS.map((n, i) => `<button class="elige ${d.riesgo === i ? 'act' : ''}" data-riesgo="${i}">${n}</button>`).join('')}</div>
      <label class="etq" for="p-objetivo">Tu meta</label><input class="campo" id="p-objetivo" maxlength="80" value="${esc(d.objetivo || '')}" placeholder="Por ejemplo: llegar a 10.000">
      <div class="ed-dos"><div><label class="etq" for="p-desde">Inviertes desde</label><input class="campo" id="p-desde" maxlength="20" value="${esc(d.desde || '')}" placeholder="2024"></div><div><label class="etq" for="p-lugar">Desde dónde</label><input class="campo" id="p-lugar" maxlength="30" value="${esc(d.lugar || '')}" placeholder="Madrid"></div></div>`; },
    favoritas: () => `<label class="etq">Mis favoritas</label><div class="opciones">${(p.favoritas || []).map((t) => `<button class="chip fav-chip" data-fuera="${esc(t)}">${logo(t, 'xs')} ${esc(alias(t))} ✕</button>`).join('') || '<span class="dim">Ninguna todavía</span>'}</div>
      <input class="campo" id="p-fav" placeholder="Añadir favorita…" autocomplete="off"><div id="p-favs" class="ed-lista" hidden></div>`,
  };
  const pinta = () => {
    const ed = $('#ed', m);
    ed.innerHTML = `<h2>Mi perfil</h2><div class="ed-cols"><aside id="ed-vista" class="ed-vista"></aside><div class="ed-panel"><div class="ed-pestanas">${secciones.map(([k, i, n]) => `<button data-edtab="${k}" class="${tab === k ? 'act' : ''}">${ico(i)}<span>${n}</span></button>`).join('')}</div><div class="ed-cuerpo">${paneles[tab]()}</div></div></div>
      <input type="file" id="p-file" accept="image/*" hidden><div class="error" id="err"></div><button class="btn pri ancho" data-pf="guardar">Guardar perfil</button>`;
    vista();
    const escribe = (id, pon) => { const el = $(id, ed); if (el) el.oninput = () => { pon(el.value); vista(); }; };
    escribe('#p-apodo', (v) => { p.apodo = v; }); escribe('#p-frase', (v) => { p.frase = v; });
    for (const k of ['bio', 'objetivo', 'desde', 'lugar']) escribe('#p-' + k, (v) => { p.detalles[k] = v; });
    const deslizador = $('#p-pos', ed);
    if (deslizador) deslizador.oninput = () => { pos = deslizador.value / 100; p.portada = recortarPortada(recorte, pos); vista(); };
    if ($('#p-logo', ed)) conectarBuscador($('#p-logo', ed), $('#p-logos', ed), 'data-logofoto');
    if ($('#p-fav', ed)) conectarBuscador($('#p-fav', ed), $('#p-favs', ed), 'data-masfav');
  };
  const ponPortada = async (archivo) => { try { recorte = await createImageBitmap(archivo); pos = 0.5; p.portada = recortarPortada(recorte, pos); tab = 'portada'; tema = 'mias'; pinta(); } catch (err) { $('#err', m).textContent = err.message || 'No puedo leer esa imagen'; } };
  alPegar = ponPortada;
  m.onclick = async (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    const d = b.dataset;
    if (d.edtab) tab = d.edtab;
    else if (d.tema) tema = d.tema;
    else if (d.mia) { const l = [...new Set([...(fotoValida(p.portada) ? [p.portada] : []), ...mias2()])]; p.portada = l[+d.mia] || p.portada; recorte = null; }
    else if (d.estilo) p.detalles.estilo = p.detalles.estilo === d.estilo ? undefined : d.estilo;
    else if (d.riesgo) p.detalles.riesgo = p.detalles.riesgo === +d.riesgo ? undefined : +d.riesgo;
    else if (d.mono) p.foto = 'logo:mono-' + d.mono;
    else if (d.logofoto) { const l = fichaDe(d.logofoto).logo || porT.get(d.logofoto)?.[2]; const moneda = monedaDe(d.logofoto.replace('-USD', '')); if (l) p.foto = 'logo:' + l; else if (moneda) p.foto = 'logo:crypto/XTVC' + moneda.s; else { $('#err', m).textContent = 'Ese no tiene logo disponible.'; return; } }
    else if (d.pcolor) p.color = d.pcolor;
    else if (d.pfondo) { p.portada = 'fondo:' + d.pfondo; recorte = null; }
    else if (d.masfav) { p.favoritas = [...new Set([...(p.favoritas || []), d.masfav])]; }
    else if (d.fuera) p.favoritas = p.favoritas.filter((t) => t !== d.fuera);
    else if (d.pf === 'quitar') p.foto = null;
    else if (d.pf === 'subir' || d.pf === 'portada') {
      paraQue = d.pf === 'subir' ? 'foto' : 'portada';
      const file = $('#p-file', m);
      file.onchange = async () => { if (paraQue === 'portada') return ponPortada(file.files[0]); try { p.foto = await comprimir(file.files[0], 360, 80000, true); pinta(); } catch (err) { $('#err', m).textContent = err.message || 'No puedo leer esa imagen'; } };
      file.click(); return;
    } else if (d.pf === 'guardar') {
      b.disabled = true;
      try { await guardarPerfil(p); if (fotoValida(p.portada)) { try { guarda.poner('mis-portadas', [p.portada, ...mias2().filter((u) => u !== p.portada)].slice(0, 6)); } catch { /* sin sitio en este dispositivo */ } } m.onclick = null; cerrar(); pintar(); toast('Perfil guardado'); } catch (err) { $('#err', m).textContent = err.message; b.disabled = false; }
      return;
    } else return;
    e.stopPropagation();
    const y = $('.ventana', m).scrollTop; pinta(); $('.ventana', m).scrollTop = y;
  };
  pinta();
}


// ---------- los dos ----------
const gente = () => [...new Set([mio.yo, ...(mio.gente || []), ...mio.alarmas.map((a) => a.por), ...(mio.ideas || []).map((i) => i.por), ...(mio.cartera || []).map((c) => c.por)].filter(Boolean))];
const cara = (q) => avatar(q, 'xs');
const deQuien = (l) => (op.quien === 'todos' ? l : l.filter((x) => x.por === op.quien));
const filtroGente = () => (gente().length > 1 ? `<div class="seg">${[['todos', 'Los dos'], ...gente().map((q) => [q, q === mio.yo ? 'Solo yo' : apodo(q)])].map(([k, n]) => `<button data-op="quien" data-k="${esc(k)}" class="${op.quien === k ? 'act' : ''}">${esc(n)}</button>`).join('')}</div>` : '');

// ---------- cartera: lo que cada uno tiene de verdad, apuntado a mano ----------
function posiciones(lista) {
  const m = new Map();
  for (const c of lista) {
    if (c.vendida) continue; // lo vendido ya no se tiene: va al historial (cartera.js)
    const p = m.get(c.t) || { t: c.t, cantidad: 0, coste: 0, lotes: [] };
    p.cantidad += +c.cantidad; p.coste += +c.cantidad * +c.precio; p.lotes.push(c); m.set(c.t, p);
  }
  return [...m.values()].map((p) => {
    const x = empresa(p.t), precio = +x.precio || p.coste / p.cantidad;
    const valor = p.cantidad * precio, hoy = fin(x.pct) ? valor - valor / (1 + x.pct / 100) : 0;
    return { ...p, x, precio, valor, hoy, gana: valor - p.coste, pct: p.coste ? ((valor - p.coste) / p.coste) * 100 : 0, medio: p.coste / p.cantidad };
  }).sort((a, b) => b.valor - a.valor);
}
const totales = (l) => l.reduce((a, p) => ({ valor: a.valor + p.valor, coste: a.coste + p.coste, hoy: a.hoy + p.hoy, gana: a.gana + p.gana }), { valor: 0, coste: 0, hoy: 0, gana: 0 });
const oculto = () => guarda.leer('ocultar', false);
const plata = (v, signo) => (oculto() ? '••••' : (signo && v > 0 ? '+' : v < 0 ? '-' : '') + Math.abs(v).toLocaleString(LOC, { useGrouping: 'always', maximumFractionDigits: Math.abs(v) < 1000 ? 2 : 0 }) + '\u00a0$');
const PALETA = ['#5aa9ff', '#36c48f', '#e2b65c', '#c98bdb', '#f0766a', '#5fd0d8', '#f0a67a', '#8fa3bd', '#9bd06a', '#6b7788'];
// un solo "Añadir": acciones o cripto, o una opcion (put o call) de la misma empresa
const conOpcionesAlta = (t) => hayOpciones() && /^[A-Z.]{1,6}$/.test(t || '');
const tiposAlta = (t, act) => (conOpcionesAlta(t) ? `<div class="seg ancho-s tipos-alta">${[['acc', 'Acciones'], ['put', '▼ Put'], ['call', '▲ Call']].map(([k, n]) => `<button type="button" data-altatipo="${k}" data-t="${esc(t)}" class="${act === k ? 'act' : ''}">${n}</button>`).join('')}</div>` : '');
function nuevaPosicion(t) {
  if (E?.db && !motor.nube) return pedirClave();
  if (!t) {
    const populares = [...new Set([...favoritas(mio.yo), ...mias(), 'BTC-USD', 'ETH-USD', 'AMZN', 'GOOGL', 'META'])].filter((x) => !x.includes('=')).slice(0, 12);
    const m = abrir(`<span class="paso">Paso 1 de 2</span><h2>¿Qué has comprado?</h2><p class="dim alta-sub">Acciones, cripto u opciones</p><input class="campo" id="qc" placeholder="Busca por nombre o símbolo" autocomplete="off"><div id="rc" class="resultados-c" hidden></div>
      <div id="pop"><span class="etq">Rápido</span><div class="rapido-c">${populares.map((x) => `<button data-tengo="${esc(x)}">${logo(x)}<b>${esc(alias(x))}</b></button>`).join('')}</div></div>`);
    const q = $('#qc', m);
    q.addEventListener('input', () => { $('#pop', m).hidden = !!q.value.trim(); });
    conectarBuscador(q, $('#rc', m), 'data-tengo');
    q.focus();
    return;
  }
  const x = empresa(t), actual = +x.precio || 0;
  let modo = guarda.leer('modo-compra', 'dinero') === 'cantidad' ? 'cantidad' : 'dinero';
  const m = abrir(`<span class="paso">Paso 2 de 2</span><div class="elegida">${logo(t, 'xl')}<b>${esc(x.nombre)}</b><span class="num">${esc(x.corto)} · ${usd(actual)} <i class="${cls(x.pct)}">${sg(x.pct)}</i></span></div>
    ${tiposAlta(t, 'acc')}
    <div class="seg ancho-s"><button data-modo="dinero" class="${modo === 'dinero' ? 'act' : ''}">Sé cuánto dinero puse</button><button data-modo="cantidad" class="${modo === 'cantidad' ? 'act' : ''}">Sé cuántas tengo</button></div>
    <label class="etq" for="v1" id="e1">${modo === 'dinero' ? 'Dinero invertido (dólares)' : 'Cantidad (valen decimales)'}</label><div class="con-sufijo"><input class="campo num" id="v1" type="number" step="any" min="0" inputmode="decimal" placeholder="0"><span id="s1">${modo === 'dinero' ? '$' : 'uds'}</span></div>
    <label class="etq" for="compra">Precio al que compraste</label><div class="con-sufijo"><input class="campo num" id="compra" type="number" step="any" min="0" inputmode="decimal" value="${actual ? +actual.toPrecision(7) : ''}"><button type="button" id="hoy">Precio de hoy</button></div>
    ${hayNivel9() ? `<label class="etq" for="fcompra">¿Cuándo lo compraste?</label><input class="campo num" id="fcompra" type="date" max="${hoyNY()}" value="${hoyNY()}">` : ''}
    <div class="vista-previa" id="prev"></div>
    <div class="error" id="err"></div><button class="btn pri ancho" id="apunta">Guardar en mi cartera</button><button class="btn ancho" data-posicion="1" style="margin-top:8px">Elegir otra</button>
    <p class="nota-c">La veis los dos. Es solo un apunte: aquí no se compra ni se vende nada.</p>`);
  const cuenta = () => {
    const v = +$('#v1', m).value, precio = +$('#compra', m).value;
    const cantidad = modo === 'dinero' ? (precio > 0 ? v / precio : 0) : v;
    return { cantidad, precio };
  };
  const previa = () => {
    const { cantidad, precio } = cuenta();
    if (!(cantidad > 0) || !(precio > 0)) { $('#prev', m).innerHTML = '<span class="dim">Escribe la cantidad para ver el resumen</span>'; return; }
    const puesto = cantidad * precio, vale = cantidad * (actual || precio), g = vale - puesto;
    $('#prev', m).innerHTML = `<div><small>Tienes</small><b class="num">${+cantidad.toFixed(6)}</b></div><div><small>Vale ahora</small><b class="num">${plata(vale)}</b></div><div><small>Ganancia</small><b class="num ${cls(g)}">${plata(g, true)}</b></div>`;
  };
  m.querySelectorAll('[data-modo]').forEach((b) => { b.onclick = () => { modo = b.dataset.modo; guarda.poner('modo-compra', modo); m.querySelectorAll('[data-modo]').forEach((y) => y.classList.toggle('act', y === b)); $('#e1', m).textContent = modo === 'dinero' ? 'Dinero invertido (dólares)' : 'Cantidad (valen decimales)'; $('#s1', m).textContent = modo === 'dinero' ? '$' : 'uds'; $('#v1', m).value = ''; previa(); $('#v1', m).focus(); }; });
  let precioMio = false;
  $('#v1', m).oninput = previa; $('#compra', m).oninput = () => { precioMio = true; previa(); };
  pideVelas(t);
  // al elegir la fecha se pone el precio de ese dia, salvo que ya hayas escrito el tuyo
  if ($('#fcompra', m)) $('#fcompra', m).onchange = (e) => { const d = pideVelas(t)?.d || [], v = [...d].reverse().find((x) => fechaVela(t, x[0]) <= e.target.value); if (v && !precioMio) { $('#compra', m).value = +v[1].toPrecision(7); previa(); } };
  $('#hoy', m).onclick = () => { $('#compra', m).value = +actual.toPrecision(7); previa(); };
  previa();
  $('#apunta', m).onclick = async () => {
    const { cantidad, precio } = cuenta();
    if (!(cantidad > 0) || !(precio > 0)) { $('#err', m).textContent = 'Falta la cantidad o el precio.'; return; }
    $('#apunta', m).disabled = true;
    try { await motor.carteraPoner(t, +cantidad.toFixed(8), precio, $('#fcompra', m)?.value || null); await refrescarMio(true); cerrar(); pintar(); toast('Guardado en tu cartera: ' + x.corto); }
    catch (e) { $('#err', m).textContent = e.message; $('#apunta', m).disabled = false; }
  };
  $('#v1', m).focus();
}
function actividad() {
  const l = [
    ...mio.alarmas.map((a) => ({ ts: Date.parse(a.disparada || a.creada), por: a.por, t: a.t, texto: a.disparada ? `saltó su alarma de ${alias(a.t)} a ${usd(a.nivel, a.t)}` : `puso una alarma: ${alias(a.t)} ${a.dir === 'sube' ? 'sube' : 'baja'} a ${usd(a.nivel, a.t)}`, va: '#alarmas' })),
    ...(mio.ideas || []).map((i) => ({ ts: Date.parse(i.creada), por: i.por, t: i.t, texto: i.dir === 'neutral' ? `cree que ${alias(i.t)} se queda en rango (${i.confianza ?? 50}% seguro)` : `cree que ${alias(i.t)} va a ${i.dir === 'sube' ? 'subir' : 'bajar'} (${i.confianza ?? 50}% seguro)`, va: enlace(i.t), id: i.id })),
    ...mio.seguidas.map((x) => ({ ts: Date.parse(x.creada) || 0, por: x.por, t: x.t, texto: `empezó a seguir ${alias(x.t)}`, va: enlace(x.t) })),
    ...(mio.cartera || []).map((c) => (c.vendida ? { ts: Date.parse(String(c.vendida).slice(0, 10) + 'T21:00:00Z'), por: c.por, t: c.t, texto: `vendió ${alias(c.t)}`, va: '#cartera' } : { ts: Date.parse(c.creada), por: c.por, t: c.t, texto: `apuntó ${alias(c.t)} en su cartera`, va: '#cartera' })),
    ...(mio.opciones || []).map((o) => ({ ts: Date.parse(o.creada), por: o.por, t: o.t, texto: `apuntó un ${o.tipo} de ${alias(o.t)}`, va: '#cartera' })),
  ];
  return l.filter((x) => x.ts).sort((a, b) => b.ts - a.ts);
}

// ---------- dibujos ----------
function chispa(vals, sube, id) {
  if (!vals || vals.length < 2) return '<svg class="chispa"></svg>';
  const paso = Math.max(1, Math.floor(vals.length / 60)), a = vals.filter((_, i) => i % paso === 0 || i === vals.length - 1);
  const mn = Math.min(...a), r = Math.max(...a) - mn || 1, c = sube ? '#36c48f' : '#f26670', g = 'g' + String(id).replace(/\W/g, '');
  const p = a.map((v, i) => `${((i / (a.length - 1)) * 120).toFixed(1)},${(31 - ((v - mn) / r) * 28).toFixed(1)}`).join(' ');
  return `<svg class="chispa" viewBox="0 0 120 34" preserveAspectRatio="none"><defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c}" stop-opacity=".28"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></linearGradient></defs><polygon points="0,34 ${p} 120,34" fill="url(#${g})"/><polyline points="${p}" fill="none" stroke="${c}" stroke-width="1.6" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>`;
}
const polar = (cx, cy, r, g) => [cx + r * Math.cos((g * Math.PI) / 180), cy + r * Math.sin((g * Math.PI) / 180)];
const arco = (cx, cy, r, a, b) => { const [x1, y1] = polar(cx, cy, r, a), [x2, y2] = polar(cx, cy, r, b); return `M${x1.toFixed(1)} ${y1.toFixed(1)}A${r} ${r} 0 ${b - a > 180 ? 1 : 0} 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`; };
function dial(titulo, d, pie) {
  if (!d) return `<div class="dial"><div class="vacio">${ico('pulso')}<div>${titulo}: sin datos todavía.</div></div></div>`;
  const zonas = [[0, 25], [25, 45], [45, 55], [55, 75], [75, 100]];
  const marcas = Array.from({ length: 51 }, (_, i) => { const g = 180 + i * 3.6, [x1, y1] = polar(150, 150, 104, g), [x2, y2] = polar(150, 150, i % 5 ? 98 : 92, g); return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="rgba(233,237,243,.25)"/>`; }).join('');
  const antes = [['Ayer', d.ayer], ['Semana', d.semana], ['Mes', d.mes], ...(fin(d.anio) ? [['Año', d.anio]] : [])].filter(([, v]) => fin(v));
  return `<div class="dial"><svg viewBox="0 0 300 168">${zonas.map(([a, b]) => `<path d="${arco(150, 150, 128, 180 + a * 1.8 + 0.8, 180 + b * 1.8 - 0.8)}" fill="none" stroke="${miedoCol((a + b) / 2)}" stroke-width="${d.valor >= a && d.valor <= b ? 24 : 12}" stroke-opacity="${d.valor >= a && d.valor <= b ? 1 : 0.3}"/>`).join('')}${marcas}
    <g class="aguja" style="transform:rotate(${d.valor * 1.8 - 90}deg)"><path d="M146.5 150L150 38L153.5 150Z" fill="#e9edf3"/></g><circle cx="150" cy="150" r="12" fill="#0b0e13" stroke="#e9edf3" stroke-width="3"/></svg>
    <div class="valor" style="color:${miedoCol(d.valor)}">${d.valor}</div><div class="nombre">${miedoTxt(d.valor)}</div><small>${titulo}${pie ? ' · ' + pie : ''}</small>
    <div class="antes">${antes.map(([n, v]) => `<div><i style="--c:${miedoCol(v)}">${v}</i>${n}</div>`).join('')}</div></div>`;
}
function anillo(valor, color, centro, tam = 1) {
  const L = 2 * Math.PI * 52, parte = L * 0.75, v = Math.max(0.02, Math.min(1, valor));
  return `<div class="anillo"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="52" fill="none" stroke="rgba(233,237,243,.1)" stroke-width="${9 * tam}" stroke-linecap="round" stroke-dasharray="${parte} ${L}"/><circle class="arco" cx="60" cy="60" r="52" fill="none" stroke="${color}" stroke-width="${9 * tam}" stroke-linecap="round" stroke-dasharray="${(parte * v).toFixed(1)} ${L}"/></svg><div>${centro}</div></div>`;
}
function donut(trozos, centro) {
  const L = 2 * Math.PI * 48, total = trozos.reduce((s, [v]) => s + v, 0) || 1;
  let ya = 0;
  return `<div class="donut"><svg viewBox="0 0 120 120">${trozos.map(([v, c]) => { const largo = (v / total) * L, s = `<circle cx="60" cy="60" r="48" fill="none" stroke="${c}" stroke-width="15" stroke-dasharray="${Math.max(0, largo - 2).toFixed(1)} ${L}" stroke-dashoffset="${(-ya).toFixed(1)}"/>`; ya += largo; return s; }).join('')}</svg><span>${centro}</span></div>`;
}
function historia(puntos, color, zonas) {
  if (!puntos || puntos.length < 2) return '';
  const vals = puntos.map((p) => p[1]), mn = zonas ? 0 : Math.min(...vals) * 0.95, mx = zonas ? 100 : Math.max(...vals) * 1.05;
  const X = (i) => (i / (puntos.length - 1)) * 1000, Y = (v) => 195 - ((v - mn) / (mx - mn || 1)) * 185;
  const linea = puntos.map((p, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(p[1]).toFixed(1)}`).join('');
  const fondo = zonas ? [[0, 25], [25, 45], [45, 55], [55, 75], [75, 100]].map(([a, b]) => `<rect x="0" width="1000" y="${Y(b)}" height="${Y(a) - Y(b)}" fill="${miedoCol((a + b) / 2)}" opacity=".09"/>`).join('') : '';
  return `<svg class="historia" viewBox="0 0 1000 200" preserveAspectRatio="none">${fondo}<path d="${linea}" fill="none" stroke="${color}" stroke-width="2.2" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg><div class="eje-h"><span>${diaCorto(new Date(puntos[0][0]))}</span><span>${zonas ? '' : `mín ${dinero(Math.min(...vals))} · máx ${dinero(Math.max(...vals))}`}</span><span>hoy</span></div>`;
}

// ---------- burbujas: circulos empaquetados, tamaño segun el movimiento ----------
let campos = [];
function burbujas(items, id) {
  campos.push({ id, items });
  return `<div class="campo-b" id="${id}"></div>`;
}
function colocarBurbujas() {
  for (const { id, items, tipo } of campos) {
    const el = $('#' + id);
    if (!el || !el.clientWidth) continue;
    if (tipo === 'mosaico') { colocarMosaico(el, items); continue; }
    const W = el.clientWidth, H = el.clientHeight, estira = W / H;
    const max = Math.max(...items.map((x) => Math.abs(x.pct) || 0), 1);
    const c = items.map((x) => ({ ...x, r: 34 + 46 * Math.sqrt((Math.abs(x.pct) || 0) / max) })).sort((a, b) => b.r - a.r);
    const puestos = [];
    for (const b of c) {
      for (let a = 0, d = 0; ; a += 0.35, d += 0.9) {
        b.x = Math.cos(a) * d * Math.max(0.6, estira * 0.9); b.y = Math.sin(a) * d * Math.min(1.5, 1 / Math.max(0.5, estira * 0.7));
        if (puestos.every((o) => Math.hypot(o.x - b.x, o.y - b.y) > o.r + b.r + 5)) break;
        if (d > 3000) break;
      }
      puestos.push(b);
    }
    const x1 = Math.min(...puestos.map((b) => b.x - b.r)), x2 = Math.max(...puestos.map((b) => b.x + b.r));
    const y1 = Math.min(...puestos.map((b) => b.y - b.r)), y2 = Math.max(...puestos.map((b) => b.y + b.r));
    const k = Math.min((W - 8) / (x2 - x1), (H - 8) / (y2 - y1), 1.7), dx = (W - (x2 - x1) * k) / 2, dy = (H - (y2 - y1) * k) / 2;
    el.innerHTML = puestos.map((b, i) => { const d = b.r * 2 * k; return `<a class="burbuja" href="${esc(b.href)}" title="${esc(b.titulo || '')}" style="--c:${col(b.pct)};--d:${d.toFixed(0)};--i:${i};left:${(dx + (b.x - b.r - x1) * k).toFixed(1)}px;top:${(dy + (b.y - b.r - y1) * k).toFixed(1)}px;width:${d.toFixed(1)}px;height:${d.toFixed(1)}px">${d > 62 ? b.logo : ''}<b>${esc(b.nombre)}</b>${d > 118 && b.titulo && b.titulo !== b.nombre ? `<small>${esc(b.titulo)}</small>` : ''}<span class="num">${sg(b.pct, d > 80 ? 2 : 1)}</span>${b.alarma ? '<i class="al"></i>' : ''}</a>`; }).join('');
  }
}
const burbujaDe = (t) => { const x = empresa(t); return { pct: x.pct ?? 0, nombre: x.corto, titulo: x.nombre, logo: logo(t), href: enlace(t), alarma: alarmasDe(t).length > 0 }; };

// ---------- bloques ----------
const sec = (icono, titulo, extra = '') => `<div class="sec"><h2>${ico(icono)} ${titulo}</h2>${extra}</div>`;
const vacio = (icono, texto, boton = '') => `<div class="vacio">${ico(icono)}<div>${texto}</div>${boton}</div>`;
const seg = (clave, opciones) => `<div class="seg">${opciones.map(([k, n]) => `<button data-op="${clave}" data-k="${k}" class="${String(op[clave]) === String(k) ? 'act' : ''}">${n}</button>`).join('')}</div>`;
function fila(t, texto) {
  const x = empresa(t);
  return `<a href="${enlace(t)}">${logo(t)}<span class="nom"><b>${esc(x.corto)}</b><small>${esc(x.nombre)}</small></span><span class="dice">${texto ?? esc(txt(x.cerebro?.claves?.[0], 'texto') || txt(x.cerebro, 'frase'))}</span>${chispa(x.velas?.map((v) => v[1]), x.pct >= 0, 'f' + t)}<span class="der num"><strong>${usd(x.precio)}</strong><span class="${cls(x.pct)}">${sg(x.pct)}</span></span></a>`;
}
const cinta = (ids) => `<div class="cinta">${ids.map(activo).filter(Boolean).map((a) => `<a href="#activo/${a.id}"><small><span>${esc(a.nombre)}</span><span class="num ${cls(a.pct)}">${sg(a.pct)}</span></small><strong class="num">${usd(a.precio, a.id)}</strong>${chispa(a.velas.slice(-96).map((v) => v[1]), a.pct >= 0, 'c' + a.id)}</a>`).join('')}</div>`;
// en los textos, el dolar no se separa de su cifra al partir la linea
const pega = (s) => String(s).replace(/\$ (?=\d)/g, '$\u00a0').replace(/(\d(?: (?:mil|millones|M|B))*) \$/g, (m) => m.replace(/ /g, '\u00a0'));
const txt = (o, campo) => pega((EN && o?.[campo === 'texto' ? 'en' : campo + '_en']) || o?.[campo] || '');
const breve = (f) => String(f || '').split(EN ? ' Biggest story' : ' Lo que más suena')[0];
const claveHTML = (k) => `<div class="clave" style="--c:${tono(k.tono)}">${ico(TRAZOS[k.tema] ? k.tema : 'nota')}<b>${esc(txt(k, 'texto'))}</b><small><em>${k.tono > 0 ? '▲ A favor' : k.tono < 0 ? '▼ En contra' : '● Neutro'}</em>${k.fuente ? esc(k.fuente) + ' · ' : ''}${k.ts ? hace(k.ts) : ''}</small></div>`;
const datosHTML = (l) => (l?.length ? `<div class="cifras">${l.map((d) => `<div style="--c:${tono(d.tono)}">${ico(TRAZOS[d.id] ? d.id : 'grafica')}<span>${esc(d.texto)}</span></div>`).join('')}</div>` : '');
function logosResultados(lista) {
  return `<div class="logos">${lista.map((r) => `<a href="#accion/${esc(r.t)}" class="${mias().includes(r.t) ? 'mia' : ''}">${logo(r.t, 's')}<span><b>${esc(nombreCorto(r.nombre))}</b><small>${esc(r.t)}${r.eps != null ? ' · esperan ' + r.eps : ''}</small></span></a>`).join('')}</div>`;
}
const nombreCorto = (n) => String(n || '').replace(/,? (inc|corp(oration)?|co|ltd|plc|holdings?|group|company|n\.v\.|s\.a\.)\.?(?= |$|,)/gi, '').replace(/ class [a-c].*$/i, '').replace(/\s*(&|and)\s*$/i, '').trim();
const diaDe = (ts) => new Date(ts).toLocaleDateString('sv-SE');

// ---------- ideas: lo que cree cada uno, dibujado ----------
// como va: con su plan, si lo tiene (analisis.js)
function resultadoIdea(i) { return resultadoAn(i); }
function herramientas() {
  const H = [['mover', 'Mover', 'grafica'], ['linea', 'Línea', 'linea'], ['flecha', 'Flecha', 'flecha'], ['nivel', 'Nivel', 'nivel'], ['zona', 'Zona', 'zona'], ['lapiz', 'Lápiz', 'lapiz'], ['texto', 'Texto', 'texto']];
  return `<div class="herramientas">${H.map(([k, n, i]) => `<button data-herr="${k}" class="${idea.h === k ? 'act' : ''}">${ico(i)}<span>${n}</span></button>`).join('')}<i></i>${COLORES_TRAZO.map((c) => `<button class="color ${idea.color === c ? 'act' : ''}" data-color="${c}" style="--c:${c}" title="Color"></button>`).join('')}<i></i><button data-deshacer="1">${ico('deshacer')}<span>Deshacer</span></button><button data-limpiar="1">${ico('basura')}<span>Borrar todo</span></button></div>`;
}
function formIdea() {
  return `<div class="form-idea"><div class="lados"><button data-lado="sube" class="${idea.dir === 'sube' ? 'act' : ''}" style="--c:var(--up)">▲ Creo que sube</button><button data-lado="baja" class="${idea.dir === 'baja' ? 'act' : ''}" style="--c:var(--dn)">▼ Creo que baja</button></div>
    <div class="confianza"><div class="seguro grande2" id="aro" style="--p:${idea.confianza};--c:${idea.dir === 'sube' ? 'var(--up)' : 'var(--dn)'}"><span class="num" id="conf-num">${idea.confianza}%</span><small>seguro</small></div><div><label for="conf">¿Cómo de seguro estás?</label><input type="range" id="conf" min="0" max="100" step="5" value="${idea.confianza}"><label for="idea-obj">Precio objetivo (opcional)</label><input class="campo num" id="idea-obj" type="number" step="any" min="0" value="${esc(idea.objetivo)}" placeholder="Se rellena con tu última flecha"></div></div>
    ${camposDibujoAn()}
    <textarea class="campo" id="idea-nota" rows="2" maxlength="300" placeholder="Explica tu idea (opcional)">${esc(idea.nota)}</textarea>
    <div class="acciones-idea"><button class="btn pri" data-publicar="1">${ico('enviar')} Publicar mi análisis</button><button class="btn" data-cancelaridea="1">Cancelar</button></div></div>`;
}

// ---------- listas largas: por paginas ----------
function paginar(lista, clave, por) {
  const total = Math.max(1, Math.ceil(lista.length / por));
  const p = Math.min(total - 1, Math.max(0, op.pag[clave] || 0));
  const items = lista.slice(p * por, (p + 1) * por);
  if (total < 2) return { items, nav: '' };
  const numeros = [...new Set([0, 1, p - 1, p, p + 1, total - 2, total - 1])].filter((n) => n >= 0 && n < total).sort((a, b) => a - b);
  let antes = -1;
  const botones = numeros.map((n) => { const salto = n - antes > 1 ? '<span class="puntos-p">…</span>' : ''; antes = n; return `${salto}<button data-pag="${clave}" data-n="${n}" class="${n === p ? 'act' : ''}">${n + 1}</button>`; }).join('');
  return { items, nav: `<nav class="paginas"><button data-pag="${clave}" data-n="${p - 1}" ${p ? '' : 'disabled'}>‹ Anterior</button>${botones}<button data-pag="${clave}" data-n="${p + 1}" ${p < total - 1 ? '' : 'disabled'}>Siguiente ›</button><small>${p * por + 1}–${p * por + items.length} de ${lista.length}</small></nav>` };
}
const filtrosEmpresas = () => ({
  todas: ['Todas', mias()],
  fav: ['★ Favoritas', favoritas(mio.yo)],
  seguidas: ['Seguidas', mio.seguidas.map((s) => s.t)],
  cartera: ['En cartera', [...new Set((mio.cartera || []).filter((c) => !c.vendida).map((c) => c.t))]],
  alarma: ['Con alarma', [...new Set(activas().map((a) => a.t))]],
});
// tabla de empresas: precio, hoy, semana, mes, tendencia y lo ultimo que pasa
function tablaEmpresas(lista) {
  return `<div class="tabla-m"><div class="tm-cab"><span>Empresa</span><span>Precio</span><span>Hoy</span><span>Semana</span><span>Mes</span><span>Tendencia</span><span></span></div>
    ${lista.map((x) => { const f = fichaDe(x.t), n = x.cerebro?.claves?.[0], al = alarmasDe(x.t).length, fav = favoritas(mio.yo).includes(x.t);
    return `<div class="tm-fila"><a class="tm-emp" href="${enlace(x.t)}">${logo(x.t)}<span class="nom"><b>${esc(x.nombre)}</b><small>${esc(x.corto)}${al ? ` · ${al} alarma${al > 1 ? 's' : ''}` : ''}${seguida(x.t) ? ' · seguida' : ''}</small></span></a>
      <span class="num tm-precio">${usd(x.precio)}</span><span class="tm-hoy"><b class="chip ${cls(x.pct)}">${sg(x.pct)}</b></span><span class="num tm-sem ${cls(f.semana)}">${sg(f.semana, 1)}</span><span class="num tm-mes ${cls(f.mes)}">${sg(f.mes, 1)}</span><span class="tm-graf">${chispa(x.velas?.map((v) => v[1]) || monedaDe(x.corto)?.linea, (x.pct ?? 0) >= 0, 't' + x.t)}</span>
      <span class="tm-acc"><button class="icono ${fav ? 'on' : ''}" data-fav="${esc(x.t)}" title="${fav ? 'Quitar de favoritas' : 'Añadir a favoritas'}">${ico('estrella')}</button><button class="icono" data-alarma="${esc(x.t)}" title="Poner alarma">${ico('campana')}</button></span>
      ${n ? `<a class="tm-noti" href="${enlace(x.t)}" style="--c:${tono(n.tono)}">${esc(txt(n, 'texto'))}</a>` : ''}</div>`; }).join('')}</div>`;
}

// ---------- todo el mercado ----------
const SECTOR_ES = { 'Electronic Technology': 'Tecnología (equipos y chips)', 'Technology Services': 'Software e internet', Finance: 'Finanzas', 'Health Technology': 'Farmacia y biotecnología', 'Health Services': 'Servicios de salud', 'Retail Trade': 'Comercio', 'Consumer Durables': 'Consumo duradero y coches', 'Consumer Non-Durables': 'Consumo básico', 'Consumer Services': 'Ocio y servicios', 'Energy Minerals': 'Petróleo y gas', 'Non-Energy Minerals': 'Minería y metales', 'Producer Manufacturing': 'Industria', 'Process Industries': 'Química y materiales', 'Industrial Services': 'Servicios industriales', 'Commercial Services': 'Servicios a empresas', 'Distribution Services': 'Distribución', Transportation: 'Transporte', Utilities: 'Luz, agua y gas', Communications: 'Telecomunicaciones', Miscellaneous: 'Otros', 'Government': 'Gobierno', ETF: 'Fondos (ETF)' };
const sectorEs = (s) => (EN ? s : SECTOR_ES[s] || s);
const TAMANOS = { todos: ['Cualquier tamaño', () => true], mega: ['Gigantes (+200 mil M)', (c) => c >= 2e11], grandes: ['Grandes (10 a 200 mil M)', (c) => c >= 1e10 && c < 2e11], medianas: ['Medianas (2 a 10 mil M)', (c) => c >= 2e9 && c < 1e10], pequenas: ['Pequeñas (menos de 2 mil M)', (c) => c > 0 && c < 2e9] };
// columna por la que se puede ordenar: [indice en la fila, texto]
const PLAZOS = { hoy: [4, 'Hoy'], semana: [7, 'Semana'], mes: [8, 'Mes'] };
const plazoI = () => (PLAZOS[op.plazo] || PLAZOS.hoy)[0];
const COLS = { nombre: [1, 'Nombre'], precio: [3, 'Precio'], hoy: [4, 'Hoy'], cap: [5, 'Capitalización'], vol: [6, 'Volumen'], rvol: [12, 'Actividad'] };
const ORDENES = {
  cap_desc: 'Mayor capitalización', cap_asc: 'Menor capitalización', hoy_desc: 'Las que más suben', hoy_asc: 'Las que más bajan', vol_desc: 'Más volumen', rvol_desc: 'Actividad fuera de lo normal',
  precio_desc: 'Precio más alto', precio_asc: 'Precio más bajo', nombre_asc: 'Nombre (A-Z)',
};
function ordenar(filas) {
  const [col, dir] = op.orden.split('_'), i = col === 'hoy' ? plazoI() : (COLS[col] || COLS.cap)[0], s = dir === 'asc' ? 1 : -1;
  return filas.sort((a, b) => {
    if (i === 1) return s * String(a[1]).localeCompare(String(b[1]));
    const x = a[i], y = b[i];
    if (x == null || y == null) return x == null ? (y == null ? 0 : 1) : -1; // sin dato, al final
    return s * (x - y);
  });
}
// fila de una empresa nuestra, con el precio mas reciente
function filaDe(t) {
  const x = empresa(t), u = porT.get(t) || [], f = fichaDe(t), m = t.endsWith('-USD') ? monedaDe(t.slice(0, -4)) : null;
  return [t, x.nombre, '', x.precio, x.pct, f.cap ?? u[5] ?? m?.cap ?? null, x.q?.volumen ?? u[6] ?? m?.vol ?? null, f.semana ?? u[7] ?? m?.semana ?? null, f.mes ?? u[8] ?? null, f.ytd ?? u[9] ?? null, f.sector || u[10] || (t.includes('-USD') ? 'Cripto' : ''), f.per ?? u[11] ?? null, f.rvol ?? u[12] ?? null];
}
const barraPlazo = () => `${seg('plazo', [['hoy', 'Hoy'], ['semana', 'Esta semana'], ['mes', 'Este mes']])}<span>${op.plazo === 'semana' ? 'Cuánto han variado en los últimos 7 días' : op.plazo === 'mes' ? 'Cuánto han variado en el último mes' : 'Cuánto varían hoy'}</span>`;
function tablaMercado(filas, desde, fija) {
  const [col, dir] = fija ? [] : op.orden.split('_');
  const titulo = (k) => (k === 'hoy' ? (PLAZOS[op.plazo] || PLAZOS.hoy)[1] : COLS[k][1]);
  const cab = (k, extra = '') => fija ? `<span class="${extra}">${titulo(k)}</span>` : `<button data-col="${k}" class="${extra} ${col === k ? 'act' : ''}">${titulo(k)}${col === k ? (dir === 'asc' ? ' ▲' : ' ▼') : ''}</button>`;
  const nuestras = new Set(mias()), favs = favoritas(mio.yo);
  return `<div class="tabla-m todo"><div class="tm-cab"><span>#</span>${cab('nombre', 'izq')}${cab('precio')}${cab('hoy')}${cab('cap')}${cab('vol')}${cab('rvol')}<span></span></div>
    ${filas.map((r, i) => { const t = r[0], n = nuestras.has(t) ? E.cerebro?.[t]?.claves?.[0] : null, fav = favs.includes(t);
    // la columna por la que se ordena se ve resaltada
    const celda = (k, clase, v) => `<span class="num ${clase} ${col === k ? 'act' : ''}">${v}</span>`;
    return `<div class="tm-fila ${nuestras.has(t) ? 'mia' : ''}"><span class="num tm-n">${desde + i + 1}</span><a class="tm-emp" href="${enlace(t)}">${logo(t)}<span class="nom"><b>${esc(nombreCorto(r[1]))}</b><small>${esc(alias(t))}${r[10] ? ' · ' + esc(sectorEs(r[10])) : ''}</small></span></a>
      ${celda('precio', 'tm-precio', usd(r[3]))}<span class="tm-hoy"><b class="chip ${cls(r[plazoI()])}">${sg(r[plazoI()])}</b></span>${celda('cap', 'tm-cap', corto(r[5]))}${celda('vol', 'tm-vol', corto(r[6]))}${celda('rvol', 'tm-rvol', fin(r[12]) ? r[12].toFixed(1) + 'x' : '—')}
      <span class="tm-acc"><button class="icono ${fav ? 'on' : ''}" data-fav="${esc(t)}" title="${fav ? 'Quitar de favoritas' : 'Añadir a favoritas'}">${ico('estrella')}</button><button class="icono" data-alarma="${esc(t)}" title="Poner alarma">${ico('campana')}</button></span>
      ${n ? `<a class="tm-noti" href="${enlace(t)}" style="--c:${tono(n.tono)}">${esc(txt(n, 'texto'))}</a>` : ''}</div>`; }).join('')}</div>`;
}

// ---------- cinco formas de ver un grupo de empresas ----------
const MODOS = { burbujas: 'Burbujas', mosaico: 'Mosaico', barras: 'Barras', anillos: 'Anillos', lista: 'Lista' };
const AJUSTES = { modo: 'burbujas', filas: 25, quieto: false, fotos: true };
const ajuste = (k) => guarda.leer('ajuste-' + k, AJUSTES[k]);
const modo = () => (MODOS[ajuste('modo')] ? ajuste('modo') : 'burbujas');
const MINIATURA = {
  burbujas: '<circle cx="9" cy="13" r="7"/><circle cx="20" cy="9" r="4.5"/><circle cx="19" cy="19" r="3.5"/>',
  mosaico: '<rect x="2" y="3" width="13" height="18" rx="2"/><rect x="17" y="3" width="9" height="10" rx="2"/><rect x="17" y="15" width="9" height="6" rx="2"/>',
  barras: '<rect x="3" y="4" width="21" height="4" rx="2"/><rect x="3" y="10" width="14" height="4" rx="2"/><rect x="3" y="16" width="8" height="4" rx="2"/>',
  anillos: '<circle cx="8" cy="12" r="5.500" fill="none" stroke="currentColor" stroke-width="2.500"/><circle cx="20" cy="12" r="5.500" fill="none" stroke="currentColor" stroke-width="2.500"/>',
  lista: '<circle cx="5" cy="6" r="2"/><circle cx="5" cy="12" r="2"/><circle cx="5" cy="18" r="2"/><rect x="10" y="5" width="15" height="2" rx="1"/><rect x="10" y="11" width="15" height="2" rx="1"/><rect x="10" y="17" width="15" height="2" rx="1"/>',
};
const dibujoModo = (k) => `<svg viewBox="0 0 28 24" width="22" height="19" fill="currentColor">${MINIATURA[k]}</svg>`;
const selectorModo = () => `<div class="modos" role="group" aria-label="Cómo verlo">${Object.entries(MODOS).map(([k, n]) => `<button data-modover="${k}" class="${modo() === k ? 'act' : ''}" title="${n}">${dibujoModo(k)}<span>${n}</span></button>`).join('')}</div>`;
const itemDe = (t) => { const x = empresa(t); return { t, nombre: x.corto, titulo: nombreCorto(x.nombre), pct: x.pct ?? 0, precio: x.precio, href: enlace(t), alarma: alarmasDe(t).length > 0 }; };
const itemU = (r) => ({ t: r[0], nombre: alias(r[0]), titulo: nombreCorto(r[1]), pct: r[4] ?? 0, precio: r[3], href: enlace(r[0]), alarma: alarmasDe(r[0]).length > 0 });
function vistaGrupo(items, id) {
  if (!items.length) return vacio('rayo', 'No hay nada que enseñar aquí todavía.');
  const m = modo(), mayor = Math.max(1, ...items.map((x) => Math.abs(x.pct)));
  if (m === 'burbujas') return burbujas(items.map((x) => ({ ...x, logo: logo(x.t) })), id);
  if (m === 'mosaico') { campos.push({ id, items, tipo: 'mosaico' }); return `<div class="mosaico" id="${id}"></div>`; }
  if (m === 'barras') return `<div class="barras-g">${[...items].sort((a, b) => b.pct - a.pct).map((x, i) => `<a href="${x.href}" style="--c:${col(x.pct)};--w:${(Math.abs(x.pct) / mayor) * 50}%;--i:${Math.min(i, 20)}">${logo(x.t, 's')}<span class="nom"><b>${esc(x.titulo)}</b><small>${esc(x.nombre)}</small></span><span class="eje"><i class="${x.pct >= 0 ? 'mas' : 'menos'}"></i></span><b class="num ${cls(x.pct)}">${sg(x.pct)}</b></a>`).join('')}</div>`;
  if (m === 'anillos') return `<div class="anillos-g">${[...items].sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct)).map((x) => `<a href="${x.href}" style="--c:${col(x.pct)};--p:${Math.max(4, (Math.abs(x.pct) / mayor) * 100).toFixed(0)}"><span class="aro-g">${logo(x.t, 'm')}</span><b>${esc(x.nombre)}</b><small>${esc(x.titulo)}</small><i class="num ${cls(x.pct)}">${sg(x.pct)}</i></a>`).join('')}</div>`;
  return tablaEmpresas(items.map((x) => empresa(x.t)));
}
// mosaico: rectangulos cuyo tamaño es lo que se mueve; se parte por la mitad del peso
function repartir(items, x, y, w, h, out) {
  if (items.length === 1) { out.push({ ...items[0], x, y, w, h }); return out; }
  const total = items.reduce((a, b) => a + b.peso, 0);
  let suma = 0, i = 0;
  while (i < items.length - 1 && suma + items[i].peso / 2 < total / 2) suma += items[i++].peso;
  i = Math.max(1, i); suma = items.slice(0, i).reduce((a, b) => a + b.peso, 0);
  const k = suma / total;
  if (w >= h) { repartir(items.slice(0, i), x, y, w * k, h, out); repartir(items.slice(i), x + w * k, y, w * (1 - k), h, out); }
  else { repartir(items.slice(0, i), x, y, w, h * k, out); repartir(items.slice(i), x, y + h * k, w, h * (1 - k), out); }
  return out;
}
function colocarMosaico(el, items) {
  const W = el.clientWidth, H = el.clientHeight, max = Math.max(1, ...items.map((x) => Math.abs(x.pct)));
  const orden = items.map((x) => ({ ...x, peso: Math.abs(x.pct) + max * 0.16 })).sort((a, b) => b.peso - a.peso);
  el.innerHTML = repartir(orden, 0, 0, W, H, []).map((b, i) => { const fuerza = 14 + (Math.abs(b.pct) / max) * 44, lado = Math.min(b.w, b.h); return `<a href="${b.href}" class="losa" title="${esc(b.titulo)}" style="--c:${col(b.pct)};--f:${fuerza.toFixed(0)}%;--i:${Math.min(i, 24)};left:${b.x.toFixed(1)}px;top:${b.y.toFixed(1)}px;width:${b.w.toFixed(1)}px;height:${b.h.toFixed(1)}px;font-size:${Math.max(10, Math.min(24, lado / 6.5)).toFixed(1)}px"><span>${lado > 84 ? logo(b.t, 's') : ''}<b>${esc(b.nombre)}</b>${lado > 120 ? `<small>${esc(b.titulo)}</small>` : ''}${lado > 34 ? `<i class="num">${sg(b.pct, 1)}</i>` : ''}</span></a>`; }).join('');
}
function ventanaAjustes() {
  const m = abrir('<div id="aj"></div>');
  $('.ventana', m).classList.add('ajustes');
  const pinta2 = () => {
    const interruptor = (k, activo, titulo, que, icono) => `<button class="aj-fila" data-aj="${k}" data-v="${activo ? 0 : 1}" role="switch" aria-checked="${activo}">${ico(icono)}<span><b>${titulo}</b><small>${que}</small></span><i class="interruptor ${activo ? 'si' : ''}"></i></button>`;
    const grupo = (k, valor, opciones) => `<div class="aj-grupo">${opciones.map(([v, n]) => `<button data-aj="${k}" data-v="${v}" class="${String(valor) === String(v) ? 'act' : ''}">${n}</button>`).join('')}</div>`;
    $('#aj', m).innerHTML = `<h2>Ajustes</h2>
      <h4>Cómo ver las empresas</h4><div class="aj-vistas">${Object.entries(MODOS).map(([k, n]) => `<button data-aj="modo" data-v="${k}" class="${modo() === k ? 'act' : ''}">${dibujoModo(k)}<span>${n}</span></button>`).join('')}</div>
      <h4>Pantalla</h4><div class="aj-caja">
        ${interruptor('movimiento', !ajuste('quieto'), 'Animaciones', 'Zoom de las portadas y transiciones', 'pulso')}
        ${interruptor('fotos', ajuste('fotos'), 'Fotos en las cabeceras', 'La imagen grande de cada apartado', 'clip')}
        ${interruptor('cifras', !oculto(), 'Ver mi dinero', 'Si lo apagas, la cartera sale tapada', 'ojo')}
      </div>
      <h4>Empresas por página</h4>${grupo('filas', ajuste('filas'), [[10, '10'], [25, '25'], [50, '50'], [100, '100']])}
      <h4>Idioma</h4>${grupo('idioma', EN ? 'en' : 'es', [['es', 'Español'], ['en', 'English']])}
      <p class="nota-c">Se guardan en este dispositivo.</p><button class="aj-nov" data-novedades="1">${ico('estrella')} Novedades</button><button class="aj-nov" data-movil="1">${ico('mas')} Instalar en el móvil</button>`;
  };
  $('#aj', m).addEventListener('click', (e) => {
    if (e.target.closest('[data-novedades]')) { e.stopPropagation(); cerrar(); ventanaNovedades(); return; }
    if (e.target.closest('[data-movil]')) { e.stopPropagation(); cerrar(); ventanaInstalar(); return; }
    const b = e.target.closest('[data-aj]');
    if (!b) return;
    e.stopPropagation();
    const k = b.dataset.aj, v = b.dataset.v;
    if (k === 'idioma') { guarda.poner('idioma', v); location.reload(); return; }
    if (k === 'cifras') guarda.poner('ocultar', v === '0');
    else if (k === 'movimiento') guarda.poner('ajuste-quieto', v === '0');
    else if (k === 'fotos') guarda.poner('ajuste-fotos', v === '1');
    else guarda.poner('ajuste-' + k, k === 'filas' ? +v : v);
    document.body.classList.toggle('quieto', ajuste('quieto'));
    const y = $('.ventana', m).scrollTop; pinta2(); $('.ventana', m).scrollTop = y; op.pag = {}; pintar();
  });
  pinta2();
}
// lo ultimo que ha cambiado, en imagenes (se abre desde el fondo de Ajustes)
// [foto, titulo, a donde lleva]. La foto es de la propia funcion: herramientas/fotos-novedades.mjs
const NOVEDADES = [
  ['Lo último', [
    ['analisis', 'Análisis con su plan', '#analisis'], ['cartera', 'Tu cartera de un vistazo', '#cartera'], ['historial', 'Vender e historial', '#cartera'],
    ['agenda', 'Lo que viene', '#calendario'], ['desb', 'Ventas desbloqueadas', '#calendario'], ['tv', 'Gráfico de TradingView', '#accion/NVDA'], ['cara', 'Cara a cara', '#comparar'], ['espera', 'Qué espera el mercado', '#accion/NVDA'], ['cadena', 'Puts y calls', '#accion/NVDA'], ['simulador', 'Simulador', '#accion/NVDA'],
    ['curva', 'La curva de tu dinero', '#cartera'], ['alarma', 'Alarma de opción', '#cartera'], ['marcador', 'Marcador de opciones', '#cartera'], ['enviar', 'Enviar al chat', '#cartera'],
    ['opciones', 'Tus opciones', '#cartera'], ['cuentas', 'Toca las publicaciones', '#inicio'],
  ]],
  ['Antes', [
    ['mercado', 'Todo el mercado', '#empresas'], ['vistas', 'Cinco formas de verlo', '#empresas'], ['panel', 'Panel de inicio', '#inicio'], ['perfil', 'Perfil con niveles', '#perfil'],
    ['portadas', 'Portadas de lujo', 'portada'], ['porcentaje', 'Alarmas por %', '#alarmas'], ['velas', 'Velas 4H · 1D · 1W · 1M', '#accion/NVDA'], ['periodo', 'Hoy · Semana · Mes', 'mueven'],
    ['centinela', 'Miedo del mercado', '#miedo'], ['reaccion', 'Reacción a resultados', '#accion/NVDA'], ['fuera', 'Antes de abrir', 'fuera'], ['calculadora', 'Calculadora', '#accion/NVDA'],
    ['mini', 'Gráficos en el chat', '#chat'], ['movil', 'En tu móvil', 'movil'], ['reglas', 'Alertas a tu gusto', '#alarmas'],
  ]],
];
function ventanaNovedades() {
  const foto = (k) => `${window.__BASE__ || ''}novedades/${EN ? 'en' : 'es'}/${k}.webp`;
  const m = abrir(`<h2>Novedades</h2><p class="nov-fecha">Noviembre 2026</p>${NOVEDADES.map(([grupo, l]) => `<h4 class="nov-t">${grupo}</h4><div class="nov">${l.map(([k, titulo, ir]) => `<button data-nov="${ir}"><img src="${foto(k)}" alt="" loading="lazy" width="620" height="388"><span>${titulo}</span></button>`).join('')}</div>`).join('')}`);
  const v = $('.ventana', m);
  v.classList.add('ancha', 'ventana-nov');
  v.addEventListener('click', (e) => {
    const b = e.target.closest('[data-nov]');
    if (!b) return;
    e.stopPropagation();
    const ir = b.dataset.nov;
    cerrar();
    if (ir === 'portada') return editarPerfil('portada');
    if (ir === 'movil') return ventanaInstalar();
    if (ir === 'fuera' || ir === 'mueven') { op.explorar = ir === 'fuera' ? 'fuera' : 'mov'; if (ruta.v === 'explorar') pintar(true); else location.hash = 'explorar'; return; }
    location.hash = ir.slice(1);
  });
}
// quien se mueve hoy, sacado del mercado entero (solo empresas con tamaño y volumen de verdad)
const MOVIMIENTOS = {
  sube: ['Las que más suben', (k) => (a, b) => b[k] - a[k], (k) => (r) => r[k] > 0],
  baja: ['Las que más bajan', (k) => (a, b) => a[k] - b[k], (k) => (r) => r[k] < 0],
  dinero: ['Donde más dinero se mueve', () => (a, b) => b[3] * b[6] - a[3] * a[6], () => () => true],
  raro: ['Actividad fuera de lo normal', () => (a, b) => b[12] - a[12], () => (r) => r[12] >= 1.5],
};
const noticiaDe = (t) => E.cerebro?.[t]?.claves?.[0] || (E.radar || []).find((x) => x.t === t)?.cerebro?.claves?.[0] || null;
function cuerpoMovimientos() {
  const [titulo, comoOrdena, comoVale] = MOVIMIENTOS[op.mov] || MOVIMIENTOS.sube;
  const k = plazoI(), orden = comoOrdena(k), vale = comoVale(k);
  const suelo = { grandes: 1e10, normales: 2e9, todas: 3e8 }[op.suelo] || 2e9;
  const lista = universo.filter((r) => r[5] >= suelo && r[6] >= 3e5 && fin(r[4]) && fin(r[3]) && r[10] !== 'ETF' && fin(r[k]) && vale(r)).sort(orden).slice(0, 48);
  if (!lista.length) return vacio('rayo', universo.length ? 'Ahora mismo no hay ninguna que cumpla.' : 'Cargando todas las empresas…');
  const podio = lista.slice(0, 3).map((r, i) => { const t = r[0], n = noticiaDe(t); return `<a class="puesto p${i + 1}" href="${enlace(t)}" style="--c:${col(r[k])}"><span class="medalla">${i + 1}</span>${logo(t, 'xl')}<b>${esc(nombreCorto(r[1]))}</b><small>${esc(t)} · ${esc(sectorEs(r[10]))}</small><strong class="num ${cls(r[k])}">${sg(r[k])}</strong><span class="num dim">${usd(r[3])} · ${corto(r[5])}</span><span class="etiquetas"><span class="chip dim">Volumen ${fin(r[12]) ? r[12] + 'x' : '—'}</span>${k === 4 ? `<span class="chip ${cls(r[7])}">Semana ${sg(r[7], 1)}</span>` : `<span class="chip ${cls(r[4])}">Hoy ${sg(r[4], 1)}</span>`}</span>${n ? `<p>${esc(txt(n, 'texto'))}</p>` : ''}</a>`; }).join('');
  const { items, nav } = paginar(lista, 'explorar', 12);
  const desde = (items.length ? lista.indexOf(items[0]) : 0);
  return `<div class="podio">${podio}</div>
    <section>${sec('pulso', titulo, selectorModo())}${vistaGrupo(lista.slice(0, 24).map((r) => ({ ...itemU(r), pct: r[k] ?? 0 })), 'campo-explorar')}</section>
    <section>${sec('resultados', 'La lista completa')}${tablaMercado(items, desde, true)}${nav}</section>`;
}

// ---------- el panel del inicio: noticias, cuentas rapidas y resultados ----------
function noticiasNuestras() {
  const vistas = new Set(), out = [];
  for (const t of [...new Set([...favoritas(mio.yo), ...mio.seguidas.map((x) => x.t), ...mias()])]) {
    for (const n of E.cerebro?.[t]?.claves || []) if (!vistas.has(n.texto)) { vistas.add(n.texto); out.push({ ...n, t }); }
  }
  const cuantas = {};
  return out.sort((a, b) => (b.ts || 0) - (a.ts || 0)).filter((n) => (cuantas[n.t] = (cuantas[n.t] || 0) + 1) <= 2).slice(0, 14);
}
function panelNoticias() {
  const l = noticiasNuestras();
  return `<article class="caja"><header><h2>${ico('nota')} Noticias</h2><small>de vuestras empresas</small></header><div class="rollo">${l.map((n) => `<a class="nota-p" href="${enlace(n.t)}" style="--c:${tono(n.tono)}">${logo(n.t, 's')}<div><small><b>${esc(alias(n.t))}</b> · ${esc(n.fuente || '')}${n.ts ? ` · ${hace(n.ts)}` : ''}</small><p>${esc(txt(n, 'texto'))}</p></div></a>`).join('') || vacio('nota', 'Sin noticias importantes ahora mismo.')}</div></article>`;
}
// la publicacion concreta; si aun no se conoce, el canal de esa cuenta
function enlaceNota(n, cuenta) {
  if (/^https:\/\/(t\.me|bsky\.app)\/[A-Za-z0-9_./-]+$/.test(n.url || '')) return n.url;
  const u = /^[A-Za-z0-9_.-]{3,80}$/.test(cuenta?.usuario || '') ? cuenta.usuario : null;
  return u ? (cuenta.red === 'bluesky' ? 'https://bsky.app/profile/' + u : 'https://t.me/s/' + u) : null;
}
function panelCuentas() {
  const R = E.redes || { cuentas: [], notas: [] };
  const nombre = (id) => R.cuentas.find((c) => c.id === id)?.nombre || id;
  if (op.cuenta !== 'todas' && !R.cuentas.some((c) => c.id === op.cuenta)) op.cuenta = 'todas';
  const l = R.notas.filter((n) => op.cuenta === 'todas' || n.cuenta === op.cuenta).slice(0, 30);
  const tickers = (s) => [...new Set([...String(s).matchAll(/\$([A-Z]{1,5})\b/g)].map((m) => m[1]).filter((t) => porT.has(t)))].slice(0, 3);
  return `<article class="caja directo"><header><h2><i class="late"></i> En directo</h2><small>cuentas que seguimos, solo lo importante</small></header>
    <div class="cuentas">${[['todas', 'Todas'], ...R.cuentas.map((c) => [c.id, c.nombre])].map(([k, n]) => `<button data-op="cuenta" data-k="${esc(k)}" class="${op.cuenta === k ? 'act' : ''}">${k === 'todas' ? '' : `<i style="--h:${hue(k)}">${esc(n[0])}</i>`}${esc(n)}</button>`).join('')}</div>
    <div class="rollo">${l.map((n) => { const url = enlaceNota(n, R.cuentas.find((c) => c.id === n.cuenta)); return `<div class="tuit ${n.peso >= 8 ? 'fuerte' : ''} ${url ? 'abre' : ''}"><i class="cara" style="--h:${hue(n.cuenta)}">${esc(nombre(n.cuenta)[0])}</i><div><small><b>${esc(nombre(n.cuenta))}</b> · ${hace(n.ts)}${n.peso >= 8 ? ' · <em>Importante</em>' : ''}</small><p>${esc(pega(EN ? n.texto : n.es || n.texto))}</p>${url ? `<a class="tuit-ir" href="${esc(url)}" target="_blank" rel="noopener noreferrer">Ver la publicación ↗</a>` : ''}${tickers(n.texto).length ? `<span class="etiquetas">${tickers(n.texto).map((t) => `<a class="chip dim" href="${enlace(t)}">${logo(t, 'xs')} ${esc(t)}</a>`).join('')}</span>` : ''}</div></div>`; }).join('') || vacio('chat', R.cuentas.length ? 'Nada importante en las últimas horas.' : 'Las cuentas aparecen en la próxima actualización.')}</div></article>`;
}
// ---------- ventas desbloqueadas: cuando pueden vender los de dentro tras salir a bolsa (informes/desbloqueos.json, PM 26-11) ----------
const QUIEN_DESB = { empleados: 'Empleados', inversores: 'Inversores', directivos: 'Directivos', todos: 'Todos' };
const GRADO_DESB = { oficial: 'Oficial', prensa: 'Según prensa', estimado: 'Calculado' };
const diaDesb = (f) => new Date(f + 'T12:00:00').toLocaleDateString(LOC, { day: 'numeric', month: 'short', year: '2-digit' });
const cuantoDesb = (x) => (x.pct != null ? x.pct + '%' + (EN || !x.de ? '' : ' ' + x.de) : x.acciones ? corto(x.acciones) + ' acciones' : '');
// los tramos que vienen, de todas las empresas, por fecha
function proximosDesb(dias) {
  const hoy = diaDe(Date.now()), fin2 = diaDe(Date.now() + dias * 864e5);
  return (E.desbloqueos?.empresas || []).flatMap((e) => e.tramos.filter((x) => x.fecha && x.fecha >= hoy && x.fecha <= fin2).map((x) => ({ e, x }))).sort((a, b) => a.x.fecha.localeCompare(b.x.fecha));
}
function filaDesb(x, e) {
  const ya = x.fecha && x.fecha < diaDe(Date.now()), cond = EN ? x.condicion_en || x.condicion : x.condicion, cuando = EN ? x.cuando_en || x.cuando : x.cuando;
  const cuanto = cuantoDesb(x), url = /^https:\/\//.test(x.fuente || '') ? x.fuente : '';
  const quien = e ? `<b>${esc(e.nombre)}</b> · ${esc(QUIEN_DESB[x.quien] || x.quien)}` : `<b>${esc(QUIEN_DESB[x.quien] || x.quien)}</b>`;
  return `<div class="desb ${ya ? 'ya' : ''}"><span class="num desb-f">${x.fecha ? esc(diaDesb(x.fecha)) : '—'}</span><div class="desb-t">${e?.t ? logo(e.t, 's') : ''}<span>${quien}${cuanto ? ` · <b>${esc(cuanto)}</b>` : ''}<small>${esc(cuando || '')}${cond ? ' · ' + esc(cond) : ''}</small></span></div>${url ? `<a class="chip ${x.grado === 'oficial' ? 'up' : 'gold'}" href="${esc(url)}" target="_blank" rel="noopener">${GRADO_DESB[x.grado] || 'Fuente'}</a>` : `<span class="chip">${GRADO_DESB[x.grado] || ''}</span>`}</div>`;
}
// ---------- lo que viene: la agenda publica de cada empresa, "el dia X haran X cosa" (PM 26-11) ----------
// E.agenda = informes/agenda.json + dividendos y resultados automaticos (los junta el vigilante); aqui se suman las ventas
// desbloqueadas. Todo por fecha, con su tipo y su grado; la etiqueta del grado abre la fuente.
const TIPOS_AG = {
  resultados: ['Resultados', '#f0b142'], dividendo: ['Dividendo', '#36c48f'], desbloqueo: ['Desbloqueo', '#f26670'], junta: ['Junta', '#b28cff'],
  inversores: ['Inversores', '#5aa9ff'], producto: ['Producto', '#3fcfc4'], conferencia: ['Conferencia', '#8ea4ff'], regulador: ['Regulador', '#ff9a3d'],
  indice: ['Índice', '#e2c35c'], split: ['Split', '#ee7fcf'], recompra: ['Recompra', '#6ad6a4'], otro: ['Otro', '#94a0b0'],
};
const GRUPOS_AG = [['todo', 'Todo'], ['resultados', 'Resultados'], ['dividendo', 'Dividendos'], ['desbloqueo', 'Desbloqueos'], ['eventos', 'Eventos']];
const GRADO_AG = { oficial: 'Oficial', prensa: 'Según prensa', estimado: 'Estimado' };
const grupoAg = (e) => (['resultados', 'dividendo', 'desbloqueo'].includes(e.tipo) ? e.tipo : 'eventos');
const finAg = (e) => e.hasta || e.fecha;
// un formateador para todas las fechas (crearlo en cada fila hace lenta la pantalla)
const FECHA_AG = new Intl.DateTimeFormat(LOC, { day: 'numeric', month: 'short', year: '2-digit' }), MES_AG = new Intl.DateTimeFormat(LOC, { month: 'long', year: 'numeric' }), fechasAg = new Map();
const fechaAg = (f) => { if (!fechasAg.has(f)) fechasAg.set(f, FECHA_AG.format(new Date(f + 'T12:00:00'))); return fechasAg.get(f); };
const mesAg = (m) => { if (!fechasAg.has(m)) fechasAg.set(m, mayus(MES_AG.format(new Date(m + '-15T12:00:00')))); return fechasAg.get(m); };
let agMemo = null;
// todo junto y por fecha: se calcula una vez por cada carga de datos
function agendaTodo() {
  if (agMemo?.E === E) return agMemo.l;
  const l = (E?.agenda?.eventos || []).filter((e) => RUTA_ID.test(e?.t || '') && TIPOS_AG[e.tipo]);
  for (const d of E?.desbloqueos?.empresas || []) {
    if (RUTA_ID.test(d.t || '')) for (const x of d.tramos || []) l.push({ t: d.t, fecha: x.fecha || null, tipo: 'desbloqueo', quien: x.quien, pct: x.pct, cuanto: cuantoDesb(x), cuando: x.cuando, cuando_en: x.cuando_en, detalle: x.condicion, detalle_en: x.condicion_en, grado: x.grado, fuente: x.fuente });
  }
  l.sort((a, b) => (a.fecha || '9').localeCompare(b.fecha || '9') || a.t.localeCompare(b.t));
  agMemo = { E, l };
  return l;
}
const tipoAg = (e) => { const [n, c] = TIPOS_AG[e.tipo] || TIPOS_AG.otro; return `<i class="ag-tipo" style="--c:${c}">${n}</i>`; };
function tituloAg(e, corto) {
  if (e.tipo !== 'desbloqueo') return `<b>${esc(txt(e, 'titulo'))}</b>`;
  const cuanto = corto ? (e.pct != null ? e.pct + '%' : '') : e.cuanto;
  return `<b>${esc(QUIEN_DESB[e.quien] || e.quien || '')}</b>${cuanto ? ` · <b>${esc(cuanto)}</b>` : ''}`;
}
function filaAg(e, hoy, conEmpresa) {
  const ya = e.fecha && finAg(e) < hoy, abajo = [txt(e, 'cuando'), txt(e, 'detalle')].filter(Boolean).join(' · ');
  const url = /^https:\/\/[^\s"'<>]+$/.test(e.fuente || '') ? e.fuente : '';
  const grado = e.auto ? 'Auto' : e.grado === 'estimado' && e.tipo === 'desbloqueo' ? 'Calculado' : GRADO_AG[e.grado] || 'Fuente';
  const clase = e.grado === 'oficial' ? 'up' : e.grado === 'prensa' ? 'gold' : 'dim', pista = e.auto ? ' title="Dato automático de TradingView"' : '';
  const chip = url ? `<a class="chip ${clase}" href="${esc(url)}" target="_blank" rel="noopener noreferrer"${pista}>${grado}</a>` : `<span class="chip ${clase}"${pista}>${grado}</span>`;
  const dia = e.fecha ? esc(fechaAg(e.fecha)) + (e.hasta ? `<small>→ ${esc(fechaAg(e.hasta))}</small>` : '') : '<small>Sin fecha</small>';
  const ir = esc(enlace(e.t));
  return `<div class="desb ${ya ? 'ya' : ''}"><span class="num desb-f">${dia}</span><div class="desb-t">${conEmpresa ? `<a href="${ir}">${logo(e.t, 's')}</a>` : ''}<span>${tipoAg(e)}${conEmpresa ? `<a href="${ir}"><b>${esc(alias(e.t))}</b></a> · ` : ''}${tituloAg(e)}${abajo ? `<small>${esc(abajo)}</small>` : ''}</span></div>${chip}</div>`;
}
// la ficha: lo que viene de esa empresa (y lo de las dos ultimas semanas, apagado)
function loQueViene(t) {
  const hoy = diaDe(Date.now()), desde = diaDe(Date.now() - 14 * 864e5);
  const l = agendaTodo().filter((e) => e.t === t), vienen = l.filter((e) => !e.fecha || finAg(e) >= hoy);
  if (!vienen.length) return '';
  const pasadas = l.filter((e) => e.fecha && finAg(e) < hoy && finAg(e) >= desde).slice(-2), todas = op.agtodas === t;
  const filas = [...pasadas, ...(todas ? vienen : vienen.slice(0, 6))];
  return `<section>${sec('calendario', 'Lo que viene')}<div class="desbs ag">${filas.map((e) => filaAg(e, hoy)).join('')}</div>${vienen.length > 6 ? `<button class="btn peq ag-mas" data-op="agtodas" data-k="${todas ? '' : esc(t)}">${todas ? 'Ver menos' : `Ver las ${vienen.length} fechas`}</button>` : ''}<p class="dim desb-nota">Toca la etiqueta para ver la fuente.${filas.some((e) => e.auto) ? ' <span>Auto = dato automático.</span>' : ''}</p></section>`;
}
// la agenda: los proximos 3 meses de vuestras empresas, por meses y con filtro por tipo
function agendaVuestra() {
  const hoy = diaDe(Date.now()), fin2 = diaDe(Date.now() + 92 * 864e5), nuestras = new Set(mias());
  const l = agendaTodo().filter((e) => e.fecha && nuestras.has(e.t) && finAg(e) >= hoy && e.fecha <= fin2);
  const cuenta = (g) => (g === 'todo' ? l.length : l.filter((e) => grupoAg(e) === g).length);
  const grupos = GRUPOS_AG.filter(([g]) => g === 'todo' || cuenta(g));
  const k = grupos.some(([g]) => g === op.agtipo) ? op.agtipo : 'todo', ver = k === 'todo' ? l : l.filter((e) => grupoAg(e) === k);
  const filtro = grupos.length > 2 ? `<div class="seg ag-seg">${grupos.map(([g, n]) => `<button data-op="agtipo" data-k="${g}" class="${k === g ? 'act' : ''}">${n} <i>${cuenta(g)}</i></button>`).join('')}</div>` : '';
  // 20 filas de entrada (cada una lleva su logo: con todas a la vez la pantalla se repinta mas lenta)
  let mes = '';
  const todas = op.agtodas === '*agenda', filas = (todas ? ver : ver.slice(0, 20)).map((e) => { const m = e.fecha.slice(0, 7), cab = m !== mes ? `<h3 class="ag-mes">${esc(mesAg(m))}</h3>` : ''; mes = m; return cab + filaAg(e, hoy, true); }).join('');
  const mas = ver.length > 20 ? `<button class="btn peq ag-mas" data-op="agtodas" data-k="${todas ? '' : '*agenda'}">${todas ? 'Ver menos' : `Ver las ${ver.length} fechas`}</button>` : '';
  return `<section class="agenda">${sec('calendario', 'Lo que viene en vuestras empresas', filtro)}${filas ? `<div class="desbs ag">${filas}</div>${mas}` : vacio('calendario', 'Nada a la vista en los próximos 3 meses.')}</section>`;
}
function panelResultados() {
  const hoy = diaDe(Date.now()), fin2 = diaDe(Date.now() + 10 * 864e5), nuestras = new Set(mias());
  const l = (P().resultados || []).filter((r) => diaDe(r.ts) >= hoy && diaDe(r.ts) <= fin2).sort((a, b) => nuestras.has(b.t) - nuestras.has(a.t) || (b.cap || 0) - (a.cap || 0)).slice(0, 16).sort((a, b) => diaDe(a.ts).localeCompare(diaDe(b.ts)) || (b.cap || 0) - (a.cap || 0));
  const dia = (d) => (d === hoy ? 'Hoy' : d === diaDe(Date.now() + 864e5) ? 'Mañana' : mayus(new Date(d + 'T12:00:00').toLocaleDateString(LOC, { weekday: 'long' })) + ' ' + +d.slice(8));
  const macro = (E.macro || []).filter((m) => m.alto && m.ts > Date.now()).slice(0, 3);
  // arriba, lo que viene de las vuestras (sin los resultados que ya estan en la lista); las ventas de las demas, aparte
  const vienen = agendaTodo().filter((e) => e.fecha && e.fecha >= hoy && nuestras.has(e.t) && !(e.tipo === 'resultados' && e.fecha <= fin2)).slice(0, 4);
  const desb = proximosDesb(21).filter(({ e }) => !nuestras.has(e.t)).slice(0, 4);
  let antes = '';
  const viene = vienen.map((e) => `<a class="dato-p" href="${esc(enlace(e.t))}"><span class="num">${esc(fechaAg(e.fecha))}</span>${tipoAg(e)}<p>${esc(alias(e.t))} · ${tituloAg(e, true)}</p></a>`).join('');
  return `<article class="caja"><header><h2>${ico('calendario')} Próximos resultados</h2><a class="btn peq" href="#calendario">Agenda</a></header><div class="rollo">${viene ? `<h3>Lo que viene</h3>${viene}` : ''}${l.map((r) => { const d = diaDe(r.ts), cab = d !== antes ? `<h3>${dia(d)}</h3>` : ''; antes = d; return `${cab}<a class="res-p ${nuestras.has(r.t) ? 'mia' : ''}" href="#accion/${esc(r.t)}">${logo(r.t, 's')}<span class="nom"><b>${esc(nombreCorto(r.nombre))}</b><small>${esc(r.t)}${r.eps != null ? ' · esperan ' + r.eps : ''}</small></span>${r.cuando ? `<span class="chip dim">${r.cuando === 'antes' ? 'Antes de abrir' : 'Tras el cierre'}</span>` : ''}</a>`; }).join('') || vacio('calendario', 'Sin datos todavía.')}
    ${desb.length ? `<h3>Ventas desbloqueadas</h3>${desb.map(({ e, x }) => `<a class="dato-p" href="${e.t ? '#accion/' + esc(e.t) : '#calendario'}"><span class="num">${esc(diaDesb(x.fecha))}</span><p>${esc(e.nombre)} · ${esc(QUIEN_DESB[x.quien] || x.quien)}${x.pct != null ? ' · ' + x.pct + '%' : ''}</p></a>`).join('')}` : ''}
    ${macro.length ? `<h3>Datos que mueven el mercado</h3>${macro.map((m) => `<div class="dato-p"><span class="num">${esc(mayus(new Date(m.ts).toLocaleDateString(LOC, { weekday: 'short', day: 'numeric' })))} · ${hhmm(new Date(m.ts))}</span><p>${esc(EN ? m.en || m.titulo : m.titulo)}</p></div>`).join('')}` : ''}</div></article>`;
}
const tablero = () => `<div class="tablero">${panelNoticias()}${panelCuentas()}${panelResultados()}</div>`;

// lo que se ve encima de la foto de cada apartado: datos vivos
function datosCabecera(v) {
  const dato = (t) => { const x = empresa(t); return { t, k: x.corto, v: usd(x.precio), p: x.pct, href: enlace(t) }; };
  const activo2 = (id) => { const a = (P().activos || []).find((x) => x.id === id); return a && { k: a.nombre, v: usd(a.precio, id), p: a.pct, href: '#activo/' + id }; };
  const extremos = () => { const l = universo.filter((r) => r[5] >= 1e10 && fin(r[4]) && r[10] !== 'ETF').sort((a, b) => b[4] - a[4]); return [...l.slice(0, 2), ...l.slice(-2)].map((r) => dato(r[0])); };
  const por = {
    inicio: () => ['NQ', 'ES', 'BTC', 'ORO'].map(activo2),
    empresas: extremos,
    explorar: () => { const s = [...(P().sectores || [])].sort((a, b) => b.dia - a.dia); return [...s.slice(0, 2), ...s.slice(-2)].map((x) => ({ t: x.t, k: x.nombre, v: 'sector', p: x.dia, href: '#accion/' + x.t })); },
    cripto: () => (P().cripto?.monedas || []).slice(0, 4).map((m) => dato(m.s + '-USD')),
    calendario: () => (P().resultados || []).filter((r) => r.ts >= Date.now() - 864e5).sort((a, b) => diaDe(a.ts).localeCompare(diaDe(b.ts)) || (b.cap || 0) - (a.cap || 0)).slice(0, 4).map((r) => ({ t: r.t, k: r.t, v: new Date(r.ts).toLocaleDateString(LOC, { day: 'numeric', month: 'short' }), href: '#accion/' + r.t })),
    miedo: () => [P().miedo && { k: 'Bolsa', v: P().miedo.valor + '/100', href: '#miedo' }, P().miedoCripto && { k: 'Cripto', v: P().miedoCripto.valor + '/100', href: '#miedo' }],
    alarmas: () => [...activas()].sort((a, b) => Math.abs(distancia(a) ?? 99) - Math.abs(distancia(b) ?? 99)).slice(0, 4).map((a) => ({ t: a.t, k: alias(a.t), v: 'a ' + usd(a.nivel, a.t), p: distancia(a), href: enlace(a.t) })),
    seguimiento: () => mio.seguidas.slice(0, 4).map((x) => dato(x.t)),
    analisis: () => (mio.ideas || []).filter((i) => !i.cerrada && aqQuienes().includes(i.por)).map((i) => ({ i, e: estadoAn(i) })).filter((x) => !x.e.terminado).sort((a, b) => Math.abs(b.e.favor ?? 0) - Math.abs(a.e.favor ?? 0)).slice(0, 4).map(({ i, e }) => ({ t: i.t, k: `${alias(i.t)} ${LADOS_AN[e.lado][1]}`, v: e.siguiente ? 'a ' + usd(e.siguiente, i.t) : FASES_AN[e.fase][0], p: e.favor, href: enlace(i.t) })),
    // cartera: el resumen grande ya va encima de la foto (cartera.js)
    nuestro: () => mias().map(empresa).filter((x) => fin(x.pct)).sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct)).slice(0, 4).map((x) => dato(x.t)),
  };
  return (por[v]?.() || []).filter(Boolean);
}
function adornarCabecera(cab) {
  const k = CABECERA[ruta.v];
  cab.classList.add('foto');
  // el zoom lento sigue donde iba aunque la pagina se repinte
  cab.style.setProperty('--foto', `url('${fotoUrl(k)}')`);
  cab.style.setProperty('--pos', (FOTOS[k] || FOTOS[POR_DEFECTO]).pos + '%');
  cab.style.setProperty('--reloj', `-${((Date.now() / 1000) % 48).toFixed(1)}s`);
  const l = datosCabecera(ruta.v);
  cab.insertAdjacentHTML('beforeend', `${l.length ? `<nav class="cab-datos">${l.map((d, i) => `<a href="${d.href}" style="--i:${i}">${d.t ? logo(d.t, 's') : ''}<span><small>${esc(d.k)}</small><b class="num">${esc(String(d.v))}</b></span>${fin(d.p) ? `<i class="num ${cls(d.p)}">${sg(d.p, 1)}</i>` : ''}</a>`).join('')}</nav>` : ''}<span class="cab-credito">${esc(FOTOS[k].n)}</span>`);
}

// ---------- el perfil por dentro: numeros, nivel y logros ----------
const RANGOS = [[0, 'Novato'], [30, 'Explorador'], [80, 'Analista'], [160, 'Estratega'], [300, 'Tiburón'], [520, 'Leyenda']];
const ESTILOS = { largo: 'Largo plazo', swing: 'Swing', dia: 'Day trading', cripto: 'Cripto', dividendos: 'Dividendos', mixto: 'Un poco de todo' };
const RIESGOS = ['Muy tranquilo', 'Tranquilo', 'Equilibrado', 'Atrevido', 'A por todas'];
const detallesDe = (q) => { const d = perfil(q).detalles; return d && typeof d === 'object' && !Array.isArray(d) ? d : {}; };
// la base compartida necesita una columna nueva para guardar "Sobre mí"; sin ella no se ofrece
const hayDetalles = () => !motor?.nube || (mio.perfiles || []).some((p) => 'detalles' in p);
function numerosDe(q) {
  const ideas = (mio.ideas || []).filter((i) => i.por === q), res = ideas.map((i) => ({ i, r: resultadoIdea(i) })).filter((x) => x.r).sort((a, b) => b.r.favor - a.r.favor);
  const bien = res.filter((x) => x.r.favor > 0).length;
  const alarmas = mio.alarmas.filter((a) => a.por === q), puestas = alarmas.filter((a) => !a.disparada), saltadas = alarmas.length - puestas.length;
  const pos = posiciones((mio.cartera || []).filter((c) => c.por === q)), T = totales(pos);
  const fav = favoritas(q), seguidas = mio.seguidas.filter((s) => s.por === q);
  const n = {
    ideas, res, bien, mal: res.length - bien, objetivos: res.filter((x) => x.r.llego).length, acierto: res.length ? Math.round((bien / res.length) * 100) : null,
    seguro: ideas.length ? Math.round(ideas.reduce((s, i) => s + (i.confianza ?? 50), 0) / ideas.length) : null,
    puestas, saltadas, pos, T, pct: T.coste ? (T.gana / T.coste) * 100 : null, fav, seguidas,
  };
  n.puntos = ideas.length * 10 + bien * 15 + n.objetivos * 25 + puestas.length * 5 + saltadas * 10 + pos.length * 8 + fav.length * 3 + seguidas.length * 3;
  const idx = RANGOS.reduce((s, [min], i) => (n.puntos >= min ? i : s), 0), sig = RANGOS[idx + 1];
  n.nivel = idx + 1; n.rango = RANGOS[idx][1]; n.siguiente = sig?.[1] || null; n.faltan = sig ? sig[0] - n.puntos : 0;
  n.avance = sig ? (n.puntos - RANGOS[idx][0]) / (sig[0] - RANGOS[idx][0]) : 1;
  return n;
}
const logrosDe = (n) => [
  ['lapiz', 'Primera idea', 'Dibuja una idea sobre un gráfico', n.ideas.length, 1],
  ['grafica', 'Analista', 'Cinco ideas dibujadas', n.ideas.length, 5],
  ['analistas', 'Puntería', 'Tres ideas ganando a la vez', n.bien, 3],
  ['copa', 'Diana', 'Una idea que llega a su objetivo', n.objetivos, 1],
  ['campana', 'Vigilante', 'Tres alarmas puestas', n.puestas.length + n.saltadas, 3],
  ['rayo', 'Cazador', 'Una alarma que salta', n.saltadas, 1],
  ['dinero', 'Inversor', 'Primera posición en la cartera', n.pos.length, 1],
  ['sector', 'Diversificado', 'Cinco empresas en cartera', n.pos.length, 5],
  ['pulso', 'En verde', 'Cartera ganando dinero', n.T.gana > 0 ? 1 : 0, 1],
  ['estrella', 'Coleccionista', 'Cinco favoritas', n.fav.length, 5],
  ['ojo', 'Informado', 'Sigue tres empresas', n.seguidas.length, 3],
  ['fuego', 'Leyenda', 'Alcanza el último rango', n.puntos, RANGOS.at(-1)[0]],
];
const caja = (icono, titulo, cuerpo, clase = '', extra = '') => `<article class="pf-caja ${clase}"><header><h3>${ico(icono)} ${titulo}</h3>${extra}</header>${cuerpo}</article>`;
const nada = (texto, boton = '') => `<div class="pf-nada"><p>${texto}</p>${boton}</div>`;
// en que sectores se fija, contando favoritas, cartera, seguidas, alarmas e ideas
function sectoresDe(n) {
  const todas = [...new Set([...n.fav, ...n.pos.map((p) => p.t), ...n.seguidas.map((s) => s.t), ...n.puestas.map((a) => a.t), ...n.ideas.map((i) => i.t)])];
  const cuenta = {};
  for (const t of todas) { const s = t.endsWith('-USD') ? 'Cripto' : fichaDe(t).sector || porT.get(t)?.[10]; if (s) (cuenta[s] ||= []).push(t); }
  return { total: todas.length, l: Object.entries(cuenta).sort((a, b) => b[1].length - a[1].length).slice(0, 6) };
}
function cajaPunteria(n) {
  if (!n.res.length) return caja('analistas', 'Puntería', nada('Sin ideas todavía. Cada idea dibujada cuenta aquí.', '<a class="btn peq pri" href="#analisis">Ver análisis</a>'));
  const linea = (et, v, c = '') => `<div class="pf-linea"><span>${et}</span><b class="num ${c}">${v}</b></div>`;
  const una = (et, x) => `<a class="pf-idea" href="${enlace(x.i.t)}" data-abriridea="${Number(x.i.id)}">${logo(x.i.t, 's')}<span><small>${et}</small><b>${esc(alias(x.i.t))}</b></span><i class="num ${cls(x.r.favor)}">${sg(x.r.favor, 1)}</i></a>`;
  return caja('analistas', 'Puntería', `<div class="pf-punteria">${anillo(n.acierto / 100, n.acierto >= 50 ? 'var(--up)' : 'var(--dn)', `<strong class="num">${n.acierto}%</strong><small>acierta</small>`, 1.1)}<div>${linea('Ganando', n.bien, 'up')}${linea('Perdiendo', n.mal, 'dn')}${linea('Objetivos cumplidos', n.objetivos)}${linea('Seguridad media', n.seguro + '%')}</div></div>
    ${una('Su mejor idea', n.res[0])}${n.res.length > 1 ? una('La que peor va', n.res.at(-1)) : ''}`);
}
function cajaCartera(n, yo) {
  if (!n.pos.length) return caja('dinero', 'Cartera', nada(yo ? 'Apunta lo que tienes y verás el reparto.' : 'No ha apuntado ninguna inversión.', yo ? '<button class="btn peq pri" data-posicion="1">Añadir inversión</button>' : ''));
  const color = (i) => PALETA[Math.min(i, PALETA.length - 1)], top = n.pos.slice(0, 6);
  return caja('dinero', 'Cartera', `<div class="pf-reparto">${donut(n.pos.map((p, i) => [p.valor, color(i)]), `<strong class="num">${plata(n.T.valor)}</strong><small class="num ${cls(n.T.hoy)}">${plata(n.T.hoy, true)}</small>`)}
    <div>${top.map((p, i) => `<a class="pf-pos" href="${enlace(p.t)}" style="--c:${color(i)}">${logo(p.t, 'xs')}<b>${esc(alias(p.t))}</b><span class="num">${((p.valor / n.T.valor) * 100).toFixed(0)}%</span><i class="num ${cls(p.pct)}">${sg(p.pct, 1)}</i></a>`).join('')}</div></div>
    <div class="pf-total"><span>Ganancia total</span><b class="num ${cls(n.T.gana)}">${plata(n.T.gana, true)} · ${sg(n.pct, 1)}</b></div>`, '', '<button class="btn peq" data-ptab="cartera">Ver todo</button>');
}
function cajaSectores(n) {
  const s = sectoresDe(n);
  return caja('sector', 'En qué se fija', s.l.length ? s.l.map(([nombre, ts], i) => `<div class="pf-sector"><div><b>${esc(nombre === 'Cripto' ? 'Cripto' : sectorEs(nombre))}</b><span class="pf-logos">${ts.slice(0, 4).map((t) => `<a href="${enlace(t)}" title="${esc(alias(t))}">${logo(t, 'xs')}</a>`).join('')}</span><i class="num">${ts.length}</i></div><u style="--w:${(ts.length / s.l[0][1].length) * 100}%;--c:${PALETA[i]}"></u></div>`).join('') : nada('Al marcar favoritas o seguir empresas aparecen sus sectores.'));
}
function cajaSobre(q, yo) {
  const d = detallesDe(q), hay = d.bio || d.estilo || d.riesgo != null || d.objetivo || d.desde || d.lugar;
  const fila = (icono, et, v) => (v ? `<div class="pf-dato">${ico(icono)}<span><small>${et}</small><b>${esc(v)}</b></span></div>` : '');
  return caja('directivos', yo ? 'Sobre mí' : 'Quién es', hay ? `${d.bio ? `<p class="pf-bio">${esc(d.bio)}</p>` : ''}<div class="pf-datos">${fila('grafica', 'Estilo', ESTILOS[d.estilo])}${fila('analistas', 'Su meta', d.objetivo)}${fila('calendario', 'Invierte desde', d.desde)}${fila('mercado', 'Desde', d.lugar)}</div>
    ${d.riesgo != null ? `<div class="pf-riesgo"><span>Riesgo</span><div>${RIESGOS.map((_, i) => `<i class="${i <= d.riesgo ? 'on' : ''}" style="--c:hsl(${120 - i * 28} 70% 55%)"></i>`).join('')}</div><b>${RIESGOS[d.riesgo] || ''}</b></div>` : ''}` : nada(yo ? 'Cuenta quién eres: tu estilo, tu meta y cuánto te arriesgas.' : 'Aún no ha escrito nada.', yo ? '<button class="btn peq pri" data-editarperfil="sobre">Rellenar</button>' : ''), '', yo && hay ? '<button class="btn peq" data-editarperfil="sobre">Editar</button>' : '');
}
function cajaCara(q, n) {
  const otro = gente().find((x) => x !== q);
  if (!otro) return '';
  const m = numerosDe(otro);
  const fila = (et, a, b, texto = (v) => v ?? '—') => { const x = Math.max(0, a || 0), y = Math.max(0, b || 0), t = x + y || 1; return `<div class="pf-vs"><b class="num ${x > y ? 'gana' : ''}">${texto(a)}</b><div><span>${et}</span><u><i style="--w:${(x / t) * 100}%;--c:${colorDe(q)}"></i><i style="--w:${(y / t) * 100}%;--c:${colorDe(otro)}"></i></u></div><b class="num ${y > x ? 'gana' : ''}">${texto(b)}</b></div>`; };
  const comunes = [...new Set([...n.fav, ...n.pos.map((p) => p.t), ...n.seguidas.map((s) => s.t)])].filter((t) => [...m.fav, ...m.pos.map((p) => p.t), ...m.seguidas.map((s) => s.t)].includes(t));
  return caja('gente', 'Cara a cara', `<div class="pf-rivales"><a href="#perfil/${encodeURIComponent(q)}">${avatar(q, 'm')}<b>${esc(apodo(q))}</b></a><span>VS</span><a href="#perfil/${encodeURIComponent(otro)}">${avatar(otro, 'm')}<b>${esc(apodo(otro))}</b></a></div>
    ${fila('Puntos', n.puntos, m.puntos)}${fila('Acierto', n.acierto, m.acierto, (v) => (v == null ? '—' : v + '%'))}${fila('Ideas', n.ideas.length, m.ideas.length)}${fila('Alarmas', n.puestas.length, m.puestas.length)}${fila('Cartera', n.pct, m.pct, (v) => (v == null ? '—' : sg(v, 1)))}${fila('Favoritas', n.fav.length, m.fav.length)}
    <div class="pf-comun"><span>${comunes.length ? 'Coincidís en' : 'Todavía no coincidís en ninguna empresa'}</span>${comunes.slice(0, 8).map((t) => `<a href="${enlace(t)}" title="${esc(alias(t))}">${logo(t, 's')}</a>`).join('')}</div>`);
}
function cajaLogros(n) {
  const l = logrosDe(n), hechos = l.filter((x) => x[3] >= x[4]).length;
  return caja('copa', 'Logros', `<div class="pf-logros">${l.map(([icono, nombre, que, va, meta]) => { const ok = va >= meta; return `<div class="pf-logro ${ok ? 'ok' : ''}" style="--p:${Math.min(100, (va / meta) * 100).toFixed(0)}"><span>${ico(icono)}</span><b>${nombre}</b><small>${que}</small><i class="num">${ok ? '✔' : `${Math.min(va, meta)}/${meta}`}</i></div>`; }).join('')}</div>`, 'ancha', `<small class="num">${hechos}/${l.length}</small>`);
}
function lineaTiempo(q, cuantas) {
  const l = actividad().filter((a) => a.por === q).slice(0, cuantas);
  if (!l.length) return nada('Sin actividad todavía.');
  let antes = '';
  return `<div class="pf-tiempo">${l.map((a) => { const d = new Date(a.ts).toLocaleDateString(LOC, { weekday: 'long', day: 'numeric', month: 'long' }), cab = d !== antes ? `<h4>${esc(mayus(d))}</h4>` : ''; antes = d; return `${cab}<a href="${a.va}" ${a.id ? `data-abriridea="${Number(a.id)}"` : ''}>${logo(a.t, 's')}<span>${esc(a.texto)}</span><small class="num">${hhmm(new Date(a.ts))}</small></a>`; }).join('')}</div>`;
}
const ideasLista = (n) => `<div class="an-rejilla">${[...n.ideas].sort((a, b) => !b.cerrada - !a.cerrada || Date.parse(b.creada) - Date.parse(a.creada)).map((i) => tarjetaAn(i, { conEmpresa: true })).join('')}</div>`;

// ---------- ideas nuevas: reaccion a resultados, fuera de horario, calculadora, comparar, reacciones, reglas, movil ----------

// ---- como reacciono a sus resultados ----
function rellenaReacciones() {
  const c = $('#reacciones');
  if (!c) return;
  const t = c.dataset.t, datos = pideVelas(t), l = datos?.res || [];
  if (!l.length) { c.innerHTML = ''; return; }
  const mayor = Math.max(5, ...l.map((x) => Math.abs(x.mov)));
  const media = l.reduce((a, x) => a + Math.abs(x.mov), 0) / l.length, suben = l.filter((x) => x.mov > 0).length;
  c.innerHTML = `<section>${sec('resultados', 'Cómo reaccionó a sus resultados')}<div class="reac"><div class="reac-cifras"><div><strong class="num">±${media.toFixed(1)}%</strong><span>se mueve de media</span></div><div><strong class="num up">${suben}</strong><span>veces subió</span></div><div><strong class="num dn">${l.length - suben}</strong><span>veces bajó</span></div></div>
    <div class="reac-barras">${[...l].reverse().map((x) => `<div title="${x.eps != null ? `Ganó ${x.eps} por acción, esperaban ${x.esperado ?? '—'}` : ''}"><b class="num ${cls(x.mov)}">${sg(x.mov, 1)}</b><div><i class="${x.mov >= 0 ? 'mas' : 'menos'}" style="--h:${(Math.abs(x.mov) / mayor) * 100}%"></i></div><small>${esc(new Date(x.f + 'T12:00:00').toLocaleDateString(LOC, { month: 'short', year: '2-digit' }))}</small>${x.eps != null && x.esperado != null ? `<em class="${x.eps >= x.esperado ? 'up' : 'dn'}">${x.eps >= x.esperado ? 'Superó' : 'Falló'}</em>` : ''}</div>`).join('')}</div></div></section>`;
}

// ---- antes de abrir y tras el cierre ----
function cuerpoFuera() {
  const F = E.fuera, k = op.franja === 'post' ? 'post' : 'pre', d = F?.[k];
  const lista = (titulo, l, clase) => `<article class="pf-caja"><header><h3 class="${clase}">${titulo}</h3></header>${l?.length ? l.map((x, i) => `<a class="fuera-f" href="#accion/${esc(x.t)}"><span class="num">${i + 1}</span>${logo(x.t, 's')}<span class="nom"><b>${esc(nombreCorto(x.nombre))}</b><small>${esc(x.t)} · ${corto(x.volumen)} acciones</small></span><span class="num">${usd(x.precio)}</span><b class="chip ${cls(x.pct)}">${sg(x.pct)}</b></a>`).join('') : '<div class="pf-nada"><p>Nada en esta franja todavía.</p></div>'}</article>`;
  return `<div style="text-align:center;margin-bottom:16px">${seg('franja', [['pre', 'Antes de abrir'], ['post', 'Tras el cierre']])}</div>
    ${d?.ts ? `<p class="aviso-peq">Leído ${hace(d.ts)} · empresas de más de 2 mil millones · datos con 15 min de retraso</p><div class="pf-rejilla">${lista('Las que más suben', d.sube, 'up')}${lista('Las que más bajan', d.baja, 'dn')}</div>` : vacio('rayo', 'Aparece en la próxima actualización.')}`;
}

// ---- calculadora ----
function calculadora(t) {
  const x = t ? empresa(t) : null, p = +x?.precio || '';
  const m = abrir(`<h2>Calculadora${x ? ' · ' + esc(x.corto) : ''}</h2><div class="al-modos"><button data-calc="acc" class="act">Acciones</button><button data-calc="opc">Opciones</button></div>
    <div id="c-acc" class="calc-campos">
      <label>Cuánto arriesgas ($)<input class="campo" id="c-riesgo" type="number" min="0" step="any" value="100"></label><label>Entrada<input class="campo" id="c-entrada" type="number" min="0" step="any" value="${p}"></label>
      <label>Stop (si sale mal)<input class="campo" id="c-stop" type="number" min="0" step="any" value="${p ? +(p * 0.95).toFixed(2) : ''}"></label><label>Objetivo<input class="campo" id="c-obj" type="number" min="0" step="any" value="${p ? +(p * 1.1).toFixed(2) : ''}"></label></div>
    <div id="c-opc" class="calc-campos" hidden>
      <div class="aj-grupo" style="grid-column:1/-1"><button data-tipo="put" class="act">Put (ganas si baja)</button><button data-tipo="call">Call (ganas si sube)</button></div>
      <label>Precio de ejercicio<input class="campo" id="c-strike" type="number" min="0" step="any" value="${p ? Math.round(p) : ''}"></label><label>Prima por acción<input class="campo" id="c-prima" type="number" min="0" step="any" value="${p ? +(p * 0.04).toFixed(2) : ''}"></label>
      <label>Contratos (100 acciones)<input class="campo" id="c-n" type="number" min="1" step="1" value="1"></label><label>Precio que esperas al vencer<input class="campo" id="c-fin" type="number" min="0" step="any" value="${p ? +(p * 0.9).toFixed(2) : ''}"></label></div>
    <div id="c-sale" class="calc-sale"></div>${x && hayOpciones() ? '<button class="btn pri ancho" id="c-apunta" hidden style="margin-top:12px">Apuntar en mis opciones</button>' : ''}<p class="nota-c">Solo son cuentas con tus números. No es un consejo.</p>`);
  let modo2 = 'acc', tipo = 'put';
  const v = (id) => +$(id, m).value, d$ = (n) => '$' + (+n).toLocaleString('en-US', { maximumFractionDigits: 2 });
  const caja2 = (et, valor, c = '') => `<div><span>${et}</span><b class="num ${c}">${valor}</b></div>`;
  const calcula = () => {
    const sale = $('#c-sale', m);
    if (modo2 === 'acc') {
      const r = v('#c-riesgo'), e = v('#c-entrada'), s = v('#c-stop'), o = v('#c-obj'), dist = Math.abs(e - s);
      if (!(r > 0 && e > 0 && s > 0 && dist > 0)) { sale.innerHTML = '<p class="dim">Pon cuánto arriesgas, la entrada y el stop.</p>'; return; }
      const largo = s < e, n = Math.floor(r / dist), gana = o > 0 ? (largo ? o - e : e - o) * n : null, pierde = dist * n;
      sale.innerHTML = n < 1 ? '<p class="dim">Con ese riesgo no llega ni para una acción.</p>'
        : caja2('Compras (acciones)', n) + caja2(largo ? 'Inviertes' : 'Posición en corto', d$(n * e)) + caja2('Si salta el stop', '-' + d$(pierde), 'dn') + (gana != null ? caja2('Si llega al objetivo', (gana >= 0 ? '+' : '-') + d$(Math.abs(gana)), cls(gana)) + caja2('Ganas por cada $ arriesgado', (gana / pierde).toFixed(2), gana / pierde >= 2 ? 'up' : '') : '');
    } else {
      const K = v('#c-strike'), pr = v('#c-prima'), n = Math.floor(v('#c-n')), S = v('#c-fin');
      if (!(K > 0 && pr > 0 && n >= 1)) { sale.innerHTML = '<p class="dim">Pon el precio de ejercicio, la prima y los contratos.</p>'; return; }
      const coste = pr * 100 * n, empate = tipo === 'put' ? K - pr : K + pr, vale = Math.max(0, tipo === 'put' ? K - S : S - K) * 100 * n, res = vale - coste;
      sale.innerHTML = caja2('Pagas', d$(coste)) + caja2('Lo máximo que pierdes', '-' + d$(coste), 'dn') + caja2('Empatas si acaba en', d$(empate)) + (S > 0 ? caja2('Resultado al vencer', (res >= 0 ? '+' : '-') + d$(Math.abs(res)), cls(res)) + caja2('Sobre lo pagado', sg((res / coste) * 100, 0), cls(res)) : '');
    }
  };
  m.querySelectorAll('input').forEach((i) => { i.oninput = calcula; });
  m.querySelectorAll('[data-calc]').forEach((b) => { b.onclick = (e) => { e.stopPropagation(); modo2 = b.dataset.calc; m.querySelectorAll('[data-calc]').forEach((o) => o.classList.toggle('act', o === b)); $('#c-acc', m).hidden = modo2 !== 'acc'; $('#c-opc', m).hidden = modo2 !== 'opc'; calcula(); }; });
  m.querySelectorAll('[data-tipo]').forEach((b) => { b.onclick = (e) => { e.stopPropagation(); tipo = b.dataset.tipo; m.querySelectorAll('[data-tipo]').forEach((o) => o.classList.toggle('act', o === b)); calcula(); }; });
  const apunta = $('#c-apunta', m);
  if (apunta) {
    apunta.onclick = (e) => { e.stopPropagation(); nuevaOpcion(t, { tipo, strike: v('#c-strike'), prima: v('#c-prima'), contratos: Math.floor(v('#c-n')) }); };
    m.querySelectorAll('[data-calc]').forEach((b) => b.addEventListener('click', () => { apunta.hidden = b.dataset.calc !== 'opc'; }));
  }
  calcula();
}

// ---- reacciones y graficos pequeños en el chat ----
const EMOJIS = ['👍', '🔥', '🚀', '😂', '👀', '❌'];
let reacciones = [], extras = null; // extras: la base ya tiene las piezas nuevas
async function mirarReacciones() {
  if (!motor?.reacciones) return;
  try { const l = (await motor.reacciones()) || []; extras = true; const antes = JSON.stringify(reacciones); reacciones = l; if (antes !== JSON.stringify(l) && ruta.v === 'chat') pintarMensajes(); }
  catch (e) { if (extras === null) extras = false; }
}
function reaccionesHTML(m) {
  if (!extras) return '';
  const mias2 = reacciones.filter((r) => +r.mensaje === +m.id);
  const grupos = EMOJIS.map((q) => [q, mias2.filter((r) => r.que === q)]).filter(([, l]) => l.length);
  return `<span class="reacs">${grupos.map(([q, l]) => `<button class="${l.some((r) => r.por === mio.yo) ? 'mia' : ''}" data-reac="${Number(m.id)}" data-q="${q}" title="${esc(l.map((r) => apodo(r.por)).join(', '))}">${q} ${l.length}</button>`).join('')}<button class="mas" data-reacabre="${Number(m.id)}" title="Reaccionar">+</button><span class="elige-r" hidden>${EMOJIS.map((q) => `<button data-reac="${Number(m.id)}" data-q="${q}">${q}</button>`).join('')}</span></span>`;
}
function minis(texto) {
  const l = [...new Set([...String(texto || '').matchAll(/\$([A-Za-z]{1,5})\b/g)].map((x) => x[1].toUpperCase()))]
    .map((s) => (E.quotes?.[s + '-USD'] || monedaDe(s) ? s + '-USD' : s)).filter((t) => E.quotes?.[t] || porT.has(t) || monedaDe(t.replace('-USD', ''))).slice(0, 3);
  return l.map((t) => { const x = empresa(t), h = (E.hist?.[t]?.v || []).map((v) => v[1]).slice(-60); return `<a class="mini-c" href="${enlace(t)}">${logo(t, 's')}<span class="mc-n"><b>${esc(x.corto)}</b><small>${esc(nombreCorto(x.nombre))}</small></span>${h.length > 5 ? chispa(h, h.at(-1) >= h[0], 'm' + t) : ''}<span class="mini-p"><b class="num">${usd(x.precio)}</b><i class="num ${cls(x.pct)}">${sg(x.pct)}</i></span></a>`; }).join('');
}

// ---- alertas a tu gusto ----
const ALCANCES = { grandes: 'una empresa grande', medianas: 'una mediana o grande', favoritas: 'una de mis favoritas', cartera: 'una de mi cartera', sector: 'una del sector' };
const misReglas = () => (Array.isArray(detallesDe(mio.yo).reglas) ? detallesDe(mio.yo).reglas : []);
function seccionReglas() {
  if (!extras) return '';
  const l = misReglas();
  const sectores = [...new Set(universo.map((u) => u[10]).filter((s) => s && s !== 'ETF'))].sort((a, b) => sectorEs(a).localeCompare(sectorEs(b)));
  return `<section>${sec('analistas', 'Alertas a tu gusto')}<div class="reglas">
    ${l.map((r) => `<div class="regla ${r.dir}"><i>${r.dir === 'sube' ? '▲' : '▼'}</i><span>Si <b>${ALCANCES[r.alcance] || ''}${r.alcance === 'sector' ? ' ' + esc(sectorEs(r.sector)) : ''}</b> ${r.dir === 'sube' ? 'sube' : 'cae'} un <b>${+r.pct}%</b> o más</span><button data-quitaregla="${+r.id}" title="Quitar">${ico('basura')}</button></div>`).join('')}
    ${l.length < 8 ? `<div class="regla-nueva"><span>Avísame si</span><select class="campo" id="rg-alcance">${Object.entries(ALCANCES).map(([k, n]) => `<option value="${k}">${n}</option>`).join('')}</select><select class="campo" id="rg-sector" hidden>${sectores.map((s) => `<option value="${esc(s)}">${esc(sectorEs(s))}</option>`).join('')}</select><select class="campo" id="rg-dir"><option value="baja">cae</option><option value="sube">sube</option></select><span>un</span><input class="campo" id="rg-pct" type="number" min="1" max="90" step="0.5" value="8"><span>% o más</span><button class="btn pri" data-ponregla="1">${ico('mas')} Crear</button></div>` : ''}
    <p class="nota-c">Se revisan mientras el mercado de EE. UU. está abierto y justo después. Como mucho 5 empresas al día por alerta.</p></div></section>`;
}
async function ponerRegla(quitar) {
  let l = misReglas();
  if (quitar) l = l.filter((r) => r.id !== quitar);
  else {
    const pct = +$('#rg-pct').value;
    if (!(pct >= 1 && pct <= 90)) return toast('Pon un porcentaje entre 1 y 90', true);
    const alcance = $('#rg-alcance').value;
    l = [...l, { id: Date.now() % 1e9, alcance, dir: $('#rg-dir').value, pct, ...(alcance === 'sector' ? { sector: $('#rg-sector').value } : {}) }];
  }
  await guardarPerfil({ detalles: { ...detallesDe(mio.yo), reglas: l } });
  pintar(); toast(quitar ? 'Alerta quitada' : 'Alerta creada');
}

// ---- instalar en el movil ----
let instalable = null;
addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); instalable = e; });
function ventanaInstalar() {
  const iphone = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const paso = (n, icono, texto) => `<div class="paso-i"><b>${n}</b><i>${icono}</i><span>${texto}</span></div>`;
  const m = abrir(`<img class="icono-app" src="icono-192.png" alt=""><h2>Radar en tu móvil</h2>
    ${instalable ? '<button class="btn pri ancho" id="ya-instalar">Instalar ahora</button>' : ''}
    <h4>${iphone ? 'En tu iPhone, con Safari' : 'En Android, con Chrome'}</h4>
    <div class="pasos-i">${iphone ? paso(1, '⬆️', 'Toca Compartir') + paso(2, '➕', 'Añadir a pantalla de inicio') + paso(3, '✅', 'Toca Añadir') : paso(1, '⋮', 'Abre el menú de Chrome') + paso(2, '📲', 'Instalar aplicación') + paso(3, '✅', 'Toca Instalar')}</div>
    <p class="nota-c">Abre esta página en el móvil y sigue estos pasos. Queda como una app, con su icono.</p>`);
  const b = $('#ya-instalar', m);
  if (b) b.onclick = async () => { await instalable.prompt(); instalable = null; cerrar(); };
}

// ---------- radar de alarmas ----------
function radarAlarmas(lista) {
  const anillos = [1, 3, 7, 15, 35];
  const radio = (pct) => 7 + 40 * Math.min(1, Math.log(1 + Math.abs(pct)) / Math.log(36));
  const arriba = lista.filter((a) => a.dir === 'sube'), abajo = lista.filter((a) => a.dir === 'baja');
  const blips = [...arriba.map((a, i) => [a, 180 + ((i + 1) * 180) / (arriba.length + 1)]), ...abajo.map((a, i) => [a, ((i + 1) * 180) / (abajo.length + 1)])].map(([a, g]) => {
    const d = distancia(a) ?? 35, [x, y] = polar(50, 50, radio(d), g);
    return `<a class="blip" href="${enlace(a.t)}" style="left:${x}%;top:${y}%;--c:${a.dir === 'sube' ? 'var(--up)' : 'var(--dn)'}">${logo(a.t, 's')}<small>${esc(alias(a.t))} ${Math.abs(d).toFixed(1)}%</small></a>`;
  }).join('');
  return `<div class="radar"><div class="barrido"></div><svg viewBox="0 0 100 100">${anillos.map((p) => `<circle cx="50" cy="50" r="${radio(p)}" fill="none" stroke="rgba(90,169,255,.2)" stroke-width=".25"/><text x="50.8" y="${50 - radio(p) - 0.6}" font-size="2.1" fill="rgba(233,237,243,.4)" font-family="IBM Plex Mono">${p}%</text>`).join('')}
    <line x1="1" x2="99" y1="50" y2="50" stroke="rgba(90,169,255,.25)" stroke-width=".25" stroke-dasharray="1 1"/><text x="3" y="48" font-size="2.6" fill="#36c48f" font-family="IBM Plex Mono">▲ SUBE</text><text x="3" y="54" font-size="2.6" fill="#f26670" font-family="IBM Plex Mono">▼ BAJA</text>
    <circle cx="50" cy="50" r="5.6" fill="#f0b142"/><text x="50" y="51" font-size="2.6" text-anchor="middle" font-weight="600" fill="#1b1300" font-family="IBM Plex Mono">SALTA</text></svg>${blips}</div>`;
}
function pista(a) {
  const x = empresa(a.t), n = +a.nivel, d = distancia(a);
  const w = a.disparada ? 100 : d == null ? 0 : Math.max(3, 100 - Math.min(100, Math.abs(d) * 6));
  return `<div class="pista ${a.disparada ? 'saltada' : ''}" style="--w:${w}%;--c:${a.disparada ? 'var(--gold)' : a.dir === 'sube' ? 'var(--up)' : 'var(--dn)'}"><a href="${enlace(a.t)}">${logo(a.t)}</a><div><div class="extremos" style="color:var(--tx)"><span>${cara(a.por)} <b>${esc(x.corto)}</b> ${a.dir === 'sube' ? 'sube a' : 'baja a'}</span><b class="num gold">${usd(n, a.t)}</b></div><div class="linea"><i></i><u></u><s></s></div><div class="extremos">${a.disparada ? `<span class="gold">¡Saltó! a ${usd(a.precio, a.t)}</span><span>${hace(Date.parse(a.disparada))}</span>` : `<span class="num">ahora ${usd(x.precio, a.t)}</span><span>${d == null ? '' : `falta un ${Math.abs(d).toFixed(1)}%`} · ${esc(a.por)}</span>`}</div></div>${a.por === mio.yo || !motor.nube ? `<button class="borrar" data-quitar="${Number(a.id)}" title="Borrar alarma">${ico('basura')}</button>` : cara(a.por)}</div>`;
}

// ---------- ETF: quien mete y quien saca ----------
const GESTORAS = { IBIT: 'BlackRock', ETHA: 'BlackRock', FBTC: 'Fidelity', FETH: 'Fidelity', GBTC: 'Grayscale', ETHE: 'Grayscale', BTC: 'Grayscale Mini', ETH: 'Grayscale Mini', ARKB: 'Ark Invest y 21Shares', BITB: 'Bitwise', ETHW: 'Bitwise', HODL: 'VanEck', ETHV: 'VanEck', BTCO: 'Invesco', QETH: 'Invesco', EZBC: 'Franklin Templeton', EZET: 'Franklin Templeton', BRRR: 'CoinShares Valkyrie', BTCW: 'WisdomTree', CETH: '21Shares' };
function seccionETF(F) {
  const grupo = F[op.etf] || [], campo = op.periodo, moneda = op.etf === 'btc' ? 'bitcoin' : 'ethereum';
  const plazo = { mes: 'en el último mes', tres: 'en los últimos 3 meses', anio: 'en lo que va de año' }[campo];
  const con = grupo.filter((f) => fin(f[campo]));
  const mayor = Math.max(1, ...con.map((f) => Math.abs(f[campo])));
  const neto = con.reduce((a, f) => a + f[campo], 0), aum = grupo.reduce((a, f) => a + (f.aum || 0), 0);
  const una = (f) => { const v = f[campo], q = GESTORAS[f.t] || f.nombre; return `<a class="flujo" href="#accion/${esc(f.t)}" style="--c:${col(v)};--w:${(Math.abs(v) / mayor) * 100}%">${logo(f.t)}<span class="nom"><b>${esc(q)}</b><small>${esc(f.t)} · ${esc(f.nombre)}</small></span><span class="eje"><i></i></span><span class="der"><strong class="num ${cls(v)}">${v > 0 ? '+' : '-'}${corto(Math.abs(v))}\u00a0$</strong><span class="dim">${v > 0 ? 'han metido' : 'han sacado'} · guarda ${corto(f.aum)}</span></span></a>`; };
  const meten = con.filter((f) => f[campo] > 0).sort((a, b) => b[campo] - a[campo]), sacan = con.filter((f) => f[campo] < 0).sort((a, b) => a[campo] - b[campo]);
  const nombra = (f) => `<b>${esc(GESTORAS[f.t] || f.t)}</b> (${corto(Math.abs(f[campo]))}\u00a0$)`;
  const diario = (F.diario || []).slice(-30), mayorD = Math.max(1, ...diario.map((d) => Math.abs(d[op.etf])));
  return `<section>${sec('dinero', `Quién compra y quién vende ${moneda} (ETF)`, `${seg('etf', [['btc', 'Bitcoin'], ['eth', 'Ethereum']])}${seg('periodo', [['mes', '1 mes'], ['tres', '3 meses'], ['anio', 'Este año']])}`)}
    <p class="frase" style="max-width:900px">${neto >= 0 ? 'En total han <em class="up">entrado</em>' : 'En total han <em class="dn">salido</em>'} <span class="num ${cls(neto)}">${corto(Math.abs(neto))}\u00a0$</span> ${plazo}.</p>
    <p class="entradilla" style="max-width:900px">${sacan.length ? `Donde más han sacado: ${sacan.slice(0, 3).map(nombra).join(', ')}.` : 'Nadie ha tenido salidas.'} ${meten.length ? `Donde más han metido: ${meten.slice(0, 3).map(nombra).join(', ')}.` : 'Ningún fondo ha recibido dinero.'} Entre todos guardan <b class="num">${corto(aum)}\u00a0$</b>.</p>
    ${meten.length ? `<div class="franja up">▲ Entra dinero</div>${meten.map(una).join('')}` : ''}${sacan.length ? `<div class="franja dn">▼ Sale dinero</div>${sacan.map(una).join('')}` : ''}
    <p class="dim" style="font-size:12.5px;margin-top:12px">Son los clientes de cada gestora comprando o vendiendo su fondo: los nombres de las personas no son públicos. Fuente: TradingView.</p>
    <div style="margin-top:22px"><span class="dim">Total día a día</span>${diario.length ? `<div class="dias">${diario.map((d) => `<div title="${esc(d.dia)}: ${corto(d[op.etf])}\u00a0$" style="--c:${col(d[op.etf])};--h:${(Math.abs(d[op.etf]) / mayorD) * 100}%"><u class="${d[op.etf] < 0 ? 'menos' : ''}"></u></div>`).join('')}</div>` : '<p class="dim" style="margin-top:6px">Empieza a dibujarse mañana: se calcula con las participaciones nuevas o retiradas de cada día.</p>'}</div></section>`;
}

// ---------- vistas ----------
const verFav = () => op.vista === 'fav' && favoritas(mio.yo).length > 0;
const listaInicio = () => (verFav() ? favoritas(mio.yo) : mias());
function resumenCartera() {
  const T = totales(posiciones((mio.cartera || []).filter((c) => c.por === mio.yo)));
  return T.valor ? `<a class="mini-cartera" href="#cartera">${ico('dinero')}<span>Tu cartera</span><b class="num">${plata(T.valor)}</b><span class="num ${cls(T.hoy)}">hoy ${plata(T.hoy, true)}</span><span class="num ${cls(T.gana)}">total ${plata(T.gana, true)}</span></a>` : '';
}
function titular() {
  const l = mias().map(empresa).filter((x) => fin(x.pct) && !['SPY', 'QQQ'].includes(x.t)).sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct));
  const m = l[0];
  if (!m) return '<h1>Vuestro radar de mercado</h1>';
  return `<h1>Hoy manda <em>${esc(m.corto)}</em>: <em class="${cls(m.pct)}">${sg(m.pct)}</em></h1><p class="entradilla">${esc(breve(txt(m.cerebro, 'frase')))}${m.cerebro?.claves?.[0] ? ` ${EN ? 'Story of the moment' : 'Noticia del momento'}: «${esc(txt(m.cerebro.claves[0], 'texto'))}».` : ''}</p>`;
}
const VISTAS = {
  empresas() {
    const nuestras = filtrosEmpresas();
    const F = { mercado: ['Todas', universo.length ? universo : null], nuestras: ['Nuestras', nuestras.todas[1]], fav: nuestras.fav, seguidas: nuestras.seguidas, cartera: nuestras.cartera, alarma: nuestras.alarma };
    const filtro = F[op.filtro] ? op.filtro : 'mercado', mercado = filtro === 'mercado';
    const base = mercado ? universo : F[filtro][1].map(filaDe);
    const q = op.busca.trim().toLowerCase(), tam = TAMANOS[op.tam] || TAMANOS.todos;
    const sectores = [...new Set(base.map((r) => r[10]).filter(Boolean))].sort((a, b) => sectorEs(a).localeCompare(sectorEs(b)));
    if (op.sector && !sectores.includes(op.sector)) op.sector = '';
    const esMov = !/^(cap|nombre|precio)_/.test(op.orden);
    const esconder = mercado && esMov && op.tam === 'todos' && !op.peques && !q;
    const filas = ordenar(base.filter((r) => (!esconder || (r[5] >= 3e8 && r[6] >= 2e5)) && (!q || r[0].toLowerCase().startsWith(q) || String(r[1]).toLowerCase().includes(q)) && (!op.sector || r[10] === op.sector) && (op.tam === 'todos' || tam[1](r[5] || 0))));
    const k = plazoI(), con = filas.filter((r) => fin(r[k])), suben = con.filter((r) => r[k] > 0).length, bajan = con.filter((r) => r[k] < 0).length;
    const total = filas.reduce((a, r) => a + (r[5] || 0), 0);
    const por = ajuste('filas');
    const { items, nav } = paginar(filas, 'empresas', por);
    const desde = Math.min(op.pag.empresas || 0, Math.max(0, Math.ceil(filas.length / por) - 1)) * por;
    return `<div class="portada"><div><h1><em>${mercado ? 'Todo el mercado' : 'Nuestras empresas'}</em></h1></div></div>
      <div class="marcas-m"><div><small>Empresas</small><b class="num">${filas.length.toLocaleString(LOC)}</b></div><div><small>Suben</small><b class="up num">${suben.toLocaleString(LOC)}</b></div><div><small>Bajan</small><b class="dn num">${bajan.toLocaleString(LOC)}</b></div><div><small>Valor total</small><b class="num">${corto(total)}</b></div></div>
      <div class="barra-m"><div class="seg">${Object.entries(F).map(([k, [n, l]]) => `<button data-op="filtro" data-k="${k}" class="${filtro === k ? 'act' : ''}">${n}${l ? ` <i>${l.length}</i>` : ''}</button>`).join('')}</div></div>
      <div class="barra-m plazo-m">${barraPlazo()}</div>
      <div class="barra-m"><input class="campo" id="filtra" type="search" placeholder="Filtrar por nombre o símbolo" value="${esc(op.busca)}" autocomplete="off">
        <select class="campo" data-sel="orden" aria-label="Ordenar">${Object.entries(ORDENES).map(([k, n]) => `<option value="${k}" ${op.orden === k ? 'selected' : ''}>${n}</option>`).join('')}</select>
        <select class="campo" data-sel="sector" aria-label="Sector"><option value="">Todos los sectores</option>${sectores.map((x) => `<option value="${esc(x)}" ${op.sector === x ? 'selected' : ''}>${esc(sectorEs(x))}</option>`).join('')}</select>
        <select class="campo" data-sel="tam" aria-label="Tamaño">${Object.entries(TAMANOS).map(([k, [n]]) => `<option value="${k}" ${op.tam === k ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
      <div id="listado">${mercado && esMov && op.tam === 'todos' && !q ? `<p class="aviso-peq">${op.peques ? 'Se ven todas, también las diminutas.' : 'Ocultas las empresas diminutas o casi sin volumen.'} <button data-peques="1">${op.peques ? 'Ocultarlas' : 'Verlas también'}</button></p>` : ''}${items.length ? tablaMercado(items, desde) + nav : vacio('lupa', !universo.length && mercado ? 'Cargando todas las empresas…' : q || op.sector || op.tam !== 'todos' ? 'Ninguna empresa coincide con esos filtros.' : 'Aún no hay ninguna aquí. Buscad una arriba y marcadla como favorita o seguidla.')}</div>`;
  },

  inicio() {
    const p = P(), cerca = [...activas()].sort((a, b) => Math.abs(distancia(a) ?? 99) - Math.abs(distancia(b) ?? 99)).slice(0, 4);
    const avisos = (E.alerts || []).slice(0, 6);
    return `<div class="portada"><div>${titular()}</div><a class="btn pri" href="#alarmas">${ico('campana')} ${activas().length} alarma${activas().length === 1 ? '' : 's'} activa${activas().length === 1 ? '' : 's'}</a></div>
      ${tablero()}
      ${resumenCartera()}
      ${cinta(['NQ', 'ES', 'VIX', 'BTC', 'ETH', 'ORO', 'DXY'])}
      <section>${sec('pulso', verFav() ? 'Mis favoritas' : 'Nuestras empresas', (favoritas(mio.yo).length ? seg('vista', [['fav', '★ Mis favoritas'], ['todas', 'Nuestras']]) : '<button class="btn peq" data-editarperfil="1">★ Elegir mis favoritas</button>') + selectorModo())}${vistaGrupo(listaInicio().map(itemDe).sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct)).slice(0, 18), 'campo-inicio')}${listaInicio().length > 18 ? `<p class="dim" style="text-align:center;margin-top:12px">Las 18 que más se mueven de ${listaInicio().length}.</p>` : ''}</section>
      <section>${sec('fuego', 'Miedo en el mercado', '<a class="btn peq" href="#miedo">Ver detalle</a>')}<div class="diales">${dial('Bolsa', p.miedo)}${dial('Cripto', p.miedoCripto)}</div></section>
      <div class="columnas"><section>${sec('campana', 'Alarmas más cerca')}${cerca.length ? cerca.map(pista).join('') : vacio('campana', 'Entrad en una empresa y poned la primera.', '<button class="btn pri" data-nueva="1">Nueva alarma</button>')}</section>
        <section>${sec('nota', 'Últimos avisos')}${avisos.length ? avisos.map((a) => `<a class="hito" href="${enlace(a.t)}" style="--c:${a.tipo === 'alarma' ? 'var(--gold)' : 'var(--lima)'};grid-template-columns:64px 44px minmax(0,1fr)"><small>${hace(a.ts).replace('hace ', '')}</small><i>${logo(a.t, 's')}</i><span>${esc(a.texto)}</span></a>`).join('') : vacio('nota', 'Aquí salen las alarmas que salten y las noticias de lo que sigáis.')}</section></div>
      <div style="text-align:center;margin-top:34px"><a class="btn" href="#empresas">Ver todas las empresas (${universo.length || mias().length})</a></div>`;
  },

  accion(t) {
    const x = empresa(t), f = x.f, q = x.q, c = x.cerebro, s = seguida(t), al = alarmasDe(t);
    const total = (f.comprar || 0) + (f.mantener || 0) + (f.vender || 0);
    const subida = f.objetivo && x.precio ? ((f.objetivo - x.precio) / x.precio) * 100 : null;
    const ev = (P().resultados || []).find((r) => r.t === t);
    const fechaRes = ev ? new Date(ev.ts) : f.resultados ? new Date(f.resultados * 1000) : null;
    const regla = (titulo, a, b) => (fin(x.precio) && b > a ? `<div class="regla"><label>${titulo}</label><div class="via"><i style="--w:${Math.max(0, Math.min(100, ((x.precio - a) / (b - a)) * 100))}%"></i></div><div class="extremos num"><span>${usd(a)}</span><span>${usd(b)}</span></div></div>` : '');
    const inf = E.informes?.[t];
    const max = Math.max(1, ...(c?.temas || []).map((k) => k.n));
    const fuera = q?.ultimo && q?.precio ? ((q.ultimo - q.precio) / q.precio) * 100 : 0;
    const extra = Math.abs(fuera) > 0.05 ? `<span class="chip ${cls(fuera)}">Fuera de horario ${usd(q.ultimo)} (${sg(fuera)})</span>` : '';
    const mayor = Math.max(1, ...['semana', 'mes', 'ytd', 'anio'].map((k) => Math.abs(f[k]) || 0));
    const torres = ['semana', 'mes', 'ytd', 'anio'].some((k) => fin(f[k]));
    return `${cabecera(t, { ...x, precio: q?.precio ?? x.precio }, `${esc(x.nombre)}${f.bolsa ? ' · ' + esc(f.bolsa) : ''}`, extra, s, al)}
    ${zonaGrafico(MARCOS, al, false, t)}
    ${q && /^[A-Z.]{1,6}$/.test(t) ? `<div id="reacciones" data-t="${esc(t)}"></div>` : ''}
    ${/^[A-Z.]{1,6}$/.test(t) ? `<div id="esperado" data-t="${esc(t)}"></div>` : ''}
    ${c ? `<section>${sec('rayo', c.ia ? 'Resumen con IA' : 'Lo que está pasando')}<div class="cerebro">${anillo((c.animo + 60) / 120, tono(animoTono(c.animo)), `<span style="color:${tono(animoTono(c.animo))}">${animoTxt(c.animo)}</span><small>ambiente de<br>las noticias</small>`)}<div><div class="frase">${esc(breve(txt(c, 'frase')))}</div>${datosHTML(EN ? c.datos_en || c.datos : c.datos)}<div class="temas">${(c.temas || []).map((k) => `<div class="tema" style="--c:${tono(Math.abs(k.tono) < 0.15 ? 0 : k.tono)};--s:${(k.n / max).toFixed(2)}"><i>${ico(TRAZOS[k.id] ? k.id : 'nota')}</i>${esc(k.nombre)}</div>`).join('')}</div></div></div>${c.claves.length ? `<div class="claves">${c.claves.map(claveHTML).join('')}</div>` : ''}</section>` : `<section>${vacio('pulso', 'Esta empresa todavía no se vigila: el gráfico es el de TradingView. Poned una alarma o seguidla y en la próxima actualización aparecen sus noticias, vuestras velas y el dibujo de ideas.', `<button class="btn pri" data-seguir="${esc(t)}">Seguir noticias</button>`)}</section>`}
    ${loQueViene(t)}
    ${inf ? `<section>${sec('lupa', 'Informe de Blake · ' + esc(inf.fecha))}<div class="frase">${esc(inf.frase)}</div><div class="claves">${(inf.puntos || []).map(claveHTML).join('')}</div>${inf.esperando?.length ? `<div class="temas">${inf.esperando.map((e) => `<span class="chip gold">${esc(e.cuando)} · ${esc(e.texto)}</span>`).join('')}</div>` : ''}${inf.riesgos?.length ? `<div class="temas">${inf.riesgos.map((r) => `<span class="chip dn">${esc(r)}</span>`).join('')}</div>` : ''}</section>` : ''}
    <div class="columnas">
      ${total ? `<section>${sec('analistas', 'Qué dicen los analistas')}<div class="rosco">${donut([[f.comprar || 0, '#36c48f'], [f.mantener || 0, '#f0b142'], [f.vender || 0, '#f26670']], `${total}<small>opiniones</small>`)}<div class="leyenda">${[['comprar', 'Comprar', 'var(--up)'], ['mantener', 'Mantener', 'var(--gold)'], ['vender', 'Vender', 'var(--dn)']].map(([k, n, k2]) => `<div style="--c:${k2}"><i></i>${n}<b>${f[k] || 0}</b></div>`).join('')}</div></div>${subida != null ? `<p style="margin-top:16px">Precio que esperan en un año: <b class="num">${usd(f.objetivo)}</b> <span class="chip ${cls(subida)}">${sg(subida, 0)}</span></p>` : ''}<p class="dim" style="font-size:12px;margin-top:6px">Se equivocan a menudo: es una opinión, no un hecho.</p></section>` : ''}
      ${torres || q ? `<section>${sec('resultados', 'Cómo le ha ido')}${torres ? `<div class="torres">${[['semana', 'Semana'], ['mes', 'Mes'], ['ytd', 'Este año'], ['anio', '12 meses']].map(([k, n]) => { const v = f[k] || 0, h = `${Math.max(3, (Math.abs(v) / mayor) * 100)}%`; return `<div class="torre" style="--c:${col(v)};--h:${h}"><div class="arriba">${v >= 0 ? '<u></u>' : ''}</div><div class="abajo">${v < 0 ? '<u></u>' : ''}</div><small><b>${sg(f[k], 1)}</b>${n}</small></div>`; }).join('')}</div>` : ''}</section>` : ''}
      ${q || f.max52 ? `<section>${sec('grafica', 'Dónde está el precio')}${q ? regla('Rango de hoy', q.minimo, q.maximo) : ''}${regla('Rango del último año', f.min52, f.max52)}</section>` : ''}
    </div>
    <section>${sec('analistas', 'Datos clave')}<div class="gordos">
      <div class="gordo"><label>Tamaño</label><strong>${corto(f.cap)}</strong><small>valor en bolsa ($)</small></div>
      <div class="gordo"><label>PER</label><strong>${fin(f.per) ? f.per.toFixed(1) : '—'}</strong><small>años de beneficios que pagas</small></div>
      <div class="gordo"><label>Volumen</label><strong>${fin(f.rvol) ? f.rvol + 'x' : '—'}</strong><small>frente a lo normal</small></div>
      <div class="gordo"><label>Resultados</label><strong>${fechaRes && fechaRes > Date.now() - 864e5 ? diaCorto(fechaRes) : '—'}</strong><small>${ev ? (ev.cuando === 'antes' ? 'antes de abrir' : ev.cuando === 'despues' ? 'tras el cierre' : 'próxima fecha') + (ev.eps != null ? ' · esperan ' + ev.eps : '') : 'próxima fecha'}</small></div></div></section>
    ${/^[A-Z.]{1,6}$/.test(t) ? `<div id="cadena" data-t="${esc(t)}"></div>` : ''}`;
  },

  activo(id) {
    const a = activo(id);
    if (!a) return vacio('pulso', 'Sin datos todavía de este indicador.');
    const t = ACTIVO_ALARMA[id], al = t ? alarmasDe(t) : [];
    const x = { precio: a.precio, pct: a.pct, corto: id };
    return `${cabecera(t || id, x, esc(a.nombre), '', t ? seguida(t) : null, al, !t)}
    ${zonaGrafico([['d1', '15m'], ['h1', '1H'], ...MARCOS.slice(2)], al, true, t)}
    <section>${sec('grafica', 'Otros indicadores')}${cinta((P().activos || []).map((z) => z.id).filter((z) => z !== id))}</section>`;
  },

  moneda(s) {
    const m = monedaDe(s), t = s + '-USD', al = alarmasDe(t), q = E.quotes?.[t];
    if (!m) return vacio('moneda', 'No tengo datos de esta moneda.');
    const x = { precio: q?.ultimo ?? m.precio, pct: m.dia, corto: s };
    return `${cabecera(t, x, esc(m.nombre), '', seguida(t), al)}
    ${q ? zonaGrafico(MARCOS, al, true, t) : `<section>${sec('grafica', 'Últimos 7 días')}${historia(m.linea.map((v, i) => [Date.now() - (m.linea.length - 1 - i) * ((7 * 864e5) / m.linea.length), v]), m.semana >= 0 ? '#36c48f' : '#f26670')}<p class="dim" style="margin-top:8px">Con una alarma o siguiéndola aparecen sus velas.</p></section>`}
    <section>${sec('moneda', 'Datos')}<div class="gordos"><div class="gordo"><label>7 días</label><strong class="${cls(m.semana)}">${sg(m.semana, 1)}</strong></div><div class="gordo"><label>Tamaño</label><strong>${corto(m.cap)}</strong><small>$</small></div><div class="gordo"><label>Volumen 24 h</label><strong>${corto(m.vol)}</strong><small>$</small></div><div class="gordo"><label>Desde su máximo</label><strong class="dn">${sg(m.ath, 0)}</strong><small>histórico</small></div><div class="gordo"><label>Hoy entre</label><strong style="font-size:20px">${usd(m.bajo)}<br>${usd(m.alto)}</strong></div></div></section>`;
  },

  alarmas() {
    const act = deQuien(activas()), saltadas = deQuien(mio.alarmas).filter((a) => a.disparada).sort((a, b) => Date.parse(b.disparada) - Date.parse(a.disparada));
    return `<div class="portada"><div><h1><em>Radar de alarmas</em></h1><p class="entradilla">Cada logo se acerca al centro según se acerca a vuestro precio. Cuando llega, os avisa Discord con el porqué.</p></div><div style="display:flex;gap:10px;flex-wrap:wrap">${filtroGente()}<button class="btn pri" data-nueva="1">${ico('mas')} Nueva alarma</button></div></div>
      <div class="radar-zona">${radarAlarmas(act)}<div>${act.length ? [...act].sort((a, b) => Math.abs(distancia(a) ?? 99) - Math.abs(distancia(b) ?? 99)).map(pista).join('') : vacio('campana', 'El radar está vacío.<br>Elegid una empresa y decidle a qué precio avisar.', `<button class="btn pri" data-nueva="1">${ico('mas')} Poner la primera</button>`)}</div></div>
      ${seccionReglas()}
      ${saltadas.length ? `<section>${sec('campana', 'Ya han saltado')}<div class="columnas"><div>${saltadas.slice(0, 12).map(pista).join('')}</div></div></section>` : ''}`;
  },

  seguimiento() {
    const l = deQuien(mio.seguidas);
    return `<div class="portada"><div><h1>En el <em>punto de mira</em></h1><p class="entradilla">Las empresas que seguís, con sus últimas noticias importantes.</p></div><div style="display:flex;gap:10px;flex-wrap:wrap">${filtroGente()}<button class="btn pri" data-enfoca="1">${ico('mas')} Añadir</button></div></div>
      ${l.length ? paginar(l, 'seguir', 5).items.map((s) => { const c = empresa(s.t).cerebro; return `<section><div class="filas">${fila(s.t)}</div>${c?.claves?.length ? `<div class="claves" style="margin-top:18px">${c.claves.map(claveHTML).join('')}</div>` : '<p class="dim" style="margin-top:12px">Sus noticias llegan en la próxima actualización.</p>'}<div style="margin-top:14px;display:flex;gap:9px;flex-wrap:wrap"><button class="btn peq ${s.noticias ? 'on' : ''}" data-avisar="${esc(s.t)}">${ico('campana')} ${s.noticias ? 'Avisando en Discord' : 'Sin avisos'}</button><button class="btn peq" data-dejar="${esc(s.t)}">Dejar de seguir</button><span class="quien-sigue">${cara(s.por || mio.yo || '?')} la sigue ${esc(s.por || '')}</span></div></section>`; }).join('') + paginar(l, 'seguir', 5).nav : vacio('ojo', 'Todavía no seguís nada.<br>Buscad una empresa arriba y pulsad «Seguir noticias».', '<button class="btn pri" data-enfoca="1">Buscar empresa</button>')}`;
  },

  perfil(nombre) {
    const q = gente().includes(nombre) ? nombre : mio.yo, p = perfil(q), yo = q === mio.yo, f = fondoDe(p), n = numerosDe(q), d = detallesDe(q);
    const tab = ['resumen', 'cartera', 'ideas', 'actividad'].includes(op.ptab) ? op.ptab : 'resumen';
    const credito = fotoValida(p.portada) ? '' : FOTOS[nombrePortada(p.portada)].n;
    const cifra = (icono, v, et, color) => `<div class="pf-cifra">${ico(icono)}<strong class="num" ${color ? `style="color:${color}"` : ''}>${v}</strong><span>${et}</span></div>`;
    const fichas2 = [ESTILOS[d.estilo], d.riesgo != null ? RIESGOS[d.riesgo] : null, d.lugar].filter(Boolean);
    const cuerpo = tab === 'cartera' ? listaCq(numerosCq([q]), [q]) + historialCq(numerosCq([q]), [q]) + (n.pos.length ? `<section>${sec('pulso', 'Cómo van hoy', selectorModo())}${vistaGrupo(n.pos.map((x) => itemDe(x.t)), 'campo-pcartera')}</section>` : '')
      : tab === 'ideas' ? `<div class="pf-rejilla">${cajaPunteria(n)}${cajaCara(q, n)}</div>${n.ideas.length ? `<section>${sec('lapiz', yo ? 'Mis ideas' : 'Sus ideas')}${ideasLista(n)}</section>` : ''}`
        : tab === 'actividad' ? `<div class="pf-rejilla">${caja('pulso', 'Todo lo que ha hecho', lineaTiempo(q, 60), 'ancha')}</div>`
          : `<div class="pf-rejilla">${cajaPunteria(n)}${cajaCartera(n, yo)}${hayDetalles() ? cajaSobre(q, yo) : ''}${cajaCara(q, n)}${cajaSectores(n)}${caja('pulso', 'Últimos movimientos', lineaTiempo(q, 6), '', '<button class="btn peq" data-ptab="actividad">Ver todo</button>')}${cajaLogros(n)}</div>
            <section>${sec('estrella', yo ? 'Mis favoritas' : 'Sus favoritas', selectorModo() + (yo ? `<button class="btn peq" data-editarperfil="favoritas">${ico('mas')} Añadir</button>` : ''))}${n.fav.length ? vistaGrupo(n.fav.map(itemDe), 'campo-fav') : vacio('estrella', yo ? 'Elige tus empresas favoritas: salen aquí y en tu inicio.' : 'Todavía no ha elegido favoritas.')}</section>
            ${n.puestas.length ? `<section>${sec('campana', 'Alarmas puestas')}<div class="columnas"><div>${n.puestas.map(pista).join('')}</div></div></section>` : ''}`;
    return `<div class="pf" style="--yo:${colorDe(q)}">
      <div class="pf-portada"><div class="pf-foto" style="${f.estilo};--reloj:-${((Date.now() / 1000) % 48).toFixed(1)}s"></div>${credito ? `<span class="cab-credito">${esc(credito)}</span>` : ''}${yo ? `<button class="pf-cambiar" data-editarperfil="portada">${ico('clip')} Cambiar portada</button>` : ''}</div>
      <div class="pf-cabeza">
        <div class="pf-aro" style="--av:${(n.avance * 100).toFixed(0)}">${avatar(q, 'xxl')}<span class="num" title="Nivel">${n.nivel}</span></div>
        <div class="pf-quien"><h1>${esc(apodo(q || 'Sin entrar'))}</h1><p>${esc(p.frase || (yo ? 'Pon tu frase, tu foto y tus favoritas.' : ''))}</p>
          <div class="pf-chips"><span class="rango">${ico('copa')} ${n.rango}</span>${fichas2.map((x) => `<span>${esc(x)}</span>`).join('')}</div></div>
        <div class="pf-acc">${yo ? `<button class="btn pri" data-editarperfil="1">${ico('lapiz')} Editar perfil</button><button class="btn" data-ajustes="1">${ico('ajustes')} Ajustes</button><button class="btn" data-clave="1">Cambiar clave</button>` : `<a class="btn pri" href="#chat">${ico('chat')} Escribirle</a>`}</div>
      </div>
      <div class="pf-subida"><div><b>Nivel ${n.nivel}</b><span class="num">${n.puntos} puntos</span><span>${n.siguiente ? `Faltan ${n.faltan} para ${n.siguiente}` : 'Rango máximo'}</span></div><u><i style="--w:${(n.avance * 100).toFixed(0)}%"></i></u></div>
      <div class="pf-cifras">${cifra('analistas', n.acierto == null ? '—' : n.acierto + '%', 'acierta')}${cifra('lapiz', n.ideas.length, 'ideas')}${cifra('campana', n.puestas.length, 'alarmas')}${cifra('dinero', n.pos.length ? plata(n.T.valor) : '—', 'en cartera')}${cifra('grafica', n.pct == null ? '—' : sg(n.pct, 1), 'ganancia', n.pct == null ? null : col(n.pct))}${cifra('estrella', n.fav.length, 'favoritas')}</div>
      <div class="pf-pestanas">${[['resumen', 'casa', 'Resumen'], ['cartera', 'dinero', 'Cartera'], ['ideas', 'lapiz', 'Ideas'], ['actividad', 'pulso', 'Actividad']].map(([k, i, t]) => `<button data-ptab="${k}" class="${tab === k ? 'act' : ''}">${ico(i)}<span>${t}</span></button>`).join('')}</div>
      ${cuerpo}</div>`;
  },

  // resumen, lo que tienes, curva, reparto, historial y cara a cara (cartera.js)
  cartera: () => vistaCartera(),

  nuestro() {
    const quienes = gente(), act = actividad();
    const tarjeta = (q) => { const n = numerosDe(q), url = `#perfil/${encodeURIComponent(q)}`;
      return `<div class="persona2" style="--yo:${colorDe(q)}"><a class="p2-portada" href="${url}" style="${fondoDe(perfil(q)).estilo}"></a><a class="pf-aro" href="${url}" style="--av:${(n.avance * 100).toFixed(0)}">${avatar(q, 'xl')}<span class="num">${n.nivel}</span></a><a class="p2-nombre" href="${url}"><b>${esc(apodo(q))}${q === mio.yo ? ' (tú)' : ''}</b></a><span class="pf-chips"><span class="rango">${ico('copa')} ${n.rango}</span>${ESTILOS[detallesDe(q).estilo] ? `<span>${ESTILOS[detallesDe(q).estilo]}</span>` : ''}</span><small class="dim">${esc(perfil(q).frase || '')}</small>
        <div class="p2-cifras"><a href="#alarmas" data-quienir="${esc(q)}"><strong>${n.puestas.length}</strong>alarmas</a><a href="#analisis" data-quienir="${esc(q)}"><strong>${n.acierto == null ? '—' : n.acierto + '%'}</strong>acierta</a><a href="#cartera" data-quienir="${esc(q)}"><strong class="${cls(n.T.gana)}">${n.pct == null ? '—' : sg(n.pct, 1)}</strong>cartera</a></div>
        <div class="p2-favs">${n.fav.slice(0, 7).map((t) => `<a href="${enlace(t)}" title="${esc(alias(t))}">${logo(t, 's')}</a>`).join('')}</div><a class="btn peq" href="${url}">Ver perfil</a></div>`; };
    return `<div class="portada"><div><h1>Lo <em>nuestro</em></h1><p class="entradilla">Todo lo que hace cada uno: alarmas, ideas, empresas seguidas y carteras.</p></div></div>
      <div class="personas">${quienes.map(tarjeta).join('')}</div>
      <section>${sec('pulso', 'Qué ha pasado entre nosotros', filtroGente())}${deQuien(act).slice(0, 30).map((a) => `<a class="hecho2" href="${a.va}" ${a.id ? `data-abriridea="${Number(a.id)}"` : ''}>${cara(a.por)}${logo(a.t, 's')}<span><b>${esc(apodo(a.por))}</b> ${esc(a.texto)}</span><small class="dim">${hace(a.ts)}</small></a>`).join('') || vacio('pulso', 'Todavía no hay nada. En cuanto pongáis una alarma, una idea o apuntéis una acción, sale aquí.')}</section>
      <section>${sec('ojo', 'Empresas que seguimos', '<a class="btn peq" href="#seguimiento">Ver sus noticias</a>')}${mio.seguidas.length ? tablaEmpresas(paginar(deQuien(mio.seguidas), 'nosotros', 6).items.map((s) => empresa(s.t))) + paginar(deQuien(mio.seguidas), 'nosotros', 6).nav : vacio('ojo', 'Todavía no seguís ninguna.')}</section>`;
  },

  // las ideas son los analisis (analisis.js); #ideas lleva aqui
  analisis: () => vistaAnalisis(),

  comparar() {
    return vistaComparar();
  },

  cripto() {
    const p = P(), C = p.cripto, F = p.etf;
    if (!C) return vacio('moneda', 'Los datos de cripto llegan en la próxima actualización.');
    const g = C.global, btc = activo('BTC'), eth = activo('ETH');
    return `<div class="portada"><div><h1>Bitcoin <em class="${cls(btc?.pct)}">${sg(btc?.pct)}</em> · Ethereum <em class="${cls(eth?.pct)}">${sg(eth?.pct)}</em></h1></div></div>
      ${cinta(['BTC', 'ETH'])}
      <section>${sec('moneda', 'Las monedas', selectorModo())}${vistaGrupo(C.monedas.map((m) => itemDe(m.s + '-USD')), 'campo-cripto')}</section>
      <div class="columnas">
        <section>${sec('fuego', 'Miedo cripto')}<div class="diales">${dial('Cripto', p.miedoCripto)}</div></section>
        ${g ? `<section>${sec('mercado', 'Quién domina')}<div class="rosco">${donut([[g.btc, '#ffb020'], [g.eth, '#8f9bff'], [100 - g.btc - g.eth, '#667283']], `${g.btc.toFixed(0)}%<small>bitcoin</small>`)}<div class="leyenda"><div style="--c:#ffb020"><i></i>Bitcoin<b>${g.btc.toFixed(1)}%</b></div><div style="--c:#8f9bff"><i></i>Ethereum<b>${g.eth.toFixed(1)}%</b></div><div style="--c:#a19e8f"><i></i>Resto<b>${(100 - g.btc - g.eth).toFixed(1)}%</b></div></div></div><div class="gordos" style="margin-top:24px"><div class="gordo"><label>Todo el mercado</label><strong>${corto(g.cap)}</strong><small class="${cls(g.cambio)}">${sg(g.cambio)} en 24 h</small></div><div class="gordo"><label>Volumen 24 h</label><strong>${corto(g.vol)}</strong><small>$</small></div></div></section>` : ''}
      </div>
      ${F ? seccionETF(F) : ''}
      <section>${sec('grafica', 'Precios')}<div class="filas">${C.monedas.map((m) => `<a href="${enlace(m.s + '-USD')}">${logo(m.s + '-USD')}<span class="nom"><b>${esc(m.s)}</b><small>${esc(m.nombre)}</small></span><span class="dice">7 días: <b class="num ${cls(m.semana)}">${sg(m.semana, 1)}</b> · tamaño ${corto(m.cap)}\u00a0$</span>${chispa(m.linea, m.semana >= 0, 'm' + m.s)}<span class="der num"><strong>${usd(m.precio)}</strong><span class="${cls(m.dia)}">${sg(m.dia)}</span></span></a>`).join('')}</div></section>`;
  },

  miedo() {
    const p = P(), v = activo('VIX');
    return `<div class="portada"><div><h1>${p.miedo ? `El mercado tiene <em style="color:${miedoCol(p.miedo.valor)}">${miedoTxt(p.miedo.valor).toLowerCase()}</em>` : 'Índice del miedo'}</h1><p class="entradilla">0 es pánico, 100 es euforia. Con mucho miedo suele haber rebajas; con mucha codicia, cuidado.</p></div></div>
      <div class="diales">${dial('Bolsa de EE. UU.', p.miedo, 'CNN')}${dial('Cripto', p.miedoCripto)}</div>
      ${p.miedo ? `<section>${sec('pulso', 'La bolsa en el último año')}${historia(p.miedo.historia, '#e9edf3', true)}</section>
      <section>${sec('analistas', 'De qué está hecho')}${p.miedo.partes.map((x) => `<div class="parte" style="--c:${miedoCol(x.valor)}"><span>${esc(x.nombre)}</span><span class="escala">${Array.from({ length: 20 }, (_, i) => `<i class="${i < Math.round(x.valor / 5) ? 'si' : ''}"></i>`).join('')}</span><b class="num" style="color:${miedoCol(x.valor)}">${x.valor}</b></div>`).join('')}</section>` : ''}
      ${p.miedoCripto ? `<section>${sec('moneda', 'Cripto, últimos 31 días')}<div class="puntos">${p.miedoCripto.historia.map(([ts, n]) => `<i style="--c:${miedoCol(n)}" title="${diaCorto(new Date(ts))}">${n}</i>`).join('')}</div></section>` : ''}
      ${v ? `<section>${sec('fuego', 'VIX: los nervios en puntos', `<a class="btn peq" href="#activo/VIX">Ver velas</a>`)}<div class="gordos" style="margin-bottom:16px"><div class="gordo"><label>Ahora</label><strong class="${v.precio > 20 ? 'dn' : 'up'}">${dinero(v.precio)}</strong><small>${v.precio < 15 ? 'mercado muy tranquilo' : v.precio < 20 ? 'tranquilo' : v.precio < 30 ? 'nervioso' : 'pánico'}</small></div></div>${historia(v.dias.map((d) => [d[0], d[1]]), '#f0b142')}</section>` : ''}`;
  },

  calendario() {
    const res = P().resultados || [];
    const lunes = new Date(); lunes.setHours(12, 0, 0, 0);
    lunes.setDate(lunes.getDate() - ((lunes.getDay() + 6) % 7) + (lunes.getDay() === 6 || lunes.getDay() === 0 ? 7 : 0) + 7 * op.semana);
    const hoy = diaDe(Date.now()), propias = new Set(mias());
    const dias = Array.from({ length: 5 }, (_, i) => { const d = new Date(lunes); d.setDate(d.getDate() + i); return d; });
    const jornada = (d) => {
      const k = diaDe(d), del = res.filter((r) => diaDe(r.ts) === k).sort((a, b) => propias.has(b.t) - propias.has(a.t) || (b.cap || 0) - (a.cap || 0));
      const grupos = [['antes', 'Antes de abrir'], ['despues', 'Tras el cierre'], ['', 'Sin hora']].map(([c, n]) => { const l = del.filter((r) => r.cuando === c).slice(0, 10); return l.length ? `<div class="franja">${n}</div>${logosResultados(l)}` : ''; }).join('');
      return `<div class="jornada ${k === hoy ? 'hoy' : k < hoy ? 'pasado' : ''}"><header><b>${d.getDate()}</b><span>${d.toLocaleDateString(LOC, { weekday: 'long' })}</span></header>${grupos || '<p class="dim">Nada grande</p>'}</div>`;
    };
    let ultimo = '';
    const macro = (E.macro || []).map((m) => { const D = diaLargo(new Date(m.ts)), cab = D !== ultimo ? `<div class="diah">${D}</div>` : ''; ultimo = D; return cab + hito(m); }).join('');
    // las ventas desbloqueadas de las vuestras ya salen en "Lo que viene"; las de las demas, aparte
    const otras = proximosDesb(92).filter(({ e }) => !propias.has(e.t));
    return `<div class="portada"><div><h1>Quién <em>presenta cuentas</em></h1><p class="entradilla">Los resultados son lo que más mueve una acción. Las vuestras salen con aro verde.</p></div>${seg('semana', [[0, 'Esta semana'], [1, 'La siguiente'], [2, 'En 2 semanas']])}</div>
      <div class="semana">${dias.map(jornada).join('')}</div>
      ${agendaVuestra()}
      <div class="columnas"><section>${sec('mercado', 'Datos que mueven todo')}${macro || vacio('calendario', 'Nada pendiente esta semana.')}</section>
      ${otras.length ? `<section class="otras-desb">${sec('calendario', 'Otras salidas a bolsa')}<div class="desbs">${otras.map(({ e, x }) => filaDesb(x, e)).join('')}</div><p class="dim desb-nota">Cuándo pueden vender empleados, inversores y fundadores de las empresas que salieron hace poco a bolsa. Mucha venta de golpe suele presionar el precio.</p></section>` : ''}</div>`;
  },

  explorar() {
    const sectores = P().sectores || [];
    const mayor = Math.max(1, ...sectores.map((s) => Math.abs(s.dia) || 0));
    const cuerpo = op.explorar === 'fuera' ? cuerpoFuera() : op.explorar === 'mapa' ? '<div class="mapa" id="mapatv"></div>'
      : op.explorar === 'sect' ? `<div class="sectores">${[...sectores].sort((a, b) => b.dia - a.dia).map((s) => `<a class="sector" href="#accion/${s.t}">${anillo(Math.abs(s.dia) / mayor, col(s.dia), `<strong class="${cls(s.dia)}">${sg(s.dia, 1)}</strong>`, 1.1)}<b>${esc(s.nombre)}</b><small class="num">mes ${sg(s.mes, 1)}</small></a>`).join('')}</div>`
        : cuerpoMovimientos();
    return `<div class="portada"><div><h1>${op.explorar === 'fuera' ? 'Con la bolsa <em>cerrada</em>' : op.explorar === 'mapa' ? 'El mercado <em>de un vistazo</em>' : op.explorar === 'sect' ? 'Qué <em>sectores</em> tiran' : 'Se está moviendo <em>algo</em>'}</h1><p class="entradilla">${op.explorar === 'fuera' ? 'Lo que se mueve antes de abrir y después del cierre.' : op.explorar === 'mov' ? 'Todo el mercado ordenado por lo que está pasando hoy. Para mirar, no para comprar a ciegas.' : op.explorar === 'sect' ? 'Cada anillo es un sector entero.' : 'Las 500 grandes: tamaño = valor, color = cómo va hoy.'}</p></div>
      <div>${seg('explorar', [['mov', 'Movimientos'], ['fuera', 'Fuera de horario'], ['sect', 'Sectores'], ['mapa', 'Mapa']])}${P().miedo ? `<a class="btn peq" href="#miedo" style="border-color:${miedoCol(P().miedo.valor)}">${ico('fuego')} Miedo: bolsa ${P().miedo.valor} · cripto ${P().miedoCripto?.valor ?? '—'}</a>` : ''}</div>
      ${op.explorar === 'mov' ? `<div>${seg('plazo', [['hoy', 'Hoy'], ['semana', 'Esta semana'], ['mes', 'Este mes']])}</div><div>${seg('mov', [['sube', 'Suben'], ['baja', 'Bajan'], ['dinero', 'Más dinero'], ['raro', 'Actividad rara']])}${seg('suelo', [['grandes', 'Solo grandes'], ['normales', 'Medianas y grandes'], ['todas', 'También pequeñas']])}</div>` : ''}</div>${cuerpo}`;
  },

  chat() {
    return `<div class="chat" id="chat">${sec('chat', 'Chat de ideas', `<span class="dim">${motor.nube ? 'compartido' : 'solo en este navegador (sin conectar)'}</span>`)}
      <div id="mensajes" aria-live="polite"></div>
      <div class="redactar"><div class="adjuntos" id="adjuntos"></div><div class="flota" id="popacc" hidden></div>
        <div class="emojis">${['🚀', '📈', '📉', '🔥', '👀', '💰', '🤔', '✅', '❌', '😂'].map((e) => `<button type="button" data-emoji="${e}">${e}</button>`).join('')}</div>
        <div class="renglon"><button class="redondo" data-adjuntar="1" title="Añadir imagen">${ico('clip')}</button><button class="redondo" data-etiquetar="1" title="Mencionar una empresa">${ico('grafica')}</button><textarea id="texto" rows="1" maxlength="2000" placeholder="Escribe una idea o pega un gráfico…"></textarea><button class="redondo pri" data-enviar="1" title="Enviar">${ico('enviar')}</button></div>
        <input type="file" id="fichero" accept="image/*" hidden></div></div>`;
  },
};
function hito(m) {
  const icono = /inflaci|precios/i.test(m.titulo) ? 'fuego' : /empleo|paro|jolts/i.test(m.titulo) ? 'directivos' : /fed/i.test(m.titulo) ? 'legal' : /ventas|consumidor/i.test(m.titulo) ? 'ventas' : 'resultados';
  return `<div class="hito ${m.alto ? 'alto' : ''}" style="--c:${m.alto ? 'var(--gold)' : 'var(--mut)'}"><time class="num">${hhmm(new Date(m.ts))}</time><i>${ico(icono)}</i><div>${esc(EN ? m.en || m.titulo : m.titulo)}<small>${m.previsto ? 'Se espera ' + esc(m.previsto) : 'Sin previsión'}${m.previo ? ' · antes ' + esc(m.previo) : ''}</small></div><span class="chip dim" data-cuenta="${+m.ts}">${falta(m.ts)}</span></div>`;
}
function cabecera(t, x, sub, extra, s, al, sinMandos) {
  return `<div class="ficha"><span class="fantasma">${esc(x.corto)}</span>${logo(t, 'xl')}<div><h1>${esc(x.corto)}</h1><p class="mut">${sub}</p></div>
    <div><div class="precio">${usd(x.precio, t)}</div><div style="margin-top:6px;display:flex;gap:7px;flex-wrap:wrap"><span class="chip ${cls(x.pct)}">${x.pct >= 0 ? '▲' : '▼'} ${sg(x.pct)} hoy</span>${extra}</div></div>
    ${sinMandos ? '' : `<div class="mandos"><button class="btn pri" data-alarma="${esc(t)}">${ico('campana')} Poner alarma</button><button class="btn ${s ? 'on' : ''}" data-seguir="${esc(t)}">${ico('ojo')} ${s ? 'En seguimiento' : 'Seguir noticias'}</button><button class="btn" data-posicionde="${esc(t)}">${ico('dinero')} La tengo</button><button class="btn ${favoritas(mio.yo).includes(t) ? 'on' : ''}" data-fav="${esc(t)}">${ico('estrella')} ${favoritas(mio.yo).includes(t) ? 'Favorita' : 'A favoritas'}</button><button class="btn" data-comentar="${esc(t)}">${ico('chat')} Compartir en el chat</button><button class="btn" data-calcula="${esc(t)}">${ico('analistas')} Calculadora</button></div>`}</div>`;
}
function zonaGrafico(rangos, al, sesiones, t) {
  if (t && idea?.t === t) {
    return `<div class="graf-cab"><span class="frase" style="font-size:20px">Dibuja tu idea sobre ${esc(alias(t))}</span>${seg('rango', rangos)}</div>${herramientas()}<div class="graf alto" id="graf"></div><div class="ayuda-graf"><span>Elige una herramienta y arrastra sobre el gráfico. El hueco de la derecha es el futuro. Con «Mover» te desplazas; arrastra los precios para estirar.</span></div>${formIdea()}`;
  }
  const v = viendo && viendo.t === t ? viendo : null;
  const tv = conTV(t), modos = t && tvSimbolo() && !v ? seg('grafv', [['tv', 'TradingView'], ['propio', 'Con alarmas']]) : '';
  if (tv) return `<div class="graf-cab">${modos}<span>${t ? `<button class="btn pri" data-dibujar="${esc(t)}">${ico('lapiz')} Dibujar mi idea</button>` : ''}</span></div>
    <div class="graf tv" id="graf"></div>
    ${t ? analisisEmpresa(t) : ''}`;
  return `<div class="graf-cab">${v ? `<div class="seg"><button data-quitaridea="1">← Gráfico normal</button><button class="act">Idea de ${esc(v.por)} · ${v.confianza ?? 50}% seguro</button></div>${seg('sobre', [['foto', 'Como lo dibujó'], ['hoy', 'Sobre el precio de ahora']])}` : `${modos}${seg('rango', rangos)}<span>${al.map((a) => `<span class="chip gold">${a.dir === 'sube' ? '▲' : '▼'} ${usd(a.nivel, a.t)}</span> `).join('')}${t ? `<button class="btn pri" data-dibujar="${esc(t)}">${ico('lapiz')} Dibujar mi idea</button>` : ''}</span>`}</div>
    <div class="graf" id="graf"></div><div class="ayuda-graf"><span>Arrastra para moverte · botones + y − para acercar (o Ctrl + rueda) · «Grande» para verlo a pantalla completa</span>${sesiones && !LARGOS.includes(op.rango) ? '<span><i style="--c:#3d5bff"></i>Máx. y mín. de Asia</span><span><i style="--c:#e02020"></i>Londres</span>' : ''}${al.length ? '<span><i style="--c:#ffd60a"></i>Vuestras alarmas</span>' : ''}${v ? '<span><i style="--c:#fff"></i>Momento en que se publicó</span>' : ''}</div>
    ${t ? analisisEmpresa(t) : ''}`;
}
// ---------- velas de plazos largos: un fichero por empresa, solo cuando se piden ----------
const MARCOS = [['d1', '5m'], ['m15', '15m'], ['h4', '4H'], ['d', '1D'], ['s', '1W'], ['mes', '1M']];
const LARGOS = ['h4', 'd', 's', 'mes'];
// 2026-11-26 (PM: "no se ve nada parecido a TradingView"): the real TradingView chart by default; "Con alarmas" keeps our own
op.grafv = guarda.leer('grafv', 'tv');
const TV_ACTIVO = { NQ: 'OANDA:NAS100USD', ES: 'OANDA:SPX500USD', BTC: 'BITSTAMP:BTCUSD', ETH: 'BITSTAMP:ETHUSD', ORO: 'OANDA:XAUUSD', CRUDO: 'TVC:USOIL' };
function tvSimbolo() {
  const { v, t } = ruta;
  if (v === 'activo') return TV_ACTIVO[t] || null;
  if (v === 'moneda') return /^[A-Z0-9]{2,10}$/.test(t || '') ? 'BINANCE:' + t + 'USDT' : null;
  return v === 'accion' && /^[A-Z][A-Z0-9.]{0,9}$/.test(t || '') ? t : null;
}
const conTV = (t) => op.grafv === 'tv' && !(idea && idea.t === t) && !(viendo && viendo.t === t) && !!tvSimbolo();
let tvAparcado = null;
const SIMBOLO_ACTIVO = { NQ: 'NQ=F', ES: 'ES=F', VIX: '^VIX', BTC: 'BTC-USD', ETH: 'ETH-USD', ORO: 'GC=F', CRUDO: 'CL=F', DXY: 'DX-Y.NYB', BONO10: '^TNX' };
const nombreVelas = (s) => s.replace(/[^A-Za-z0-9.-]/g, '_');
const velasLargas = new Map();
// devuelve los datos, null si no hay, o undefined mientras llegan
function pideVelas(simbolo) {
  const tramo = Math.floor(Date.now() / 36e5), ya = velasLargas.get(simbolo);
  if (ya && ya.tramo === tramo) return ya.datos;
  velasLargas.set(simbolo, { tramo, datos: ya?.datos });
  const llega = window.__VELAS__ ? Promise.resolve(window.__VELAS__[nombreVelas(simbolo)] || null) : fetch(`data/v/${nombreVelas(simbolo)}.json?${tramo}`).then((r) => (r.ok ? r.json() : null));
  llega.catch(() => null).then((datos) => { velasLargas.set(simbolo, { tramo, datos }); if (!idea && $('#graf')) ponerGrafico(); rellenaReacciones(); if (ruta.v === 'comparar') montarComparar(); else if (ruta.v === 'accion') rellenaMercadoOpciones(); else if (ruta.v === 'cartera' || ruta.v === 'perfil') { pintarCurva(); pintarCq(); } pintarAn(); });
  return ya?.datos;
}


// junta velas en bloques mas grandes: [ts, cierre, alto, bajo, apertura, volumen]
function agrupa(velas, ms) {
  const out = [];
  for (const v of velas) {
    const k = Math.floor(v[0] / ms) * ms, u = out[out.length - 1];
    if (u && u[0] === k) { u[1] = v[1]; u[2] = Math.max(u[2], v[2]); u[3] = Math.min(u[3], v[3]); u[5] += v[5] || 0; }
    else out.push([k, v[1], v[2], v[3], v[4], v[5] || 0]);
  }
  return out;
}
function ponerGrafico() {
  for (const el of document.querySelectorAll('[data-mini]')) { const i = (mio.ideas || []).find((x) => x.id === +el.dataset.mini); if (i?.dibujo) grafico(el, { velas: i.dibujo.velas, trazos: i.dibujo.trazos, mini: true }); }
  const el = $('#graf');
  graf = null;
  guarda.poner('grafv', op.grafv);
  const aparcado = tvAparcado; tvAparcado = null;
  if (!el) { aparcado?.remove(); return; }
  if (el.classList.contains('tv')) {
    const s = tvSimbolo(), clave = s + '|' + (EN ? 'en' : 'es');
    // the same chart as before a repaint: moved back without reloading (Chrome moveBefore keeps the iframe alive)
    if (aparcado && aparcado.dataset.clave === clave && el.parentNode.moveBefore) { el.parentNode.moveBefore(aparcado, el); aparcado.id = 'graf'; el.remove(); return; }
    aparcado?.remove();
    el.dataset.clave = clave;
    widgetTV(el, 'advanced-chart', { symbol: s, autosize: true, interval: 'D', timezone: 'Europe/Madrid', theme: 'dark', style: '1', locale: EN ? 'en' : 'es', withdateranges: true, hide_side_toolbar: false, hide_top_toolbar: false, allow_symbol_change: false, save_image: false, calendar: false, support_host: 'https://www.tradingview.com' });
    return;
  }
  aparcado?.remove();
  const { v, t } = ruta;
  const a = v === 'activo' ? activo(t) : null, ticker = v === 'activo' ? ACTIVO_ALARMA[t] : v === 'moneda' ? t + '-USD' : t;
  const ver = viendo && viendo.t === ticker ? viendo : null;
  const guardado = ver ? ver.dibujo.marco : op.rango, marco = guardado === 'm6' ? 'd' : guardado;
  const dia = !LARGOS.includes(marco);
  const simbolo = v === 'activo' ? SIMBOLO_ACTIVO[t] : ticker, seguida2 = !!(a || E.quotes?.[ticker]);
  let largas = null;
  if (!dia && seguida2) {
    largas = pideVelas(simbolo);
    if (largas === undefined && marco !== 'd') { el.innerHTML = '<div class="graf-vacio">Cargando velas…</div>'; return; }
  }
  let vivas = (dia ? (a ? a.velas : E.quotes?.[ticker]?.velas) : largas?.[marco] || (marco === 'd' ? (a ? a.dias : E.hist?.[ticker]?.v) : null))?.filter((k) => k.length >= 5);
  if (vivas && marco === 'm15') vivas = agrupa(vivas, 15 * 60e3);
  if (vivas && marco === 'h1') vivas = agrupa(vivas, 60 * 60e3);
  const alarmas = (ticker ? alarmasDe(ticker) : []).map((x) => ({ nivel: +x.nivel, dir: x.dir }));
  const continuo = v === 'activo' || v === 'moneda';
  const opciones = { alarmas, intradia: dia, marco, sesiones: dia && continuo && t !== 'VIX' && t !== 'BONO10', ver: innerWidth < 640 ? 60 : 110, largoSesion: a ? 64 : 190 };
  if (idea && idea.t === ticker) {
    graf = grafico(el, { ...opciones, alarmas: [], velas: vivas, editable: true, trazos: idea.trazos, color: idea.color, onCambio: (tz) => { idea.trazos = tz.map((x) => ({ ...x })); const f = [...tz].reverse().find((x) => x.h === 'flecha'); if (f && !idea.objetivoManual) { idea.objetivo = +f.p[f.p.length - 1][1].toPrecision(6); const caja = $('#idea-obj'); if (caja) caja.value = idea.objetivo; const ahora = empresa(idea.t).precio; if (ahora) { idea.dir = idea.objetivo >= ahora ? 'sube' : 'baja'; pintarLado(); } } } });
    graf?.usar(idea.h);
  } else if (ver) {
    // sus velas guardadas, o las suyas seguidas de lo que ha pasado despues
    const foto = ver.dibujo.velas, ultima = foto[foto.length - 1][0];
    const velas = op.sobre === 'hoy' && vivas?.length ? [...foto, ...vivas.filter((k) => k[0] > ultima)] : foto;
    graf = grafico(el, { ...opciones, ver: undefined, velas, trazos: ver.dibujo.trazos, marca: Date.parse(ver.creada), alarmas: [] });
  } else if (!vivas && !a && /^[A-Z][A-Z0-9.]{0,9}$/.test(ticker || '')) {
    widgetTV(el, 'advanced-chart', { symbol: ticker, autosize: true, interval: 'D', timezone: 'Europe/Madrid', theme: 'dark', style: '1', locale: EN ? 'en' : 'es', hide_side_toolbar: true, hide_top_toolbar: false, allow_symbol_change: false, save_image: false });
  } else if (!vivas && seguida2) el.innerHTML = '<div class="graf-vacio">Las velas de este plazo aparecen en la próxima actualización.</div>';
  else graf = grafico(el, { ...opciones, velas: vivas });
}
function pintarLado() {
  document.querySelectorAll('[data-lado]').forEach((b) => b.classList.toggle('act', b.dataset.lado === idea.dir));
  $('#aro')?.style.setProperty('--c', idea.dir === 'sube' ? 'var(--up)' : 'var(--dn)');
}

// ---------- navegacion ----------
const MENU = [['inicio', 'casa', 'Inicio'], ['empresas', 'rayo', 'Mercado'], ['cartera', 'dinero', 'Cartera'], ['analisis', 'lapiz', 'Análisis'], ['nuestro', 'gente', 'Nosotros']];
// los apartados sin pestaña (miedo, seguimiento) se abren desde dentro
const GRUPOS = {
  empresas: [['empresas', 'Empresas'], ['explorar', 'Se mueven'], ['comparar', 'Comparar'], ['cripto', 'Cripto'], ['calendario', 'Agenda'], ['miedo', null]],
  nuestro: [['nuestro', 'Resumen'], ['alarmas', 'Alarmas'], ['seguimiento', null]],
};
const grupoDe = (v) => Object.keys(GRUPOS).find((g) => GRUPOS[g].some(([k]) => k === v)) || v;
const subMenu = () => { const g = GRUPOS[grupoDe(ruta.v)]; return g ? `<nav class="sub">${g.filter(([v, n]) => n || ruta.v === v).map(([v, n]) => `<a href="#${v}" class="${ruta.v === v ? 'act' : ''}">${n || mayus(v)}${v === 'alarmas' && activas().length ? ` <b>${activas().length}</b>` : ''}</a>`).join('')}</nav>` : ''; };
const CON_ID = ['accion', 'activo', 'moneda'];
function pintarMenu() {
  const sinLeer = mensajes.filter((m) => m.id > guarda.leer('leido', 0) && m.por !== mio.yo).length;
  $('#nav').innerHTML = MENU.map(([v, , n]) => `<a href="#${v}" class="${grupoDe(ruta.v) === v ? 'act' : ''}">${n}</a>`).join('');
  const chat = $('#chatbtn');
  chat.innerHTML = `${ico('chat')}${sinLeer ? `<b>${sinLeer}</b>` : ''}`;
  chat.classList.toggle('act', ruta.v === 'chat');
  $('#yo').innerHTML = motor?.nube || !E?.db ? avatar(mio.yo || '?') : '<span class="ava" style="--c:#667283">?</span>';
  $('#yo').title = motor?.nube ? 'Mi perfil' : 'Entrar';
  $('#lang').textContent = EN ? 'ES' : 'EN';
  $('#engrane').innerHTML = ico('ajustes');
}
function pintar(animar) {
  pintarMenu();
  if (!E) return;
  const main = $('#vista');
  // el chat no se vuelve a construir: se perderia lo que se esta escribiendo
  if (ruta.v === 'chat' && !animar && $('#chat')) return;
  if (!animar && ruta.v === 'explorar' && op.explorar === 'mapa' && $('#mapatv')) return;
  if (!animar && ruta.v === 'comparar' && $('#cmp') && cmpMontado() === aComparar().join()) { montarComparar(); return; }
  if (!animar && idea && $('#conf')) return; // dibujando: no se toca nada
  if (!animar && (document.activeElement?.id === 'filtra' || document.activeElement?.id === 'cd-mas' || document.activeElement?.dataset?.fechalote || document.activeElement?.dataset?.sel || document.activeElement?.closest?.('.regla-nueva, .comp-busca'))) return;
  const y = scrollY;
  campos = [];
  main.classList.toggle('anima', !!animar);
  const abiertas = [...main.querySelectorAll('details[open]')].map((d) => d.dataset.pos);
  const rollos = [...main.querySelectorAll('.rollo')].map((d) => d.scrollTop);
  // the TradingView chart is parked outside while the page is rebuilt, so a data refresh does not reload it (ponerGrafico puts it back)
  const tvViejo = $('#graf.tv');
  if (tvViejo && document.body.moveBefore) { let p = $('#tv-aparca'); if (!p) { p = document.createElement('div'); p.id = 'tv-aparca'; p.hidden = true; document.body.append(p); } p.moveBefore(tvViejo, null); tvViejo.removeAttribute('id'); tvAparcado = tvViejo; }
  main.innerHTML = subMenu() + VISTAS[ruta.v](ruta.t);
  for (const d of main.querySelectorAll('details')) if (abiertas.includes(d.dataset.pos)) d.open = true;
  const cab = main.querySelector(':scope > .portada');
  if (cab && CABECERA[ruta.v] && ajuste('fotos')) adornarCabecera(cab);
  if (!animar) main.querySelectorAll('.rollo').forEach((d, i) => { d.scrollTop = rollos[i] || 0; });
  colocarBurbujas();
  ponerGrafico();
  if ($('#qcomp')) conectarBuscador($('#qcomp'), $('#rcomp'), 'data-masc');
  rellenaReacciones();
  rellenaMercadoOpciones();
  pintarCurva();
  pintarCq();
  pintarAn();
  if (ruta.v === 'comparar') montarComparar();
  if ($('#mapatv')) widgetTV($('#mapatv'), 'stock-heatmap', { dataSource: 'SPX500', blockSize: 'market_cap_basic', blockColor: 'change', grouping: 'sector', locale: 'es', colorTheme: 'dark', hasTopBar: true, isDataSetEnabled: true, isZoomEnabled: true, hasSymbolTooltip: true, width: '100%', height: '100%' });
  if (ruta.v === 'chat') { pintarMensajes(true); pintarAdjuntos(); }
  if (!animar) scrollTo(0, y);
}
function widgetTV(el, nombre, cfg) {
  el.innerHTML = '<div class="tradingview-widget-container"><div class="tradingview-widget-container__widget" style="height:100%;width:100%"></div></div>';
  const s = document.createElement('script');
  s.src = `https://s3.tradingview.com/external-embedding/embed-widget-${nombre}.js`; s.async = true; s.textContent = JSON.stringify(cfg);
  el.firstChild.appendChild(s);
}
function navegar() {
  let [v, t] = location.hash.slice(1).split('/');
  // las ideas ahora son Analisis
  if (v === 'ideas') { v = 'analisis'; history.replaceState(null, '', '#analisis'); }
  const nueva = v === 'perfil' ? { v, t: decodeURIComponent(t || '') || mio.yo } : CON_ID.includes(v) && RUTA_ID.test(t || '') ? { v, t } : { v: VISTAS[v] && !CON_ID.includes(v) ? v : 'inicio', t: null };
  if (nueva.t !== ruta.t) { op.rango = 'd1'; idea = null; if (viendo && viendo.t !== (nueva.v === 'activo' ? ACTIVO_ALARMA[nueva.t] : nueva.v === 'moneda' ? nueva.t + '-USD' : nueva.t)) viendo = null; }
  ruta = nueva;
  $('#resultados').hidden = true;
  scrollTo(0, 0);
  pintar(true);
}

// ---------- buscador ----------
function buscar(q) {
  q = q.trim().toLowerCase();
  if (!q) return [];
  const extra = [...(P().cripto?.monedas || []).map((m) => [m.s + '-USD', m.nombre, '', m.precio, m.dia]), ...(P().activos || []).filter((a) => ACTIVO_ALARMA[a.id] && !a.id.match(/BTC|ETH/)).map((a) => [ACTIVO_ALARMA[a.id], a.nombre, '', a.precio, a.pct])];
  const a = [], b = [], c = [];
  for (const u of [...extra, ...universo]) {
    const t = alias(u[0]).toLowerCase(), n = u[1].toLowerCase();
    if (t === q) a.unshift(u); else if (t.startsWith(q)) a.push(u); else if (n.startsWith(q)) b.push(u); else if (q.length > 2 && n.includes(q)) c.push(u);
  }
  return [...a, ...b, ...c].slice(0, 8);
}
const filaRes = (u, atributo) => `<button class="res" ${atributo}="${esc(u[0])}">${logo(u[0], 's')}<span style="min-width:0"><b>${esc(alias(u[0]))}</b><small>${esc(u[1])}</small></span><span class="der num"><strong>${usd(u[3], u[0])}</strong><span class="${cls(u[4])}">${sg(u[4])}</span></span></button>`;
function conectarBuscador(input, caja, atributo) {
  const pinta = () => { const r = buscar(input.value); caja.hidden = !input.value.trim(); caja.innerHTML = r.map((u) => filaRes(u, atributo)).join('') || '<div class="vacio">No la encuentro (bolsa de EE. UU. y las principales criptos).</div>'; };
  input.addEventListener('input', pinta);
  input.addEventListener('focus', () => input.value.trim() && pinta());
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') $(`[${atributo}]`, caja)?.click(); if (e.key === 'Escape') { caja.hidden = true; input.blur(); } });
}

// ---------- ventanas ----------
function toast(texto, mal) {
  const t = $('#toast');
  t.innerHTML = `${ico(mal ? 'x' : 'campana')}<span>${esc(texto)}</span>`;
  t.className = mal ? 'mal' : ''; t.hidden = false;
  clearTimeout(t._h); t._h = setTimeout(() => { t.hidden = true; }, 4500);
}
function abrir(html) {
  const m = $('#modal');
  m.innerHTML = `<div class="ventana" role="dialog" aria-modal="true"><button class="cerrar" data-cerrar="1" aria-label="Cerrar">${ico('x')}</button>${html}</div>`;
  m.hidden = false;
  return m;
}
const cerrar = () => { $('#modal').hidden = true; $('#modal').innerHTML = ''; };
function miCuenta() {
  const m = abrir(`<h2>Eres ${esc(mio.yo)}</h2><p class="mut" style="margin:8px 0 18px">Pon una clave que recuerdes. Mínimo 10 caracteres y algún número o guion: por ejemplo, tres palabras vuestras unidas con guiones. No uses la de otras webs.</p>
    <input class="campo" id="nueva" type="password" placeholder="Clave nueva" autocomplete="new-password"><input class="campo" id="otra" type="password" placeholder="Repítela" autocomplete="new-password" style="margin-top:10px">
    <label class="ver"><input type="checkbox" id="vera"> Ver lo que escribo</label><div class="error" id="err"></div><button class="btn pri ancho" id="cambiar">Cambiar mi clave</button><button class="btn ancho" id="salir" style="margin-top:10px">Salir en este dispositivo</button>`);
  $('#vera', m).onchange = (e) => { for (const i of [$('#nueva', m), $('#otra', m)]) i.type = e.target.checked ? 'text' : 'password'; };
  $('#cambiar', m).onclick = async () => {
    const nueva = $('#nueva', m).value.trim(), error = $('#err', m);
    if (nueva !== $('#otra', m).value.trim()) { error.textContent = 'Las dos no son iguales.'; return; }
    if (nueva.length < 10 || !/[^A-Za-z]/.test(nueva)) { error.textContent = 'Mínimo 10 caracteres y algún número o guion.'; return; }
    $('#cambiar', m).disabled = true;
    try {
      await motor.cambiarClave(nueva);
      guarda.poner('clave', nueva); motor = motorNube(E.db, nueva);
      cerrar(); toast('Clave cambiada. Úsala en tus otros dispositivos.');
    } catch (e) { error.textContent = e.message; $('#cambiar', m).disabled = false; }
  };
  $('#salir', m).onclick = () => { guarda.poner('clave', null); location.reload(); };
}
function pedirClave() {
  if (motor?.nube) return miCuenta();
  if (!E?.db) { abrir('<h2>Aún sin conectar</h2><p class="mut" style="margin-top:10px">La base compartida todavía no está puesta. De momento las alarmas y el chat se guardan solo en este navegador y no llegan a Discord.</p>'); return; }
  const m = abrir('<h2>¿Quién eres?</h2><p class="mut" style="margin:8px 0 18px">Pega tu clave personal. Solo hace falta una vez en este dispositivo.</p><input class="campo" id="clave" type="password" placeholder="Tu clave" autocomplete="current-password"><div class="error" id="err"></div><button class="btn pri ancho" id="entrar">Entrar</button>');
  const entrar = async () => {
    const clave = $('#clave', m).value.trim();
    try {
      const prueba = motorNube(E.db, clave), d = await prueba.leer();
      guarda.poner('clave', clave); motor = prueba; mio = d; mensajes = []; ultimoId = 0; chatCargado = false;
      cerrar(); avisoBanda(); extras = null; await mirarReacciones(); pintar(true); mirarChat(); toast('Hola, ' + d.yo);
    } catch (e) { $('#err', m).textContent = e.message === 'clave incorrecta' ? 'Esa clave no es.' : e.message; }
  };
  $('#entrar', m).onclick = entrar;
  $('#clave', m).onkeydown = (e) => { if (e.key === 'Enter') entrar(); };
  $('#clave', m).focus();
}
function nuevaAlarma(t) {
  if (E?.db && !motor.nube) return pedirClave();
  if (!t) {
    const m = abrir('<h2>Nueva alarma</h2><p class="mut" style="margin:8px 0 16px">¿De qué quieres que te avise?</p><input class="campo" id="qa" placeholder="Nvidia, NQ, Bitcoin…" autocomplete="off"><div id="ra" style="max-height:330px;overflow:auto;margin-top:8px" hidden></div>');
    conectarBuscador($('#qa', m), $('#ra', m), 'data-elegir');
    $('#qa', m).focus();
    return;
  }
  const x = empresa(t), precio = +x.precio || 0, redondo = (n) => +n.toPrecision(n > 1000 ? 7 : 5);
  const m = abrir(`<div class="fila-f">${logo(t)}<span class="nom"><b>${esc(x.corto)}</b><small>${esc(x.nombre)} · ahora ${usd(precio, t)}</small></span></div>
    <div class="al-modos"><button data-al="precio" class="act">A un precio</button><button data-al="pct">Si se mueve un %</button></div>
    <div id="al-precio"><h2 style="margin-top:6px;text-align:center">Avísame cuando llegue a</h2>
      <div class="grande"><input id="nivel" type="number" step="any" min="0" inputmode="decimal" value="${precio ? redondo(precio * 1.05) : ''}"></div>
      <div style="text-align:center;min-height:26px" id="explica"></div>
      <input type="range" id="barrita" min="-25" max="25" step="0.5" value="5" aria-label="Porcentaje">
      <div class="rapidos">${[-10, -5, -3, -1, 1, 3, 5, 10].map((p) => `<button style="--c:${col(p)}" data-pct="${p}">${p > 0 ? '+' : ''}${p}%</button>`).join('')}</div></div>
    <div id="al-pct" hidden><h2 style="margin-top:6px;text-align:center">Avísame si se mueve un</h2>
      <div class="grande pct"><input id="cuanto" type="number" step="0.5" min="0.5" max="90" inputmode="decimal" value="10"><b>%</b></div>
      <div class="rapidos">${[5, 10, 15, 20, 30].map((p) => `<button style="--c:var(--lima)" data-cuanto="${p}">${p}%</button>`).join('')}</div>
      <div class="aj-grupo" id="al-lado">${[['las', 'Arriba o abajo'], ['baja', 'Solo si baja'], ['sube', 'Solo si sube']].map(([k, n]) => `<button data-lado2="${k}" class="${k === 'las' ? 'act' : ''}">${n}</button>`).join('')}</div>
      <label class="etq" for="entrada">Contando desde (tu precio de entrada)</label><input class="campo" id="entrada" type="number" step="any" min="0" inputmode="decimal" value="${precio ? redondo(precio) : ''}">
      <div class="al-previa" id="previa"></div></div>
    <p class="nota-c">Además, si en un día se mueve un 10% o más os avisa solo, sin poner nada.</p>
    <div class="error" id="err"></div><button class="btn pri ancho" id="guardar">${ico('campana')} Guardar alarma</button>`);
  const input = $('#nivel', m), barra = $('#barrita', m);
  let tipo = 'precio', lado = 'las';
  const explica = () => { const n = +input.value, d = precio ? ((n - precio) / precio) * 100 : 0; $('#explica', m).innerHTML = n > 0 && precio ? `<span class="chip ${cls(d)}">${d >= 0 ? '▲ si sube' : '▼ si baja'} un ${Math.abs(d).toFixed(1)}%</span>` : ''; return d; };
  const aPct = (p) => { input.value = redondo(precio * (1 + p / 100)); barra.value = p; explica(); };
  // los niveles que salen de "x% desde mi entrada"
  const niveles = () => { const base = +$('#entrada', m).value, c = +$('#cuanto', m).value; if (!(base > 0 && c > 0 && c < 100)) return []; return [['baja', redondo(base * (1 - c / 100))], ['sube', redondo(base * (1 + c / 100))]].filter(([d]) => lado === 'las' || lado === d); };
  const pasado = ([d, n]) => precio && (d === 'sube' ? precio >= n : precio <= n);
  const previa = () => { $('#previa', m).innerHTML = niveles().map(([d, n]) => `<span class="chip ${d === 'sube' ? 'up' : 'dn'} ${pasado([d, n]) ? 'ya' : ''}">${d === 'sube' ? '▲ si sube a' : '▼ si baja a'} ${usd(n, t)}${pasado([d, n]) ? ' (ya pasado)' : ''}</span>`).join(''); };
  input.oninput = () => { barra.value = explica(); };
  barra.oninput = () => aPct(+barra.value);
  $('#cuanto', m).oninput = previa; $('#entrada', m).oninput = previa;
  m.querySelectorAll('[data-pct]').forEach((b) => { b.onclick = () => aPct(+b.dataset.pct); });
  m.querySelectorAll('[data-cuanto]').forEach((b) => { b.onclick = () => { $('#cuanto', m).value = b.dataset.cuanto; previa(); }; });
  m.querySelectorAll('[data-lado2]').forEach((b) => { b.onclick = (e) => { e.stopPropagation(); lado = b.dataset.lado2; m.querySelectorAll('[data-lado2]').forEach((o) => o.classList.toggle('act', o === b)); previa(); }; });
  m.querySelectorAll('[data-al]').forEach((b) => { b.onclick = (e) => { e.stopPropagation(); tipo = b.dataset.al; m.querySelectorAll('[data-al]').forEach((o) => o.classList.toggle('act', o === b)); $('#al-precio', m).hidden = tipo !== 'precio'; $('#al-pct', m).hidden = tipo !== 'pct'; $('#err', m).textContent = ''; }; });
  explica(); previa();
  $('#guardar', m).onclick = async () => {
    let lista;
    if (tipo === 'precio') {
      const n = +(+input.value).toFixed(6);
      if (!(n > 0) || n === precio) { $('#err', m).textContent = 'Pon un precio distinto del actual.'; return; }
      lista = [[n > precio ? 'sube' : 'baja', n]];
    } else {
      lista = niveles().filter((x2) => !pasado(x2));
      if (!lista.length) { $('#err', m).textContent = 'Con ese porcentaje y esa entrada no queda nada por avisar.'; return; }
    }
    $('#guardar', m).disabled = true;
    try {
      for (const [dir, n] of lista) await motor.alarmaPoner(t, dir, +n.toFixed(6));
      await refrescarMio(true); cerrar(); pintar();
      const que = lista.map(([, n]) => dinero(n)).join(' y ');
      toast(motor.nube ? `Alarma puesta: ${x.corto} a ${que}` : `Guardada solo aquí: ${x.corto} a ${que}`);
    } catch (e) { $('#err', m).textContent = e.message; $('#guardar', m).disabled = false; }
  };
  input.focus(); input.select();
}

// ---------- chat ----------
const imagenValida = (s) => /^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(s || '');
function mensajeHTML(m, previo) {
  const d = new Date(m.creada), dia = diaLargo(d), mia = m.por === mio.yo;
  const sep = !previo || diaLargo(new Date(previo.creada)) !== dia ? `<div class="fecha">${mayus(dia)}</div>` : '';
  const x = m.t ? empresa(m.t) : null;
  return `${sep}<div class="msg ${mia ? 'mio' : ''}">${mia ? '' : `<a href="#perfil/${encodeURIComponent(m.por)}">${avatar(m.por, 's')}</a>`}<div class="burb2"><span class="quien">${esc(apodo(m.por))}</span>${x ? `<a class="accion" href="${enlace(m.t)}">${logo(m.t, 's')}<span><b>${esc(x.corto)}</b><span class="num">${usd(x.precio, m.t)}</span> <span class="num ${cls(x.pct)}">${sg(x.pct)}</span></span></a>` : ''}${imagenValida(m.imagen) || imagenes.has(m.id) ? `<img src="${m.imagen || imagenes.get(m.id)}" alt="imagen: toca para ampliar" data-ver="1">` : m.con_imagen ? `<img class="cargando" data-img="${Number(m.id)}" data-ver="1" alt="imagen">` : ''}${esc(sinTarjetas(m.texto))}${tarjetasChat(m.texto)}${minis(m.texto)}${reaccionesHTML(m)}<span class="hora">${hhmm(d)}${mia ? `<button data-borrarmsg="${Number(m.id)}">borrar</button>` : ''}</span></div></div>`;
}
function pintarMensajes(alFinal) {
  const c = $('#mensajes');
  if (!c) return;
  const abajo = c.scrollHeight - c.scrollTop - c.clientHeight < 90;
  c.innerHTML = mensajes.map((m, i) => mensajeHTML(m, mensajes[i - 1])).join('') || vacio('chat', 'Aquí compartís ideas, gráficos y empresas.<br>Escribid el primer mensaje.');
  if (alFinal || abajo) { c.scrollTop = c.scrollHeight; c.querySelectorAll('.burb2>img[src]').forEach((i) => { i.onload = () => { c.scrollTop = c.scrollHeight; }; }); }
  if (mensajes.length && !document.hidden) guarda.poner('leido', mensajes.at(-1).id);
  traerImagenes(c);
}
// cada imagen se descarga una sola vez
const imagenes = new Map();
async function traerImagenes(c) {
  for (const el of c.querySelectorAll('img[data-img]')) {
    const id = +el.dataset.img;
    try { if (!imagenes.has(id)) { const u = await motor.imagen(id); if (imagenValida(u)) imagenes.set(id, u); } } catch (e) { console.warn(e.message); }
    if (!imagenes.has(id)) continue;
    el.onload = () => { if (c.scrollHeight - c.scrollTop - c.clientHeight < 600) c.scrollTop = c.scrollHeight; };
    el.src = imagenes.get(id); el.classList.remove('cargando'); el.removeAttribute('data-img');
  }
}
function pintarAdjuntos() {
  const c = $('#adjuntos');
  if (!c) return;
  c.innerHTML = (adjunto.imagen ? `<div class="adj"><img src="${adjunto.imagen}" alt="" data-ver="1"><span class="dim">Imagen lista</span><button data-sinimg="1">${ico('x')}</button></div>` : '') + (adjunto.t ? `<div class="adj">${logo(adjunto.t, 's')}<b>${esc(alias(adjunto.t))}</b><button data-sinacc="1">${ico('x')}</button></div>` : '');
  c.hidden = !c.innerHTML;
}
// los graficos tienen lineas finas: se guarda grande y en webp para que el zoom se lea
async function ponerImagen(archivo) {
  if (!archivo?.type.startsWith('image/')) return;
  try { adjunto.imagen = await comprimir(archivo, 2400, motor.nube ? 650000 : 400000, false); pintarAdjuntos(); $('#texto')?.focus(); }
  catch { toast('No puedo leer esa imagen', true); }
}
async function enviar() {
  const caja = $('#texto'), texto = caja.value.trim();
  if (!texto && !adjunto.imagen && !adjunto.t) return;
  if (E?.db && !motor.nube) return pedirClave();
  const b = $('[data-enviar]'); b.disabled = true;
  try {
    await motor.decir(texto || (adjunto.imagen ? '' : 'Mirad esta 👀'), adjunto.imagen, adjunto.t);
    caja.value = ''; caja.style.height = ''; adjunto = { imagen: null, t: null }; pintarAdjuntos();
    await mirarChat(true);
  } catch (e) { toast(e.message, true); }
  b.disabled = false; caja.focus();
}
let mirando = false;
async function mirarChat(alFinal) {
  if (!motor || mirando) return;
  mirando = true;
  try {
    const nuevos = await motor.chat(ultimoId);
    if (nuevos.length) {
      const ajenos = chatCargado ? nuevos.filter((m) => m.por !== mio.yo) : [];
      mensajes = [...mensajes, ...nuevos].slice(-200); ultimoId = mensajes.at(-1).id;
      pintarMensajes(alFinal);
      if (ajenos.length && (ruta.v !== 'chat' || document.hidden)) toast(`${apodo(ajenos.at(-1).por)}: ${sinTarjetas(ajenos.at(-1).texto) || (ajenos.at(-1).texto ? 'ha compartido algo de su cartera' : 'ha mandado una imagen')}`);
      pintarMenu();
    } else if (!chatCargado) pintarMensajes(true);
    chatCargado = true;
  } catch (e) { console.warn('chat', e.message); }
  mirando = false;
}

// ---------- carga ----------
async function refrescarMio(forzar) {
  try {
    const huella = await motor.version();
    if (!forzar && huella && huella === mio._huella) return;
    mio = await motor.leer(); mio._huella = huella;
  } catch (e) { console.warn(e.message); if (e.message === 'clave incorrecta') { guarda.poner('clave', null); motor = motorLocal(); mio = await motor.leer(); avisoBanda(); } }
}
function avisoBanda() {
  $('#aviso').innerHTML = motor.nube ? '' : E?.db
    ? '<div class="banda">Para ver las alarmas compartidas, el chat y recibir avisos, entra con tu clave.<button class="btn peq pri" data-entrar="1">Entrar</button></div>'
    : '<div class="banda">Modo prueba: alarmas y chat se guardan solo en este navegador hasta conectar la base compartida.</div>';
}
function reloj() {
  if (!E) return;
  $('#upd').textContent = 'Actualizado ' + hace(E.actualizado);
  $('#vivo').classList.toggle('old', Date.now() - E.actualizado > 35 * 60000);
  document.querySelectorAll('[data-cuenta]').forEach((el) => { el.textContent = falta(+el.dataset.cuenta); });
}
let tramoU = null;
async function cargarUniverso() {
  const tramo = Math.floor(Date.now() / 18e5);
  if (tramo === tramoU) return;
  try {
    universo = window.__UNIVERSO__ || (await (await fetch('data/universo.json?' + tramo)).json()).e;
    porT = new Map(universo.map((u) => [u[0], u])); tramoU = tramo;
  } catch { console.warn('sin la lista completa'); }
}
async function cargar() {
  try {
    const nuevo = window.__STATE__ || await (await fetch('data/state.json?' + Date.now(), { cache: 'no-store' })).json();
    const primera = !E;
    if (!primera && nuevo.actualizado === marca) return reloj();
    E = nuevo; marca = E.actualizado;
    if (primera) {
      const clave = guarda.leer('clave', null);
      motor = E.db && clave ? motorNube(E.db, clave) : motorLocal();
      await refrescarMio(true); await mirarReacciones(); avisoBanda(); navegar(); mirarChat();
      await cargarUniverso(); if (ruta.v !== 'chat') pintar();
    } else { await refrescarMio(); await cargarUniverso(); pintar(); }
    reloj();
  } catch (err) { console.error(err); $('#upd').textContent = 'Sin datos todavía'; $('#vivo').classList.add('old'); }
}
// si se publica una versión nueva de la web, se recarga sola (salvo que se esté escribiendo)
async function mirarVersion() {
  if (window.__STATE__) return;
  try {
    const r = await fetch('version.txt?' + Date.now(), { cache: 'no-store' });
    if (!r.ok) return;
    const v = (await r.text()).trim();
    const vieja = MIA ? v !== MIA : version && v !== version;
    // una sola vez por version, para no quedarse recargando
    if (vieja && /^[a-z0-9]{6,40}$/i.test(v) && sessionStorage.getItem('radar-recarga') !== v && !$('#texto')?.value && !idea && $('#modal').hidden) { sessionStorage.setItem('radar-recarga', v); location.replace(location.pathname + '?v=' + v + location.hash); }
    version ||= v;
  } catch {}
}

// ---------- clics ----------
document.addEventListener('click', async (e) => {
  if (e.target.id === 'modal') return cerrar();
  const va = e.target.closest('[data-quienir]');
  if (va) { op.quien = va.dataset.quienir; op.cq = va.dataset.quienir; }
  const abre = e.target.closest('[data-abriridea]');
  if (abre) { viendo = mio.ideas.find((x) => x.id === +abre.dataset.abriridea) || null; op.sobre = 'foto'; }
  if (!e.target.closest('.buscar')) $('#resultados').hidden = true;
  if (e.target.matches('[data-ver]')) return visor(e.target.src);
  const b = e.target.closest('button');
  if (!b || b.closest('#visor') || b.closest('#ed') || b.closest('#aj')) return;
  b.blur();
  const d = b.dataset;
  try {
    if (b.id === 'engrane') return ventanaAjustes();
    if (b.id === 'lang') { guarda.poner('idioma', EN ? 'es' : 'en'); location.reload(); return; }
    if (b.id === 'yo') { if (E?.db && !motor.nube) pedirClave(); else location.hash = 'perfil'; }
    else if (d.entrar || d.clave) pedirClave();
    else if (d.editarperfil) editarPerfil(d.editarperfil);
    else if (d.ptab) { op.ptab = d.ptab; pintar(); $('.pf-pestanas')?.scrollIntoView({ block: 'start' }); scrollBy(0, -90); }
    else if (d.fav) { if (E?.db && !motor.nube) return pedirClave(); const f = favoritas(mio.yo), esta = f.includes(d.fav); await guardarPerfil({ favoritas: esta ? f.filter((t) => t !== d.fav) : [...f, d.fav] }); pintar(); toast(esta ? 'Quitada de favoritas' : 'Añadida a tus favoritas'); }
    else if (d.cerrar) cerrar();
    else if (d.ir) { $('#q').value = ''; $('#resultados').hidden = true; location.hash = enlace(d.ir); }
    else if (d.elegir) nuevaAlarma(d.elegir);
    else if (d.nueva) nuevaAlarma();
    else if (d.alarma) nuevaAlarma(d.alarma);
    else if (d.enfoca) { scrollTo({ top: 0 }); $('#q').focus(); }
    else if (d.modover) { guarda.poner('ajuste-modo', d.modover); pintar(); }
    else if (d.calcula) calculadora(d.calcula);
    else if (d.instalar) ventanaInstalar();
    else if (d.masc) { ponerComparados([...new Set([...aComparar(), d.masc])].slice(0, 4)); b.blur(); pintar(true); }
    else if (d.quitacomp) { ponerComparados(aComparar().filter((t) => t !== d.quitacomp)); pintar(true); }
    else if (d.reacabre) { const e2 = b.nextElementSibling; if (e2) e2.hidden = !e2.hidden; }
    else if (d.reac) { await motor.reaccionar(+d.reac, d.q); await mirarReacciones(); }
    else if (d.ponregla) await ponerRegla();
    else if (d.quitaregla) await ponerRegla(+d.quitaregla);
    else if (d.ajustes) ventanaAjustes();
    else if (d.peques) { op.peques = !op.peques; op.pag = {}; pintar(); }
    else if (d.col) { const [c0, dir] = op.orden.split('_'); op.orden = d.col + '_' + (c0 === d.col ? (dir === 'desc' ? 'asc' : 'desc') : d.col === 'nombre' ? 'asc' : 'desc'); op.pag = {}; pintar(); }
    else if (d.pag) {
      const antes = b.closest('.paginas')?.getBoundingClientRect().top;
      op.pag[d.pag] = +d.n; pintar();
      const barra2 = () => document.querySelector(`.paginas [data-pag="${d.pag}"]`)?.closest('.paginas');
      const ancla = () => { const n = barra2(); if (n && antes != null) scrollBy(0, n.getBoundingClientRect().top - antes); };
      ancla(); requestAnimationFrame(ancla);
    }
    else if (d.op) {
      if (['filtro', 'quien', 'mov', 'suelo', 'plazo'].includes(d.op)) op.pag = {};
      op[d.op] = d.op === 'semana' ? +d.k : d.k;
      if (d.op === 'rango' && idea) { idea.trazos = []; $('#conf') && ($('#vista').innerHTML = ''); }
      pintar();
    }
    else if (d.dibujar) {
      if (E?.db && !motor.nube) return pedirClave();
      viendo = null; idea = { t: d.dibujar, trazos: [], h: 'flecha', color: COLORES_TRAZO[0], dir: 'sube', confianza: 60, nota: '', objetivo: '' }; pintar();
      $('#graf')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    else if (d.herr) { idea.h = d.herr; graf?.usar(d.herr); document.querySelectorAll('[data-herr]').forEach((x) => x.classList.toggle('act', x === b)); }
    else if (d.color) { idea.color = d.color; graf?.color(d.color); document.querySelectorAll('[data-color]').forEach((x) => x.classList.toggle('act', x === b)); if (idea.h === 'mover') $('[data-herr=linea]')?.click(); }
    else if (d.deshacer) graf?.deshacer();
    else if (d.limpiar) graf?.limpiar();
    else if (d.lado) { idea.dir = d.lado; pintarLado(); }
    else if (d.cancelaridea) { idea = null; $('#vista').innerHTML = ''; pintar(); }
    else if (d.publicar) {
      const precio = empresa(idea.t).precio, objetivo = +idea.objetivo || null;
      if (!precio || !graf) return toast('Aún no tengo el precio de esta empresa', true);
      if (objetivo && (idea.dir === 'sube' ? objetivo <= precio : objetivo >= precio)) return toast(`Si crees que ${idea.dir === 'sube' ? 'sube, el objetivo debe estar por encima' : 'baja, el objetivo debe estar por debajo'} de ${dinero(precio)}`, true);
      if (enJuegoAn(idea.t) >= MAX_AN) return toast(`Ya tienes ${MAX_AN} análisis abiertos de ${alias(idea.t)}: cierra uno`, true);
      const extra = planDibujoAn(precio);
      if (extra.error) return toast(extra.error, true);
      b.disabled = true;
      try {
        const dibujo = { marco: op.rango, velas: graf.foto(), trazos: graf.trazos().slice(0, 60), plan: extra.plan };
        await hacerSitioAn(idea.t);
        await motor.ideaPoner({ t: idea.t, dir: idea.dir, precio, objetivo, nota: idea.nota.trim(), confianza: idea.confianza, dibujo });
        idea = null; await refrescarMio(true); $('#vista').innerHTML = ''; pintar(); toast('Análisis publicado: ya lo podéis ver los dos');
      } catch (err) { b.disabled = false; throw err; }
    }
    else if (d.veridea) { const i = mio.ideas.find((x) => x.id === +d.veridea); viendo = viendo?.id === i.id ? null : i; op.sobre = 'foto'; if (ruta.v === 'ideas') location.hash = enlace(i.t); else { pintar(); $('#graf')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); } }
    else if (d.quitaridea) { viendo = null; pintar(); }
    else if (d.borraridea) { await motor.ideaBorrar(+d.borraridea); if (viendo?.id === +d.borraridea) viendo = null; await refrescarMio(true); pintar(); toast('Idea borrada'); }
    else if (d.quitar) { await motor.alarmaQuitar(+d.quitar); await refrescarMio(true); pintar(); toast('Alarma borrada'); }
    else if (d.seguir || d.avisar || d.dejar) {
      if (E?.db && !motor.nube) return pedirClave();
      const t = d.seguir || d.avisar || d.dejar, s = seguida(t);
      if (d.dejar || (d.seguir && s)) { await motor.dejar(t); toast(`Ya no seguís ${alias(t)}`); }
      else if (d.avisar) await motor.seguir(t, !s?.noticias);
      else { await motor.seguir(t, true); toast(motor.nube ? `Siguiendo ${alias(t)}: lo importante irá a Discord` : `Siguiendo ${alias(t)}`); }
      await refrescarMio(true); pintar();
    } else if (d.comentar) { adjunto.t = d.comentar; location.hash = 'chat'; }
    else if (d.enviar) enviar();
    else if (d.posicion) nuevaPosicion();
    else if (d.altatipo) { if (d.altatipo === 'acc') nuevaPosicion(d.t); else nuevaOpcion(d.t, { tipo: d.altatipo }); }
    else if (d.posicionde) nuevaPosicion(d.posicionde);
    else if (d.tengo) nuevaPosicion(d.tengo);
    else if (d.quitarpos) { await motor.carteraQuitar(+d.quitarpos); await refrescarMio(true); pintar(); toast('Quitado de tu cartera'); }
    else if (d.opcion) nuevaOpcion();
    else if (d.opcionde) nuevaOpcion(d.opcionde);
    else if (d.cierraop) cerrarOpcion(+d.cierraop);
    else if (d.quitaop) { await motor.opcionQuitar(+d.quitaop); await refrescarMio(true); pintar(); toast('Opción quitada'); }
    else if (d.ocultar) { guarda.poner('ocultar', !oculto()); pintar(); }
    else if (d.adjuntar) $('#fichero').click();
    else if (d.emoji) { const c = $('#texto'); c.setRangeText(d.emoji, c.selectionStart, c.selectionEnd, 'end'); c.focus(); }
    else if (d.etiquetar) {
      const p = $('#popacc');
      if (!p.hidden) { p.hidden = true; return; }
      p.innerHTML = [...new Set([...mias(), 'NQ=F', 'BTC-USD'])].map((t) => { const x = empresa(t); return filaRes([t, x.nombre, '', x.precio, x.pct], 'data-mencion'); }).join(''); p.hidden = false;
    } else if (d.mencion) { adjunto.t = d.mencion; $('#popacc').hidden = true; pintarAdjuntos(); $('#texto').focus(); }
    else if (d.sinimg) { adjunto.imagen = null; pintarAdjuntos(); }
    else if (d.sinacc) { adjunto.t = null; pintarAdjuntos(); }
    else if (d.borrarmsg) { await motor.borrar(+d.borrarmsg); mensajes = mensajes.filter((m) => m.id !== +d.borrarmsg); pintarMensajes(); }
  } catch (err) { toast(err.message, true); }
});
document.addEventListener('change', (e) => { const k = e.target.dataset?.sel; if (k) { op[k] = e.target.value; op.pag = {}; e.target.blur(); pintar(); } });
document.addEventListener('change', (e) => { if (e.target.id === 'rg-alcance') $('#rg-sector').hidden = e.target.value !== 'sector'; });
document.addEventListener('change', (e) => { if (e.target.id === 'fichero') { ponerImagen(e.target.files[0]); e.target.value = ''; } });
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') cerrar();
  if (e.target.id === 'texto' && e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); enviar(); }
});
document.addEventListener('input', (e) => {
  if (e.target.id === 'filtra') {
    op.busca = e.target.value; op.pag = {};
    const nuevo = document.createElement('div'); nuevo.innerHTML = VISTAS.empresas();
    $('#listado').replaceWith($('#listado', nuevo));
  }
  if (idea && e.target.id === 'conf') { idea.confianza = +e.target.value; $('#conf-num').textContent = idea.confianza + '%'; $('#aro').style.setProperty('--p', idea.confianza); }
  if (idea && e.target.id === 'idea-nota') idea.nota = e.target.value;
  if (idea && e.target.id === 'idea-obj') { idea.objetivo = e.target.value; idea.objetivoManual = !!e.target.value; }
});
document.addEventListener('input', (e) => { if (e.target.id === 'texto') { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 2 + 'px'; } });
document.addEventListener('paste', (e) => { if (ruta.v !== 'chat') return; const f = [...(e.clipboardData?.files || [])].find((x) => x.type.startsWith('image/')); if (f) { e.preventDefault(); ponerImagen(f); } });
for (const ev of ['dragover', 'dragleave', 'drop']) document.addEventListener(ev, (e) => {
  const c = e.target.closest?.('#chat');
  if (!c) return;
  e.preventDefault();
  c.classList.toggle('encima', ev === 'dragover');
  if (ev === 'drop') ponerImagen(e.dataTransfer.files[0]);
});
let ancho = innerWidth, espera;
addEventListener('resize', () => { if (innerWidth === ancho) return; ancho = innerWidth; clearTimeout(espera); espera = setTimeout(colocarBurbujas, 150); });

document.body.classList.toggle('quieto', guarda.leer('ajuste-quieto', false));
document.querySelectorAll('[data-ico]').forEach((el) => { el.innerHTML = ico(el.dataset.ico); });
conectarBuscador($('#q'), $('#resultados'), 'data-ir');
addEventListener('hashchange', () => { if (E) { cerrar(); navegar(); } });
cargar().then(mirarVersion);
setInterval(() => { if (!document.hidden) { cargar(); mirarVersion(); } }, 60000);
setInterval(reloj, 30000);
// chat: rapido si se esta mirando, lento si no; con la pestaña oculta una vez por minuto
let tic = 0;
setInterval(() => { tic++; if (document.hidden ? tic % 15 === 0 : ruta.v === 'chat' ? true : tic % 6 === 0) mirarChat(); if (!document.hidden && ruta.v === 'chat' && extras !== false && tic % 3 === 0) mirarReacciones(); }, 4000);
setInterval(async () => { if (!document.hidden && motor?.nube && $('#modal').hidden) { const antes = JSON.stringify(mio); await refrescarMio(true); if (JSON.stringify(mio) !== antes) pintar(); } }, 20000);
