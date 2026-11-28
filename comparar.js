// Cara a cara: grafico propio para comparar hasta 4 empresas (separadas o juntas en %), y sus datos lado a lado.
// Canvas puro: solo se pinta al mover, ampliar o cambiar algo, y como mucho una vez por fotograma.
'use strict';

const CMP_COLOR = ['#ffd60a', '#ffffff', '#1736d6', '#c80000'];
const CMP_COLOR_UI = ['#ffd60a', '#e9edf3', '#6c8cff', '#ff5c5c'];
const CMP_TIPOS = [['velas', 'Velas'], ['huecas', 'Huecas'], ['ha', 'Suaves'], ['barras', 'Barras'], ['linea', 'Línea'], ['area', 'Área']];
const CMP_RANGOS = [['1m', '1M', 31, 'h4'], ['3m', '3M', 92, 'd'], ['6m', '6M', 183, 'd'], ['1a', '1A', 366, 'd'], ['2a', '2A', 731, 'd'], ['5a', '5A', 1830, 's'], ['todo', 'Todo', 1e5, 'mes']];
const CMP_MARCOS = [['auto', 'Auto'], ['h4', '4H'], ['d', '1D'], ['s', '1S'], ['mes', '1M']];
const cmpOp = { modo: 'sep', tipo: 'velas', rango: innerWidth < 700 ? '3m' : '6m', marco: 'auto', ...guarda.leer('comp-op', {}) };
let K = null, cmpEspera = 0, cmpGuarda = 0, cmpDuelo = 0;

const aComparar = () => { const l = guarda.leer('comparar', null) || detallesDe(mio?.yo).comparar; return (Array.isArray(l) ? l : ['NVDA', 'AMD']).filter((t) => RUTA_ID.test(t)).slice(0, 4); };
const continuo = (t) => /-USD$|=F$|=X$|\.NYB$/.test(t);
const cmpMontado = () => K?.lista.join() || '';
// la lista viaja en el perfil para que el vigilante prepare las velas de lo que comparais
function ponerComparados(l) {
  guarda.poner('comparar', l);
  clearTimeout(cmpGuarda);
  cmpGuarda = setTimeout(() => {
    if (!motor?.nube || !hayDetalles()) return;
    const d = detallesDe(mio.yo);
    if (JSON.stringify(d.comparar || []) !== JSON.stringify(l)) guardarPerfil({ detalles: { ...d, comparar: l } }).catch((e) => console.warn(e.message));
  }, 1500);
}

function vistaComparar() {
  const l = aComparar();
  const boton = (grupo, k, texto, extra = '') => `<button data-cmp="${grupo}" data-k="${k}" class="${cmpOp[grupo] === k ? 'act' : ''}" ${extra}>${texto}</button>`;
  const dibujo = { velas: '<path d="M6 3v3M6 14v5M17 5v4M17 17v4M4 6h4v8H4zM15 9h4v8h-4z"/>', huecas: '<path d="M7 3v4M7 17v4M4 7h6v10H4zM17 4v3M17 15v4M14 7h6v8h-6z"/>', ha: '<path d="M4 14h3v5H4zM10.5 10h3v7h-3zM17 5h3v8h-3z"/>', barras: '<path d="M7 4v16M4 8h3M7 15h3M17 3v14M14 13h3M17 6h3"/>', linea: '<path d="M3 17l5-6 4 3 8-9"/>', area: '<path d="M3 20V15l5-6 4 3 8-8v16z"/>' };
  return `<div class="portada"><div><h1>Cara a <em>cara</em></h1><p class="entradilla">Hasta cuatro empresas: mueve y amplía todas a la vez.</p></div></div>
    <div class="cmp-elige">${l.map((t, i) => `<span style="--c:${CMP_COLOR_UI[i]}">${logo(t, 's')}<a href="${enlace(t)}">${esc(alias(t))}</a><button data-quitacomp="${esc(t)}" title="Quitar">✕</button></span>`).join('')}${l.length < 4 ? '<div class="comp-busca"><input class="campo" id="qcomp" placeholder="Añadir empresa…" autocomplete="off"><div id="rcomp" hidden></div></div>' : ''}</div>
    ${!l.length ? vacio('grafica', 'Elige dos empresas para compararlas.') : `<div id="cmp-marco">
      <div class="cmp-barra">
        <div class="seg">${boton('modo', 'sep', 'Separadas')}${boton('modo', 'pct', 'Juntas en %')}</div>
        <div class="seg cmp-tipos">${CMP_TIPOS.map(([k, n]) => boton('tipo', k, `<svg viewBox="0 0 24 24">${dibujo[k]}</svg><span>${n}</span>`, `title="${n}"`)).join('')}</div>
        <div class="seg">${CMP_RANGOS.map(([k, n]) => boton('rango', k, n)).join('')}</div>
        <div class="seg"><span class="cmp-et">Velas de</span>${CMP_MARCOS.map(([k, n]) => boton('marco', k, n)).join('')}</div>
        <div class="seg cmp-mandos"><button data-cmpz="menos" title="Alejar">−</button><button data-cmpz="mas" title="Acercar">+</button><button data-cmpz="ver">Centrar</button><button data-cmpz="lleno" title="Pantalla completa">⛶ Grande</button></div>
      </div>
      <div class="cmp-duelo" id="cmp-duelo"></div>
      <div id="cmp"><p class="dim centro">Cargando velas…</p></div>
    </div>
    <div id="cmp-datos"></div>`}`;
}

