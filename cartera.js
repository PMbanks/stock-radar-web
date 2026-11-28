// La cartera de un vistazo: cuánto vale, cuánto ganas o pierdes, en qué estás, el reparto, lo cerrado y cara a cara.
// Todo se calcula en el navegador con las carteras (privadas): nada de importes sale a los ficheros públicos.
// Usa piezas de app.js, opciones.js y curva.js: solo se llaman al pintar.
'use strict';

// vender acciones con historial: cuando la base tiene db/radar-11 (en modo prueba, siempre)
const hayVentas = () => !!motor && (!motor.nube || mio.nivel >= 11);
// de quién se ve: yo por defecto, el otro o los dos
function cqQuienes() {
  const g = gente(), q = op.cq || mio.yo;
  if (q === 'todos' && g.length > 1) return g;
  return [g.includes(q) ? q : mio.yo];
}
const TIPOS_CQ = { accion: ['Acciones', '#5aa9ff'], etf: ['Fondos (ETF)', '#5fd0d8'], cripto: ['Cripto', '#f0b142'], futuro: ['Futuros', '#f0a67a'], opcion: ['Opciones', '#c98bdb'], efectivo: ['Efectivo', '#8fa3bd'] };
const tipoCq = (t) => (/-USD$/.test(t) ? 'cripto' : /=F$/.test(t) ? 'futuro' : porT.get(t)?.[10] === 'ETF' ? 'etf' : 'accion');
const sectorCq = (t) => { const k = tipoCq(t); return k === 'accion' ? sectorEs(fichaDe(t).sector || porT.get(t)?.[10]) || 'Otros' : TIPOS_CQ[k][0]; };
const porFechaLote = (a, b) => diaLote(a).localeCompare(diaLote(b)) || a.id - b.id;
const sumaCq = (l, f) => l.reduce((a, x) => a + (f(x) || 0), 0);
const colorCq = (i) => PALETA[Math.min(i, PALETA.length - 1)];
const efectivoDe = (q) => Math.max(0, +detallesDe(q).efectivo || 0);
const ejercicioCq = (k) => (Number.isInteger(+k) ? String(+k) : (+k).toFixed(2));

// las posiciones abiertas, una por persona y empresa
function agrupaCq(lotes) {
  const m = new Map();
  for (const c of lotes) {
    const k = c.por + '|' + c.t, p = m.get(k) || { k, por: c.por, t: c.t, cantidad: 0, coste: 0, lotes: [] };
    p.cantidad += +c.cantidad; p.coste += +c.cantidad * +c.precio; p.lotes.push(c); m.set(k, p);
  }
  return [...m.values()].map((p) => {
    const x = empresa(p.t), precio = +x.precio || p.coste / p.cantidad, valor = p.cantidad * precio, hoy = fin(x.pct) ? valor - valor / (1 + x.pct / 100) : 0;
    return { ...p, x, precio, valor, hoy, gana: valor - p.coste, pct: p.coste ? ((valor - p.coste) / p.coste) * 100 : 0, medio: p.coste / p.cantidad, tipo: tipoCq(p.t) };
  }).sort((a, b) => b.valor - a.valor);
}

// todas las cuentas de una o varias personas
function numerosCq(quienes) {
  const de = (x) => quienes.includes(x.por), filas = (mio.cartera || []).filter(de);
  const pos = agrupaCq(filas.filter((c) => !c.vendida));
  const ventas = filas.filter((c) => c.vendida).map((c) => { const coste = +c.precio * +c.cantidad, gana = (+c.precio_venta - +c.precio) * +c.cantidad; return { tipo: 'acc', c, id: c.id, t: c.t, por: c.por, fecha: String(c.vendida).slice(0, 10), gana, coste, pct: coste ? (gana / coste) * 100 : 0 }; });
  const ops = hayOpciones() ? (mio.opciones || []).filter(de) : [];
  const abiertas = ops.filter((o) => !o.cerrada).map((o) => ({ o, c: cuentasOp(o) })).sort((a, b) => String(a.o.vence).localeCompare(String(b.o.vence)));
  const vivas = abiertas.filter((x) => x.c.vale != null), vencidas = abiertas.filter((x) => x.c.dias < 0);
  const cerradas = ops.filter((o) => o.cerrada).map((o) => ({ o, c: cuentasOp(o) }));
  const T = totales(pos), opVale = sumaCq(vivas, (x) => x.c.vale), opPagado = sumaCq(vivas, (x) => x.c.pagado);
  const realizado = sumaCq(ventas, (v) => v.gana) + sumaCq(cerradas, (x) => x.c.gana);
  const costeCerrado = sumaCq(ventas, (v) => v.coste) + sumaCq(cerradas, (x) => x.c.pagado);
  const valor = T.valor + opVale, invertido = T.coste + opPagado, abierta = valor - invertido, total = abierta + realizado, puesto = invertido + costeCerrado, antes = T.valor - T.hoy;
  const hechas = [...ventas, ...cerradas.map(({ o, c }) => ({ tipo: 'op', o, id: o.id, t: o.t, por: o.por, fecha: String(o.cerrada).slice(0, 10), gana: c.gana, coste: c.pagado, pct: c.pct }))].sort((a, b) => b.fecha.localeCompare(a.fecha) || b.id - a.id);
  return {
    pos, ventas, abiertas, vivas, vencidas, cerradas, hechas, T, opVale, opPagado, realizado, valor, invertido, abierta, total,
    pctTotal: puesto ? (total / puesto) * 100 : null, hoy: T.hoy, pctHoy: antes ? (T.hoy / antes) * 100 : null,
    efectivo: sumaCq(quienes, efectivoDe), hay: pos.length + ops.length + ventas.length > 0,
  };
}

