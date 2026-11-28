// Tus opciones (puts y calls), apuntadas a mano y visibles entre los dos. Usa las piezas de app.js (se llaman al pintar).
'use strict';

// en la nube solo aparece cuando la base ya tiene su tabla (db/radar-8-opciones.sql)
const hayOpciones = () => !!motor && (!motor.nube || Array.isArray(mio.opciones));
// crear el formato de fecha es caro: se hace una vez y la fecha se recuerda unos segundos
const FORMATO_NY = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' });
let hoyGuardado = '', hoyHasta = 0;
const hoyNY = () => { const a = Date.now(); if (a > hoyHasta) { hoyGuardado = FORMATO_NY.format(a); hoyHasta = a + 15000; } return hoyGuardado; };
const diasHasta = (vence) => Math.round((Date.parse(String(vence).slice(0, 10) + 'T00:00:00Z') - Date.parse(hoyNY() + 'T00:00:00Z')) / 864e5);
const fechaOp = (v) => new Date(String(v).slice(0, 10) + 'T12:00:00').toLocaleDateString(LOC, { day: 'numeric', month: 'short', year: 'numeric' });
const nombreTipo = (tipo) => (tipo === 'call' ? 'Call' : 'Put');
// alarmas de opcion y fechas de compra: cuando la base tiene su ultima actualizacion (db/radar-9)
const hayNivel9 = () => !!motor && (!motor.nube || mio.nivel >= 9);

// todas las cuentas de una opcion
function cuentasOp(o) {
  const x = empresa(o.t), precio = +x.precio || null, K = +o.strike, prima = +o.prima, n = +o.contratos * 100, call = o.tipo === 'call';
  const dias = diasHasta(o.vence), cerrada = !!o.cerrada;
  const mercado = !cerrada && dias >= 0 ? primaDeMercado(pideCadena(o.t), o) : null;
  const dentro = precio == null ? null : Math.max(0, call ? precio - K : K - precio);
  const ahora = cerrada ? +o.prima_fin : dias < 0 ? null : mercado ?? dentro;
  const pagado = prima * n, vale = ahora == null ? null : ahora * n, gana = vale == null ? null : vale - pagado;
  return { x, precio, K, call, dias, cerrada, mercado, ahora, pagado, vale, gana, pct: gana == null || !pagado ? null : (gana / pagado) * 100, empate: call ? K + prima : K - prima };
}

// una regla con el ejercicio, el punto de empate y el precio de ahora
function reglaOp(c) {
  if (c.precio == null) return '';
  const puntos = [c.K, c.empate, c.precio], min = Math.min(...puntos), max = Math.max(...puntos);
  const aire = Math.max((max - min) * 0.18, c.precio * 0.025), a = min - aire, b = max + aire;
  const X = (v) => ((v - a) / (b - a)) * 100;
  const gana = c.call ? `left:${X(c.empate)}%;right:0` : `left:0;right:${100 - X(c.empate)}%`;
  const marca = (v, clase, texto) => `<span class="op-marca ${clase}" style="left:${X(v).toFixed(2)}%"><i></i><small>${texto} <b class="num">${usd(v)}</b></small></span>`;
  return `<div class="op-regla"><u style="${gana}"></u>${marca(c.K, 'ejer', 'Ejercicio')}${marca(c.empate, 'empate', 'Empate')}<span class="op-ahora ${(c.call ? c.precio >= c.empate : c.precio <= c.empate) ? 'bien' : ''}" style="left:${X(c.precio).toFixed(2)}%"><small>Ahora <b class="num">${usd(c.precio)}</b></small><i></i></span></div>`;
}
function fraseOp(c) {
  if (c.precio == null) return '';
  const hasta = (v) => (Math.abs(v - c.precio) / c.precio) * 100;
  if (c.call ? c.precio >= c.empate : c.precio <= c.empate) return `<p class="op-frase up">Si venciera hoy, ganarías.</p>`;
  const verbo = c.call ? 'subir' : 'bajar';
  if (c.call ? c.precio > c.K : c.precio < c.K) return `<p class="op-frase gold">Ya está en dinero. Le falta ${verbo} un ${hasta(c.empate).toFixed(1)}% para empatar.</p>`;
  return `<p class="op-frase">Le falta ${verbo} un ${hasta(c.K).toFixed(1)}% para llegar al ejercicio y un ${hasta(c.empate).toFixed(1)}% para empatar.</p>`;
}