// ---------- datos: todas las series en un mismo eje de fechas ----------
const fechaNY = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' });
function claveVela(marco, t, ts) {
  const dia = continuo(t) ? new Date(ts).toISOString().slice(0, 10) : fechaNY.format(ts);
  if (marco === 'd') return dia;
  if (marco === 'mes') return dia.slice(0, 7);
  if (marco === 's') { const d = new Date(dia + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7)); return d.toISOString().slice(0, 10); }
  if (continuo(t)) return String(Math.floor(ts / 144e5));
  return dia + (horaNY(ts).min < 810 ? 'a' : 'b');
}
function suavizadas(velas) {
  let antes = null;
  return velas.map((v) => {
    if (!v) return null;
    const [ts, c, h, l, o] = v, cierre = (o + h + l + c) / 4, abre = antes ? (antes.o + antes.c) / 2 : (o + c) / 2;
    antes = { o: abre, c: cierre };
    return [ts, cierre, Math.max(h, abre, cierre), Math.min(l, abre, cierre), abre, v[5]];
  });
}
function montarComparar() {
  const caja = $('#cmp');
  if (!caja) { K = null; return; }
  const l = aComparar(), datos = l.map((t) => pideVelas(t));
  if (datos.some((d) => d === undefined)) return;
  const con = l.filter((t, i) => datos[i]), sin = l.filter((t, i) => !datos[i]);
  const mezcla = con.some(continuo) && !con.every(continuo);
  let marco = cmpOp.marco === 'auto' ? CMP_RANGOS.find((r) => r[0] === cmpOp.rango)[3] : cmpOp.marco;
  if (marco === 'h4' && mezcla) marco = 'd';
  const d = Object.fromEntries(l.map((t, i) => [t, datos[i]]));
  const guias = con.filter((t) => !continuo(t)), usar = guias.length ? guias : con;
  const eje = new Map();
  for (const t of usar) for (const v of d[t][marco] || []) { const k = claveVela(marco, t, v[0]); if (!eje.has(k)) eje.set(k, v[0]); }
  const claves = [...eje.keys()].sort((a, b) => eje.get(a) - eje.get(b)), ts = claves.map((k) => eje.get(k));
  const filas = {};
  for (const t of con) { const m = new Map((d[t][marco] || []).map((v) => [claveVela(marco, t, v[0]), v])); filas[t] = claves.map((k) => m.get(k) || null); }
  const N = ts.length, firma = `${l.join()}|${marco}|${cmpOp.rango}`;
  const previo = K && K.firma === firma ? K : null;
  K = { lista: l, con, sin, marco, ts, N, filas, ha: Object.fromEntries(con.map((t) => [t, suavizadas(filas[t])])), datos: d, firma, cruz: null, paneles: [], raf: 0, desde: 0, hasta: 0, ventana: '' };
  if (previo) {
    const alFinal = previo.hasta >= previo.N - 1, ancho = previo.hasta - previo.desde;
    K.desde = alFinal ? previo.desde + (N - previo.N) : previo.desde; K.hasta = K.desde + ancho;
  } else centrar();
  // mismas empresas: los datos nuevos entran sin volver a montar nada
  if (previo && previo.con.join() === con.join() && previo.paneles[0]?.c.isConnected) { K.paneles = previo.paneles; K.mira = previo.mira; K.cruz = previo.cruz; pideDibujo(); return; }
  construirPaneles();
  pintarDatosComparados();
}
function centrar() {
  if (!K) return;
  const dias = CMP_RANGOS.find((r) => r[0] === cmpOp.rango)[2], limite = (K.ts[K.N - 1] || 0) - dias * 864e5;
  let ini = K.ts.findIndex((x) => x >= limite);
  if (ini < 0) ini = 0;
  K.desde = ini - 0.5; K.hasta = K.N - 0.5 + Math.max(1, (K.N - ini) * 0.025);
}
function construirPaneles() {
  const caja = $('#cmp'), juntas = cmpOp.modo === 'pct';
  if (!K.con.length) { caja.innerHTML = vacio('grafica', 'Las velas de estas empresas aparecen en la próxima actualización.'); $('#cmp-duelo').innerHTML = ''; return; }
  const faltan = K.sin.length ? `<p class="cmp-falta">Las velas de <b>${K.sin.map((t) => esc(alias(t))).join(', ')}</b> aparecen en la próxima actualización. Sus datos ya están abajo.</p>` : '';
  const panel = (id, clase, cab) => `<div class="cmp-panel ${clase}" data-panel="${id}">${cab}<div class="cmp-lienzo"><canvas></canvas></div></div>`;
  caja.className = `n${K.con.length} ${juntas ? 'juntas' : 'separadas'}`;
  caja.innerHTML = faltan + (juntas
    ? panel('todas', 'combinada', '<header class="cmp-cab" data-lee="todas"></header>')
    : K.con.map((t) => panel(t, '', `<header class="cmp-cab" data-lee="${esc(t)}" style="--c:${CMP_COLOR_UI[K.lista.indexOf(t)]}"></header>`)).join(''))
    + (K.con.length === 2 ? panel('ventaja', 'ventaja', '<header class="cmp-cab" data-lee="ventaja"></header>') : '')
    + '<p class="cmp-nota" id="cmp-nota">Arrastra para moverte. Pellizca, usa + y −, o la rueda con Ctrl para ampliar. Doble toque para centrar.</p>';
  K.paneles = [...caja.querySelectorAll('.cmp-panel')].map((el) => ({ id: el.dataset.panel, el: el.querySelector('.cmp-lienzo'), c: el.querySelector('canvas'), lee: el.querySelector('.cmp-cab'), antes: '' }));
  K.mira?.disconnect();
  K.mira = new ResizeObserver(() => pideDibujo());
  for (const p of K.paneles) { K.mira.observe(p.el); gestos(p); }
  pideDibujo();
}