// ---------- dibujos pequeños (SVG quieto: nada se mueve si no tocas) ----------
// linea de los ultimos 30 dias con niveles opcionales (ejercicio de una opcion, por ejemplo)
function lineaCq(t, niveles = []) {
  const d = pideVelas(t)?.d;
  if (!d) return `<span class="cq-chispa" data-chispa="${esc(t)}" data-niv="${esc(niveles.map((n) => n.v).join(','))}"></span>`;
  const vals = d.slice(-30).map((v) => v[1]), ahora = +empresa(t).precio;
  if (ahora && fechaVela(t, d.at(-1)[0]) < fechaNY.format(Date.now())) vals.push(ahora);
  if (vals.length < 2) return '<span class="cq-chispa"></span>';
  const cerca = niveles.filter((n) => n.v > 0 && n.v < Math.max(...vals) * 1.35 && n.v > Math.min(...vals) * 0.65);
  const todos = [...vals, ...cerca.map((n) => n.v)], mn = Math.min(...todos), r = Math.max(...todos) - mn || 1;
  const Y = (v) => (31 - ((v - mn) / r) * 28).toFixed(1), sube = vals.at(-1) >= vals[0], c = sube ? '#36c48f' : '#f26670';
  const p = vals.map((v, i) => `${((i / (vals.length - 1)) * 120).toFixed(1)},${Y(v)}`).join(' ');
  return `<span class="cq-chispa"><svg viewBox="0 0 120 34" preserveAspectRatio="none">${cerca.map((n) => `<line x1="0" x2="120" y1="${Y(n.v)}" y2="${Y(n.v)}" stroke="${n.c}" stroke-dasharray="3 3"/>`).join('')}<polyline points="0,34 ${p} 120,34" fill="${c}" fill-opacity=".12" stroke="none"/><polyline points="${p}" fill="none" stroke="${c}"/></svg></span>`;
}
// las lineas que llegan cuando ya estaba pintado
function rellenaChispasCq() {
  for (const el of document.querySelectorAll('[data-chispa]')) {
    if (!pideVelas(el.dataset.chispa)) continue;
    const niv = el.dataset.niv ? el.dataset.niv.split(',').map((v) => ({ v: +v, c: '#f0b142' })) : [];
    el.outerHTML = lineaCq(el.dataset.chispa, niv);
  }
}

// ---------- lo grande de arriba ----------
function selectorCq() {
  const g = gente();
  if (g.length < 2) return '';
  const q = op.cq || mio.yo, boton = (k, cuerpo) => `<button data-op="cq" data-k="${esc(k)}" class="${q === k ? 'act' : ''}">${cuerpo}</button>`;
  return `<div class="seg cq-quien">${boton(mio.yo, `${avatar(mio.yo, 'xs')}Yo`)}${g.filter((x) => x !== mio.yo).map((x) => boton(x, `${avatar(x, 'xs')}${esc(apodo(x))}`)).join('')}${boton('todos', 'Los dos')}</div>`;
}
function heroCq(N, quienes) {
  const yo = quienes.length === 1 && quienes[0] === mio.yo, varios = quienes.length > 1;
  const titulo = varios ? 'Las dos carteras' : yo ? 'Mi cartera' : 'Cartera de ' + esc(apodo(quienes[0]));
  const pastilla = (et, v, p) => `<span class="cq-pastilla ${cls(v)}"><small>${et}</small><b class="num">${plata(v, true)}</b><i class="num">${sg(p, p != null && Math.abs(p) < 10 ? 2 : 1)}</i></span>`;
  const dato = (et, v, c = '', id = '') => `<span ${id ? `id="${id}" hidden` : ''}><small>${et}</small><b class="num ${c}">${v}</b></span>`;
  const repartoBarra = N.pos.length ? `<div class="cq-barra" title="Reparto">${N.pos.map((p, i) => `<i style="--c:${colorCq(i)};flex:${Math.max(0.012, p.valor / (N.T.valor || 1))}"></i>`).join('')}${N.opVale > 0 ? `<i style="--c:${TIPOS_CQ.opcion[1]};flex:${Math.max(0.012, N.opVale / (N.T.valor || 1))}"></i>` : ''}</div>` : '';
  return `<div class="portada cq-hero">
    ${selectorCq()}
    <div class="cq-cuanto"><span class="cq-etq">${titulo}</span><strong class="num">${plata(N.valor)}</strong></div>
    <div class="cq-pastillas">${pastilla('Hoy', N.hoy, N.pctHoy)}${pastilla('Total', N.total, N.pctTotal)}</div>
    <div class="cq-datos">${dato('Invertido', plata(N.invertido))}${N.vivas.length ? dato('Opciones abiertas', plata(N.vivas.reduce((a, x) => a + x.c.gana, 0), true), cls(N.vivas.reduce((a, x) => a + x.c.gana, 0))) : ''}${N.hechas.length ? dato('Cerrado', plata(N.realizado, true), cls(N.realizado)) : ''}${dato('', '', '', 'cq-vs')}</div>
    ${repartoBarra}
    <div class="cq-acc"><button class="btn pri" data-posicion="1">${ico('mas')} Añadir</button><button class="btn ${oculto() ? 'on' : ''}" data-ocultar="1">${ico('ojo')} ${oculto() ? 'Mostrar cifras' : 'Ocultar cifras'}</button></div>
  </div>`;
}

