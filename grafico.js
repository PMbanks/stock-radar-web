// Velas con los colores de PM, dibujo encima y visor de imagenes con zoom. Canvas puro: solo se pinta cuando algo cambia.
'use strict';
const PM = {
  fondo: '#898989', reja: 'rgba(0,0,0,.09)', texto: '#141414', sube: '#678797', negro: '#000000',
  asia: '#1736d6', londres: '#c80000', alarma: '#ffd60a',
};
const COLORES_TRAZO = ['#ffd60a', '#ffffff', '#000000', '#c80000', '#1736d6', '#00e676'];
const enNY = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
function horaNY(ts) {
  const p = Object.fromEntries(enNY.formatToParts(ts).map((x) => [x.type, x.value]));
  return { dia: `${p.year}-${p.month}-${p.day}`, min: (+p.hour % 24) * 60 + +p.minute };
}
// maximos y minimos de Asia (20:00-24:00 NY, azul) y Londres (02:00-05:00 NY, rojo)
function sesionesDe(velas) {
  const m = new Map();
  velas.forEach((v, i) => {
    const h = horaNY(v[0]);
    const n = h.min >= 1200 ? 'ASIA' : h.min >= 120 && h.min < 300 ? 'LDN' : null;
    if (!n) return;
    const k = n + h.dia;
    const s = m.get(k) || { n, ini: i, fin: i, alto: -Infinity, bajo: Infinity };
    s.fin = i; s.alto = Math.max(s.alto, v[2]); s.bajo = Math.min(s.bajo, v[3]);
    m.set(k, s);
  });
  return [...m.values()].slice(-4);
}