// cada opcion se ve como una fila de la lista de Cartera (cartera.js: filaOpCq)

// el formulario de opcion abierto: se rellena solo cuando llega la cadena de esa empresa
let altaOpcion = null;
// los proximos viernes, que es cuando vence la mayoria; si es festivo en la bolsa, vencen el jueves
const VIERNES_FESTIVOS = ['2026-12-25', '2027-01-01', '2027-03-26', '2027-06-18', '2027-12-24'];
function viernes(cuantos) {
  const d = new Date(hoyNY() + 'T12:00:00Z'), out = [];
  for (; out.length < cuantos; d.setUTCDate(d.getUTCDate() + 1)) {
    if (d.getUTCDay() !== 5) continue;
    const f = d.toISOString().slice(0, 10);
    out.push(VIERNES_FESTIVOS.includes(f) ? new Date(d.getTime() - 864e5).toISOString().slice(0, 10) : f);
  }
  return out;
}

function nuevaOpcion(t, pre = {}) {
  if (E?.db && !motor.nube) return pedirClave();
  if (!hayOpciones()) return toast('Las opciones aún no están activadas', true);
  const vale = (x) => /^[A-Z.]{1,6}$/.test(x);
  if (!t || !vale(t)) {
    const populares = [...new Set([...(mio.opciones || []).map((o) => o.t), ...favoritas(mio.yo), ...mias(), 'NVDA', 'TSLA', 'AMD', 'SPY', 'QQQ'])].filter(vale).slice(0, 12);
    const m = abrir(`<span class="paso">Paso 1 de 2</span><h2>¿De qué empresa es la opción?</h2><input class="campo" id="qo" placeholder="Busca por nombre o símbolo" autocomplete="off"><div id="ro" class="resultados-c" hidden></div>
      <div id="pop"><span class="etq">Rápido</span><div class="rapido-c">${populares.map((x) => `<button data-opcionde="${esc(x)}">${logo(x)}<b>${esc(x)}</b></button>`).join('')}</div></div>`);
    const q = $('#qo', m);
    q.addEventListener('input', () => { $('#pop', m).hidden = !!q.value.trim(); });
    conectarBuscador(q, $('#ro', m), 'data-opcionde');
    q.focus();
    return;
  }
  const x = empresa(t), actual = +x.precio || 0;
  let tipo = pre.tipo === 'call' ? 'call' : 'put', primaMia = pre.prima > 0, ejercicioMio = pre.strike > 0;
  const m = abrir(`<span class="paso">Paso 2 de 2</span><div class="elegida">${logo(t, 'xl')}<b>${esc(x.nombre)}</b><span class="num">${esc(x.corto)} · ${usd(actual)} <i class="${cls(x.pct)}">${sg(x.pct)}</i></span></div>
    ${tiposAlta(t, tipo)}<p class="op-explica" id="op-expl">${tipo === 'call' ? 'Call: ganas si sube' : 'Put: ganas si baja'}</p>
    <div class="calc-campos op-campos">
      <label style="grid-column:1/-1">Vence el<input class="campo num" id="op-vence" type="date" min="${hoyNY()}" value="${esc(String(pre.vence || '').slice(0, 10))}"></label>
      <div class="op-fechas" id="op-fechas"></div>
      <label style="grid-column:1/-1">Precio de ejercicio<input class="campo num" id="op-strike" type="number" min="0" step="any" inputmode="decimal" value="${pre.strike > 0 ? pre.strike : actual ? Math.round(actual) : ''}"></label>
      <div class="op-fechas" id="op-ejer"></div>
      <label>Contratos (100 acciones)<input class="campo num" id="op-n" type="number" min="1" step="1" inputmode="numeric" value="${pre.contratos >= 1 ? pre.contratos : 1}"></label>
      <label>Prima por acción<input class="campo num" id="op-prima" type="number" min="0" step="any" inputmode="decimal" value="${pre.prima > 0 ? pre.prima : ''}" placeholder="0.00"></label></div>
    <p class="op-mercado" id="op-mer"></p>
    <div class="vista-previa" id="op-prev"></div>
    <div class="error" id="err"></div><button class="btn pri ancho" id="op-guarda" data-t="${esc(t)}">Guardar opción</button><button class="btn ancho" data-opcion="1" style="margin-top:8px">Elegir otra</button>
    <p class="nota-c">La veis los dos. Es solo un apunte: aquí no se compra ni se vende nada.</p>`);
  const lee = () => ({ t, tipo, strike: +$('#op-strike', m).value, vence: $('#op-vence', m).value, prima: +$('#op-prima', m).value, contratos: Math.floor(+$('#op-n', m).value) });
  const previa = () => {
    const o = lee(), caja = $('#op-prev', m);
    m.querySelectorAll('[data-opfecha]').forEach((b) => b.classList.toggle('act', b.dataset.opfecha === o.vence));
    m.querySelectorAll('[data-opejer]').forEach((b) => b.classList.toggle('act', +b.dataset.opejer === o.strike));
    if (!(o.strike > 0 && o.prima > 0 && o.contratos >= 1)) { caja.innerHTML = '<span class="dim">Escribe el ejercicio y la prima para ver el resumen</span>'; return; }
    caja.innerHTML = `<div><small>Pagas</small><b class="num">${plata(o.prima * 100 * o.contratos)}</b></div><div><small>Empatas en</small><b class="num">${usd(o.tipo === 'call' ? o.strike + o.prima : o.strike - o.prima)}</b></div><div><small>Días</small><b class="num">${o.vence ? Math.max(0, diasHasta(o.vence)) : '—'}</b></div>`;
  };
  // vencimientos y ejercicios de verdad (si ya llego la cadena) y la prima de mercado puesta
  const rellena = () => {
    if (!m.contains($('#op-guarda', m))) return;
    const cad = pideCadena(t), vi = $('#op-vence', m), si = $('#op-strike', m);
    const fechas = (cad?.v ? vencimientosDe(cad) : viernes(6).filter((f) => f >= hoyNY())).slice(0, 6);
    if (!vi.value && fechas.length) vi.value = fechas.find((f) => diasHasta(f) >= 7) || fechas[0];
    $('#op-fechas', m).innerHTML = fechas.map((f) => `<button type="button" data-opfecha="${f}">${esc(new Date(f + 'T12:00:00').toLocaleDateString(LOC, { day: 'numeric', month: 'short' }))}</button>`).join('');
    const ks = (cad?.v?.[vi.value] || []).map((f) => f[0]);
    const cerca = actual && ks.length ? [...ks].sort((a, b) => Math.abs(a - actual) - Math.abs(b - actual)).slice(0, 5).sort((a, b) => a - b) : [];
    if (!ejercicioMio && cerca.length) si.value = cerca.reduce((a, k) => (Math.abs(k - actual) < Math.abs(a - actual) ? k : a), cerca[0]);
    $('#op-ejer', m).innerHTML = cerca.map((k) => `<button type="button" data-opejer="${k}">${Number.isInteger(k) ? k : k.toFixed(2)}</button>`).join('');
    const mer = primaDeMercado(cad, { tipo, strike: +si.value, vence: vi.value });
    if (mer != null && !primaMia) $('#op-prima', m).value = Math.round(mer * 100) / 100;
    $('#op-mer', m).innerHTML = mer != null ? `Precio de mercado ahora: <b class="num">${dos(mer)}</b>` : '';
    m.querySelectorAll('[data-opfecha]').forEach((b) => { b.onclick = (e) => { e.stopPropagation(); vi.value = b.dataset.opfecha; rellena(); }; });
    m.querySelectorAll('[data-opejer]').forEach((b) => { b.onclick = (e) => { e.stopPropagation(); si.value = b.dataset.opejer; ejercicioMio = true; rellena(); }; });
    previa();
  };
  altaOpcion = { t, f: rellena };
  m.querySelectorAll('[data-altatipo]').forEach((b) => { b.onclick = (e) => {
    e.stopPropagation();
    if (b.dataset.altatipo === 'acc') return nuevaPosicion(t);
    tipo = b.dataset.altatipo;
    m.querySelectorAll('[data-altatipo]').forEach((y) => y.classList.toggle('act', y === b));
    $('#op-expl', m).textContent = tipo === 'call' ? 'Call: ganas si sube' : 'Put: ganas si baja';
    rellena();
  }; });
  $('#op-vence', m).onchange = () => rellena();
  $('#op-strike', m).oninput = () => { ejercicioMio = true; rellena(); };
  $('#op-prima', m).oninput = () => { primaMia = true; previa(); };
  $('#op-n', m).oninput = previa;
  $('#op-guarda', m).onclick = async (e) => {
    e.stopPropagation();
    const o = lee(), error = $('#err', m);
    if (!(o.strike > 0)) { error.textContent = 'Falta el precio de ejercicio.'; return; }
    if (!o.vence || diasHasta(o.vence) < 0) { error.textContent = 'Elige una fecha de vencimiento de hoy en adelante.'; return; }
    if (!(o.prima > 0)) { error.textContent = 'Falta la prima que pagaste.'; return; }
    if (!(o.contratos >= 1 && o.contratos <= 10000)) { error.textContent = 'Pon cuántos contratos.'; return; }
    $('#op-guarda', m).disabled = true;
    try { await motor.opcionPoner(o); await refrescarMio(true); cerrar(); if (ruta.v !== 'cartera') location.hash = 'cartera'; else pintar(); toast('Opción guardada: la ves en Cartera'); }
    catch (err) { error.textContent = err.message; $('#op-guarda', m).disabled = false; }
  };
  rellena();
}