// ---------- gestos: mover y ampliar todas a la vez ----------
const CMP_EJE = 66;
function acotar(desde, ancho) {
  ancho = Math.max(Math.min(12, K.N), Math.min(K.N * 1.08 + 2, ancho));
  K.desde = Math.max(-ancho * 0.12 - 0.5, Math.min(K.N - ancho * 0.7, desde));
  K.hasta = K.desde + ancho;
}
function ampliar(factor, donde = 0.85) {
  if (!K) return;
  const ancho = K.hasta - K.desde, nuevo = Math.max(Math.min(12, K.N), Math.min(K.N * 1.08 + 2, ancho * factor));
  acotar(K.desde + ancho * donde - nuevo * donde, nuevo);
  pideDibujo();
}
function gestos(p) {
  const c = p.c, dedos = new Map();
  let sep = 0;
  const ancho = () => Math.max(1, p.el.clientWidth - CMP_EJE);
  c.onpointerdown = (e) => { c.setPointerCapture(e.pointerId); dedos.set(e.pointerId, e.offsetX); sep = 0; };
  c.onpointermove = (e) => {
    if (!K) return;
    const antes = dedos.get(e.pointerId);
    if (antes != null) dedos.set(e.pointerId, e.offsetX);
    if (dedos.size === 2) {
      const [a, b] = [...dedos.values()], s = Math.abs(a - b);
      if (sep && s > 12) ampliar(sep / s, Math.max(0, Math.min(1, (a + b) / 2 / ancho())));
      sep = s; return;
    }
    if (antes != null) acotar(K.desde - ((e.offsetX - antes) / ancho()) * (K.hasta - K.desde), K.hasta - K.desde);
    K.cruz = { i: Math.max(0, Math.min(K.N - 1, Math.round(K.desde + (e.offsetX / ancho()) * (K.hasta - K.desde)))), panel: p.id, y: e.offsetY };
    pideDibujo();
  };
  const suelta = (e) => { dedos.delete(e.pointerId); sep = 0; };
  c.onpointerup = c.onpointercancel = suelta;
  c.onpointerleave = () => { if (K && !dedos.size) { K.cruz = null; pideDibujo(); } };
  c.ondblclick = () => { centrar(); pideDibujo(); };
  c.addEventListener('wheel', (e) => {
    if (!(e.ctrlKey || $('#cmp-marco')?.classList.contains('lleno'))) return;
    e.preventDefault(); ampliar(e.deltaY > 0 ? 1.15 : 1 / 1.15, Math.max(0, Math.min(1, e.offsetX / ancho())));
  }, { passive: false });
}
const pideDibujo = () => { if (K && !K.raf) K.raf = requestAnimationFrame(dibujarComparar); };

// ---------- dibujo ----------
const visibles = () => [Math.max(0, Math.ceil(K.desde)), Math.min(K.N, Math.floor(K.hasta) + 1)];
// de donde parte cada una: el cierre anterior a lo que se ve (o la apertura de la primera vela)
function baseDe(t) {
  const [a, b] = visibles(), f = K.filas[t];
  for (let i = a - 1; i >= 0; i--) if (f[i]) return f[i][1];
  for (let i = a; i < b; i++) if (f[i]) return f[i][4];
  return null;
}
const ultimaDe = (t, hasta) => { const f = K.filas[t]; for (let i = Math.min(K.N - 1, hasta); i >= 0; i--) if (f[i]) return f[i]; return null; };
function cambioDe(t) {
  const [a, b] = visibles(), base = baseDe(t), u = ultimaDe(t, b - 1);
  return base && u && K.filas[t].slice(a, b).some(Boolean) ? (u[1] / base - 1) * 100 : null;
}
const pasoBonito = (rango, cuantas) => { const bruto = rango / cuantas, e = 10 ** Math.floor(Math.log10(bruto || 1)); return [1, 2, 2.5, 5, 10].map((k) => k * e).find((k) => k >= bruto) || e; };
const fechaEje = (ts, corta) => new Date(ts).toLocaleDateString(LOC, K.marco === 'mes' ? { month: 'short', year: '2-digit' } : K.marco === 's' || (K.hasta - K.desde > 300) ? { month: 'short', year: '2-digit' } : corta ? { day: 'numeric', month: 'short' } : { day: 'numeric', month: 'short', year: 'numeric' });

