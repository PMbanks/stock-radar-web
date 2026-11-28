// Precios de opciones de cada empresa: movimiento que espera el mercado, tabla de puts y calls y simulador.
// Los ficheros data/o/<empresa>.json los prepara el vigilante. Usa piezas de app.js y opciones.js (se llaman al pintar).
'use strict';

// fila: [ejercicio, cCompra, cVenta, cUltimo, pCompra, pVenta, pUltimo, cAbiertos, pAbiertos]
const cadenas = new Map();
function pideCadena(t) {
  const tramo = Math.floor(Date.now() / 6e5), ya = cadenas.get(t);
  if (ya && ya.tramo === tramo) return ya.datos;
  cadenas.set(t, { tramo, datos: ya?.datos });
  const llega = window.__CADENAS__ ? Promise.resolve(window.__CADENAS__[t] || null) : fetch(`data/o/${encodeURIComponent(t)}.json?${tramo}`).then((r) => (r.ok ? r.json() : null));
  llega.catch(() => null).then((datos) => {
    cadenas.set(t, { tramo, datos });
    llegoCadena(t);
  });
  return ya?.datos;
}
function llegoCadena(t) {
  if (altaOpcion?.t === t && $('#op-guarda')) altaOpcion.f();
  if (ruta.v === 'accion' && ruta.t === t) rellenaMercadoOpciones();
  else if (ruta.v === 'comparar') pintarDatosComparados();
  else if (['cartera', 'perfil'].includes(ruta.v) && $('#modal').hidden) pintar();
  else if (ruta.v === 'chat') pintarMensajes();
}
const medio = (compra, venta, ultimo) => (compra > 0 && venta > 0 ? (compra + venta) / 2 : ultimo > 0 ? ultimo : null);
// precios de contratos, siempre con dos decimales
const dos = (v) => (Number.isFinite(+v) && v !== null && v !== '' ? (+v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—');
const primaCall = (f) => (f ? medio(f[1], f[2], f[3]) : null);
const primaPut = (f) => (f ? medio(f[4], f[5], f[6]) : null);
function primaDeMercado(cadena, o) {
  const f = cadena?.v?.[String(o.vence).slice(0, 10)]?.find((x) => Math.abs(x[0] - +o.strike) < 0.001);
  return o.tipo === 'call' ? primaCall(f) : primaPut(f);
}
const ordenadas = new WeakMap();
function vencimientosDe(cad) {
  if (!cad?.v) return [];
  const hoy = hoyNY(), ya = ordenadas.get(cad);
  if (ya?.hoy === hoy) return ya.l;
  const l = Object.keys(cad.v).filter((v) => v >= hoy && cad.v[v].length > 1).sort();
  ordenadas.set(cad, { hoy, l });
  return l;
}

// movimiento que se esta pagando hasta un vencimiento: una call mas una put al precio de ahora
function esperado(cad, vence) {
  const filas = cad?.v?.[vence], S = cad?.precio;
  if (!filas || !S) return null;
  const con = filas.map((f) => ({ k: f[0], c: primaCall(f), p: primaPut(f) })).filter((x) => x.c != null && x.p != null);
  if (con.length < 2) return null;
  const arriba = con.findIndex((x) => x.k >= S);
  const a = con[Math.max(0, arriba < 0 ? con.length - 1 : arriba - 1)], b = con[arriba < 0 ? con.length - 1 : arriba];
  const peso = b.k === a.k ? 0 : Math.max(0, Math.min(1, (S - a.k) / (b.k - a.k)));
  const valor = (a.c + a.p) * (1 - peso) + (b.c + b.p) * peso;
  return { vence, dias: diasHasta(vence), valor, pct: (valor / S) * 100, S };
}
const vencimientoCerca = (cad, dias) => vencimientosDe(cad).filter((v) => diasHasta(v) >= 1).sort((a, b) => Math.abs(diasHasta(a) - dias) - Math.abs(diasHasta(b) - dias))[0] || null;
// cuantas puts abiertas hay por cada call, en un vencimiento
function putsPorCall(cad, vence) {
  const f = cad?.v?.[vence] || [], c = f.reduce((a, x) => a + (x[7] || 0), 0), p = f.reduce((a, x) => a + (x[8] || 0), 0);
  return c > 0 ? p / c : null;
}
function proximosResultados(t) {
  const ev = (P().resultados || []).find((r) => r.t === t), f = fichaDe(t);
  const ts = ev?.ts || (f.resultados ? f.resultados * 1000 : null);
  if (!ts) return null;
  const dia = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(ts);
  return diasHasta(dia) >= 0 ? { dia, dias: diasHasta(dia), cuando: ev?.cuando || '' } : null;
}

// ---------- cuentas de una opcion (Black-Scholes, interes fijo del 4 %) ----------
function normal(x) {
  const t = 1 / (1 + 0.2316419 * Math.abs(x)), d = 0.3989423 * Math.exp((-x * x) / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return x > 0 ? 1 - p : p;
}
function valorOpcion(call, S, K, T, v, r = 0.04) {
  if (!(T > 0) || !(v > 0)) return Math.max(0, call ? S - K : K - S);
  const d1 = (Math.log(S / K) + (r + (v * v) / 2) * T) / (v * Math.sqrt(T)), d2 = d1 - v * Math.sqrt(T);
  return call ? S * normal(d1) - K * Math.exp(-r * T) * normal(d2) : K * Math.exp(-r * T) * normal(-d2) - S * normal(-d1);
}
// los "nervios" que hacen que la cuenta de el precio al que se esta pagando
function nerviosDe(call, S, K, T, precio) {
  if (!(precio > 0) || precio <= Math.max(0, call ? S - K : K - S) + 0.005) return null;
  let a = 0.01, b = 6;
  if (valorOpcion(call, S, K, T, b) < precio) return null;
  for (let i = 0; i < 48; i++) { const m = (a + b) / 2; if (valorOpcion(call, S, K, T, m) > precio) b = m; else a = m; }
  return (a + b) / 2;
}
const anios = (dias) => (Math.max(0, dias) + 0.4) / 365;

// ---------- 1. lo que espera el mercado ----------
function cono(cad, resultados) {
  const quiero = [2, 7, 14, 30, 60, 90, 180, 365];
  const l = [...new Set(quiero.map((d) => vencimientoCerca(cad, d)).filter(Boolean))].map((v) => esperado(cad, v)).filter(Boolean).sort((a, b) => a.dias - b.dias);
  if (l.length < 3) return '';
  const S = cad.precio, W = 900, H = 306, ML = 8, MR = 8, MT = 34, MB = 62;
  const maxD = l.at(-1).dias, maxP = Math.max(...l.map((x) => x.pct)) * 1.12;
  const X = (d) => ML + Math.sqrt(d / maxD) * (W - ML - MR - 70) + 8, Y = (p) => MT + ((maxP - p) / (2 * maxP)) * (H - MT - MB);
  const arriba = [[0, 0], ...l.map((x) => [x.dias, x.pct])], abajo = [...l].reverse().map((x) => [x.dias, -x.pct]);
  const ruta2 = [...arriba, ...abajo].map(([d, p], i) => `${i ? 'L' : 'M'}${X(d).toFixed(1)} ${Y(p).toFixed(1)}`).join(' ') + 'Z';
  const marca = resultados && resultados.dias <= maxD ? `<line x1="${X(resultados.dias)}" x2="${X(resultados.dias)}" y1="${MT - 6}" y2="${H - MB}" class="co-res"/><text x="${X(resultados.dias)}" y="${H - 5}" class="co-rt" text-anchor="middle">Resultados</text>` : '';
  let ultimo = -99;
  return `<div class="cono-caja"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Rango que espera el mercado"><path d="${ruta2}" class="co-zona"/><line x1="${ML}" x2="${W - MR}" y1="${Y(0)}" y2="${Y(0)}" class="co-cero"/>
    <text x="${W - MR}" y="${Y(0) - 7}" class="co-ahora" text-anchor="end">${usd(S)}</text>${marca}
    ${l.map((x) => { const px = X(x.dias), sitio = px - ultimo > 74; if (sitio) ultimo = px; return `<circle cx="${px}" cy="${Y(x.pct)}" r="4" class="co-up"/><circle cx="${px}" cy="${Y(-x.pct)}" r="4" class="co-dn"/>${sitio ? `<text x="${px}" y="${Y(x.pct) - 11}" class="co-up" text-anchor="middle">${usd(S * (1 + x.pct / 100))}</text><text x="${px}" y="${Y(-x.pct) + 20}" class="co-dn" text-anchor="middle">${usd(S * Math.max(0, 1 - x.pct / 100))}</text><text x="${px}" y="${H - 23}" class="co-f" text-anchor="middle">${esc(new Date(x.vence + 'T12:00:00').toLocaleDateString(LOC, { day: 'numeric', month: 'short', ...(x.dias > 300 ? { year: '2-digit' } : {}) }))}</text>` : ''}`; }).join('')}</svg></div>
    <div class="esp-chips">${l.map((x) => `<span><small>${x.dias <= 1 ? 'Mañana' : `En ${x.dias} días`}</small><b class="num">±${x.pct.toFixed(1)}%</b></span>`).join('')}</div>`;
}
function seccionEsperado(t) {
  const cad = pideCadena(t);
  if (cad === undefined) return `<section>${sec('pulso', 'Lo que espera el mercado')}<p class="dim centro">Cargando precios de opciones…</p></section>`;
  if (!cad || !vencimientosDe(cad).length) return `<section>${sec('pulso', 'Lo que espera el mercado')}${vacio('pulso', 'Los precios de opciones salen para las empresas que vigiláis. Añádela a favoritas y aparecen en la siguiente actualización.', favoritas(mio.yo).includes(t) ? '' : `<button class="btn pri" data-fav="${esc(t)}">Añadir a favoritas</button>`)}</section>`;
  const res = proximosResultados(t), cerca = res && res.dias <= 21;
  const vence = cerca ? vencimientosDe(cad).find((v) => (res.cuando === 'antes' ? v >= res.dia : v > res.dia)) : vencimientoCerca(cad, 30);
  const e = vence ? esperado(cad, vence) : null;
  if (!e) return '';
  const historia = pideVelas(t)?.res || [], media = historia.length ? historia.reduce((a, x) => a + Math.abs(x.mov), 0) / historia.length : null;
  const razon = media ? e.pct / media : null;
  const veredicto = !cerca || razon == null ? '' : razon > 1.15 ? '<span class="chip gold">Se paga más movimiento del que suele hacer</span>' : razon < 0.85 ? '<span class="chip up">Se paga menos movimiento del que suele hacer</span>' : '<span class="chip dim">Se paga lo que suele moverse</span>';
  const mayor = Math.max(e.pct, ...historia.map((x) => Math.abs(x.mov)), 1);
  const barras = cerca && historia.length ? `<div class="esp-barras">${[...historia].reverse().map((x) => `<div><b class="num ${cls(x.mov)}">${sg(x.mov, 1)}</b><u><i class="${x.mov >= 0 ? 'mas' : 'menos'}" style="--h:${(Math.abs(x.mov) / mayor) * 100}%"></i></u><small>${esc(new Date(x.f + 'T12:00:00').toLocaleDateString(LOC, { month: 'short', year: '2-digit' }))}</small></div>`).join('')}<div class="ahora"><b class="num gold">±${e.pct.toFixed(1)}%</b><u><i style="--h:${(e.pct / mayor) * 100}%"></i></u><small>Esperado</small></div></div>` : '';
  const fecha = (d) => new Date(d + 'T12:00:00').toLocaleDateString(LOC, { day: 'numeric', month: 'long' });
  return `<section>${sec('pulso', 'Lo que espera el mercado')}<div class="esp">
    <div class="esp-cabeza"><div class="esp-grande"><span>${cerca ? `Para sus resultados del ${fecha(res.dia)}` : `De aquí al ${fecha(e.vence)}`}</span><strong class="num">±${e.pct.toFixed(1)}%</strong><small class="num">entre <b class="dn">${usd(e.S * Math.max(0, 1 - e.pct / 100))}</b> y <b class="up">${usd(e.S * (1 + e.pct / 100))}</b></small>${veredicto}${cerca && media ? `<small>De media se movió <b class="num">±${media.toFixed(1)}%</b> en sus últimos ${historia.length} resultados</small>` : ''}</div>${barras}</div>
    ${cono(cad, res)}
    <p class="nota-c">Sale del precio de una call y una put al precio de ahora: es lo que se está pagando, no una predicción.${cerca ? ' Incluye todo lo que pueda pasar hasta ese vencimiento.' : res ? ` Resultados el ${fecha(res.dia)}: la comparación con su historia sale cuando falten 3 semanas.` : ''}</p></div></section>`;
}

// ---------- 2. tabla de puts y calls ----------
const tabla = { t: null, vence: null, todas: false };
function seccionCadena(t) {
  const cad = pideCadena(t), l = vencimientosDe(cad);
  if (!l.length) return '';
  if (tabla.t !== t) { tabla.t = t; tabla.vence = null; tabla.todas = false; }
  if (!l.includes(tabla.vence)) tabla.vence = vencimientoCerca(cad, 30) || l[0];
  const S = cad.precio, filas = cad.v[tabla.vence];
  let centro = filas.findIndex((f) => f[0] >= S);
  if (centro < 0) centro = filas.length - 1;
  const ini = tabla.todas ? 0 : Math.max(0, centro - 7), vis = filas.slice(ini, tabla.todas ? filas.length : centro + 7);
  const maxA = Math.max(1, ...vis.flatMap((f) => [f[7] || 0, f[8] || 0]));
  const corta = (v) => new Date(v + 'T12:00:00').toLocaleDateString(LOC, { day: 'numeric', month: 'short', ...(v.slice(0, 4) !== hoyNY().slice(0, 4) ? { year: '2-digit' } : {}) });
  const primeros = [...new Set([...l.slice(0, 7), tabla.vence])].sort();
  const razon = putsPorCall(cad, tabla.vence);
  const celda = (f, tipo) => { const v = tipo === 'call' ? primaCall(f) : primaPut(f), a = tipo === 'call' ? f[7] : f[8], dentro = tipo === 'call' ? f[0] < S : f[0] > S;
    return `<button class="cd-precio ${tipo} ${dentro ? 'dentro' : ''}" data-contrato="${tipo}|${f[0]}" ${v == null ? 'disabled' : ''}><i style="--w:${(((a || 0) / maxA) * 100).toFixed(0)}%"></i><b class="num">${dos(v)}</b><small class="num">${a ? a.toLocaleString(LOC) + ' abiertos' : ''}</small></button>`; };
  let puesta = false;
  const raya = () => { puesta = true; return `<div class="cd-ahora"><span class="num">Precio ahora ${usd(S)}</span></div>`; };
  const cuerpo = vis.map((f) => `${!puesta && f[0] >= S ? raya() : ''}<div class="cd-fila">${celda(f, 'call')}<span class="cd-k"><b class="num">${dinero(f[0])}</b><small class="num">${sg(((f[0] - S) / S) * 100, 1)}</small></span>${celda(f, 'put')}</div>`).join('');
  return `<section>${sec('dinero', 'Puts y calls', `<button class="btn peq" data-simula="${esc(t)}">${ico('grafica')} Simulador</button>`)}<div class="cd">
    <div class="cd-fechas">${primeros.map((v) => `<button data-cdvence="${v}" class="${v === tabla.vence ? 'act' : ''}"><b>${esc(corta(v))}</b><small>${diasHasta(v) === 0 ? 'hoy' : `${diasHasta(v)} d`}</small></button>`).join('')}${l.length > primeros.length ? `<select class="campo" id="cd-mas"><option value="">Más fechas…</option>${l.filter((v) => !primeros.includes(v)).map((v) => `<option value="${v}">${esc(corta(v))} · ${diasHasta(v)} d</option>`).join('')}</select>` : ''}</div>
    ${razon != null ? `<p class="cd-razon">Por cada call abierta hay <b class="num">${razon.toFixed(2)}</b> puts en esta fecha</p>` : ''}
    <div class="cd-cab"><span class="up">▲ Calls (ganan si sube)</span><span>Ejercicio</span><span class="dn">▼ Puts (ganan si baja)</span></div>
    <div class="cd-filas">${cuerpo}${puesta ? '' : raya()}</div>
    ${filas.length > 14 ? `<div class="centro"><button class="btn peq" data-cdtodas="1">${tabla.todas ? 'Ver solo los cercanos' : `Ver los ${filas.length} precios`}</button></div>` : ''}
    <p class="nota-c">Toca un precio para apuntarlo, simularlo o calcular. Precio medio entre compra y venta, de Nasdaq y con retraso.</p></div></section>`;
}
function rellenaMercadoOpciones() {
  const e = $('#esperado'), c = $('#cadena');
  if (!e || !c) return;
  e.innerHTML = seccionEsperado(e.dataset.t);
  c.innerHTML = seccionCadena(c.dataset.t);
}
function ventanaContrato(tipo, strike) {
  const t = tabla.t, vence = tabla.vence, cad = pideCadena(t), f = cad?.v?.[vence]?.find((x) => x[0] === strike);
  if (!f) return;
  const call = tipo === 'call', prima = call ? primaCall(f) : primaPut(f), compra = call ? f[1] : f[4], venta = call ? f[2] : f[5], S = cad.precio, dias = diasHasta(vence);
  const empate = call ? strike + prima : strike - prima, v = nerviosDe(call, S, strike, anios(dias), prima);
  let prob = null;
  if (v) { const T = anios(dias), d2 = (Math.log(S / strike) + (0.04 - (v * v) / 2) * T) / (v * Math.sqrt(T)); prob = normal(call ? d2 : -d2) * 100; }
  const dato = (et, val, c = '') => `<div><span>${et}</span><b class="num ${c}">${val}</b></div>`;
  const x = empresa(t);
  const m = abrir(`<div class="elegida">${logo(t, 'xl')}<b>${esc(x.corto)} · ${nombreTipo(tipo)} ${dinero(strike)}</b><span class="dim">Vence el ${esc(fechaOp(vence))} · ${dias} días</span></div>
    <div class="calc-sale">${dato('Precio por acción', dos(prima))}${dato('Un contrato cuesta', '$' + Math.round(prima * 100).toLocaleString('en-US'))}${dato('Empatas si acaba en', usd(empate))}${dato(`Tiene que ${call ? 'subir' : 'bajar'}`, sg(Math.max(0, (call ? (empate - S) : (S - empate)) / S) * 100, 1).replace('+', ''))}${dato('Compra · venta', `${compra > 0 ? dos(compra) : '—'} · ${venta > 0 ? dos(venta) : '—'}`)}${prob != null ? dato('Opciones de acabar en dinero', `~${prob.toFixed(0)}%`) : dato('Abiertos', (call ? f[7] : f[8])?.toLocaleString(LOC) || '—')}</div>
    <button class="btn pri ancho" id="ct-apunta" style="margin-top:16px" ${hayOpciones() ? '' : 'hidden'}>Apuntar que la he comprado</button>
    <button class="btn ancho" id="ct-simula" style="margin-top:8px">Simular qué pasa si…</button>
    <p class="nota-c">Cuentas orientativas con precios con retraso. No es un consejo.</p>`);
  $('#ct-apunta', m).onclick = (e) => { e.stopPropagation(); nuevaOpcion(t, { tipo, strike, vence, prima: +prima.toFixed(2), contratos: 1 }); };
  $('#ct-simula', m).onclick = (e) => { e.stopPropagation(); simulador({ t, tipo, strike, vence, prima: +prima.toFixed(2), contratos: 1 }); };
}

// ---------- 3. simulador "que pasa si" ----------
function simulador(o) {
  const t = o.t, cad = pideCadena(t), x = empresa(t);
  const S = cad?.precio || +x.precio;
  if (!S) return toast('Aún no tengo el precio de esta empresa', true);
  if (!o.strike) {
    // desde el boton de la tabla: la put mas cercana al precio, a un mes
    const vence = tabla.t === t && tabla.vence ? tabla.vence : vencimientoCerca(cad, 30);
    const f = [...(cad?.v?.[vence] || [])].sort((a, b) => Math.abs(a[0] - S) - Math.abs(b[0] - S))[0];
    if (!f) return toast('Aún no tengo precios de opciones de esta empresa', true);
    o = { t, tipo: 'put', strike: f[0], vence, prima: +(primaPut(f) || S * 0.04).toFixed(2), contratos: 1 };
  }
  const call = o.tipo === 'call', K = +o.strike, prima = +o.prima, n = 100 * (+o.contratos || 1), dias = Math.max(0, diasHasta(o.vence));
  const actual = primaDeMercado(cad, o), v0 = nerviosDe(call, S, K, anios(dias), actual ?? prima) || 0.5;
  const lo = Math.max(0.01, S * 0.6), hi = S * 1.4;
  const m = abrir(`<h2>Qué pasa si… · ${esc(x.corto)} ${nombreTipo(o.tipo)} ${dinero(K)}</h2>
    <p class="dim centro">Vence el ${esc(fechaOp(o.vence))} · pagado ${dos(prima)} × ${n}</p>
    <div class="sim-res"><div><span>Valdría</span><b class="num" id="s-vale">—</b></div><div class="gran"><span>Ganarías o perderías</span><strong class="num" id="s-gana">—</strong><small class="num" id="s-pct"></small></div><div><span>Precio de la acción</span><b class="num" id="s-pre">—</b></div></div>
    <div class="sim-graf"><svg viewBox="0 0 600 220" preserveAspectRatio="none"><line id="s-cero" x1="0" x2="600" class="s-cero"/><line id="s-k" y1="0" y2="220" class="s-k"/><path id="s-fin" class="s-fin"/><path id="s-dia" class="s-dia"/><line id="s-x" y1="0" y2="220" class="s-x"/></svg><div class="sim-ley"><span class="dia">Ese día</span><span class="fin">Al vencer</span><span class="k">Ejercicio</span></div></div>
    <label class="sim-r"><span>Si la acción está en <b class="num" id="e-p"></b></span><input type="range" id="r-p" min="${lo}" max="${hi}" step="${(hi - lo) / 400}" value="${S}"></label>
    <label class="sim-r"><span>El día <b id="e-d"></b></span><input type="range" id="r-d" min="0" max="${dias}" step="1" value="0" ${dias ? '' : 'disabled'}></label>
    <label class="sim-r"><span>Nervios del mercado <b class="num" id="e-v"></b></span><input type="range" id="r-v" min="5" max="${Math.max(200, Math.ceil(v0 * 150))}" step="1" value="${Math.round(v0 * 100)}"></label>
    <div class="sim-mapa" id="s-mapa"></div>
    <p class="nota-c">Es una estimación, no un precio seguro. Después de unos resultados los nervios suelen caer de golpe y la opción pierde valor: bájalos para verlo. No es un consejo.</p>`);
  $('.ventana', m).classList.add('ancha');
  const el = (id) => $(id, m), plataS = (v, signo) => (signo && v > 0 ? '+' : v < 0 ? '-' : '') + '$' + Math.abs(v).toLocaleString('en-US', { maximumFractionDigits: 0 });
  const fechaEn = (d) => (d === 0 ? 'hoy' : d >= dias ? 'del vencimiento' : new Date(Date.parse(hoyNY() + 'T12:00:00Z') + d * 864e5).toLocaleDateString(LOC, { day: 'numeric', month: 'short' }));
  const resultado = (precio, d, v) => ((d >= dias ? Math.max(0, call ? precio - K : K - precio) : valorOpcion(call, precio, K, anios(dias - d), v)) - prima) * n;
  let pendiente = 0, vMapa = null;
  const mapa = (v) => {
    const pasos = [20, 10, 5, 0, -5, -10, -20], cuando = [...new Set([0, Math.round(dias * 0.25), Math.round(dias * 0.5), Math.round(dias * 0.75), dias])];
    const celdas = pasos.map((p) => cuando.map((d) => resultado(S * (1 + p / 100), d, v))), tope = Math.max(1, ...celdas.flat().map(Math.abs));
    el('#s-mapa').innerHTML = `<h4>Mapa: precio y día</h4><div class="mapa-r" style="--n:${cuando.length}"><span></span>${cuando.map((d) => `<span>${esc(d === 0 ? 'Hoy' : d >= dias ? 'Vence' : fechaEn(d))}</span>`).join('')}${pasos.map((p, i) => `<span class="num">${usd(S * (1 + p / 100))}<small>${p > 0 ? '+' : ''}${p}%</small></span>${celdas[i].map((r) => `<b class="num ${r >= 0 ? 'mas' : 'menos'}" style="--f:${(12 + (Math.abs(r) / tope) * 55).toFixed(0)}%">${plataS(r, true)}</b>`).join('')}`).join('')}</div>`;
  };
  const calcula = () => {
    pendiente = 0;
    const precio = +el('#r-p').value, d = +el('#r-d').value, v = +el('#r-v').value / 100;
    const gana = resultado(precio, d, v), coste = prima * n;
    el('#s-vale').textContent = plataS(gana + coste);
    el('#s-gana').textContent = plataS(gana, true); el('#s-gana').className = 'num ' + (gana >= 0 ? 'up' : 'dn');
    el('#s-pct').textContent = coste ? sg((gana / coste) * 100, 0) : ''; el('#s-pct').className = 'num ' + (gana >= 0 ? 'up' : 'dn');
    el('#s-pre').textContent = usd(precio);
    el('#e-p').textContent = `${usd(precio)} (${sg(((precio - S) / S) * 100, 1)})`; el('#e-d').textContent = fechaEn(d); el('#e-v').textContent = Math.round(v * 100) + '%';
    const puntos = Array.from({ length: 61 }, (_, i) => lo + ((hi - lo) * i) / 60);
    const dia = puntos.map((p) => resultado(p, d, v)), fin2 = puntos.map((p) => resultado(p, dias, v));
    const mn = Math.min(...dia, ...fin2, 0), mx = Math.max(...dia, ...fin2, 1), aire = (mx - mn) * 0.08;
    const X = (p) => ((p - lo) / (hi - lo)) * 600, Y = (r) => ((mx + aire - r) / (mx - mn + 2 * aire)) * 220;
    const trazo = (l) => l.map((r, i) => `${i ? 'L' : 'M'}${X(puntos[i]).toFixed(1)} ${Y(r).toFixed(1)}`).join('');
    el('#s-dia').setAttribute('d', trazo(dia)); el('#s-fin').setAttribute('d', trazo(fin2));
    el('#s-cero').setAttribute('y1', Y(0)); el('#s-cero').setAttribute('y2', Y(0));
    el('#s-k').setAttribute('x1', X(K)); el('#s-k').setAttribute('x2', X(K));
    el('#s-x').setAttribute('x1', X(precio)); el('#s-x').setAttribute('x2', X(precio));
    if (vMapa !== v) { vMapa = v; mapa(v); }
  };
  m.querySelectorAll('input[type=range]').forEach((i) => { i.oninput = () => { pendiente ||= requestAnimationFrame(calcula); }; });
  calcula();
}

document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-cdvence],[data-cdtodas],[data-contrato],[data-simula]');
  if (!b) return;
  if (b.dataset.cdvence) { tabla.vence = b.dataset.cdvence; $('#cadena').innerHTML = seccionCadena(tabla.t); }
  else if (b.dataset.cdtodas) { tabla.todas = !tabla.todas; $('#cadena').innerHTML = seccionCadena(tabla.t); }
  else if (b.dataset.contrato) { const [tipo, k] = b.dataset.contrato.split('|'); ventanaContrato(tipo, +k); }
  else if (b.dataset.simula) simulador({ t: b.dataset.simula });
});
document.addEventListener('change', (e) => { if (e.target.id === 'cd-mas' && e.target.value) { tabla.vence = e.target.value; $('#cadena').innerHTML = seccionCadena(tabla.t); } });
