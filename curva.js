// La curva de vuestro dinero. Se calcula en el navegador con las carteras (privadas) y el historico de precios:
// nada de importes sale a los ficheros publicos. Canvas: solo se pinta al tocar.
'use strict';
const CU_RANGOS = [['1s', '1S', 7], ['1m', '1M', 31], ['3m', '3M', 92], ['6m', '6M', 183], ['1a', '1A', 366], ['todo', 'Todo', 1e5]];
const CU_VISTAS = [['valor', 'Valor'], ['ganancia', 'Ganancia'], ['pct', 'En %']];
const CU_COMPARA = [['', 'Nada'], ['SPY', 'S&P 500'], ['QQQ', 'Nasdaq'], ['BTC-USD', 'Bitcoin']];
const cuOp = { rango: '6m', vista: 'valor', base: 'real', compara: 'SPY', opciones: true, ...guarda.leer('curva-op', {}) };
let CU = null;

const fechaVela = (t, ts) => (continuo(t) ? new Date(ts).toISOString().slice(0, 10) : fechaNY.format(ts));
// formatear fechas es caro: cada lote y cada historico se calcula una vez
const diasLote = new WeakMap(), preciosBase = new WeakMap();
const diaLote = (c) => { let d = diasLote.get(c); if (!d) { d = String(c.comprada || fechaNY.format(Date.parse(c.creada) || Date.now())).slice(0, 10); diasLote.set(c, d); } return d; };
const ganadoOp = (o) => (+o.prima_fin - +o.prima) * 100 * +o.contratos;
const diaTxt = (d, anio = true) => new Date(d + 'T12:00:00').toLocaleDateString(LOC, { day: 'numeric', month: 'short', ...(anio ? { year: 'numeric' } : {}) });