// una serie de velas con el tipo elegido. col = color propio (en juntas) o null (colores de PM)
function serie(g, velas, X, Y, ancho, col, base, suelo) {
  const [a, b] = visibles(), tipo = cmpOp.tipo;
  if (tipo === 'linea' || tipo === 'area' || (col && ancho < 1.6)) {
    const pts = [];
    for (let i = Math.max(0, a - 1); i < Math.min(K.N, b + 1); i++) if (velas[i]) pts.push([X(i), Y(velas[i][1])]);
    if (!pts.length) return;
    g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    g.strokeStyle = col || '#000'; g.lineWidth = 2.2; g.lineJoin = 'round'; g.stroke();
    if (tipo === 'area') { g.lineTo(pts.at(-1)[0], suelo); g.lineTo(pts[0][0], suelo); g.closePath(); g.globalAlpha = col ? 0.16 : 0.22; g.fillStyle = col || '#000'; g.fill(); g.globalAlpha = 1; }
    return;
  }
  g.lineWidth = 1;
  for (let i = a; i < b; i++) {
    const v = velas[i];
    if (!v) continue;
    const x = Math.round(X(i)) + 0.5, c = v[1], h = v[2], l = v[3], o = v[4], sube = c >= o;
    if (tipo === 'barras') {
      g.strokeStyle = col || (sube ? '#1f4a5c' : '#000'); g.lineWidth = Math.max(1, Math.min(2.4, ancho / 4));
      g.beginPath(); g.moveTo(x, Y(h)); g.lineTo(x, Y(l)); g.moveTo(x - ancho / 2, Y(o)); g.lineTo(x, Y(o)); g.moveTo(x, Y(c)); g.lineTo(x + ancho / 2, Y(c)); g.stroke();
      continue;
    }
    const borde = col || '#000', y0 = Y(Math.max(o, c)), alto = Math.max(1, Y(Math.min(o, c)) - y0);
    g.strokeStyle = borde; g.beginPath(); g.moveTo(x, Y(h)); g.lineTo(x, y0); g.moveTo(x, y0 + alto); g.lineTo(x, Y(l)); g.stroke();
    const x0 = Math.round(x - ancho / 2) + 0.5, w = Math.max(1, Math.round(ancho));
    if (tipo === 'huecas') { g.fillStyle = sube ? PM.fondo : borde; } else g.fillStyle = col ? (sube ? col : '#000') : sube ? PM.sube : PM.negro;
    g.fillRect(x0, y0, w, alto);
    if (w > 2) g.strokeRect(x0, y0, w, alto);
  }
}
function lienzo(p) {
  const dpr = Math.min(2, devicePixelRatio || 1), W = p.el.clientWidth, H = p.el.clientHeight;
  if (!W || !H) return null;
  const w = Math.round(W * dpr), h = Math.round(H * dpr);
  if (p.c.width !== w || p.c.height !== h) { p.c.width = w; p.c.height = h; }
  const g = p.c.getContext('2d');
  g.setTransform(dpr, 0, 0, dpr, 0, 0); g.fillStyle = PM.fondo; g.fillRect(0, 0, W, H);
  g.font = '11px "IBM Plex Mono", ui-monospace, monospace'; g.textBaseline = 'middle'; g.textAlign = 'left';
  return { g, W, H, pw: W - CMP_EJE };
}
function ejeFechas(g, X, pw, H) {
  const [a, b] = visibles(), paso = pw / (K.hasta - K.desde), cada = Math.max(1, Math.ceil(95 / paso));
  g.fillStyle = PM.texto; g.textAlign = 'center';
  for (let i = a - (a % cada) + cada; i < b; i += cada) if (X(i) > 30 && X(i) < pw - 30) g.fillText(fechaEje(K.ts[i], true), X(i), H - 9);
  g.textAlign = 'left';
}
function rejilla(g, mn, mx, Y, pw, texto, cuantas) {
  const salto = pasoBonito(mx - mn, cuantas);
  g.strokeStyle = PM.reja; g.fillStyle = PM.texto; g.lineWidth = 1;
  for (let v = Math.ceil(mn / salto) * salto; v < mx; v += salto) { const y = Math.round(Y(v)) + 0.5; g.beginPath(); g.moveTo(0, y); g.lineTo(pw, y); g.stroke(); g.fillText(texto(v), pw + 7, y); }
}
function etiquetaEje(g, pw, y, texto, fondo, letra) { g.fillStyle = fondo; g.fillRect(pw, y - 10, CMP_EJE, 20); g.fillStyle = letra; g.font = '700 11px "IBM Plex Mono", monospace'; g.fillText(texto, pw + 6, y); }
function cruzEn(g, p, X, pw, H, valorDe) {
  const z = K.cruz;
  if (!z) return;
  const x = X(z.i);
  if (x < 0 || x > pw) return;
  g.strokeStyle = 'rgba(0,0,0,.75)'; g.lineWidth = 1; g.setLineDash([4, 4]);
  g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke();
  if (z.panel === p.id) { g.beginPath(); g.moveTo(0, z.y); g.lineTo(pw, z.y); g.stroke(); g.setLineDash([]); etiquetaEje(g, pw, z.y, valorDe(z.y), '#262626', '#fff'); }
  g.setLineDash([]);
  const f = fechaEje(K.ts[z.i]); g.font = '700 11px "IBM Plex Mono", monospace';
  const w = g.measureText(f).width + 14, bx = Math.max(0, Math.min(pw - w, x - w / 2));
  g.fillStyle = '#262626'; g.fillRect(bx, H - 19, w, 19); g.fillStyle = '#fff'; g.textAlign = 'center'; g.fillText(f, bx + w / 2, H - 9); g.textAlign = 'left';
}
const pctTxt = (v) => `${v > 0 ? '+' : ''}${v.toFixed(Math.abs(v) >= 100 ? 0 : 1)}%`;
function leer(p, html, fijo = '') {
  if (p.fijo !== fijo) { p.fijo = fijo; p.antes = null; p.lee.innerHTML = fijo + '<span class="cmp-din"></span>'; p.din = p.lee.lastElementChild; }
  if (p.antes !== html) { p.antes = html; p.din.innerHTML = html; }
}