// Los trazos se guardan en (hora, precio), no en pixeles: siguen en su sitio al mover o acercar.
// trazo = { h: 'linea'|'flecha'|'zona'|'nivel'|'lapiz'|'texto', c: color, p: [[ts, precio], ...], t: texto }
function grafico(el, op) {
  const velas = op.velas || [];
  el.innerHTML = '';
  if (velas.length < 2) { el.innerHTML = '<div class="graf-vacio">El gráfico aparece en la próxima actualización.</div>'; return null; }
  const c = document.createElement('canvas'), g = c.getContext('2d');
  const lee = document.createElement('div'); lee.className = 'graf-lee';
  el.append(c); if (!op.mini) el.append(lee);
  const ses = op.sesiones ? sesionesDe(velas) : [];
  const n = velas.length;
  const trazos = (op.trazos || []).map((t) => ({ ...t, p: t.p.map((q) => [...q]) }));
  let herramienta = 'mover', color = op.color || COLORES_TRAZO[0], actual = null;
  const intervalo = (() => { const d = velas.slice(1, 60).map((v, i) => v[0] - velas[i][0]).sort((a, b) => a - b); return d[Math.floor(d.length / 2)] || 3e5; })();
  const idxDe = (ts) => {
    if (ts >= velas[n - 1][0]) return n - 1 + (ts - velas[n - 1][0]) / intervalo;
    if (ts <= velas[0][0]) return (ts - velas[0][0]) / intervalo;
    let a = 0, b = n - 1;
    while (b - a > 1) { const m = (a + b) >> 1; if (velas[m][0] <= ts) a = m; else b = m; }
    return a + (ts - velas[a][0]) / (velas[b][0] - velas[a][0] || 1);
  };
  const tsDe = (i) => {
    if (i >= n - 1) return Math.round(velas[n - 1][0] + (i - (n - 1)) * intervalo);
    if (i <= 0) return Math.round(velas[0][0] + i * intervalo);
    const a = Math.floor(i);
    return Math.round(velas[a][0] + (i - a) * (velas[a + 1][0] - velas[a][0]));
  };
  const inicial = Math.min(n, op.ver || Math.min(n, 120));
  // hueco a la derecha para dibujar lo que crees que va a pasar
  const lejos = Math.max(0, ...trazos.flatMap((t) => t.p.map((p) => idxDe(p[0]) - (n - 1))));
  const hueco = Math.max(op.editable ? Math.round(inicial * 0.3) : 0, Math.ceil(lejos) + (lejos ? 4 : 0));
  const tope = n + Math.max(hueco, Math.round(inicial * 0.3));
  let desde = n - inicial + Math.round(hueco * 0.4), hasta = n + hueco, cruz = null, W = 0, H = 0, escala = 1, subeY = 0, E = null;
  const MD = op.mini ? 0 : 66, MB = op.mini ? 0 : 24, MT = op.mini ? 4 : 34;
  const fmt = (x) => x.toLocaleString('en-US', { minimumFractionDigits: Math.abs(x) < 10 ? 4 : 2, maximumFractionDigits: Math.abs(x) < 10 ? 4 : 2 });
  const FECHAS = { h4: { day: 'numeric', month: 'short', hour: '2-digit' }, s: { day: 'numeric', month: 'short', year: '2-digit' }, mes: { month: 'short', year: 'numeric' } };
  const cuando = (ts) => new Date(ts).toLocaleString(LOC, FECHAS[op.marco] || (op.intradia ? { weekday: 'short', hour: '2-digit', minute: '2-digit' } : { day: 'numeric', month: 'short' }));

  function dibuja(t) {
    const pts = t.p.map(([ts, pr]) => [E.X(idxDe(ts)), E.Y(pr)]);
    const [a, b] = [pts[0], pts[pts.length - 1]];
    if (!a) return;
    g.strokeStyle = t.c; g.fillStyle = t.c; g.lineWidth = op.mini ? 1.4 : 2.4; g.lineJoin = g.lineCap = 'round';
    if (t.h === 'linea' || t.h === 'lapiz' || t.h === 'flecha') {
      g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke();
      if (t.h === 'flecha' && pts.length > 1) {
        const prev = pts[Math.max(0, pts.length - 2)], ang = Math.atan2(b[1] - prev[1], b[0] - prev[0]), L = op.mini ? 7 : 13;
        g.beginPath(); g.moveTo(b[0], b[1]); g.lineTo(b[0] - L * Math.cos(ang - 0.45), b[1] - L * Math.sin(ang - 0.45)); g.lineTo(b[0] - L * Math.cos(ang + 0.45), b[1] - L * Math.sin(ang + 0.45)); g.closePath(); g.fill();
        if (!op.mini) { g.font = '600 11px "IBM Plex Mono", monospace'; g.fillText(fmt(t.p[t.p.length - 1][1]), b[0] + 8, b[1]); }
      }
    } else if (t.h === 'zona') {
      const x = Math.min(a[0], b[0]), y = Math.min(a[1], b[1]), w = Math.abs(b[0] - a[0]), h = Math.abs(b[1] - a[1]);
      g.globalAlpha = 0.22; g.fillRect(x, y, w, h); g.globalAlpha = 1; g.strokeRect(x, y, w, h);
    } else if (t.h === 'nivel') {
      g.beginPath(); g.moveTo(0, a[1]); g.lineTo(W - MD, a[1]); g.stroke();
      if (!op.mini) { g.font = '600 11px "IBM Plex Mono", monospace'; g.fillText(fmt(t.p[0][1]), 8, a[1] - 9); }
    } else if (t.h === 'texto') {
      g.font = `700 ${op.mini ? 9 : 14}px "Manrope", sans-serif`;
      const w = g.measureText(t.t || '').width;
      g.fillStyle = 'rgba(0,0,0,.72)'; g.fillRect(a[0] - 6, a[1] - (op.mini ? 8 : 13), w + 12, op.mini ? 16 : 26);
      g.fillStyle = t.c === '#000000' ? '#ffffff' : t.c; g.fillText(t.t || '', a[0], a[1]);
    }
  }

  function pinta() {
    const dpr = Math.min(2, devicePixelRatio || 1);
    W = el.clientWidth; H = el.clientHeight;
    if (!W || !H) return;
    c.width = W * dpr; c.height = H * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = PM.fondo; g.fillRect(0, 0, W, H);
    const a = Math.max(0, Math.floor(desde)), b = Math.min(n, Math.ceil(hasta)), vis = velas.slice(a, b);
    if (!vis.length) return;
    let mn = Math.min(...vis.map((v) => v[3])), mx = Math.max(...vis.map((v) => v[2]));
    const margen = (mx - mn || mx * 0.01) * 0.8;
    const quiero = [...(op.alarmas || []).map((al) => al.nivel), ...trazos.flatMap((t) => t.p.map((p) => p[1]))];
    for (const v of quiero) if (v > mn - margen && v < mx + margen) { mn = Math.min(mn, v); mx = Math.max(mx, v); }
    let aire = (mx - mn || 1) * (op.editable ? 0.22 : 0.08); mn -= aire; mx += aire;
    // escala y desplazamiento manuales (arrastrando el eje de precios o hacia arriba y abajo)
    const medio = (mx + mn) / 2, mitad = ((mx - mn) / 2) * escala;
    mn = medio - mitad + subeY * mitad * 2; mx = medio + mitad + subeY * mitad * 2;
    const pw = W - MD, ph = H - MB - MT, paso = pw / (hasta - desde);
    const X = (i) => (i - desde + 0.5) * paso, Y = (p) => MT + ((mx - p) / (mx - mn)) * ph;
    E = { X, Y, mn, mx, pw, ph, paso, iDe: (x) => desde + x / paso - 0.5, pDe: (y) => mx - ((y - MT) / ph) * (mx - mn) };
    g.font = '11px "IBM Plex Mono", ui-monospace, monospace'; g.textBaseline = 'middle'; g.textAlign = 'left';
    if (!op.mini) {
      const salto = (() => { const bruto = (mx - mn) / 6, e = 10 ** Math.floor(Math.log10(bruto)); return [1, 2, 2.5, 5, 10].map((k) => k * e).find((k) => k >= bruto); })();
      g.strokeStyle = PM.reja; g.fillStyle = PM.texto; g.lineWidth = 1;
      for (let p = Math.ceil(mn / salto) * salto; p < mx; p += salto) { const y = Math.round(Y(p)) + 0.5; g.beginPath(); g.moveTo(0, y); g.lineTo(pw, y); g.stroke(); g.fillText(fmt(p), pw + 8, y); }
      const cada = Math.max(1, Math.round((op.marco === 'h4' || op.marco === 's' ? 120 : 90) / paso));
      g.textAlign = 'center';
      for (let i = a - (a % cada) + cada; i < b; i += cada) if (X(i) > 30 && X(i) < pw - 30) g.fillText(cuando(velas[i][0]), X(i), H - MB / 2);
      g.textAlign = 'left';
    }
    g.save(); g.beginPath(); g.rect(0, 0, pw, H - MB); g.clip();
    const vmax = Math.max(...vis.map((v) => v[5] || 0));
    if (vmax > 0 && !op.mini) { g.fillStyle = 'rgba(0,0,0,.17)'; for (let i = a; i < b; i++) { const h = ((velas[i][5] || 0) / vmax) * ph * 0.14; g.fillRect(X(i) - paso * 0.35, H - MB - h, Math.max(1, paso * 0.7), h); } }
    const ancho = Math.max(1, Math.min(18, paso * 0.68));
    for (let i = a; i < b; i++) {
      const [, cie, alto, bajo, abre] = velas[i], x = Math.round(X(i)), sube = cie >= abre;
      g.strokeStyle = PM.negro; g.lineWidth = 1; g.beginPath(); g.moveTo(x + 0.5, Y(alto)); g.lineTo(x + 0.5, Y(bajo)); g.stroke();
      const y0 = Y(Math.max(cie, abre)), h = Math.max(1, Y(Math.min(cie, abre)) - y0), x0 = Math.round(x - ancho / 2) + 0.5;
      g.fillStyle = sube ? PM.sube : PM.negro;
      g.fillRect(x0, y0, ancho, h);
      if (ancho > 2.5) g.strokeRect(x0, y0, ancho, h);
    }
    // momento en que se publico la idea
    if (op.marca) { const x = X(idxDe(op.marca)); g.strokeStyle = '#fff'; g.setLineDash([3, 4]); g.beginPath(); g.moveTo(x, MT); g.lineTo(x, H - MB); g.stroke(); g.setLineDash([]); }
    g.lineWidth = 1.6;
    for (const s of ses) {
      const col = s.n === 'ASIA' ? PM.asia : PM.londres, x1 = X(s.ini), x2 = Math.max(X(s.fin), Math.min(pw, X(s.ini + (op.largoSesion || 70))));
      g.strokeStyle = col; g.fillStyle = col;
      for (const p of [s.alto, s.bajo]) { g.beginPath(); g.moveTo(x1, Y(p)); g.lineTo(x2, Y(p)); g.stroke(); }
      g.font = '600 10px "IBM Plex Mono", monospace';
      g.fillText(s.n, x1 + 3, Y(s.alto) - 8);
    }
    trazos.forEach(dibuja);
    if (actual) dibuja(actual);
    g.restore();
    if (op.mini) return;
    const etiqueta = (p, fondo, letra) => { const y = Math.max(MT, Math.min(H - MB, Y(p))); g.fillStyle = fondo; g.fillRect(pw, y - 9, MD, 18); g.fillStyle = letra; g.font = '600 11px "IBM Plex Mono", monospace'; g.fillText(fmt(p), pw + 8, y); };
    for (const al of op.alarmas || []) {
      if (al.nivel < mn || al.nivel > mx) continue;
      g.strokeStyle = PM.alarma; g.lineWidth = 2; g.setLineDash([9, 5]); g.beginPath(); g.moveTo(0, Y(al.nivel)); g.lineTo(pw, Y(al.nivel)); g.stroke(); g.setLineDash([]);
      g.fillStyle = PM.alarma; g.fillRect(8, Y(al.nivel) - 10, 90, 20); g.fillStyle = '#000'; g.font = '600 11px "IBM Plex Mono", monospace'; g.fillText('♦ ' + fmt(al.nivel), 13, Y(al.nivel));
      etiqueta(al.nivel, PM.alarma, '#000');
    }
    const ult = velas[n - 1][1];
    if (ult >= mn && ult <= mx) { g.strokeStyle = '#000'; g.lineWidth = 1; g.setLineDash([2, 3]); g.beginPath(); g.moveTo(0, Y(ult)); g.lineTo(pw, Y(ult)); g.stroke(); g.setLineDash([]); etiqueta(ult, '#000', '#fff'); }
    let v = velas[n - 1];
    if (cruz && cruz.x < pw) {
      const i = Math.max(a, Math.min(b - 1, Math.round(E.iDe(cruz.x)))); v = velas[i];
      g.strokeStyle = 'rgba(0,0,0,.65)'; g.setLineDash([4, 4]); g.beginPath(); g.moveTo(cruz.x, MT); g.lineTo(cruz.x, H - MB); g.moveTo(0, cruz.y); g.lineTo(pw, cruz.y); g.stroke(); g.setLineDash([]);
      if (cruz.y > MT && cruz.y < H - MB) etiqueta(E.pDe(cruz.y), '#303030', '#fff');
    }
    const [ts, cie, alto, bajo, abre] = v, d = ((cie - abre) / abre) * 100;
    lee.innerHTML = `<b>${cuando(ts)}</b><span>A ${fmt(abre)}</span><span>Máx ${fmt(alto)}</span><span>Mín ${fmt(bajo)}</span><span>C ${fmt(cie)}</span><span>${d >= 0 ? '+' : ''}${d.toFixed(2)}%</span>`;
  }

  const cambio = () => { op.onCambio?.(trazos); pinta(); };
  const api = {
    usar: (h) => { herramienta = h; c.style.cursor = h === 'mover' ? 'grab' : 'crosshair'; },
    color: (x) => { color = x; },
    deshacer: () => { trazos.pop(); cambio(); },
    limpiar: () => { trazos.length = 0; cambio(); },
    trazos: () => trazos,
    // foto de las velas visibles, para guardar la idea tal y como se vio
    foto: () => velas.slice(Math.max(0, Math.floor(desde), n - 170), n).map((v) => v.slice(0, 5)),
    ajustar: () => { desde = n - inicial + Math.round(hueco * 0.4); hasta = n + hueco; escala = 1; subeY = 0; pinta(); },
  };
  new ResizeObserver(() => pinta()).observe(el);
  pinta();
  if (op.mini) return api;

  const acota = (ancho, ini) => { ancho = Math.max(Math.min(14, n), Math.min(tope, ancho)); desde = Math.max(-3, Math.min(tope - ancho, n - Math.min(ancho * 0.35, n), ini)); hasta = desde + ancho; };
  const zoom = (k, x) => { const f = Math.max(0, Math.min(1, x / (W - MD))), ancho = hasta - desde, ancla = desde + ancho * f, nuevo = Math.max(Math.min(14, n), Math.min(tope, ancho * k)); acota(nuevo, ancla - nuevo * f); pinta(); };
  c.addEventListener('wheel', (e) => { if (!(e.ctrlKey || el.classList.contains('lleno'))) return; e.preventDefault(); if (e.offsetX > W - MD) { escala = Math.max(0.4, Math.min(3, escala * (e.deltaY > 0 ? 1.1 : 1 / 1.1))); pinta(); } else zoom(e.deltaY > 0 ? 1.15 : 1 / 1.15, e.offsetX); }, { passive: false });
  const dedos = new Map();
  let separacion = 0, eje = false;
  const punto = (e) => [tsDe(E.iDe(Math.min(e.offsetX, E.pw))), +E.pDe(e.offsetY).toPrecision(8)];
  function pedirTexto(e) {
    const p = punto(e), caja = document.createElement('input');
    caja.className = 'graf-texto'; caja.maxLength = 60; caja.placeholder = 'Escribe y pulsa Intro';
    caja.style.left = Math.min(e.offsetX, W - 230) + 'px'; caja.style.top = e.offsetY - 18 + 'px';
    let hecho = false;
    const fin = (guardar) => { if (hecho || !caja.isConnected) return; hecho = true; const t = caja.value.trim(); caja.remove(); if (guardar && t) { trazos.push({ h: 'texto', c: color, p: [p], t }); cambio(); } };
    caja.onkeydown = (ev) => { if (ev.key === 'Enter') fin(true); if (ev.key === 'Escape') fin(false); ev.stopPropagation(); };
    caja.onblur = () => fin(true);
    el.append(caja); setTimeout(() => caja.focus(), 30);
  }
  c.addEventListener('pointerdown', (e) => {
    c.setPointerCapture(e.pointerId); dedos.set(e.pointerId, [e.offsetX, e.offsetY]); separacion = 0;
    eje = e.offsetX > W - MD;
    if (herramienta === 'mover' || eje || dedos.size > 1 || !E) { actual = null; return; }
    if (herramienta === 'texto') { dedos.delete(e.pointerId); e.preventDefault(); pedirTexto(e); return; }
    const p = punto(e);
    actual = { h: herramienta, c: color, p: herramienta === 'nivel' ? [p] : [p, p] };
    if (herramienta === 'lapiz') actual.p = [p];
    pinta();
  });
  c.addEventListener('pointermove', (e) => {
    const antes = dedos.get(e.pointerId);
    if (dedos.size === 2 && antes) {
      dedos.set(e.pointerId, [e.offsetX, e.offsetY]); actual = null;
      const [p, q] = [...dedos.values()], s = Math.abs(p[0] - q[0]);
      if (separacion && s > 10) zoom(separacion / s, (p[0] + q[0]) / 2);
      separacion = s; return;
    }
    cruz = { x: e.offsetX, y: e.offsetY };
    if (antes) {
      const dx = e.offsetX - antes[0], dy = e.offsetY - antes[1];
      dedos.set(e.pointerId, [e.offsetX, e.offsetY]);
      if (actual) {
        const p = punto(e);
        if (actual.h === 'lapiz') { if (actual.p.length < 300 && Math.hypot(dx, dy) > 1.5) actual.p.push(p); }
        else if (actual.h === 'nivel') actual.p = [p];
        else actual.p[1] = p;
      } else if (eje) escala = Math.max(0.4, Math.min(3, escala * (1 + dy / 200)));
      else if (herramienta === 'mover') { const ancho = hasta - desde; acota(ancho, desde - (dx / (W - MD)) * ancho); if (Math.abs(escala - 1) > 0.05) subeY = Math.max(-0.4, Math.min(0.4, subeY + dy / (H - MB - MT))); }
    }
    pinta();
  });
  const suelta = (e) => {
    dedos.delete(e.pointerId); separacion = 0; eje = false;
    if (actual) {
      const t = actual; actual = null;
      const [a, b] = [t.p[0], t.p[t.p.length - 1]];
      if (t.h === 'nivel' || t.p.length > 2 || a[0] !== b[0] || a[1] !== b[1]) { trazos.push(t); cambio(); } else pinta();
    }
  };
  c.addEventListener('pointerup', suelta); c.addEventListener('pointercancel', suelta);
  c.addEventListener('pointerleave', () => { cruz = null; pinta(); });
  c.addEventListener('dblclick', () => { if (herramienta === 'mover') api.ajustar(); });
  const mandos = document.createElement('div');
  mandos.className = 'graf-mandos';
  mandos.innerHTML = '<button type="button" data-g="menos" title="Alejar">−</button><button type="button" data-g="mas" title="Acercar">+</button><button type="button" data-g="ver" title="Volver a la vista normal">Centrar</button><button type="button" data-g="lleno" title="Pantalla completa">⛶ Grande</button>';
  el.append(mandos);
  const lleno = (si) => {
    el.classList.toggle('lleno', si);
    document.body.classList.toggle('sin-scroll', si);
    mandos.querySelector('[data-g=lleno]').textContent = si ? '✕ Salir' : '⛶ Grande';
    if (si) addEventListener('keydown', salir); else removeEventListener('keydown', salir);
    pinta();
  };
  const salir = (e) => { if (e.key === 'Escape' || e.type === 'hashchange') lleno(false); };
  addEventListener('hashchange', () => { if (el.classList.contains('lleno')) lleno(false); }, { once: true });
  mandos.addEventListener('click', (e) => {
    const a = e.target.dataset.g;
    if (a === 'mas') zoom(1 / 1.3, (W - MD) * 0.75); else if (a === 'menos') zoom(1.3, (W - MD) * 0.75);
    else if (a === 'ver') api.ajustar(); else if (a === 'lleno') lleno(!el.classList.contains('lleno'));
    e.stopPropagation();
  });
  api.usar('mover');
  return api;
}