// el dia en que se vendio un lote (db/radar-11), o null si sigue abierto
const diaVenta = (c) => (c.vendida ? String(c.vendida).slice(0, 10) : null);
// serie completa, dia a dia. base 'real': cada compra cuenta desde su fecha; 'como': como si ya lo tuvierais todo
// lo vendido sale del dinero invertido el dia de la venta y su resultado se queda (vendido), con o sin opciones
function serieDinero(lotes, cerradas, precios, base, compara) {
  if (base === 'como') lotes = lotes.filter((c) => !c.vendida);
  const tickers = [...new Set(lotes.map((c) => c.t))].filter((t) => precios[t]?.size);
  const bolsa = tickers.filter((t) => !continuo(t)), guias = bolsa.length ? bolsa : tickers.length ? tickers : compara && precios[compara] ? [compara] : [];
  const dias = new Set();
  for (const t of guias) for (const d of precios[t].keys()) dias.add(d);
  for (const o of cerradas) dias.add(String(o.cerrada).slice(0, 10));
  for (const c of lotes) if (diaVenta(c)) dias.add(diaVenta(c));
  const hoy = fechaNY.format(Date.now());
  dias.add(hoy);
  let l = [...dias].filter((d) => d <= hoy).sort();
  if (base === 'real') {
    const primero = [...lotes.map(diaLote), ...cerradas.map((o) => String(o.cerrada).slice(0, 10))].sort()[0];
    // una compra en fin de semana entra el siguiente dia con precio
    const desde = l.findIndex((d) => d >= primero);
    l = desde < 0 ? l.slice(-1) : l.slice(desde);
  }
  // ultimo precio conocido de cada una en cada dia
  const ordenadas = Object.fromEntries(tickers.concat(compara && precios[compara] ? [compara] : []).map((t) => [t, [...precios[t]].sort((a, b) => (a[0] < b[0] ? -1 : 1))]));
  const puntero = {}, ultimo = {};
  const precioEn = (t, d) => { const o = ordenadas[t]; let i = puntero[t] || 0; while (i < o.length && o[i][0] <= d) { ultimo[t] = o[i][1]; i++; } puntero[t] = i; return ultimo[t]; };
  const out = [];
  let unidades = null, antes = null, dentro = new Set();
  for (const d of l) {
    const p = Object.fromEntries(tickers.map((t) => [t, precioEn(t, d)]));
    const activos = lotes.filter((c) => p[c.t] != null && (base === 'como' || diaLote(c) <= d) && !(diaVenta(c) && diaVenta(c) <= d));
    let valor = 0, coste = 0, entra = 0, salto = 0, sale = 0, vendido = 0;
    const porT = {};
    for (const c of activos) {
      const v = +c.cantidad * p[c.t], k = +c.cantidad * +c.precio;
      valor += v; coste += k;
      const x = (porT[c.t] ||= { valor: 0, coste: 0, vendido: 0 }); x.valor += v; x.coste += k;
      // sin fecha de compra no se sabe cuando se gano o perdio lo anterior: entra al precio de ese dia
      if (!dentro.has(c.id)) { dentro.add(c.id); if (antes) { entra += c.comprada ? k : v; if (!c.comprada && base === 'real') salto += v - k; } }
    }
    // lo vendido hasta hoy: su resultado se queda y el dinero de la venta sale (como una retirada)
    const ventas = [];
    for (const c of lotes) {
      const fv = diaVenta(c);
      if (!fv || fv > d) continue;
      const g = (+c.precio_venta - +c.precio) * +c.cantidad;
      vendido += g; (porT[c.t] ||= { valor: 0, coste: 0, vendido: 0 }).vendido += g;
      if (fv > (antes?.d || '')) { ventas.push({ t: c.t, v: g }); if (dentro.has(c.id)) sale += +c.cantidad * +c.precio_venta; }
    }
    const opciones = cerradas.filter((o) => String(o.cerrada).slice(0, 10) <= d && (base === 'real' || String(o.cerrada).slice(0, 10) >= l[0])).reduce((a, o) => a + ganadoOp(o), 0);
    const compra = activos.filter((c) => base === 'real' && diaLote(c) > (antes?.d || '') && diaLote(c) <= d);
    // en % sin que las compras nuevas parezcan ganancias ni las ventas perdidas
    const previo = antes ? antes.valor + entra : coste;
    const rend = antes ? (previo > 0 ? (valor + sale - antes.valor - entra) / previo : 0) : base === 'real' && coste > 0 ? valor / coste - 1 : 0;
    const indice = (antes ? antes.indice : 1) * (1 + rend);
    let refValor = null, refPrecio = null;
    if (compara && ordenadas[compara]) {
      refPrecio = precioEn(compara, d) ?? null;
      if (refPrecio) {
        if (unidades == null && (coste > 0)) unidades = coste / refPrecio;
        else if (unidades != null && (entra || sale)) unidades = Math.max(0, unidades + (entra - sale) / refPrecio);
        if (unidades != null) refValor = unidades * refPrecio;
      }
    }
    const punto = { d, valor, coste, entra, sale, salto, opciones, vendido, indice, porT, refValor, refPrecio, precios: p, compras: compra, ventas: base === 'real' ? ventas : [], cierres: cerradas.filter((o) => String(o.cerrada).slice(0, 10) > (antes?.d || (base === 'real' ? '' : d)) && String(o.cerrada).slice(0, 10) <= d) };
    out.push(punto); antes = punto;
  }
  return out.filter((x) => x.coste > 0 || x.opciones !== 0 || x.vendido !== 0 || x.cierres.length);
}
// lo que se ve en un periodo: todo medido desde su primer dia
function periodo(serie, dias, conOpciones) {
  if (!serie.length) return [];
  const limite = new Date(Date.now() - dias * 864e5).toISOString().slice(0, 10);
  let i = serie.findIndex((x) => x.d >= limite);
  i = Math.max(0, (i < 0 ? serie.length : i) - 1);
  const l = serie.slice(i), a = l[0], total = (x) => x.valor - x.coste + (x.vendido || 0) + (conOpciones ? x.opciones : 0);
  let puesto = 0, saltos = 0, unidades = a.refPrecio ? a.valor / a.refPrecio : null;
  return l.map((x, k) => {
    if (k) { const neto = x.entra - (x.sale || 0); puesto += neto; saltos += x.salto; if (unidades != null && neto && x.refPrecio) unidades = Math.max(0, unidades + neto / x.refPrecio); }
    const refV = unidades != null && x.refPrecio ? unidades * x.refPrecio : null;
    return {
      ...x, ganado: total(x), cambio: total(x) - total(a) - saltos, pct: (x.indice / a.indice - 1) * 100,
      refValor: refV, refCambio: refV != null ? refV - a.valor - puesto : null, refPct: x.refPrecio && a.refPrecio ? (x.refPrecio / a.refPrecio - 1) * 100 : null,
    };
  });
}