function cerrarOpcion(id) {
  const o = (mio.opciones || []).find((y) => +y.id === id);
  if (!o) return;
  const c = cuentasOp(o);
  const m = abrir(`<h2>Cerrar ${esc(c.x.corto)} ${nombreTipo(o.tipo)} ${dinero(c.K)}</h2>
    <label class="etq" for="op-fin">A cuánto la vendiste (prima por acción)</label><input class="campo num" id="op-fin" type="number" min="0" step="any" inputmode="decimal" value="${c.ahora != null ? +c.ahora.toFixed(2) : ''}">
    <div class="vista-previa" id="op-prev"></div><div class="error" id="err"></div>
    <button class="btn pri ancho" id="op-vende">Cerrar a este precio</button><button class="btn ancho" id="op-cero" style="margin-top:8px">Venció sin valor</button>`);
  const previa = () => {
    const v = $('#op-fin', m).value, res = (+v - +o.prima) * 100 * +o.contratos;
    $('#op-prev', m).innerHTML = v === '' ? '<span class="dim">Escribe el precio de venta</span>' : `<div><small>Pagaste</small><b class="num">${plata(c.pagado)}</b></div><div><small>Resultado</small><b class="num ${cls(res)}">${plata(res, true)}</b></div>`;
  };
  const guardar = async (prima) => {
    try { await motor.opcionCerrar(id, prima); await refrescarMio(true); cerrar(); pintar(); toast('Opción cerrada'); }
    catch (err) { $('#err', m).textContent = err.message; }
  };
  $('#op-fin', m).oninput = previa;
  $('#op-vende', m).onclick = (e) => { e.stopPropagation(); const v = $('#op-fin', m).value; if (v === '' || !(+v >= 0)) { $('#err', m).textContent = 'Falta el precio.'; return; } guardar(+v); };
  $('#op-cero', m).onclick = (e) => { e.stopPropagation(); guardar(0); };
  previa();
}