// ---------- lo que tienes: acciones, cripto y opciones en una lista ----------
function filaPosCq(p, i, total, varios) {
  const yo = p.por === mio.yo, peso = total ? (p.valor / total) * 100 : 0;
  const uds = oculto() ? '••' : (+p.cantidad.toFixed(p.tipo === 'cripto' ? 6 : 4)).toLocaleString(LOC, { maximumFractionDigits: 6 });
  const lotes = [...p.lotes].sort(porFechaLote);
  const lote = (c) => { const g = (p.precio - +c.precio) * +c.cantidad; return `<div class="cq-lote"><span class="num">${c.comprada ? esc(fechaOp(c.comprada)) : `apuntada ${hace(Date.parse(c.creada))}`}</span><span class="num">${oculto() ? '••' : +c.cantidad} × ${usd(c.precio)}</span><b class="num ${cls(g)}">${plata(g, true)}</b>${yo && hayNivel9() ? `<input class="lote-f num" type="date" data-fechalote="${Number(c.id)}" value="${esc(String(c.comprada || '').slice(0, 10))}" max="${hoyNY()}" title="Fecha de compra">` : ''}${yo ? `<button class="borrar" data-quitarpos="${Number(c.id)}" title="Quitar esta compra">${ico('basura')}</button>` : ''}</div>`; };
  return `<details class="cq-fila" data-pos="cq${esc(p.k)}" style="--c:${colorCq(i)};--w:${Math.min(100, Math.max(1.5, peso)).toFixed(1)}%">
    <summary>${logo(p.t)}<span class="cq-nom"><b>${esc(p.x.corto)}${varios ? avatar(p.por, 'xs') : ''}</b><small>${esc(nombreCorto(p.x.nombre))}</small><small class="num">${uds} · ${peso.toFixed(peso < 10 ? 1 : 0)}%</small></span>
      ${lineaCq(p.t)}<span class="cq-hoy num"><b>${usd(p.precio, p.t)}</b><small class="${cls(p.x.pct)}">${sg(p.x.pct)}</small></span>
      <span class="cq-val num"><b>${plata(p.valor)}</b><small class="${cls(p.gana)}">${plata(p.gana, true)}</small><small class="${cls(p.pct)}">${sg(p.pct, 1)}</small></span></summary>
    <div class="cq-det">
      <div class="cq-cifras"><div><span>Compra media</span><b class="num">${usd(p.medio, p.t)}</b></div><div><span>Invertido</span><b class="num">${plata(p.coste)}</b></div><div><span>Hoy</span><b class="num ${cls(p.hoy)}">${plata(p.hoy, true)}</b></div><div><span>Peso</span><b class="num">${peso.toFixed(1)}%</b></div></div>
      <div class="cq-lotes">${lotes.map(lote).join('')}</div>
      <div class="cq-botones">${yo && hayVentas() ? `<button class="btn peq pri" data-vender="${esc(p.t)}">${ico('dinero')} Vender</button>` : ''}${yo ? `<button class="btn peq" data-posicionde="${esc(p.t)}">${ico('mas')} Comprar más</button>` : ''}<button class="btn peq" data-compartir="inv|${esc(p.por)}|${esc(p.t)}">${ico('chat')} Al chat</button><a class="btn peq" href="${enlace(p.t)}">${ico('grafica')} Gráfico y noticias</a></div>
    </div></details>`;
}
function filaOpCq({ o, c }, total, varios) {
  const yo = o.por === mio.yo, vencida = c.dias < 0, peso = total && c.vale ? (c.vale / total) * 100 : 0;
  const plazo = vencida ? 'Vencida' : c.dias === 0 ? 'Vence hoy' : c.dias === 1 ? 'Vence mañana' : `${c.dias} d`;
  return `<details class="cq-fila cq-op ${vencida ? 'vencida' : ''}" data-pos="cqop${Number(o.id)}" style="--c:${TIPOS_CQ.opcion[1]};--w:${Math.min(100, Math.max(1.5, peso)).toFixed(1)}%">
    <summary>${logo(o.t)}<span class="cq-nom"><b>${esc(c.x.corto)} <em class="${o.tipo}">${o.tipo === 'call' ? '▲' : '▼'} ${nombreTipo(o.tipo)} ${ejercicioCq(c.K)}</em>${varios ? avatar(o.por, 'xs') : ''}</b><small class="num">${esc(diaTxt(String(o.vence).slice(0, 10), false))} · <span class="${c.dias <= 7 ? 'gold' : ''}">${plazo}</span></small><small class="num">${oculto() ? '••' : +o.contratos} × 100</small></span>
      ${lineaCq(o.t, [{ v: c.K, c: '#f0b142' }])}<span class="cq-hoy num"><b>${usd(c.precio)}</b><small>Empate ${usd(c.empate)}</small></span>
      <span class="cq-val num">${vencida ? '<b class="gold">Sin apuntar</b><small>Apunta cómo acabó</small>' : `<b>${c.vale == null ? '—' : plata(c.vale)}</b><small class="${cls(c.gana)}">${c.gana == null ? '' : plata(c.gana, true)}</small><small class="${cls(c.pct)}">${c.pct == null ? '' : sg(c.pct, 0)}</small>`}</span></summary>
    <div class="cq-det">${vencida ? '<p class="op-frase gold">Ya venció. Apunta cómo acabó para que cuente.</p>' : reglaOp(c) + fraseOp(c)}
      <div class="cq-cifras"><div><span>Pagaste</span><b class="num">${plata(c.pagado)}</b></div><div><span>${vencida ? 'Resultado' : c.mercado != null ? 'Vale ahora' : 'Si venciera hoy'}</span><b class="num">${vencida ? '—' : c.vale == null ? '—' : plata(c.vale)}</b></div><div><span>Prima</span><b class="num">${dos(o.prima)}${c.ahora != null && !vencida ? ` → ${dos(c.ahora)}` : ''}</b></div><div><span>Plazo</span><b class="${c.dias <= 7 ? 'gold' : ''}">${vencida ? 'Vencida' : c.dias === 0 ? 'Vence hoy' : c.dias === 1 ? 'Vence mañana' : `Quedan ${c.dias} días`}</b></div></div>
      ${+o.avisa_sube || +o.avisa_baja ? `<div class="op-avisos">${ico('campana')}${+o.avisa_sube ? `<span class="chip up">Avisa si gana +${+o.avisa_sube}%</span>` : ''}${+o.avisa_baja ? `<span class="chip dn">Avisa si pierde -${+o.avisa_baja}%</span>` : ''}</div>` : ''}
      <div class="cq-botones">${yo ? `<button class="btn peq pri" data-cierraop="${Number(o.id)}">${vencida ? 'Apuntar cómo acabó' : 'Cerrar'}</button>` : ''}${vencida ? '' : `<button class="btn peq" data-simop="${Number(o.id)}">${ico('grafica')} Simular</button>`}${yo && !vencida && hayNivel9() ? `<button class="btn peq" data-alarmaop="${Number(o.id)}">${ico('campana')} Alarma</button>` : ''}<button class="btn peq" data-compartir="op|${Number(o.id)}">${ico('chat')} Al chat</button>${yo ? `<button class="borrar" data-quitaop="${Number(o.id)}" title="Quitar esta opción">${ico('basura')}</button>` : ''}</div>
    </div></details>`;
}
function listaCq(N, quienes) {
  const varios = quienes.length > 1, yo = quienes.includes(mio.yo);
  const grupos = [['todo', 'Todo', N.pos.length + N.abiertas.length], ...['accion', 'etf', 'cripto', 'futuro'].map((k) => [k, TIPOS_CQ[k][0], N.pos.filter((p) => p.tipo === k).length]), ['opcion', 'Opciones', N.abiertas.length]].filter((g) => g[2] > 0);
  const tipo = grupos.some((g) => g[0] === op.cqtipo) ? op.cqtipo : 'todo';
  if (!N.pos.length && !N.abiertas.length) {
    return `<section class="cq-sec">${sec('dinero', 'Lo que tienes')}<div class="hueco">${ico('dinero')}<p>${yo ? 'Apunta lo que tienes de verdad y verás cuánto vale, cuánto ganas y cómo va cada cosa.' : esc(apodo(quienes[0])) + ' todavía no ha apuntado nada.'}</p>${yo ? `<button class="btn pri" data-posicion="1">${ico('mas')} Añadir</button>` : ''}</div></section>`;
  }
  const base = N.valor || 1, pos = N.pos.map((p, i) => [p, i]).filter(([p]) => tipo === 'todo' || p.tipo === tipo), ops = tipo === 'todo' || tipo === 'opcion' ? N.abiertas : [];
  const filtro = grupos.length > 2 ? `<div class="seg">${grupos.map(([k, n, c]) => `<button data-op="cqtipo" data-k="${k}" class="${tipo === k ? 'act' : ''}">${n} <i class="num">${c}</i></button>`).join('')}</div>` : '';
  return `<section class="cq-sec">${sec('dinero', 'Lo que tienes', filtro)}
    <div class="cq-lista">${pos.map(([p, i]) => filaPosCq(p, i, base, varios)).join('')}${pos.length && ops.length ? '<h4 class="cq-sep">Opciones</h4>' : ''}${ops.map((x) => filaOpCq(x, base, varios)).join('')}</div>
    <p class="nota-c centro">Toca una fila para ver sus compras, venderla o cerrarla. Precios con retraso.</p></section>`;
}