// la de quien se mira en Cartera (yo, el otro o los dos)
const quienesCurva = () => cqQuienes();
const cerradasCurva = (quienes) => (mio.opciones || []).filter((o) => o.cerrada && quienes.includes(o.por));
// precio de cierre de cada dia por empresa; null mientras llegan los historicos
function preciosCurva(quiero) {
  const datos = quiero.map((t) => pideVelas(t));
  if (datos.some((d) => d === undefined)) return null;
  const precios = {}, sin = [], hoy = fechaNY.format(Date.now());
  quiero.forEach((t, i) => {
    const d = datos[i];
    let base = d && preciosBase.get(d);
    if (d && !base) { base = new Map((d.d || []).map((v) => [fechaVela(t, v[0]), v[1]])); preciosBase.set(d, base); }
    const m = new Map(base || []), ahora = +empresa(t).precio;
    if (ahora) m.set(hoy, ahora);
    if (m.size > 1) precios[t] = m; else sin.push(t);
  });
  return { precios, sin };
}
function pintarCurva() {
  const c = $('#curva');
  if (!c) { CU = null; return; }
  const quien = quienesCurva(), yo = quien.length === 1 && quien[0] === mio.yo;
  const lotes = (mio.cartera || []).filter((x) => quien.includes(x.por));
  const cerradas = cerradasCurva(quien);
  const titulo = sec('grafica', yo ? 'La curva de tu dinero' : quien.length > 1 ? 'La curva de vuestro dinero' : 'La curva de su dinero');
  // sin nada apuntado ya lo dice la lista de arriba
  if (!lotes.length && !cerradas.length) { c.innerHTML = ''; CU = null; return; }
  const quiero = [...new Set([...lotes.map((x) => x.t), ...(cuOp.compara ? [cuOp.compara] : [])])];
  const pr = preciosCurva(quiero);
  if (!pr) { if (!CU) c.innerHTML = `<section>${titulo}<p class="dim centro">Cargando precios…</p></section>`; return; }
  const precios = pr.precios, sin = pr.sin.filter((t) => t !== cuOp.compara);
  let base = cuOp.base, serie = serieDinero(lotes, cerradas, precios, base, cuOp.compara);
  // recien apuntado y sin fechas: la curva real aun no tiene recorrido
  const corta = base === 'real' && serie.length < 3;
  if (corta) { base = 'como'; serie = serieDinero(lotes, cerradas, precios, base, cuOp.compara); }
  const l = periodo(serie, CU_RANGOS.find((r) => r[0] === cuOp.rango)[2], cuOp.opciones);
  // arriba, en el resumen: desde el principio contra el indice elegido
  const vs = $('#cq-vs'), todo = cuOp.compara ? periodo(serie, 1e5, cuOp.opciones).at(-1) : null;
  if (vs && todo && fin(todo.refPct) && serie.length > 2) { const dif = todo.pct - todo.refPct; vs.hidden = false; vs.innerHTML = `<small>${esc(CU_COMPARA.find((x) => x[0] === cuOp.compara)[1])} ${sg(todo.refPct, 1)}</small><b class="num ${cls(dif)}">${dif >= 0 ? 'Por delante' : 'Por detrás'} ${Math.abs(dif).toFixed(1)} pts</b>`; }
  const firma = JSON.stringify([lotes.map((x) => [x.id, x.comprada, x.vendida, x.cantidad]), cerradas.length, cuOp, quien, oculto(), l.length, l.at(-1)?.valor?.toFixed(2)]);
  if (CU && CU.firma === firma && c.firstElementChild?.dataset.curva) return;
  if (l.length < 2) { c.innerHTML = `<section>${titulo}<p class="dim centro">Todavía no hay recorrido suficiente. Mañana se ve la curva.</p></section>`; CU = null; return; }
  CU?.mira?.disconnect();
  const boton = (g, k, n) => `<button data-cu="${g}" data-k="${k}" class="${String(cuOp[g]) === String(k) ? 'act' : ''}">${n}</button>`;
  c.innerHTML = `<section data-curva="1">${titulo}<div class="cu">
    <div class="cu-barra"><div class="seg">${CU_VISTAS.map(([k, n]) => boton('vista', k, n)).join('')}</div><div class="seg">${CU_RANGOS.map(([k, n]) => boton('rango', k, n)).join('')}</div></div>
    <div class="cu-cifra" id="cu-cifra"></div>
    <div class="cu-lienzo"><canvas></canvas></div>
    <div class="cu-ley"><span class="nuestra">${yo ? 'Lo tuyo' : 'Lo vuestro'}</span>${cuOp.vista === 'valor' ? '<span class="inv">Lo invertido</span>' : ''}${cuOp.compara ? `<span class="ref">Mismo dinero en ${CU_COMPARA.find((x) => x[0] === cuOp.compara)[1]}</span>` : ''}${base === 'real' ? '<span class="compra">Compra</span>' : ''}${cuOp.opciones && cerradas.length ? '<span class="opc">Opción cerrada</span>' : ''}${base === 'real' && lotes.some((x) => x.vendida) ? '<span class="vta">Venta</span>' : ''}</div>
    <div class="cu-barra"><div class="seg"><span class="cmp-et">Contar</span>${boton('base', 'real', 'Desde que se compró')}${boton('base', 'como', 'Como si ya lo tuvierais')}</div><div class="seg"><span class="cmp-et">Comparar con</span>${CU_COMPARA.map(([k, n]) => boton('compara', k, n)).join('')}</div>${cerradas.length ? `<div class="seg"><button data-cu="opciones" data-k="${!cuOp.opciones}" class="${cuOp.opciones ? 'act' : ''}">Con opciones cerradas</button></div>` : ''}</div>
    ${corta ? '<p class="cu-aviso">Como no hay fechas de compra anteriores, se enseña cómo habría ido lo que tenéis hoy. Pon la fecha en cada compra (toca su fila en la lista de arriba).</p>' : ''}
    ${!corta && base === 'real' && lotes.some((x) => !x.comprada) ? `<p class="cu-aviso">Las compras sin fecha cuentan desde el día en que se apuntaron. Ponles la fecha (toca su fila en la lista de arriba) y la curva sale completa.</p>` : ''}
    ${sin.length ? `<p class="cu-aviso">Sin histórico todavía de ${sin.map((t) => esc(alias(t))).join(', ')}: aparece en las próximas actualizaciones.</p>` : ''}
    <p class="nota-c">Toca o pasa por la curva para ver un día. Arrastra para medir entre dos días.</p>
    <div id="cu-extra"></div></div></section>`;
  CU = { sinOp: (mio.opciones || []).some((o) => !o.cerrada && quien.includes(o.por) && diasHasta(o.vence) >= 0), l, serie, base, lotes, firma, cruz: null, ancla: null, raf: 0, c: c.querySelector('canvas'), el: c.querySelector('.cu-lienzo'), cifra: '' };
  gestosCurva();
  CU.mira = new ResizeObserver(() => dibujarCurvaPronto()); CU.mira.observe(CU.el);
  detalleCurva();
  dibujarCurvaPronto();
}
const dibujarCurvaPronto = () => { if (CU && !CU.raf) CU.raf = requestAnimationFrame(dibujarCurva); };
function gestosCurva() {
  const c = CU.c;
  const indice = (e) => Math.max(0, Math.min(CU.l.length - 1, Math.round(((e.offsetX - 6) / Math.max(1, c.clientWidth - 84)) * (CU.l.length - 1))));
  let abajo = false;
  c.onpointerdown = (e) => { abajo = true; c.setPointerCapture(e.pointerId); CU.ancla = indice(e); CU.cruz = CU.ancla; dibujarCurvaPronto(); };
  c.onpointermove = (e) => { if (!CU) return; CU.cruz = indice(e); if (!abajo) CU.ancla = null; dibujarCurvaPronto(); };
  c.onpointerup = c.onpointercancel = () => { abajo = false; };
  c.onpointerleave = () => { if (!abajo && CU) { CU.cruz = null; CU.ancla = null; dibujarCurvaPronto(); } };
}
function dibujarCurva() {
  if (!CU) return;
  CU.raf = 0;
  const { c, el, l } = CU, dpr = Math.min(2, devicePixelRatio || 1), W = el.clientWidth, H = el.clientHeight;
  if (!W || !H) return;
  if (c.width !== Math.round(W * dpr) || c.height !== Math.round(H * dpr)) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); }
  const g = c.getContext('2d'), v = cuOp.vista, MR = 78, MB = 24, MT = 12, ML = 6;
  g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
  const mio2 = l.map((x) => (v === 'valor' ? x.valor : v === 'ganancia' ? x.cambio : x.pct));
  const ref = l.map((x) => (!cuOp.compara ? null : v === 'valor' ? x.refValor : v === 'ganancia' ? x.refCambio : x.refPct));
  const puesto = v === 'valor' ? l.map((x) => x.coste) : [];
  const todos = [...mio2, ...ref, ...puesto, ...(v === 'valor' ? [] : [0])].filter(fin);
  let mn = Math.min(...todos), mx = Math.max(...todos);
  const aire = (mx - mn || Math.abs(mx) * 0.05 || 1) * 0.1; mn -= aire; mx += aire;
  const X = (i) => ML + (i / (l.length - 1)) * (W - ML - MR), Y = (n) => MT + ((mx - n) / (mx - mn)) * (H - MT - MB);
  const texto = (n) => (v === 'pct' ? pctTxt(n) : oculto() ? '••••' : (v === 'ganancia' && n > 0 ? '+' : n < 0 ? '-' : '') + corto2(Math.abs(n)));
  g.font = '11px "IBM Plex Mono", monospace'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  const salto = pasoBonito(mx - mn, 5);
  for (let n = Math.ceil(mn / salto) * salto; n < mx; n += salto) { const y = Math.round(Y(n)) + 0.5; g.strokeStyle = 'rgba(233,237,243,.07)'; g.beginPath(); g.moveTo(ML, y); g.lineTo(W - MR, y); g.stroke(); g.fillStyle = '#667283'; g.fillText(texto(n), W - MR + 8, y); }
  if (v !== 'valor') { g.strokeStyle = 'rgba(233,237,243,.35)'; g.beginPath(); g.moveTo(ML, Y(0)); g.lineTo(W - MR, Y(0)); g.stroke(); }
  g.fillStyle = '#667283'; g.textAlign = 'center';
  const cada = Math.max(1, Math.ceil(l.length / Math.max(2, Math.floor((W - MR) / 100))));
  for (let i = Math.floor(cada / 2); i < l.length; i += cada) g.fillText(diaTxt(l[i].d, false), Math.max(26, X(i)), H - 10);
  g.textAlign = 'left';
  const linea = (datos) => { let p = false; g.beginPath(); datos.forEach((n, i) => { if (!fin(n)) return; if (p) g.lineTo(X(i), Y(n)); else g.moveTo(X(i), Y(n)); p = true; }); };
  // zona entre dos dias al arrastrar
  const a = CU.ancla, b = CU.cruz;
  if (a != null && b != null && a !== b) { g.fillStyle = 'rgba(90,169,255,.13)'; g.fillRect(X(Math.min(a, b)), MT, Math.abs(X(b) - X(a)), H - MT - MB); }
  const fin2 = mio2.at(-1), color = v === 'valor' ? '#5aa9ff' : fin2 >= 0 ? '#36c48f' : '#f26670';
  const deg = g.createLinearGradient(0, MT, 0, H - MB); deg.addColorStop(0, color + '55'); deg.addColorStop(1, color + '05');
  linea(mio2); const suelo = v === 'valor' ? H - MB : Y(0); g.lineTo(X(l.length - 1), suelo); g.lineTo(X(0), suelo); g.closePath(); g.fillStyle = deg; g.fill();
  if (puesto.length) { linea(puesto); g.strokeStyle = '#94a0b0'; g.lineWidth = 1.4; g.setLineDash([5, 5]); g.stroke(); g.setLineDash([]); }
  if (cuOp.compara) { linea(ref); g.strokeStyle = '#f0b142'; g.lineWidth = 1.8; g.stroke(); }
  linea(mio2); g.strokeStyle = color; g.lineWidth = 2.6; g.stroke();
  l.forEach((x, i) => {
    if (CU.base === 'real' && x.compras.length) { g.beginPath(); g.arc(X(i), Y(mio2[i]), 4.5, 0, 7); g.fillStyle = '#36c48f'; g.fill(); g.strokeStyle = '#0b0e13'; g.lineWidth = 2; g.stroke(); }
    const cierre = (cuOp.opciones ? x.cierres.reduce((s, o) => s + ganadoOp(o), 0) : 0) + (x.ventas || []).reduce((s, o) => s + o.v, 0);
    if ((cuOp.opciones && x.cierres.length) || x.ventas?.length) { const y = Y(mio2[i]) - 12; g.beginPath(); g.moveTo(X(i), y - 6); g.lineTo(X(i) + 6, y); g.lineTo(X(i), y + 6); g.lineTo(X(i) - 6, y); g.closePath(); g.fillStyle = cierre >= 0 ? '#36c48f' : '#f26670'; g.fill(); }
  });
  if (b != null) {
    g.strokeStyle = 'rgba(233,237,243,.6)'; g.lineWidth = 1; g.setLineDash([4, 4]);
    for (const i of a != null && a !== b ? [a, b] : [b]) { g.beginPath(); g.moveTo(X(i), MT); g.lineTo(X(i), H - MB); g.stroke(); }
    g.setLineDash([]);
    for (const [n, col2] of [[mio2[b], color], [ref[b], '#f0b142']]) { if (!fin(n)) continue; g.beginPath(); g.arc(X(b), Y(n), 5, 0, 7); g.fillStyle = col2; g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 1.5; g.stroke(); }
  }
  cifraCurva();
}
const corto2 = (n) => (n >= 1e6 ? (n / 1e6).toFixed(2) + ' M' : n >= 1e4 ? (n / 1e3).toFixed(1) + ' k' : n.toLocaleString(LOC, { maximumFractionDigits: n < 100 ? 1 : 0 })) + ' $';
// el numero grande de arriba: el periodo entero, el dia que se toca o la distancia entre dos dias
function cifraCurva() {
  const { l, cruz: b, ancla: a } = CU, medir = a != null && b != null && a !== b;
  const ini = medir ? l[Math.min(a, b)] : l[0], x = medir ? l[Math.max(a, b)] : l[b ?? l.length - 1];
  const dif = x.cambio - ini.cambio, pc = ((1 + x.pct / 100) / (1 + ini.pct / 100) - 1) * 100;
  const dRef = x.refPct != null && ini.refPct != null ? ((1 + x.refPct / 100) / (1 + ini.refPct / 100) - 1) * 100 : null;
  const previo = b != null && b > 0 ? l[b - 1] : null;
  const html = `<span>${medir ? `${diaTxt(ini.d)} → ${diaTxt(x.d)}` : b != null ? diaTxt(x.d) : `Desde el ${diaTxt(ini.d)}`}${CU.sinOp ? ` · <em>acciones y cripto</em>` : ""}</span>
    <strong class="num">${medir ? `<b class="${cls(dif)}">${plata(dif, true)}</b>` : plata(x.valor)}</strong>
    <div class="cambios">${medir ? '' : `<span class="chip ${cls(dif)}">En el periodo ${plata(dif, true)}</span>`}<span class="chip ${cls(pc)}">${sg(pc)}</span>
    ${cuOp.compara && dRef != null ? `<span class="chip gold">${CU_COMPARA.find((r) => r[0] === cuOp.compara)[1]} ${sg(dRef)}</span><span class="chip ${cls(pc - dRef)}">${pc >= dRef ? 'Vais por delante' : 'Vais por detrás'} ${Math.abs(pc - dRef).toFixed(1)} puntos</span>` : ''}
    ${!medir ? `<span class="chip dim">Invertido ${plata(x.coste)}</span><span class="chip ${cls(x.ganado)}">Ganancia total ${plata(x.ganado, true)}</span>` : ''}
    ${previo ? `<span class="chip ${cls(x.cambio - previo.cambio)}">Ese día ${plata(x.cambio - previo.cambio, true)}</span>` : ''}</div>
    ${b != null && !medir && (x.compras.length || x.cierres.length || x.ventas?.length) ? `<small>${[...x.compras.map((o) => `Compra de ${esc(alias(o.t))}`), ...x.ventas.map((o) => `Venta de ${esc(alias(o.t))} ${plata(o.v, true)}`), ...x.cierres.map((o) => `${esc(alias(o.t))} ${o.tipo} cerrada ${plata(ganadoOp(o), true)}`)].join(' · ')}</small>` : '<small>&nbsp;</small>'}`;
  if (CU.cifra !== html) { CU.cifra = html; $('#cu-cifra').innerHTML = html; }
}
// debajo: cifras del periodo, quien ha aportado y mes a mes (el reparto tiene su apartado en Cartera)
function detalleCurva() {
  const { l, serie } = CU, e = $('#cu-extra');
  const dias = l.slice(1).map((x, i) => ({ d: x.d, v: x.cambio - l[i].cambio, p: ((1 + x.pct / 100) / (1 + l[i].pct / 100) - 1) * 100 }));
  const mejor = dias.reduce((a, x) => (x.v > a.v ? x : a), dias[0]), peor = dias.reduce((a, x) => (x.v < a.v ? x : a), dias[0]);
  let alto = 1, caida = 0, techo = l[0];
  for (const x of l) { const n = 1 + x.pct / 100; alto = Math.max(alto, n); caida = Math.min(caida, (n / alto - 1) * 100); if (x.valor > techo.valor) techo = x; }
  const verdes = dias.filter((x) => x.v > 0).length, movidos = dias.filter((x) => x.v !== 0).length;
  const dato = (et, val, sub, c = '') => `<div><span>${et}</span><b class="num ${c}">${val}</b><small>${sub}</small></div>`;
  // cuanto ha puesto o quitado cada una en el periodo
  const ini = l[0], fin3 = l.at(-1), neto = (x) => (x ? x.valor - x.coste + (x.vendido || 0) : 0);
  const aporta = [...new Set([...Object.keys(ini.porT), ...Object.keys(fin3.porT)])].map((t) => ({ t, v: neto(fin3.porT[t]) - neto(ini.porT[t]), valor: fin3.porT[t]?.valor || 0 })).filter((x) => Math.abs(x.v) > 0.005 || x.valor);
  if (cuOp.opciones) { const v = fin3.opciones - ini.opciones; if (v) aporta.push({ t: null, v, valor: 0 }); }
  aporta.sort((a, b) => b.v - a.v);
  const mayor = Math.max(1, ...aporta.map((x) => Math.abs(x.v)));
  // mes a mes, con toda la serie
  const meses = new Map();
  serie.forEach((x, i) => { const k = x.d.slice(0, 7), t = (y) => y.valor - y.coste + (y.vendido || 0) + (cuOp.opciones ? y.opciones : 0); const m = meses.get(k) || { ini: i ? t(serie[i - 1]) : 0, fin: 0 }; m.fin = t(x); meses.set(k, m); });
  const lm = [...meses].slice(-12).map(([k, m]) => ({ k, v: m.fin - m.ini })), mm = Math.max(1, ...lm.map((x) => Math.abs(x.v)));
  e.innerHTML = `<div class="cu-datos">${dato('Mejor día', plata(mejor.v, true), `${diaTxt(mejor.d)} · ${sg(mejor.p, 1)}`, cls(mejor.v))}${dato('Peor día', plata(peor.v, true), `${diaTxt(peor.d)} · ${sg(peor.p, 1)}`, cls(peor.v))}${dato('Días en verde', movidos ? `${Math.round((verdes / movidos) * 100)}%` : '—', `${verdes} de ${movidos}`)}${dato('Mayor caída', sg(caida, 1), 'desde un máximo del periodo', 'dn')}${dato('Punto más alto', plata(techo.valor), diaTxt(techo.d))}${dato('Un día normal', plata(dias.reduce((a, x) => a + Math.abs(x.v), 0) / (dias.length || 1)), 'arriba o abajo')}</div>
    <h4>Quién ha puesto y quitado en el periodo</h4><div class="cu-aporta">${aporta.map((x) => `<a ${x.t ? `href="${enlace(x.t)}"` : ''}>${x.t ? logo(x.t, 's') : `<span class="cu-op">${ico('dinero')}</span>`}<b>${x.t ? esc(alias(x.t)) : 'Opciones'}</b><u><i class="${x.v >= 0 ? 'mas' : 'menos'}" style="--w:${((Math.abs(x.v) / mayor) * 100).toFixed(1)}%"></i></u><strong class="num ${cls(x.v)}">${plata(x.v, true)}</strong></a>`).join('')}</div>
    ${lm.length > 1 ? `<h4>Mes a mes</h4><div class="cu-meses">${lm.map((m) => `<div><b class="num ${cls(m.v)}">${oculto() ? '••' : (m.v > 0 ? '+' : m.v < 0 ? '-' : '') + corto2(Math.abs(m.v))}</b><span><i class="${m.v >= 0 ? 'mas' : 'menos'}" style="--h:${((Math.abs(m.v) / mm) * 100).toFixed(0)}%"></i></span><small>${esc(new Date(m.k + '-15').toLocaleDateString(LOC, { month: 'short' }))}</small></div>`).join('')}</div>` : ''}`;
}
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-cu]');
  if (!b) return;
  const g = b.dataset.cu, k = b.dataset.k;
  cuOp[g] = g === 'opciones' ? k === 'true' : k;
  guarda.poner('curva-op', cuOp);
  CU = null;
  const y = scrollY;
  pintarCurva(); scrollTo(0, y);
});