// ---------- avisame si mi opcion gana o pierde ----------
function ventanaAlarmaOp(id) {
  const o = (mio.opciones || []).find((y) => +y.id === id);
  if (!o) return;
  const c = cuentasOp(o), prima = +o.prima, n = 100 * +o.contratos;
  const grupo = (k, titulo, valores, signo, actual) => `<div class="al-op ${k}"><span class="etq">${titulo}</span><div class="al-op-chips">${valores.map((v) => `<button type="button" data-al="${k}" data-v="${v}">${signo}${v}%</button>`).join('')}</div><div class="con-sufijo"><input class="campo num" id="al-${k}" type="number" min="1" step="1" inputmode="numeric" placeholder="Sin aviso" value="${+actual || ''}"><span>%</span></div><p id="al-${k}-t"></p></div>`;
  const m = abrir(`<h2>Alarma · ${esc(c.x.corto)} ${nombreTipo(o.tipo)} ${dinero(c.K)}</h2><p class="dim centro">Pagaste ${dos(prima)} por acción${c.pct != null ? ` · ahora ${sg(c.pct, 0)}` : ''}</p>
    ${grupo('sube', 'Avísame si gana', [25, 50, 100, 200], '+', o.avisa_sube)}${grupo('baja', 'Avísame si pierde', [25, 40, 60, 80], '-', o.avisa_baja)}
    <div class="error" id="err"></div><button class="btn pri ancho" id="al-guarda">Guardar avisos</button><button class="btn ancho" id="al-quita" style="margin-top:8px">Quitar avisos</button>
    <p class="nota-c">Llega a Discord. Se mira cada pocos minutos con el mercado abierto, con precio de Nasdaq con retraso.</p>`);
  const val = (k) => +$('#al-' + k, m).value || null;
  const previa = () => {
    for (const k of ['sube', 'baja']) {
      const v = val(k), precio = v ? prima * (1 + ((k === 'sube' ? v : -v) / 100)) : null;
      $('#al-' + k + '-t', m).innerHTML = precio == null || precio < 0 ? '' : `Cuando el contrato valga <b class="num">${dos(precio)}</b>: ${k === 'sube' ? 'ganarías' : 'perderías'} <b class="num ${k === 'sube' ? 'up' : 'dn'}">${plata(Math.abs(precio - prima) * n)}</b>`;
      m.querySelectorAll(`[data-al="${k}"]`).forEach((b) => b.classList.toggle('act', +b.dataset.v === v));
    }
  };
  m.querySelectorAll('[data-al]').forEach((b) => { b.onclick = (e) => { e.stopPropagation(); const i = $('#al-' + b.dataset.al, m); i.value = +i.value === +b.dataset.v ? '' : b.dataset.v; previa(); }; });
  m.querySelectorAll('input').forEach((i) => { i.oninput = previa; });
  const guardar = async (sube, baja) => {
    try { await motor.opcionAlarmas(id, sube, baja); await refrescarMio(true); cerrar(); pintar(); toast(sube || baja ? 'Alarma de opción guardada' : 'Avisos quitados'); }
    catch (e) { $('#err', m).textContent = e.message; }
  };
  $('#al-guarda', m).onclick = (e) => {
    e.stopPropagation();
    const sube = val('sube'), baja = val('baja');
    if (!sube && !baja) { $('#err', m).textContent = 'Elige al menos un aviso.'; return; }
    if ((sube != null && !(sube > 0)) || (baja != null && !(baja > 0 && baja <= 100))) { $('#err', m).textContent = 'La pérdida va de 1 a 100%.'; return; }
    guardar(sube, baja);
  };
  $('#al-quita', m).onclick = (e) => { e.stopPropagation(); guardar(null, null); };
  previa();
}