// ---------- reparto: por empresa, sector o tipo ----------
function repartoCq(N, quienes) {
  if (!N.pos.length && !N.vivas.length && !N.efectivo) return '';
  const modo = ['empresas', 'sectores', 'tipo'].includes(op.cqrep) ? op.cqrep : 'empresas';
  let trozos = [];
  if (modo === 'empresas') trozos = N.pos.map((p, i) => [alias(p.t), p.valor, colorCq(i), p.t]);
  else if (modo === 'sectores') { const s = {}; for (const p of N.pos) s[sectorCq(p.t)] = (s[sectorCq(p.t)] || 0) + p.valor; trozos = Object.entries(s).sort((a, b) => b[1] - a[1]).map(([n, v], i) => [n, v, colorCq(i)]); }
  else { const s = {}; for (const p of N.pos) s[p.tipo] = (s[p.tipo] || 0) + p.valor; if (N.opVale > 0) s.opcion = N.opVale; if (N.efectivo > 0) s.efectivo = N.efectivo; trozos = Object.entries(s).sort((a, b) => b[1] - a[1]).map(([k, v]) => [TIPOS_CQ[k][0], v, TIPOS_CQ[k][1]]); }
  if (modo !== 'tipo' && N.opVale > 0) trozos.push(['Opciones', N.opVale, TIPOS_CQ.opcion[1]]);
  // lo pequeño se junta para que se lea
  if (trozos.length > 8) { const resto = trozos.slice(7); trozos = [...trozos.slice(0, 7), ['Otras', sumaCq(resto, (x) => x[1]), '#6b7788']]; }
  const total = sumaCq(trozos, (x) => x[1]) || 1;
  const centro = `<strong class="num">${trozos.length}</strong><small>${modo === 'empresas' ? 'activos' : modo === 'sectores' ? 'sectores' : 'tipos'}</small>`;
  const yo = quienes.length === 1 && quienes[0] === mio.yo;
  return `<section class="cq-sec">${sec('sector', 'Reparto', `<div class="seg">${[['empresas', 'Empresas'], ['sectores', 'Sectores'], ['tipo', 'Tipo']].map(([k, n]) => `<button data-op="cqrep" data-k="${k}" class="${modo === k ? 'act' : ''}">${n}</button>`).join('')}</div>`)}
    <div class="cq-reparto">${donut(trozos.map(([, v, c]) => [v, c]), centro)}
      <div class="cq-ley">${trozos.map(([n, v, c, t]) => `<div style="--c:${c}">${t ? logo(t, 'xs') : '<i></i>'}<span>${esc(n)}</span><b class="num">${((v / total) * 100).toFixed(v / total < 0.1 ? 1 : 0)}%</b><small class="num">${plata(v)}</small><u style="--w:${((v / total) * 100).toFixed(1)}%"></u></div>`).join('')}</div></div>
    ${modo === 'tipo' && yo && hayDetalles() ? `<div class="cq-efectivo"><button class="btn peq" data-efectivo="1">${ico('dinero')} ${N.efectivo ? 'Efectivo ' + plata(N.efectivo) : 'Añadir efectivo'}</button><small class="dim">El dinero sin invertir. Solo cuenta en el reparto.</small></div>` : ''}</section>`;
}
function ponerEfectivo() {
  if (E?.db && !motor.nube) return pedirClave();
  const ahora = efectivoDe(mio.yo);
  const m = abrir(`<h2>Efectivo</h2><p class="dim centro" style="margin:6px 0 4px">El dinero que tienes sin invertir. Sale en el reparto por tipo.</p>
    <div class="con-sufijo"><input class="campo num" id="ef" type="number" step="any" min="0" inputmode="decimal" value="${ahora || ''}" placeholder="0"><span>$</span></div>
    <div class="error" id="err"></div><button class="btn pri ancho" id="ef-g" style="margin-top:14px">Guardar</button>`);
  const i = $('#ef', m);
  i.focus();
  $('#ef-g', m).onclick = async (e) => {
    e.stopPropagation();
    const v = +i.value;
    if (!(v >= 0) || v > 1e10) { $('#err', m).textContent = 'Pon una cantidad.'; return; }
    try { await guardarPerfil({ detalles: { ...detallesDe(mio.yo), efectivo: v ? Math.round(v * 100) / 100 : undefined } }); cerrar(); pintar(); toast('Efectivo guardado'); }
    catch (err) { $('#err', m).textContent = err.message; }
  };
}