function dibujarComparar() {
  if (!K) return;
  K.raf = 0;
  if (!$('#cmp')) { K.mira?.disconnect(); return; }
  const [a, b] = visibles();
  for (const p of K.paneles) {
    const L = lienzo(p);
    if (!L) continue;
    const { g, H, pw } = L, paso = pw / (K.hasta - K.desde), X = (i) => (i - K.desde) * paso;
    if (p.id === 'ventaja') { dibujarVentaja(p, g, X, pw, H); continue; }
    const juntas = p.id === 'todas', lista = juntas ? K.con : [p.id];
    const bases = Object.fromEntries(lista.map((t) => [t, baseDe(t)]));
    const series = lista.map((t) => {
      const v = cmpOp.tipo === 'ha' ? K.ha[t] : K.filas[t];
      if (!juntas) return v;
      const base = bases[t], r = (x) => (x / base - 1) * 100;
      const out = new Array(K.N).fill(null);
      for (let i = Math.max(0, a - 1); i < Math.min(K.N, b + 1); i++) if (v[i] && base) out[i] = [v[i][0], r(v[i][1]), r(v[i][2]), r(v[i][3]), r(v[i][4])];
      return out;
    });
    let mn = Infinity, mx = -Infinity;
    const soloCierre = cmpOp.tipo === 'linea' || cmpOp.tipo === 'area';
    for (const s of series) for (let i = a; i < b; i++) if (s[i]) { mn = Math.min(mn, s[i][soloCierre ? 1 : 3]); mx = Math.max(mx, s[i][soloCierre ? 1 : 2]); }
    if (!Number.isFinite(mn)) { g.fillStyle = PM.texto; g.fillText('Sin velas en estas fechas', 14, H / 2); leer(p, ''); continue; }
    if (juntas) { mn = Math.min(mn, 0); mx = Math.max(mx, 0); }
    const aire = (mx - mn || Math.abs(mx) * 0.02 || 1) * 0.08; mn -= aire; mx += aire;
    const MT = 8, MB = 22, ph = H - MT - MB, Y = (v) => MT + ((mx - v) / (mx - mn)) * ph;
    rejilla(g, mn, mx, Y, pw, juntas ? pctTxt : (v) => dinero(v), Math.max(3, Math.round(ph / 55)));
    ejeFechas(g, X, pw, H);
    g.save(); g.beginPath(); g.rect(0, 0, pw, H - MB); g.clip();
    if (!juntas) {
      const s = series[0]; let vm = 0;
      for (let i = a; i < b; i++) vm = Math.max(vm, K.filas[p.id][i]?.[5] || 0);
      if (vm > 0) { g.fillStyle = 'rgba(0,0,0,.15)'; for (let i = a; i < b; i++) { const h = ((K.filas[p.id][i]?.[5] || 0) / vm) * ph * 0.15; g.fillRect(X(i) - paso * 0.35, H - MB - h, Math.max(1, paso * 0.7), h); } }
      serie(g, s, X, Y, Math.max(1, Math.min(22, paso * 0.7)), null, 0, H - MB);
      // el color de cada una, tambien en su grafico
      g.fillStyle = CMP_COLOR[K.lista.indexOf(p.id)]; g.fillRect(0, 0, 5, H - MB);
    } else {
      g.strokeStyle = '#000'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(0, Y(0)); g.lineTo(pw, Y(0)); g.stroke();
      // en juntas cada empresa tiene su hueco dentro de cada fecha: las velas nunca se pisan
      const sub = (paso * 0.86) / lista.length, velas = !soloCierre && sub >= 1.6;
      series.forEach((s, j) => serie(g, s, velas ? (i) => X(i) - (paso * 0.86) / 2 + sub * (j + 0.5) : X, Y, velas ? Math.min(14, sub * 0.82) : sub, CMP_COLOR[K.lista.indexOf(lista[j])], 0, Y(0)));
      const nota = $('#cmp-nota');
      if (nota) nota.dataset.lineas = !soloCierre && !velas ? '1' : '';
    }
    g.restore();
    if (juntas) {
      // etiquetas al final, separadas para que se lean todas
      const fines = lista.map((t, j) => { let v = null; for (let i = b - 1; i >= a; i--) if (series[j][i]) { v = series[j][i][1]; break; } return v == null ? null : { t, v, y: Math.max(MT + 10, Math.min(H - MB - 10, Y(v))) }; }).filter(Boolean).sort((m, n) => m.y - n.y);
      for (let i = 1; i < fines.length; i++) fines[i].y = Math.max(fines[i].y, fines[i - 1].y + 33);
      for (let i = fines.length - 1; i >= 0; i--) fines[i].y = Math.min(fines[i].y, (i === fines.length - 1 ? H - MB - 16 : fines[i + 1].y - 33));
      for (const f of fines) {
        const col = CMP_COLOR[K.lista.indexOf(f.t)], oscuro = col === '#1736d6' || col === '#c80000';
        g.fillStyle = col; g.fillRect(pw, f.y - 16, CMP_EJE, 31); g.fillStyle = oscuro ? '#fff' : '#000';
        g.font = '800 11px "Manrope", sans-serif'; g.fillText(alias(f.t).slice(0, 7), pw + 6, f.y - 7);
        g.font = '700 11px "IBM Plex Mono", monospace'; g.fillText(pctTxt(f.v), pw + 6, f.y + 7);
      }
      cruzEn(g, p, X, pw, H, (y) => pctTxt(mx - ((y - MT) / ph) * (mx - mn)));
      const i = K.cruz ? K.cruz.i : b - 1;
      leer(p, `<span class="cmp-dia">${esc(fechaEje(K.ts[Math.max(0, Math.min(K.N - 1, i))]))}</span>${lista.map((t) => { const v = ultimaDe(t, i), base = bases[t]; return v && base ? `<span class="cmp-ley" style="--c:${CMP_COLOR_UI[K.lista.indexOf(t)]}"><i></i><b>${esc(alias(t))}</b><em class="num ${cls(v[1] - base)}">${pctTxt((v[1] / base - 1) * 100)}</em><small class="num">${dinero(v[1])}</small></span>` : ''; }).join('')}`);
    } else {
      const t = p.id, ult = ultimaDe(t, b - 1);
      if (ult) { const y = Y(ult[1]); if (y > MT && y < H - MB) { g.strokeStyle = '#000'; g.setLineDash([2, 3]); g.beginPath(); g.moveTo(0, y); g.lineTo(pw, y); g.stroke(); g.setLineDash([]); etiquetaEje(g, pw, y, dinero(ult[1]), '#000', '#fff'); } }
      cruzEn(g, p, X, pw, H, (y) => dinero(mx - ((y - MT) / ph) * (mx - mn)));
      const i = K.cruz ? K.cruz.i : b - 1, v = K.filas[t][Math.max(0, Math.min(K.N - 1, i))] || ultimaDe(t, i), cambio = cambioDe(t), x = empresa(t);
      const dia = v && v[4] ? ((v[1] - v[4]) / v[4]) * 100 : 0, desde = v && bases[t] ? (v[1] / bases[t] - 1) * 100 : null;
      leer(p, `${v ? `<span class="cmp-ohlc num"><i>${esc(fechaEje(v[0]))}</i><i>A ${dinero(v[4])}</i><i>Máx ${dinero(v[2])}</i><i>Mín ${dinero(v[3])}</i><i>C ${dinero(v[1])}</i><i class="${cls(dia)}">${sg(dia)}</i></span>` : ''}
        <span class="cmp-cambio ${cls(K.cruz ? desde : cambio)}"><small>${K.cruz ? 'hasta ese día' : 'en lo que ves'}</small><strong class="num">${fin(K.cruz ? desde : cambio) ? pctTxt(K.cruz ? desde : cambio) : '—'}</strong></span>`, `<span class="cmp-quien">${logo(t, 's')}<b>${esc(x.corto)}</b><em class="num">${usd(x.precio)}</em></span>`);
    }
  }
  const ventana = `${a}-${b}`;
  if (ventana !== K.ventana) {
    K.ventana = ventana;
    // la clasificacion, como mucho 8 veces por segundo; los datos de abajo, al soltar
    if (!cmpDuelo) { pintarDuelo(); cmpDuelo = setTimeout(() => { cmpDuelo = 0; pintarDuelo(); }, 120); }
    clearTimeout(cmpEspera); cmpEspera = setTimeout(pintarDatosComparados, 260);
  }
}
// quien va por delante en cada momento (solo con dos)
function dibujarVentaja(p, g, X, pw, H) {
  const [a, b] = visibles(), [t, u] = K.con, bt = baseDe(t), bu = baseDe(u);
  const dif = [];
  for (let i = a; i < b; i++) { const x = ultimaDe(t, i), y = ultimaDe(u, i); if (x && y && bt && bu) dif.push([i, (x[1] / bt - y[1] / bu) * 100]); }
  if (!dif.length) { leer(p, ''); return; }
  const tope = Math.max(1, ...dif.map((d) => Math.abs(d[1]))) * 1.15, Y = (v) => (H - 20) / 2 + 2 - (v / tope) * ((H - 24) / 2);
  rejilla(g, -tope, tope, Y, pw, pctTxt, 3); ejeFechas(g, X, pw, H);
  g.save(); g.beginPath(); g.rect(0, 0, pw, H - 18); g.clip();
  for (const [lado, quien] of [[1, t], [-1, u]]) {
    g.save(); g.beginPath(); g.rect(0, lado > 0 ? 0 : Y(0), pw, lado > 0 ? Y(0) : H); g.clip();
    g.beginPath(); g.moveTo(X(dif[0][0]), Y(0)); for (const [i, v] of dif) g.lineTo(X(i), Y(v)); g.lineTo(X(dif.at(-1)[0]), Y(0)); g.closePath();
    g.fillStyle = CMP_COLOR[K.lista.indexOf(quien)]; g.globalAlpha = 0.8; g.fill(); g.restore();
  }
  g.strokeStyle = '#000'; g.lineWidth = 1; g.beginPath(); g.moveTo(0, Y(0)); g.lineTo(pw, Y(0)); g.stroke(); g.restore();
  cruzEn(g, p, X, pw, H, (y) => pctTxt((((H - 20) / 2 + 2 - y) / ((H - 24) / 2)) * tope));
  const punto = K.cruz ? dif.find((d) => d[0] === K.cruz.i) || dif.at(-1) : dif.at(-1), gana = punto[1] >= 0 ? t : u;
  leer(p, `<span class="cmp-quien"><b>Quién va por delante</b></span><span class="cmp-ley" style="--c:${CMP_COLOR_UI[K.lista.indexOf(gana)]}"><i></i><b>${esc(alias(gana))}</b><em class="num">por ${Math.abs(punto[1]).toFixed(1)} puntos</em></span>`);
}
function pintarDuelo() {
  const c = $('#cmp-duelo');
  if (!c || !K) return;
  const l = K.con.map((t) => ({ t, v: cambioDe(t) })).filter((x) => x.v != null).sort((a, b) => b.v - a.v);
  if (!l.length) { c.innerHTML = ''; c.dataset.orden = ''; return; }
  const mayor = Math.max(1, ...l.map((x) => Math.abs(x.v))), [a, b] = visibles();
  const html = `<p>${esc(fechaEje(K.ts[a]))} → ${esc(fechaEje(K.ts[b - 1]))}</p>${l.map((x, i) => `<div style="--c:${CMP_COLOR_UI[K.lista.indexOf(x.t)]}"><span class="puesto-n">${i + 1}</span>${logo(x.t, 's')}<b>${esc(alias(x.t))}</b><u><i class="${x.v >= 0 ? 'mas' : 'menos'}" style="--w:${((Math.abs(x.v) / mayor) * 100).toFixed(1)}%"></i></u><strong class="num ${cls(x.v)}">${pctTxt(x.v)}</strong></div>`).join('')}`;
  if (c.dataset.orden !== l.map((x) => x.t).join()) { c.dataset.orden = l.map((x) => x.t).join(); c.innerHTML = html; return; }
  // mismo orden: solo se mueven las barras y los numeros
  c.firstElementChild.textContent = `${fechaEje(K.ts[a])} → ${fechaEje(K.ts[b - 1])}`;
  l.forEach((x, i) => { const fila = c.children[i + 1], u = fila.querySelector('u i'), n = fila.querySelector('strong'); u.style.setProperty('--w', ((Math.abs(x.v) / mayor) * 100).toFixed(1) + '%'); u.className = x.v >= 0 ? 'mas' : 'menos'; n.textContent = pctTxt(x.v); n.className = 'num ' + cls(x.v); });
}