// ---------- marcador de opciones: solo las cerradas ----------
function numerosOp(q) {
  const l = (mio.opciones || []).filter((o) => o.por === q && o.cerrada).sort((a, b) => Date.parse(a.cerrada) - Date.parse(b.cerrada));
  if (!l.length) return null;
  const r = l.map((o) => ({ o, v: (+o.prima_fin - +o.prima) * 100 * +o.contratos, pct: ((+o.prima_fin - +o.prima) / +o.prima) * 100 }));
  const suma = (x) => x.reduce((a, y) => a + y.v, 0), gan = r.filter((x) => x.v > 0), per = r.filter((x) => x.v <= 0);
  const clase = (tipo) => { const x = r.filter((y) => y.o.tipo === tipo); return { n: x.length, total: suma(x), acierto: x.length ? (x.filter((y) => y.v > 0).length / x.length) * 100 : null }; };
  let racha = 0;
  for (let i = r.length - 1; i >= 0 && (r[i].v > 0) === (r.at(-1).v > 0); i--) racha++;
  let acumulado = 0;
  const porT = {};
  for (const x of r) porT[x.o.t] = (porT[x.o.t] || 0) + x.v;
  return {
    q, n: r.length, ganadas: gan.length, acierto: (gan.length / r.length) * 100, total: suma(r), mediaG: gan.length ? suma(gan) / gan.length : null, mediaP: per.length ? suma(per) / per.length : null,
    mejor: r.reduce((a, x) => (x.v > a.v ? x : a), r[0]), peor: r.reduce((a, x) => (x.v < a.v ? x : a), r[0]), calls: clase('call'), puts: clase('put'),
    racha, enVerde: r.at(-1).v > 0, curva: [0, ...r.map((x) => (acumulado += x.v))], porT: Object.entries(porT).sort((a, b) => b[1] - a[1]),
  };
}
function tarjetaMarcador(n, lider) {
  const min = Math.min(...n.curva), max = Math.max(...n.curva), alto = max - min || 1;
  const puntos = n.curva.map((v, i) => `${((i / (n.curva.length - 1)) * 300).toFixed(1)},${(66 - ((v - min) / alto) * 60).toFixed(1)}`).join(' ');
  const dato = (et, val, c = '', sub = '') => `<div><span>${et}</span><b class="num ${c}">${val}</b>${sub ? `<small>${sub}</small>` : ''}</div>`;
  const de = (x) => `${esc(alias(x.o.t))} ${nombreTipo(x.o.tipo)} ${sg(x.pct, 0)}`;
  const mayor = Math.max(1, Math.abs(n.calls.total), Math.abs(n.puts.total), ...n.porT.map((x) => Math.abs(x[1])));
  const barra = (nombre, v, sub) => `<div class="mk-barra"><b>${nombre}</b><u><i class="${v >= 0 ? 'mas' : 'menos'}" style="--w:${((Math.abs(v) / mayor) * 100).toFixed(0)}%"></i></u><strong class="num ${cls(v)}">${plata(v, true)}</strong><small>${sub}</small></div>`;
  return `<article class="mk" style="--yo:${colorDe(n.q)}"><header>${avatar(n.q, 's')}<div><b>${esc(apodo(n.q))}</b><small>${n.n} ${n.n === 1 ? 'cerrada' : 'cerradas'}</small></div>${lider ? '<span class="chip gold">Va por delante</span>' : ''}<strong class="num ${cls(n.total)}">${plata(n.total, true)}</strong></header>
    <div class="mk-centro"><span class="mk-aro" style="--p:${n.acierto.toFixed(0)}"><b class="num">${n.acierto.toFixed(0)}%</b><small>ganadas</small></span><div class="mk-datos">${dato('Ganancia media', n.mediaG == null ? '—' : plata(n.mediaG, true), 'up')}${dato('Pérdida media', n.mediaP == null ? '—' : plata(n.mediaP, true), 'dn')}${dato('La mejor', plata(n.mejor.v, true), cls(n.mejor.v), de(n.mejor))}${dato('La peor', plata(n.peor.v, true), cls(n.peor.v), de(n.peor))}${dato('Racha', `${n.racha} ${n.enVerde ? 'ganando' : 'perdiendo'}`, n.enVerde ? 'up' : 'dn')}${dato('Ganadas', `${n.ganadas} de ${n.n}`)}</div></div>
    <svg class="mk-curva" viewBox="0 0 300 72" preserveAspectRatio="none"><polyline points="${puntos}" style="stroke:${col(n.total)}"/></svg>
    <h4>Puts contra calls</h4>${barra('▼ Puts', n.puts.total, n.puts.n ? `${n.puts.acierto.toFixed(0)}% de ${n.puts.n}` : 'ninguna')}${barra('▲ Calls', n.calls.total, n.calls.n ? `${n.calls.acierto.toFixed(0)}% de ${n.calls.n}` : 'ninguna')}
    <h4>Por empresa</h4>${n.porT.slice(0, 5).map(([t, v]) => barra(esc(alias(t)), v, '')).join('')}</article>`;
}
function marcadorOpciones(quienes) {
  if (!hayOpciones()) return '';
  const l = quienes.map(numerosOp).filter(Boolean);
  if (!l.length) return (mio.opciones || []).some((o) => o.por === mio.yo) ? `<section class="mk-seccion">${sec('copa', 'Marcador de opciones')}<p class="dim centro">Cierra tu primera opción y empieza el marcador.</p></section>` : '';
  const top = l.length > 1 ? Math.max(...l.map((n) => n.total)) : null;
  return `<section class="mk-seccion">${sec('copa', 'Marcador de opciones')}<div class="mk-rejilla">${l.map((n) => tarjetaMarcador(n, n.total === top)).join('')}</div></section>`;
}