// ---------- historial: lo vendido y lo cerrado, mes a mes ----------
function historialCq(N, quienes) {
  const l = N.hechas, varios = quienes.length > 1;
  const marcador = marcadorOpciones(quienes);
  if (!l.length) return `<section class="cq-sec">${sec('calendario', 'Historial')}<div class="hueco">${ico('calendario')}<p>Cuando vendas acciones o cierres una opción, aquí ves lo ganado y lo perdido, mes a mes.</p></div></section>${marcador}`;
  const ganadas = l.filter((x) => x.gana > 0), mejor = l.reduce((a, x) => (x.gana > a.gana ? x : a), l[0]), peor = l.reduce((a, x) => (x.gana < a.gana ? x : a), l[0]);
  const nombre = (x) => (x.tipo === 'op' ? `${alias(x.t)} ${nombreTipo(x.o.tipo)} ${dinero(x.o.strike)}` : alias(x.t));
  // meses seguidos, del primero al actual (como mucho 12)
  const meses = new Map(), hoy = fechaNY.format(Date.now()).slice(0, 7);
  for (let k = l.at(-1).fecha.slice(0, 7); k <= hoy; k = new Date(Date.UTC(+k.slice(0, 4), +k.slice(5, 7), 1)).toISOString().slice(0, 7)) meses.set(k, 0);
  for (const x of l) meses.set(x.fecha.slice(0, 7), (meses.get(x.fecha.slice(0, 7)) || 0) + x.gana);
  const lm = [...meses].slice(-12), mm = Math.max(1, ...lm.map(([, v]) => Math.abs(v)));
  const dato = (et, v, sub, c = '') => `<div><span>${et}</span><b class="num ${c}">${v}</b><small>${sub}</small></div>`;
  const fila = (x) => `<div class="cq-hecha">${logo(x.t, 's')}<span><b>${esc(nombre(x))}${varios ? avatar(x.por, 'xs') : ''}</b><small><span>${x.tipo === 'op' ? (+x.o.prima_fin === 0 ? 'Venció sin valor' : 'Opción cerrada') : `Vendidas ${oculto() ? '••' : +x.c.cantidad} a ${usd(x.c.precio_venta, x.t)}`}</span> · ${esc(fechaOp(x.fecha))}</small></span><strong class="num ${cls(x.gana)}">${plata(x.gana, true)}<small>${sg(x.pct, 0)}</small></strong>${x.por === mio.yo ? (x.tipo === 'acc' ? `<button class="borrar" data-devolver="${Number(x.id)}" title="Deshacer la venta">${ico('deshacer')}</button>` : `<button class="borrar" data-quitaop="${Number(x.id)}" title="Quitar esta opción">${ico('basura')}</button>`) : '<i></i>'}</div>`;
  return `<section class="cq-sec">${sec('calendario', 'Historial')}
    <div class="cq-resumen">${dato('Cerrado en total', plata(N.realizado, true), `${l.length} ${l.length === 1 ? 'operación' : 'operaciones'}`, cls(N.realizado))}${dato('Acierto', `${Math.round((ganadas.length / l.length) * 100)}%`, `${ganadas.length} de ${l.length} con ganancia`, ganadas.length * 2 >= l.length ? 'up' : 'dn')}${dato('La mejor', plata(mejor.gana, true), esc(nombre(mejor)), cls(mejor.gana))}${dato('La peor', plata(peor.gana, true), esc(nombre(peor)), cls(peor.gana))}</div>
    ${lm.length > 1 ? `<h4 class="cq-h4">Lo cerrado, mes a mes</h4><div class="cu-meses cq-meses">${lm.map(([k, v]) => `<div><b class="num ${cls(v)}">${v ? (oculto() ? '••' : (v > 0 ? '+' : '-') + corto2(Math.abs(v))) : '·'}</b><span><i class="${v >= 0 ? 'mas' : 'menos'}" style="--h:${v ? ((Math.abs(v) / mm) * 100).toFixed(0) : 0}%"></i></span><small>${esc(new Date(k + '-15').toLocaleDateString(LOC, { month: 'short' }))}</small></div>`).join('')}</div>` : ''}
    <div class="cq-hechas">${l.slice(0, 6).map(fila).join('')}${l.length > 6 ? `<details class="cq-mas" data-pos="cq-hechas"><summary>Ver todo (${l.length})</summary>${l.slice(6).map(fila).join('')}</details>` : ''}</div>
  </section>${marcador}`;
}