// ---------- visor de imagenes: rueda o pellizco para acercar, arrastrar para mover ----------
function visor(src) {
  const v = document.querySelector('#visor');
  v.innerHTML = '<img alt="imagen ampliada" draggable="false"><div class="visor-mandos"><button data-v="menos" title="Alejar">−</button><span></span><button data-v="mas" title="Acercar">+</button><button data-v="ajustar">Ajustar</button><button data-v="cerrar">Cerrar</button></div>';
  const img = v.querySelector('img'), pct = v.querySelector('span');
  let k = 1, x = 0, y = 0;
  const pon = () => { img.style.transform = `translate(${x}px,${y}px) scale(${k})`; pct.textContent = Math.round(k * 100) + '%'; };
  const zoom = (f, cx = innerWidth / 2, cy = innerHeight / 2) => {
    const nk = Math.max(1, Math.min(12, k * f)), r = nk / k, ox = cx - innerWidth / 2, oy = cy - innerHeight / 2;
    x = ox - (ox - x) * r; y = oy - (oy - y) * r; k = nk;
    if (k === 1) { x = 0; y = 0; }
    pon();
  };
  const cerrar = () => { v.hidden = true; v.innerHTML = ''; removeEventListener('keydown', tecla); };
  const tecla = (e) => { if (e.key === 'Escape') cerrar(); if (e.key === '+') zoom(1.3); if (e.key === '-') zoom(1 / 1.3); };
  addEventListener('keydown', tecla);
  v.onwheel = (e) => { e.preventDefault(); zoom(e.deltaY > 0 ? 1 / 1.2 : 1.2, e.clientX, e.clientY); };
  const dedos = new Map();
  let sep = 0, movido = 0;
  v.onpointerdown = (e) => { if (e.target.closest('button')) return; v.setPointerCapture(e.pointerId); dedos.set(e.pointerId, [e.clientX, e.clientY]); sep = 0; movido = 0; };
  v.onpointermove = (e) => {
    const antes = dedos.get(e.pointerId);
    if (!antes) return;
    dedos.set(e.pointerId, [e.clientX, e.clientY]);
    if (dedos.size === 2) {
      const [a, b] = [...dedos.values()], s = Math.hypot(a[0] - b[0], a[1] - b[1]);
      if (sep) zoom(s / sep, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
      sep = s; movido = 99;
    } else { const dx = e.clientX - antes[0], dy = e.clientY - antes[1]; movido += Math.abs(dx) + Math.abs(dy); if (k > 1) { x += dx; y += dy; pon(); } }
  };
  v.onpointerup = v.onpointercancel = (e) => { const era = dedos.delete(e.pointerId); sep = 0; if (era && movido < 5 && e.target === v) cerrar(); };
  v.ondblclick = (e) => { if (e.target.closest('button')) return; if (k > 1) { k = 1; x = y = 0; pon(); } else zoom(3, e.clientX, e.clientY); };
  v.querySelector('.visor-mandos').onclick = (e) => {
    const a = e.target.dataset.v;
    if (a === 'mas') zoom(1.4); else if (a === 'menos') zoom(1 / 1.4); else if (a === 'ajustar') { k = 1; x = y = 0; pon(); } else if (a === 'cerrar') cerrar();
  };
  img.src = src; v.hidden = false; pon();
}