// ---------- enviar al chat una opcion o una inversion ----------
const TARJETA = /\[\[(?:op:(\d{1,12})|inv:([^:\]\n]{1,20}):([A-Z0-9][A-Z0-9.=-]{0,11}))\]\]/g;
const sinTarjetas = (texto) => String(texto || '').replace(TARJETA, '').trim();
function tarjetaDe(id, quien, t) {
  if (id) {
    const o = (mio.opciones || []).find((y) => +y.id === +id);
    if (!o) return '<span class="tc vacia">Esa opción ya no está apuntada</span>';
    const c = cuentasOp(o);
    return `<a class="tc" href="#cartera">${logo(o.t, 's')}<span><b>${esc(c.x.corto)} ${nombreTipo(o.tipo)} ${dinero(c.K)}</b><small>${c.cerrada ? 'Cerrada' : `Vence el ${esc(fechaOp(o.vence))}`} · de ${esc(apodo(o.por))}</small></span><span class="tc-v"><strong class="num ${cls(c.gana)}">${c.gana == null ? '—' : plata(c.gana, true)}</strong><small class="num ${cls(c.pct)}">${c.pct == null ? '' : sg(c.pct, 0)}</small></span></a>`;
  }
  const p = posiciones((mio.cartera || []).filter((c) => c.por === quien && c.t === t))[0];
  if (!p) return '<span class="tc vacia">Esa inversión ya no está apuntada</span>';
  return `<a class="tc" href="#cartera">${logo(t, 's')}<span><b>${esc(p.x.corto)} en cartera</b><small>de ${esc(apodo(quien))} · compra media ${usd(p.medio)}</small></span><span class="tc-v"><strong class="num ${cls(p.gana)}">${plata(p.gana, true)}</strong><small class="num ${cls(p.pct)}">${sg(p.pct, 1)}</small></span></a>`;
}
const tarjetasChat = (texto) => [...String(texto || '').matchAll(TARJETA)].slice(0, 3).map((x) => tarjetaDe(x[1], x[2], x[3])).join('');
function compartir(ref) {
  if (E?.db && !motor.nube) return pedirClave();
  const [tipo, a, b] = ref.split('|');
  const marca = tipo === 'op' ? `[[op:${a}]]` : `[[inv:${a}:${b}]]`;
  const m = abrir(`<h2>Enviar al chat</h2><div class="tc-vista">${tarjetasChat(marca)}</div><input class="campo" id="tc-texto" maxlength="300" placeholder="Escribe algo (opcional)" autocomplete="off"><div class="error" id="err"></div><button class="btn pri ancho" id="tc-envia" style="margin-top:12px">${ico('chat')} Enviar</button><p class="nota-c">Se ve con las cifras de cada momento.</p>`);
  const envia = async () => {
    $('#tc-envia', m).disabled = true;
    try { await motor.decir(`${$('#tc-texto', m).value.trim()} ${marca}`.trim(), null, null); cerrar(); toast('Enviado al chat'); mirarChat(true); }
    catch (e) { $('#err', m).textContent = e.message; $('#tc-envia', m).disabled = false; }
  };
  $('#tc-envia', m).onclick = (e) => { e.stopPropagation(); envia(); };
  $('#tc-texto', m).onkeydown = (e) => { if (e.key === 'Enter') envia(); };
}
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-simop],[data-alarmaop],[data-compartir]');
  if (!b) return;
  if (b.dataset.simop) { const o = (mio.opciones || []).find((y) => +y.id === +b.dataset.simop); if (o) simulador({ ...o, strike: +o.strike, prima: +o.prima, vence: String(o.vence).slice(0, 10) }); }
  else if (b.dataset.alarmaop) ventanaAlarmaOp(+b.dataset.alarmaop);
  else compartir(b.dataset.compartir);
});
document.addEventListener('change', async (e) => {
  const i = e.target;
  if (!i.dataset?.fechalote) return;
  try { await motor.carteraFecha(+i.dataset.fechalote, i.value || null); i.blur(); await refrescarMio(true); pintar(); toast('Fecha de compra guardada'); }
  catch (err) { toast(err.message, true); }
});