// ---------- cara a cara: solo en %, nada de importes ----------
function caraCq() {
  const g = gente();
  if (g.length < 2) return '';
  const a = mio.yo, b = g.find((q) => q !== a), A = numerosCq([a]), B = numerosCq([b]);
  if (!A.hay || !B.hay) return '';
  const mejor = (N) => (N.pos.length ? N.pos.reduce((x, p) => (p.pct > x.pct ? p : x), N.pos[0]) : null);
  const acierto = (N) => (N.hechas.length ? (N.hechas.filter((x) => x.gana > 0).length / N.hechas.length) * 100 : null);
  const verde = (N) => (N.pos.length ? (N.pos.filter((p) => p.gana > 0).length / N.pos.length) * 100 : null);
  const ma = mejor(A), mb = mejor(B);
  const fila = (et, x, y, txt, sub = ['', ''], colorea = true) => {
    if (x == null && y == null) return '';
    const gx = x != null && (y == null || x > y), gy = y != null && (x == null || y > x), lo = Math.min(0, x ?? 0, y ?? 0), w = (v) => (v == null ? 0 : Math.max(4, ((v - lo) / ((Math.max(x ?? lo, y ?? lo) - lo) || 1)) * 100));
    return `<div class="cq-vs"><b class="num ${gx ? 'gana' : ''} ${colorea ? cls(x) : ''}">${x == null ? '—' : txt(x)}<small>${sub[0]}</small></b><div><span>${et}</span><u><i style="--w:${w(x).toFixed(0)}%;--c:${colorDe(a)}"></i><i style="--w:${w(y).toFixed(0)}%;--c:${colorDe(b)}"></i></u></div><b class="num ${gy ? 'gana' : ''} ${colorea ? cls(y) : ''}">${y == null ? '—' : txt(y)}<small>${sub[1]}</small></b></div>`;
  };
  const pc = (v) => sg(v, 1), lleva = (A.pctTotal ?? -1e9) === (B.pctTotal ?? -1e9) ? null : (A.pctTotal ?? -1e9) > (B.pctTotal ?? -1e9) ? a : b;
  return `<section class="cq-sec">${sec('gente', 'Cara a cara')}<div class="cq-cara">
    <div class="pf-rivales cq-rivales"><a href="#perfil/${encodeURIComponent(a)}">${avatar(a, 'm')}<b>${esc(apodo(a))}</b></a><span>VS</span><a href="#perfil/${encodeURIComponent(b)}">${avatar(b, 'm')}<b>${esc(apodo(b))}</b></a></div>
    ${lleva ? `<p class="cq-lider"><b style="color:${colorDe(lleva)}">${esc(apodo(lleva))}</b> va por delante</p>` : ''}
    ${fila('Ganancia total', A.pctTotal, B.pctTotal, pc)}${fila('Hoy', A.pctHoy, B.pctHoy, (v) => sg(v, 2))}${fila('Su mejor inversión', ma?.pct, mb?.pct, pc, [ma ? esc(alias(ma.t)) : '', mb ? esc(alias(mb.t)) : ''])}${fila('Acierto al cerrar', acierto(A), acierto(B), (v) => v.toFixed(0) + '%', undefined, false)}${fila('Inversiones en verde', verde(A), verde(B), (v) => v.toFixed(0) + '%', undefined, false)}
    <div id="cq-cara-graf" data-a="${esc(a)}" data-b="${esc(b)}"></div>
    <p class="nota-c centro">Solo porcentajes, para comparar aunque pongáis cantidades distintas.</p></div></section>`;
}
// la carrera en % desde que los dos tienen algo
function graficoCaraCq() {
  const el = $('#cq-cara-graf');
  if (!el || el.dataset.hecho) return;
  const a = el.dataset.a, b = el.dataset.b;
  const lotes = (q) => (mio.cartera || []).filter((c) => c.por === q), cerradas = (q) => cerradasCurva([q]);
  const tickers = [...new Set([...lotes(a), ...lotes(b)].map((c) => c.t))];
  const precios = preciosCurva([...tickers, 'SPY']);
  if (!precios) return;
  const sa = serieDinero(lotes(a), cerradas(a), precios.precios, 'real', 'SPY'), sb = serieDinero(lotes(b), cerradas(b), precios.precios, 'real', 'SPY');
  if (sa.length < 3 || sb.length < 3) return;
  const desde = sa[0].d > sb[0].d ? sa[0].d : sb[0].d, dias = Math.round((Date.now() - Date.parse(desde + 'T12:00:00Z')) / 864e5) + 1;
  const pa = periodo(sa, dias, true), pb = periodo(sb, dias, true);
  const fechas = [...new Set([...pa, ...pb].map((x) => x.d))].filter((d) => d >= desde).sort();
  if (fechas.length < 3) return;
  const serie = (l, k) => { const m = new Map(l.map((x) => [x.d, x[k]])); let u = 0; return fechas.map((d) => { if (m.has(d) && fin(m.get(d))) u = m.get(d); return u; }); };
  const ya = serie(pa, 'pct'), yb = serie(pb, 'pct'), ys = serie(pa, 'refPct');
  const todos = [...ya, ...yb, ...ys, 0], mn = Math.min(...todos), mx = Math.max(...todos), r = mx - mn || 1;
  const X = (i) => ((i / (fechas.length - 1)) * 600).toFixed(1), Y = (v) => (8 + ((mx - v) / r) * 144).toFixed(1);
  const linea = (l, c, extra = '') => `<polyline points="${l.map((v, i) => `${X(i)},${Y(v)}`).join(' ')}" fill="none" stroke="${c}" ${extra}/>`;
  el.dataset.hecho = '1';
  el.innerHTML = `<h4 class="cq-h4">La carrera, en %</h4><div class="cq-carrera"><svg viewBox="0 0 600 160" preserveAspectRatio="none"><line x1="0" x2="600" y1="${Y(0)}" y2="${Y(0)}" stroke="rgba(233,237,243,.25)" stroke-dasharray="4 4"/>${linea(ys, '#f0b142', 'stroke-dasharray="5 4" stroke-opacity=".8"')}${linea(yb, colorDe(b))}${linea(ya, colorDe(a))}</svg></div>
    <div class="cq-carrera-ley"><span style="--c:${colorDe(a)}">${esc(apodo(a))} <b class="num ${cls(ya.at(-1))}">${sg(ya.at(-1), 1)}</b></span><span style="--c:${colorDe(b)}">${esc(apodo(b))} <b class="num ${cls(yb.at(-1))}">${sg(yb.at(-1), 1)}</b></span><span style="--c:#f0b142">S&P 500 <b class="num ${cls(ys.at(-1))}">${sg(ys.at(-1), 1)}</b></span><small>Desde el ${esc(diaTxt(desde))}</small></div>`;
}