// ---------- datos de cada una, lado a lado ----------
function riesgoDe(t, ini, fin2) {
  const d = (K?.datos[t] || pideVelas(t))?.d || [];
  const v = d.filter((x) => x[0] >= ini - 864e5 && x[0] <= fin2 + 864e5);
  if (v.length < 5) return null;
  const r = v.slice(1).map((x, i) => (x[1] / v[i][1] - 1) * 100);
  let alto = v[0][1], caida = 0;
  for (const x of v) { alto = Math.max(alto, x[1]); caida = Math.min(caida, (x[1] / alto - 1) * 100); }
  return {
    caida, normal: r.reduce((a, x) => a + Math.abs(x), 0) / r.length, peor: Math.min(...r), mejor: Math.max(...r),
    verdes: (r.filter((x) => x > 0).length / r.length) * 100,
    volumen: v.reduce((a, x) => a + (x[5] || 0), 0) / v.length,
    dias: new Map(v.slice(1).map((x, i) => [claveVela('d', t, x[0]), r[i]])),
  };
}
function parecido(a, b) {
  const x = [], y = [];
  for (const [k, v] of a.dias) if (b.dias.has(k)) { x.push(v); y.push(b.dias.get(k)); }
  if (x.length < 10) return null;
  const m = (l) => l.reduce((s, v) => s + v, 0) / l.length, mx = m(x), my = m(y);
  let n = 0, dx = 0, dy = 0;
  for (let i = 0; i < x.length; i++) { n += (x[i] - mx) * (y[i] - my); dx += (x[i] - mx) ** 2; dy += (y[i] - my) ** 2; }
  return dx && dy ? n / Math.sqrt(dx * dy) : null;
}
function pintarDatosComparados() {
  const c = $('#cmp-datos');
  if (!c || !K) return;
  const l = K.lista, [a, b] = visibles(), ini = K.ts[a] || Date.now() - 183 * 864e5, hasta = K.ts[b - 1] || Date.now();
  const e = l.map((t) => ({ t, x: empresa(t), f: fichaDe(t), q: E.quotes?.[t], u: porT.get(t), r: riesgoDe(t, ini, hasta), cad: continuo(t) ? null : pideCadena(t), res: continuo(t) ? null : proximosResultados(t), hist: pideVelas(t)?.res || [], c: E.cerebro?.[t] }));
  // modo: 'alto' gana el mayor, 'bajo' el menor; barra: pinta una barra proporcional
  const fila = (titulo, ayuda, valor, texto, modo, barra) => {
    const v = e.map(valor);
    if (v.every((x) => x == null || x === '')) return '';
    const num = v.filter(fin), top = modo && num.length > 1 ? (modo === 'alto' ? Math.max(...num) : Math.min(...num)) : null;
    const mayor = Math.max(1e-9, ...num.map(Math.abs));
    return `<div class="cf-fila"><span class="cf-et"><b>${titulo}</b>${ayuda ? `<small>${ayuda}</small>` : ''}</span>${e.map((x, i) => `<div class="cf-cel ${top != null && v[i] === top ? 'mejor' : ''}">${v[i] == null || v[i] === '' ? '<span class="dim">—</span>' : texto(v[i], x)}${barra && fin(v[i]) ? `<u><i style="--w:${((Math.abs(v[i]) / mayor) * 100).toFixed(0)}%;--c:${barra === 'signo' ? col(v[i]) : CMP_COLOR_UI[i]}"></i></u>` : ''}</div>`).join('')}</div>`;
  };
  const num = (x) => `<b class="num">${x}</b>`, pc = (v) => `<b class="num ${cls(v)}">${sg(v, 1)}</b>`;
  const grupo = (icono, titulo, filas) => (filas.trim() ? `<article class="cf-grupo"><h3>${ico(icono)} ${titulo}</h3>${filas}</article>` : '');
  const analistas = (x) => { const n = (x.f.comprar || 0) + (x.f.mantener || 0) + (x.f.vender || 0); return n ? ((x.f.comprar || 0) / n) * 100 : null; };
  const pares = [];
  for (let i = 0; i < e.length; i++) for (let j = i + 1; j < e.length; j++) { const p = e[i].r && e[j].r ? parecido(e[i].r, e[j].r) : null; if (p != null) pares.push([i, j, p]); }
  const espera = (x, dias) => { const v = x.cad ? vencimientoCerca(x.cad, dias) : null; return v ? esperado(x.cad, v)?.pct ?? null : null; };
  const faltan = l.filter((t) => !E.fichas?.[t] && !continuo(t));
  c.innerHTML = `<section>${sec('analistas', 'Datos, lado a lado')}<div class="cf" style="--n:${l.length}">
    <div class="cf-cabeza"><span></span>${e.map((x, i) => `<a href="${enlace(x.t)}" style="--c:${CMP_COLOR_UI[i]}">${logo(x.t)}<b>${esc(x.x.corto)}</b><small>${esc(nombreCorto(x.x.nombre))}</small></a>`).join('')}</div>
    ${grupo('dinero', 'Precio', fila('Precio ahora', '', (x) => x.x.precio, (v) => num(usd(v))) + fila('Hoy', '', (x) => x.x.pct, pc, 'alto', 'signo') + fila('Fuera de horario', 'antes o después del mercado', (x) => (x.q?.ultimo && x.q?.precio && Math.abs(x.q.ultimo / x.q.precio - 1) > 0.0005 ? (x.q.ultimo / x.q.precio - 1) * 100 : null), pc))}
    ${grupo('resultados', 'Cómo le ha ido', fila('En lo que ves', 'las fechas del gráfico', (x) => (K.con.includes(x.t) ? cambioDe(x.t) : null), pc, 'alto', 'signo') + fila('Semana', '', (x) => x.f.semana, pc, 'alto', 'signo') + fila('Mes', '', (x) => x.f.mes, pc, 'alto', 'signo') + fila('Este año', '', (x) => x.f.ytd, pc, 'alto', 'signo') + fila('12 meses', '', (x) => x.f.anio, pc, 'alto', 'signo'))}
    ${grupo('pulso', 'Riesgo, en las fechas del gráfico', fila('Mayor caída', 'desde un máximo', (x) => x.r?.caida, pc, 'alto', 'signo') + fila('Un día normal se mueve', 'arriba o abajo', (x) => x.r?.normal, (v) => num('±' + v.toFixed(2) + '%'), null, true) + fila('Mejor día', '', (x) => x.r?.mejor, pc, 'alto') + fila('Peor día', '', (x) => x.r?.peor, pc, 'alto') + fila('Días en verde', '', (x) => x.r?.verdes, (v) => num(v.toFixed(0) + '%'), 'alto', true)
      + fila('Rango del año', 'dónde está entre mínimo y máximo', (x) => (x.f.max52 > x.f.min52 && x.x.precio ? Math.max(0, Math.min(100, ((x.x.precio - x.f.min52) / (x.f.max52 - x.f.min52)) * 100)) : null), (v, x) => `<span class="cf-rango" style="--w:${v.toFixed(0)}"><i></i></span><small class="num">${usd(x.f.min52)} – ${usd(x.f.max52)}</small>`))}
    ${grupo('sector', 'Tamaño y valor', fila('Tamaño', 'valor en bolsa', (x) => x.f.cap, (v) => num(corto(v) + ' $'), null, true) + fila('PER', 'años de beneficios que pagas · menos es más barata', (x) => (x.f.per > 0 ? x.f.per : null), (v) => num(v.toFixed(1)), 'bajo', true) + fila('Sector', '', (x) => (x.f.sector ? sectorEs(x.f.sector) : null), (v) => `<span>${esc(v)}</span>`) + fila('Volumen', 'frente a lo normal', (x) => x.f.rvol, (v) => num(v + 'x'), null, true) + fila('Acciones al día', 'media en estas fechas', (x) => x.r?.volumen || null, (v) => num(corto(v)), null, true))}
    ${grupo('analistas', 'Qué dicen los analistas', fila('Dicen comprar', 'se equivocan a menudo', analistas, (v, x) => `${num(v.toFixed(0) + '%')}<span class="cf-opi">${[['comprar', 'var(--up)'], ['mantener', 'var(--gold)'], ['vender', 'var(--dn)']].map(([k, co]) => `<i style="flex:${x.f[k] || 0};background:${co}"></i>`).join('')}</span><small class="num">${x.f.comprar || 0} · ${x.f.mantener || 0} · ${x.f.vender || 0}</small>`, 'alto') + fila('Precio que esperan', 'en un año', (x) => x.f.objetivo, (v) => num(usd(v))) + fila('Margen hasta ese precio', '', (x) => (x.f.objetivo && x.x.precio ? (x.f.objetivo / x.x.precio - 1) * 100 : null), pc, 'alto', 'signo'))}
    ${grupo('rayo', 'Resultados y opciones', fila('Próximos resultados', '', (x) => x.res?.dia, (v, x) => `${num(new Date(v + 'T12:00:00').toLocaleDateString(LOC, { day: 'numeric', month: 'short' }))}<small>${x.res.dias === 0 ? 'hoy' : `en ${x.res.dias} días`}</small>`) + fila('Al presentar se mueve', 'media de las últimas veces', (x) => (x.hist.length ? x.hist.reduce((s, r) => s + Math.abs(r.mov), 0) / x.hist.length : null), (v) => num('±' + v.toFixed(1) + '%'), null, true) + fila('Últimas veces', 'la más reciente primero', (x) => (x.hist.length ? 1 : null), (v, x) => `<span class="cf-chips">${x.hist.slice(0, 4).map((r) => `<em class="num ${cls(r.mov)}">${sg(r.mov, 1)}</em>`).join('')}</span>`)
      + fila('Espera el mercado: 1 semana', 'según el precio de las opciones', (x) => espera(x, 7), (v) => num('±' + v.toFixed(1) + '%'), null, true) + fila('Espera el mercado: 1 mes', '', (x) => espera(x, 30), (v) => num('±' + v.toFixed(1) + '%'), null, true) + fila('Puts por cada call', 'abiertas, a un mes', (x) => (x.cad ? putsPorCall(x.cad, vencimientoCerca(x.cad, 30)) : null), (v) => num(v.toFixed(2)), null, true))}
    ${grupo('nota', 'Noticias', fila('Ambiente', 'de sus noticias', (x) => (x.c ? x.c.animo : null), (v) => `<span class="chip ${animoTono(v) > 0 ? 'up' : animoTono(v) < 0 ? 'dn' : 'dim'}">${animoTxt(v)}</span>`, 'alto') + fila('Qué pasa', '', (x) => (x.c?.frase ? breve(txt(x.c, 'frase')) : null), (v) => `<span class="cf-frase">${esc(v)}</span>`))}
    </div>
    ${pares.length ? `<div class="cf-pares"><h3>¿Se mueven parecido?</h3>${pares.map(([i, j, p]) => `<div><span>${logo(e[i].t, 's')}${logo(e[j].t, 's')}<b>${esc(e[i].x.corto)} y ${esc(e[j].x.corto)}</b></span><u><i style="--w:${(Math.max(0, p) * 100).toFixed(0)}%"></i></u><strong class="num">${(p * 100).toFixed(0)}%</strong><small>${p > 0.7 ? 'Casi siempre van a la vez' : p > 0.4 ? 'Suelen ir a la vez' : p > 0.15 ? 'A veces coinciden' : p > -0.15 ? 'Cada una va a lo suyo' : 'Suelen ir al revés'}</small></div>`).join('')}</div>` : ''}
    ${faltan.length ? `<p class="nota-c">De ${faltan.map(alias).join(', ')} solo hay datos básicos hasta la próxima actualización.</p>` : ''}</section>`;
}
function pantallaComparar(si) {
  const m = $('#cmp-marco');
  if (!m) return;
  m.classList.toggle('lleno', si); document.body.classList.toggle('sin-scroll', si);
  m.querySelector('[data-cmpz=lleno]').textContent = si ? '✕ Salir' : '⛶ Grande';
  pideDibujo();
}
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-cmp],[data-cmpz]');
  if (!b) return;
  if (b.dataset.cmpz) {
    const q = b.dataset.cmpz;
    if (q === 'mas') ampliar(1 / 1.35); else if (q === 'menos') ampliar(1.35); else if (q === 'ver') { centrar(); pideDibujo(); } else pantallaComparar(!$('#cmp-marco').classList.contains('lleno'));
    return;
  }
  const g = b.dataset.cmp;
  cmpOp[g] = b.dataset.k;
  if (g === 'rango') cmpOp.marco = 'auto';
  guarda.poner('comp-op', cmpOp);
  document.querySelectorAll('[data-cmp]').forEach((x) => x.classList.toggle('act', cmpOp[x.dataset.cmp] === x.dataset.k));
  if (g === 'tipo') pideDibujo();
  else if (g === 'modo') construirPaneles();
  else { if (K) K.firma = ''; montarComparar(); }
});
addEventListener('keydown', (e) => { if (e.key === 'Escape' && $('#cmp-marco.lleno')) pantallaComparar(false); });
addEventListener('hashchange', () => { if ($('#cmp-marco.lleno')) pantallaComparar(false); document.body.classList.remove('sin-scroll'); });