// ---------- vender acciones: precio de ahora puesto, todo de una vez o una parte ----------
function venderPosicion(t) {
  if (E?.db && !motor.nube) return pedirClave();
  const lotes = (mio.cartera || []).filter((c) => c.por === mio.yo && c.t === t && !c.vendida).sort(porFechaLote);
  if (!lotes.length) return;
  const x = empresa(t), actual = +x.precio || 0, tengo = sumaCq(lotes, (c) => +c.cantidad), coste = sumaCq(lotes, (c) => +c.cantidad * +c.precio);
  const m = abrir(`<div class="elegida">${logo(t, 'xl')}<b>${esc(x.nombre)}</b><span class="num">${esc(x.corto)} · ${usd(actual, t)} <i class="${cls(x.pct)}">${sg(x.pct)}</i></span></div>
    <div class="seg ancho-s">${[[0.25, '25%'], [0.5, '50%'], [1, 'Todo']].map(([k, n]) => `<button data-parte="${k}" class="${k === 1 ? 'act' : ''}">${n}</button>`).join('')}</div>
    <label class="etq" for="vq">Cuántas vendes</label><div class="con-sufijo"><input class="campo num" id="vq" type="number" step="any" min="0" inputmode="decimal" value="${+tengo.toFixed(8)}"><span class="num">/ ${+tengo.toFixed(6)}</span></div>
    <label class="etq" for="vp">Precio de venta</label><div class="con-sufijo"><input class="campo num" id="vp" type="number" step="any" min="0" inputmode="decimal" value="${actual ? +actual.toPrecision(7) : ''}"><button type="button" id="vhoy">Precio de hoy</button></div>
    <label class="etq" for="vf">Fecha</label><input class="campo num" id="vf" type="date" max="${hoyNY()}" value="${hoyNY()}">
    <div class="vista-previa" id="vprev"></div><div class="error" id="err"></div>
    <button class="btn pri ancho" id="vende">Vender</button>
    <p class="nota-c">Es solo un apunte: aquí no se vende nada de verdad. Lo vendido pasa a tu historial.</p>`);
  const lee = () => ({ q: Math.min(tengo, +$('#vq', m).value), p: +$('#vp', m).value, f: $('#vf', m).value || hoyNY() });
  const previa = () => {
    const { q, p } = lee();
    m.querySelectorAll('[data-parte]').forEach((b) => b.classList.toggle('act', Math.abs(+b.dataset.parte * tengo - q) < 1e-9));
    if (!(q > 0) || !(p > 0)) { $('#vprev', m).innerHTML = '<span class="dim">Pon cuántas y a qué precio</span>'; $('#vende', m).textContent = 'Vender'; return; }
    const base = (coste / tengo) * q, g = q * p - base;
    $('#vprev', m).innerHTML = `<div><small>Recibes</small><b class="num">${plata(q * p)}</b></div><div><small>Resultado</small><b class="num ${cls(g)}">${plata(g, true)}</b></div><div><small>Sobre lo puesto</small><b class="num ${cls(g)}">${sg((g / base) * 100, 1)}</b></div>`;
    $('#vende', m).textContent = `Vender ${oculto() ? '' : (+q.toFixed(6)).toLocaleString(LOC) + ' '}a ${usd(p, t)}`;
  };
  m.querySelectorAll('[data-parte]').forEach((b) => { b.onclick = (e) => { e.stopPropagation(); $('#vq', m).value = +(tengo * +b.dataset.parte).toFixed(8); previa(); }; });
  $('#vhoy', m).onclick = (e) => { e.stopPropagation(); $('#vp', m).value = +actual.toPrecision(7); previa(); };
  m.querySelectorAll('input').forEach((i) => { i.oninput = previa; });
  $('#vende', m).onclick = async (e) => {
    e.stopPropagation();
    const { q, p, f } = lee();
    if (!(q > 0) || !(p > 0)) { $('#err', m).textContent = 'Falta la cantidad o el precio.'; return; }
    $('#vende', m).disabled = true;
    try {
      // primero lo más antiguo
      let falta = q;
      for (const c of lotes) { if (falta <= 1e-9) break; const parte = Math.min(falta, +c.cantidad); await motor.carteraVender(c.id, +parte.toFixed(8), p, f); falta -= parte; }
      const g = q * p - (coste / tengo) * q;
      await refrescarMio(true); cerrar(); pintar(); toast(`Vendido: ${x.corto} ${plata(g, true)}`);
    } catch (err) { $('#err', m).textContent = err.message; $('#vende', m).disabled = false; }
  };
  previa();
}

// ---------- la pantalla ----------
function vistaCartera() {
  const quienes = cqQuienes(), N = numerosCq(quienes);
  return `${heroCq(N, quienes)}${listaCq(N, quienes)}<div id="curva"></div>${repartoCq(N, quienes)}${historialCq(N, quienes)}${caraCq()}`;
}
// lo que llega despues de pintar: lineas pequeñas y la carrera
function pintarCq() {
  if (ruta.v !== 'cartera' && ruta.v !== 'perfil') return;
  rellenaChispasCq();
  graficoCaraCq();
}
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-vender],[data-efectivo],[data-devolver]');
  if (!b) return;
  if (b.dataset.vender) venderPosicion(b.dataset.vender);
  else if (b.dataset.efectivo) ponerEfectivo();
  else if (b.dataset.devolver) {
    b.disabled = true;
    motor.carteraDevolver(+b.dataset.devolver).then(() => refrescarMio(true)).then(() => { pintar(); toast('Venta deshecha: vuelve a tu cartera'); }).catch((err) => { b.disabled = false; toast(err.message, true); });
  }
});
