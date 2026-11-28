// Análisis: lo que cree cada uno de una empresa, con su plan (entrada, objetivos, stop y hasta cuándo) y cómo va en vivo.
// Son las ideas de siempre (radar_ideas): el plan va dentro del dibujo, así que funciona sin cambiar la base.
// Hasta 3 abiertos por empresa y persona. Neutral y editar: cuando la base tiene db/radar-12 (en modo prueba, siempre).
// No llevan importes: los ven los dos. Usa piezas de app.js, curva.js y cartera.js (solo al pintar).
'use strict';

const hayAnalisis12 = () => !!motor && (!motor.nube || mio.nivel >= 12);
const MAX_AN = 3;
const LADOS_AN = { sube: ['Alcista', '▲', '#36c48f'], baja: ['Bajista', '▼', '#f26670'], neutral: ['Neutral', '◆', '#94a0b0'] };
// colores de las lineas sobre el grafico gris de PM (los de sus dibujos)
const NIVEL_AN = { objetivo: '#0b7d3e', stop: '#c80000', entrada: '#1736d6', rango: '#0b7d3e' };
const planDe = (i) => { const p = i?.dibujo?.plan; return p && typeof p === 'object' && !Array.isArray(p) ? p : {}; };
const ladoAn = (i) => (i.dir === 'baja' ? 'baja' : i.dir === 'neutral' ? 'neutral' : 'sube');
const vivosAn = (q, t) => (mio.ideas || []).filter((i) => i.por === q && i.t === t && !i.cerrada);
// los que siguen en juego (los que ya tocaron objetivo, stop o plazo no cuentan para el tope)
const enJuegoAn = (t) => vivosAn(mio.yo, t).filter((i) => !estadoAn(i).terminado).length;
// sitio para uno nuevo: si hace falta, los terminados pasan solos al historial a su precio de salida
async function hacerSitioAn(t) {
  const l = vivosAn(mio.yo, t);
  if (l.length < MAX_AN) return true;
  const hechos = l.filter((i) => estadoAn(i).terminado);
  if (l.length - hechos.length >= MAX_AN) return false;
  for (const i of hechos.slice(0, l.length - MAX_AN + 1)) { const e = estadoAn(i); await motor.ideaCerrar(i.id, e.salida || e.ahora || +i.precio); }
  return true;
}
const pctAn = (a, b) => (a > 0 && b > 0 ? ((a - b) / b) * 100 : null);
const precioAn = (v) => (v >= 1000 ? Math.round(v) : v >= 10 ? +v.toFixed(2) : +v.toPrecision(4));
// precio corto para las cajas de niveles: $143 o $152.5
const usdAn = (v) => '$' + (v >= 1000 ? Math.round(v).toLocaleString('en-US') : +(+v).toFixed(v >= 10 ? 2 : 3));
function aqQuienes() {
  const g = gente(), q = op.aq || mio.yo;
  if (q === 'todos' && g.length > 1) return g;
  return [g.includes(q) ? q : mio.yo];
}

// ---------- cómo va cada análisis: con las velas diarias desde que se apuntó y el precio de ahora ----------
// formatear fechas es caro: las velas de cada empresa se pasan a dias una sola vez
const memoAn = new WeakMap(), pasosVelas = new WeakMap();
const pasosDe = (t, datos) => { let l = pasosVelas.get(datos); if (!l) { l = (datos.d || []).map((v) => ({ f: fechaVela(t, v[0]), alto: v[2], bajo: v[3], cierre: v[1] })); pasosVelas.set(datos, l); } return l; };
function estadoAn(i) {
  const datos = pideVelas(i.t), ahora = +empresa(i.t).precio || null, hoy = hoyNY();
  const k = `${ahora}|${datos ? datos.ts || 1 : 0}|${hoy}`, ya = memoAn.get(i);
  if (ya && ya.k === k) return ya.e;
  const e = calculaAn(i, datos, ahora, hoy);
  memoAn.set(i, { k, e });
  return e;
}
function calculaAn(i, datos, ahora, hoy) {
  const p = planDe(i), lado = ladoAn(i), signo = lado === 'baja' ? -1 : 1, precio0 = +i.precio;
  let ent = (Array.isArray(p.entrada) ? p.entrada : []).map(Number).filter((v) => v > 0);
  ent = ent.length ? [Math.min(...ent), Math.max(...ent)] : null;
  const ref = ent ? (ent[0] + ent[1]) / 2 : precio0;
  let objs = (Array.isArray(p.objetivos) ? p.objetivos : []).map(Number).filter((v) => v > 0);
  if (!objs.length && +i.objetivo > 0) objs = [+i.objetivo];
  objs = objs.sort((a, b) => (a - b) * signo).slice(0, 3);
  const stop = +p.stop > 0 ? +p.stop : null;
  const r = (Array.isArray(p.rango) ? p.rango : []).map(Number).filter((v) => v > 0);
  const rango = lado === 'neutral' && r.length === 2 ? [Math.min(...r), Math.max(...r)] : null;
  const vence = /^\d{4}-\d{2}-\d{2}$/.test(p.vence || '') ? p.vence : null;
  const desde = fechaNY.format(Date.parse(i.creada) || Date.now()), hasta = i.cerrada ? String(i.cerrada).slice(0, 10) : hoy;
  // el dia en que se apunto no cuenta (no se sabe si fue antes o despues): desde el siguiente, mas el precio de ahora
  const pasos = (datos ? pasosDe(i.t, datos) : []).filter((s) => s.f > desde && s.f <= hasta);
  if (ahora && !i.cerrada && (!pasos.length || pasos.at(-1).f < hoy)) pasos.push({ f: hoy, alto: ahora, bajo: ahora, cierre: ahora });
  let fase = ent && !(precio0 >= ent[0] && precio0 <= ent[1]) ? 'espera' : 'marcha', alc = 0, salida = null, cuando = null, ultimo = null;
  for (const s of pasos) {
    if (vence && s.f > vence) break;
    ultimo = s;
    if (fase === 'espera') { if (s.bajo <= ent[1] && s.alto >= ent[0]) fase = 'marcha'; else continue; }
    if (lado === 'neutral') { if (rango && (s.bajo < rango[0] || s.alto > rango[1])) { fase = 'roto'; cuando = s.f; break; } continue; }
    let n = alc;
    while (n < objs.length && (signo > 0 ? s.alto >= objs[n] : s.bajo <= objs[n])) n++;
    alc = n;
    // si el mismo dia toca stop y objetivo cuenta el objetivo (el dia no dice que fue antes)
    if (stop != null && (signo > 0 ? s.bajo <= stop : s.alto >= stop)) { fase = alc ? 'objetivo' : 'stop'; salida = alc ? objs[alc - 1] : stop; cuando = s.f; break; }
    if (objs.length && alc === objs.length) { fase = 'objetivo'; salida = objs.at(-1); cuando = s.f; break; }
  }
  const vencida = !!vence && hoy > vence;
  if (lado === 'neutral' && fase === 'marcha' && vencida) { fase = 'cumplida'; cuando = vence; }
  else if (fase === 'marcha' && vencida) { fase = alc ? 'objetivo' : 'caducada'; salida = alc ? objs[alc - 1] : ultimo?.cierre ?? ahora; cuando = vence; }
  else if (fase === 'espera' && vencida) fase = 'anulada';
  if (i.cerrada && (fase === 'marcha' || fase === 'espera')) { fase = fase === 'espera' ? 'anulada' : 'cerrada'; salida = +i.precio_fin || null; cuando = hasta; }
  const favorDe = (v) => (v > 0 && ref > 0 ? ((v - ref) / ref) * 100 * signo : null);
  let favor = null;
  if (lado === 'neutral') favor = null;
  else if (['objetivo', 'stop', 'caducada', 'cerrada'].includes(fase)) favor = favorDe(salida);
  else if (fase === 'marcha') favor = favorDe(ahora);
  const dentroRango = (v) => !!rango && v >= rango[0] && v <= rango[1];
  const gana = fase === 'objetivo' || fase === 'cumplida' || (lado === 'neutral' ? fase === 'cerrada' && dentroRango(salida) : ['caducada', 'cerrada'].includes(fase) && favor > 0);
  const pierde = fase === 'stop' || fase === 'roto' || (lado === 'neutral' ? fase === 'cerrada' && !dentroRango(salida) : ['caducada', 'cerrada'].includes(fase) && favor != null && favor <= 0);
  const siguiente = objs[alc] ?? null, terminado = !['marcha', 'espera'].includes(fase);
  return {
    lado, signo, ent, ref, objs, stop, rango, vence, fase, alc, salida, cuando, favor, gana, pierde, terminado, ahora, siguiente,
    aObj: pctAn(siguiente, ahora), aStop: pctAn(stop, ahora), aEnt: ent && ahora ? pctAn(ahora < ent[0] ? ent[0] : ahora > ent[1] ? ent[1] : ahora, ahora) : null,
    dias: vence ? diasHasta(vence) : null, rr: stop != null && objs.length && Math.abs(ref - stop) > 0 ? Math.abs(objs[0] - ref) / Math.abs(ref - stop) : null,
  };
}
// lo que usan el perfil y el marcador: a favor o en contra (null mientras espera la entrada)
function resultadoAn(i) {
  const e = estadoAn(i);
  if (e.fase === 'espera' || e.fase === 'anulada' || (!e.ahora && !e.terminado)) return null;
  const favor = e.favor ?? (e.gana ? 1 : e.pierde ? -1 : 0);
  return { ahora: e.terminado ? e.salida ?? e.ahora : e.ahora, mov: favor * e.signo, favor, llego: e.fase === 'objetivo' || e.fase === 'cumplida' };
}

// ---------- dibujos: el grafico gris de PM con sus velas y las lineas del plan (SVG quieto) ----------
function graficoAn(i, e, alto = 132) {
  const datos = pideVelas(i.t);
  if (!datos) return `<div class="an-graf" data-angraf="${Number(i.id) || 0}" data-t="${esc(i.t)}"></div>`;
  const todas = datos.d || [], desde = fechaNY.format(Date.parse(i.creada) || Date.now());
  let ini = pasosDe(i.t, datos).findIndex((x) => x.f >= desde);
  if (ini < 0) ini = todas.length;
  // 30 dias antes de apuntarlo y hasta hoy (como mucho 160 velas)
  const velas = todas.slice(Math.max(0, todas.length - 160, Math.min(todas.length - 70, ini - 30)));
  if (velas.length < 3) return '<div class="an-graf"></div>';
  const W = 320, H = alto, PW = W * 0.8, n = velas.length, paso = PW / n;
  const niveles = [...(e.ent || []), ...e.objs, e.stop, ...(e.rango || [])].filter((v) => v > 0);
  let mn = Math.min(...velas.map((v) => v[3]), ...niveles), mx = Math.max(...velas.map((v) => v[2]), ...niveles);
  const aire = (mx - mn || mx * 0.02) * 0.08; mn -= aire; mx += aire;
  const Y = (v) => +(4 + ((mx - v) / (mx - mn)) * (H - 8)).toFixed(1), X = (k) => +((k + 0.5) * paso).toFixed(1);
  let mechas = '', suben = '', bajan = '';
  const ancho = Math.max(1, Math.min(7, paso * 0.62));
  velas.forEach((v, k) => {
    const x = X(k), y0 = Y(Math.max(v[1], v[4])), h = Math.max(0.8, Y(Math.min(v[1], v[4])) - y0);
    mechas += `M${x} ${Y(v[2])}V${Y(v[3])}`;
    const cuerpo = `M${(x - ancho / 2).toFixed(1)} ${y0}h${ancho.toFixed(1)}v${h.toFixed(1)}h-${ancho.toFixed(1)}z`;
    if (v[1] >= v[4]) suben += cuerpo; else bajan += cuerpo;
  });
  const xi = Math.max(0, Math.min(PW, X(Math.max(0, ini - (todas.length - n))) - paso / 2));
  const linea = (v, c, gruesa) => `<line x1="${xi.toFixed(1)}" x2="${W}" y1="${Y(v)}" y2="${Y(v)}" stroke="${c}" stroke-width="${gruesa ? 1.8 : 1.3}"/>`;
  const ahora = e.ahora;
  return `<div class="an-graf"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(i.t)}"><rect width="${W}" height="${H}" rx="8" fill="#898989"/>
    ${e.rango ? `<rect x="${xi.toFixed(1)}" y="${Y(e.rango[1])}" width="${(W - xi).toFixed(1)}" height="${(Y(e.rango[0]) - Y(e.rango[1])).toFixed(1)}" fill="${NIVEL_AN.rango}" fill-opacity=".18"/>` : ''}
    ${e.ent ? `<rect x="${xi.toFixed(1)}" y="${Y(e.ent[1])}" width="${(W - xi).toFixed(1)}" height="${Math.max(1.5, Y(e.ent[0]) - Y(e.ent[1])).toFixed(1)}" fill="${NIVEL_AN.entrada}" fill-opacity=".28"/>` : ''}
    <path d="${mechas}" stroke="#000" stroke-width=".8" fill="none"/><path d="${bajan}" fill="#000"/><path d="${suben}" fill="#678797" stroke="#000" stroke-width=".5"/>
    <line x1="${xi.toFixed(1)}" x2="${xi.toFixed(1)}" y1="0" y2="${H}" stroke="#fff" stroke-dasharray="3 3" stroke-width=".9"/>
    ${e.objs.map((v) => linea(v, NIVEL_AN.objetivo, true)).join('')}${e.stop ? linea(e.stop, NIVEL_AN.stop, true) : ''}${e.rango ? e.rango.map((v) => linea(v, NIVEL_AN.rango)).join('') : ''}
    ${ahora && !e.terminado ? `<line x1="0" x2="${W}" y1="${Y(ahora)}" y2="${Y(ahora)}" stroke="#000" stroke-dasharray="2 3" stroke-width=".9"/><circle cx="${X(n - 1)}" cy="${Y(ahora)}" r="3.2" fill="#ffd60a" stroke="#000" stroke-width="1"/>` : ''}</svg></div>`;
}
// la regla: donde esta el precio dentro del plan (rojo hasta el stop, verde hasta el objetivo)
function reglaAn(e) {
  const pts = [e.stop, ...(e.ent || []), ...e.objs, e.ahora, ...(e.rango || []), e.ref].filter((v) => v > 0);
  if (pts.length < 3) return '';
  const mn = Math.min(...pts), mx = Math.max(...pts), aire = (mx - mn) * 0.06 || mx * 0.02, a = mn - aire, b = mx + aire;
  const X = (v) => +(((v - a) / (b - a)) * 100).toFixed(2), tramo = (x1, x2, c) => `<u class="${c}" style="left:${Math.min(x1, x2)}%;width:${Math.abs(x2 - x1)}%"></u>`;
  let h = '';
  if (e.rango) h += tramo(X(e.rango[0]), X(e.rango[1]), 'bien');
  else {
    if (e.stop) h += tramo(X(e.stop), X(e.ref), 'mal');
    if (e.objs.length) h += tramo(X(e.ref), X(e.objs.at(-1)), 'bien');
    if (e.ent) h += `<em style="left:${X(e.ent[0])}%;width:${Math.max(0.8, X(e.ent[1]) - X(e.ent[0]))}%"></em>`;
    h += e.objs.map((v, k) => `<i class="obj ${k < e.alc ? 'hecho' : ''}" style="left:${X(v)}%"></i>`).join('');
    if (e.stop) h += `<i class="stop" style="left:${X(e.stop)}%"></i>`;
  }
  if (e.ahora) h += `<b class="ahora" style="left:${X(e.ahora)}%"></b>`;
  return `<div class="an-regla">${h}</div>`;
}

// ---------- una tarjeta por análisis ----------
const FASES_AN = {
  espera: ['Esperando la entrada', 'gold'], marcha: ['En marcha', ''], objetivo: ['Objetivo cumplido', 'up'], stop: ['Tocó el stop', 'dn'],
  caducada: ['Se acabó el plazo', 'dim'], cumplida: ['Se cumplió', 'up'], roto: ['Se salió del rango', 'dn'], cerrada: ['Cerrado', 'dim'], anulada: ['No llegó a entrar', 'dim'],
};
function chipAn(e) {
  const [txt, c] = FASES_AN[e.fase] || ['', ''];
  if (e.fase === 'marcha' && e.lado !== 'neutral') return `<span class="chip ${cls(e.favor)}">${txt}<b> ${sg(e.favor, 1)}</b></span>${e.alc ? `<span class="chip up">Objetivo ${e.alc} ✓</span>` : ''}`;
  if (e.fase === 'objetivo' && e.objs.length > 1 && e.alc < e.objs.length) return `<span class="chip up">Objetivo ${e.alc} de ${e.objs.length} ✓</span>`;
  return `<span class="chip ${c}">${txt}${e.favor != null && e.fase !== 'marcha' ? `<b> ${sg(e.favor, 1)}</b>` : ''}</span>`;
}
function tarjetaAn(i, opciones = {}) {
  const e = estadoAn(i), [nombre, flecha, color] = LADOS_AN[e.lado], p = planDe(i), yo = i.por === mio.yo, conf = i.confianza ?? 50;
  // lo que escribio no se traduce; si no escribio nada, el lado
  const tesis = p.tesis || (i.nota ? String(i.nota).split(/[.!?\n]/)[0].slice(0, 80) : ''), titulo = tesis ? `<span class="an-propio">${esc(tesis)}</span>` : `<span>${i.dibujo?.velas ? 'Idea dibujada' : nombre}</span>`;
  const dato = (et, v, sub = '', c = '') => `<div><span>${et}</span><b class="num ${c}">${v}</b>${sub ? `<small class="num">${sub}</small>` : ''}</div>`;
  const rango = (a, b) => (a === b ? usdAn(a) : `${usdAn(a)} a ${usdAn(b)}`);
  const niveles = e.rango
    ? dato('Se queda entre', rango(e.rango[0], e.rango[1]), e.ahora && !e.terminado ? `ahora ${usd(e.ahora)}` : '')
    : `${dato('Entrada', e.ent ? rango(e.ent[0], e.ent[1]) : usdAn(e.ref), e.fase === 'espera' && e.aEnt != null ? `a ${sg(e.aEnt, 1)}` : '')}${e.objs.length ? dato(e.objs.length > 1 ? 'Objetivos' : 'Objetivo', e.objs.map((v) => usdAn(v)).join(' · '), !e.terminado && e.aObj != null ? `a ${sg(e.aObj, 1)}` : '', 'up') : ''}${e.stop ? dato('Stop', usdAn(e.stop), !e.terminado && e.aStop != null ? `a ${sg(e.aStop, 1)}` : '', 'dn') : ''}`;
  const plazo = e.vence ? (e.dias > 1 ? `quedan ${e.dias} días` : e.dias === 1 ? 'acaba mañana' : e.dias === 0 ? 'acaba hoy' : `hasta el ${diaTxt(e.vence, false)}`) : '';
  const salir = yo && !i.cerrada;
  return `<article class="an ${e.lado} ${e.terminado ? 'hecho' : ''}" style="--c:${color}">
    <header>${opciones.conEmpresa ? `<a href="${enlace(i.t)}">${logo(i.t, 's')}</a>` : ''}<span class="an-lado">${flecha} ${nombre}</span>${opciones.varios || !yo ? `<span class="an-quien">${avatar(i.por, 'xs')}${esc(apodo(i.por))}</span>` : ''}<span class="an-seguro" style="--p:${conf}" title="Seguridad"><b class="num">${conf}%</b></span></header>
    <h3>${opciones.conEmpresa ? `<b>${esc(alias(i.t))}</b> ` : ''}${titulo}</h3>
    ${graficoAn(i, e)}${reglaAn(e)}
    <div class="an-estado">${chipAn(e)}${e.rr && !e.terminado ? `<span class="chip dim" title="Lo que ganas por cada 1 que arriesgas">${e.rr.toFixed(1)} a 1</span>` : ''}</div>
    <div class="an-niveles">${niveles}</div>
    ${i.nota && p.tesis ? `<p class="an-nota">${esc(i.nota)}</p>` : ''}
    <footer><small class="dim"><span>${hace(Date.parse(i.creada))}</span>${plazo ? ` · <span>${plazo}</span>` : ''}</small><span>${i.dibujo?.velas ? `<button class="btn peq" data-veridea="${Number(i.id)}">${ico('lapiz')} Dibujo</button>` : ''}${salir ? `<button class="btn peq ${e.terminado ? 'pri' : ''}" data-cierraan="${Number(i.id)}">${e.terminado ? 'Al historial' : 'Cerrar'}</button>` : ''}${salir && hayAnalisis12() ? `<button class="btn peq" data-editaan="${Number(i.id)}">Editar</button>` : ''}${yo ? `<button class="borrar" data-borraridea="${Number(i.id)}" title="Borrar este análisis">${ico('basura')}</button>` : ''}</span></footer>
  </article>`;
}
// los análisis de una empresa, en su ficha
function analisisEmpresa(t) {
  const l = (mio.ideas || []).filter((i) => i.t === t && !i.cerrada), hechos = (mio.ideas || []).filter((i) => i.t === t && i.cerrada);
  const mios = enJuegoAn(t), boton = mios < MAX_AN ? `<button class="btn peq pri" data-nuevoan="${esc(t)}">${ico('mas')} Nuevo análisis</button>` : '';
  if (!l.length && !hechos.length) return `<div class="ideas-aqui">${sec('lapiz', `Análisis de ${esc(alias(t))}`, boton)}<p class="dim centro an-vacio">Apunta qué esperas: entrada, objetivo y stop. Se mueve con el precio.</p></div>`;
  const varios = new Set(l.map((i) => i.por)).size > 1;
  return `<div class="ideas-aqui">${sec('lapiz', `Análisis de ${esc(alias(t))}`, boton)}<div class="an-rejilla">${l.map((i) => tarjetaAn(i, { varios })).join('')}</div>${hechos.length ? `<p class="dim centro an-vacio"><a href="#analisis" data-aqhist="1">${hechos.length} en el historial</a></p>` : ''}</div>`;
}

// ---------- la pantalla ----------
function numerosAn(lista) {
  const es = lista.map((i) => ({ i, e: estadoAn(i) })), dec = es.filter((x) => x.e.gana || x.e.pierde);
  const g = dec.filter((x) => x.e.gana), conF = dec.filter((x) => fin(x.e.favor)), media = (l) => (l.length ? l.reduce((a, x) => a + x.e.favor, 0) / l.length : null);
  const lado = (k) => { const d = dec.filter((x) => x.e.lado === k); return { n: d.length, acierto: d.length ? (d.filter((x) => x.e.gana).length / d.length) * 100 : null }; };
  return {
    es, dec, g, acierto: dec.length ? (g.length / dec.length) * 100 : null, vivos: es.filter((x) => !x.e.terminado), hechos: es.filter((x) => x.e.terminado).sort((a, b) => String(b.e.cuando || b.i.cerrada || '').localeCompare(String(a.e.cuando || a.i.cerrada || ''))),
    mediaG: media(conF.filter((x) => x.e.gana)), mediaP: media(conF.filter((x) => x.e.pierde)),
    mejor: conF.length ? conF.reduce((a, x) => (x.e.favor > a.e.favor ? x : a), conF[0]) : null, peor: conF.length ? conF.reduce((a, x) => (x.e.favor < a.e.favor ? x : a), conF[0]) : null,
    sube: lado('sube'), baja: lado('baja'), neutral: lado('neutral'),
  };
}
function selectorAq() {
  const g = gente();
  if (g.length < 2) return '';
  const q = op.aq || mio.yo, boton = (k, cuerpo) => `<button data-op="aq" data-k="${esc(k)}" class="${q === k ? 'act' : ''}">${cuerpo}</button>`;
  return `<div class="seg cq-quien">${boton(mio.yo, `${avatar(mio.yo, 'xs')}Yo`)}${g.filter((x) => x !== mio.yo).map((x) => boton(x, `${avatar(x, 'xs')}${esc(apodo(x))}`)).join('')}${boton('todos', 'Los dos')}</div>`;
}
function vistaAnalisis() {
  const quienes = aqQuienes(), varios = quienes.length > 1, yo = quienes.length === 1 && quienes[0] === mio.yo;
  const N = numerosAn((mio.ideas || []).filter((i) => quienes.includes(i.por)));
  const tab = op.aqtab === 'historial' ? 'historial' : 'vivos';
  const titulo = varios ? 'Vuestros <em>análisis</em>' : yo ? 'Mis <em>análisis</em>' : `Análisis de <em>${esc(apodo(quienes[0]))}</em>`;
  const cabeza = `<div class="portada"><div><h1>${titulo}</h1><p class="entradilla">Qué esperas de cada empresa: entrada, objetivo y stop. Se mueve con el precio.</p></div><div>${selectorAq()}<button class="btn pri" data-nuevoan="1">${ico('mas')} Nuevo análisis</button></div></div>`;
  const pestanas = `<div class="an-pestanas">${seg('aqtab', [['vivos', `Abiertos <i class="num">${N.vivos.length}</i>`], ['historial', `Historial <i class="num">${N.hechos.length}</i>`]])}</div>`;
  if (!N.es.length) return `${cabeza}<section>${vacio('lapiz', 'Todavía no hay análisis. Elige una empresa y apunta qué esperas: entrada, objetivo y stop.', `<button class="btn pri" data-nuevoan="1">${ico('mas')} Nuevo análisis</button>`)}</section>`;
  if (tab === 'historial') return `${cabeza}${pestanas}${historialAn(N, varios)}`;
  // una fila por empresa, la mas reciente arriba
  const porT = new Map();
  for (const x of [...N.vivos].sort((a, b) => Date.parse(b.i.creada) - Date.parse(a.i.creada))) { if (!porT.has(x.i.t)) porT.set(x.i.t, []); porT.get(x.i.t).push(x.i); }
  const bloques = [...porT].map(([t, l]) => {
    const x = empresa(t), mios = enJuegoAn(t);
    return `<section class="an-emp"><header class="an-cab"><a href="${enlace(t)}">${logo(t)}</a><a class="an-nom" href="${enlace(t)}"><b>${esc(x.corto)}</b><small>${esc(nombreCorto(x.nombre))}</small></a><span class="num an-precio"><b>${usd(x.precio, t)}</b><small class="${cls(x.pct)}">${sg(x.pct)}</small></span>${quienes.includes(mio.yo) && mios < MAX_AN ? `<button class="btn peq" data-nuevoan="${esc(t)}">${ico('mas')} Otro</button>` : ''}</header>
      <div class="an-rejilla">${l.map((i) => tarjetaAn(i, { varios })).join('')}</div></section>`;
  }).join('');
  return `${cabeza}${pestanas}${resumenAn(N)}${bloques || `<section>${vacio('lapiz', 'Ningún análisis abierto. Los terminados están en el historial.')}</section>`}`;
}
function resumenAn(N) {
  const espera = N.vivos.filter((x) => x.e.fase === 'espera').length, favor = N.vivos.filter((x) => x.e.favor > 0).length;
  const dato = (et, v, sub, c = '') => `<div><span>${et}</span><b class="num ${c}">${v}</b><small>${sub}</small></div>`;
  return `<div class="cq-resumen an-resumen">${dato('Abiertos', N.vivos.length, `${espera} esperando entrada`)}${dato('Van a favor', `${favor} de ${N.vivos.length - espera}`, 'de los que ya entraron', favor * 2 >= N.vivos.length - espera ? 'up' : 'dn')}${dato('Acierto', N.acierto == null ? '—' : `${Math.round(N.acierto)}%`, `${N.g.length} de ${N.dec.length} terminados`, N.acierto == null ? '' : N.acierto >= 50 ? 'up' : 'dn')}${dato('Media al acertar', N.mediaG == null ? '—' : sg(N.mediaG, 1), N.mediaP == null ? 'sin fallos' : `al fallar ${sg(N.mediaP, 1)}`, 'up')}</div>`;
}
function historialAn(N, varios) {
  if (!N.hechos.length) return `<section>${vacio('calendario', 'Cuando un análisis llegue al objetivo, toque el stop o se acabe su plazo, aparece aquí con su resultado.')}</section>`;
  const barra = (et, d) => (d.n ? `<div class="mk-barra"><b>${et}</b><u><i class="${d.acierto >= 50 ? 'mas' : 'menos'}" style="--w:${Math.max(4, d.acierto).toFixed(0)}%"></i></u><strong class="num">${Math.round(d.acierto)}%</strong><small>de ${d.n}</small></div>` : '');
  const fila = ({ i, e }) => { const [nombre, flecha] = LADOS_AN[e.lado], p = planDe(i); return `<div class="cq-hecha an-hecho">${logo(i.t, 's')}<span><b>${esc(alias(i.t))} <em class="an-tag ${e.lado}">${flecha} ${nombre}</em>${varios ? avatar(i.por, 'xs') : ''}</b><small><span>${esc(FASES_AN[e.fase]?.[0] || '')}</span>${p.tesis ? `<span class="an-propio"> · ${esc(p.tesis)}</span>` : ''}</small></span><strong class="num ${e.gana ? 'up' : e.pierde ? 'dn' : 'mut'}">${e.favor != null ? sg(e.favor, 1) : e.gana ? '✓' : e.pierde ? '✗' : '—'}<small>${e.cuando ? esc(diaTxt(String(e.cuando).slice(0, 10))) : ''}</small></strong>${i.por === mio.yo ? `<button class="borrar" data-borraridea="${Number(i.id)}" title="Borrar este análisis">${ico('basura')}</button>` : '<i></i>'}</div>`; };
  return `${resumenAn(N)}<section class="an-hist"><div class="an-aciertos">${anillo((N.acierto ?? 0) / 100, (N.acierto ?? 0) >= 50 ? 'var(--up)' : 'var(--dn)', `<strong class="num">${N.acierto == null ? '—' : Math.round(N.acierto) + '%'}</strong><small>acierto</small>`)}<div class="an-barras">${barra('▲ Alcistas', N.sube)}${barra('▼ Bajistas', N.baja)}${barra('◆ Neutrales', N.neutral)}${N.mejor ? `<p class="dim"><span>Mejor</span> <b class="num up">${sg(N.mejor.e.favor, 1)}</b> ${esc(alias(N.mejor.i.t))} · <span>peor</span> <b class="num dn">${sg(N.peor.e.favor, 1)}</b> ${esc(alias(N.peor.i.t))}</p>` : ''}</div></div>
    <div class="cq-hechas">${N.hechos.slice(0, 12).map(fila).join('')}${N.hechos.length > 12 ? `<details class="cq-mas" data-pos="an-hechos"><summary>Ver todo (${N.hechos.length})</summary>${N.hechos.slice(12).map(fila).join('')}</details>` : ''}</div></section>`;
}
// graficos que llegan despues de pintar
function pintarAn() {
  if (altaAn && pideVelas(altaAn.t) && !$('#modal').hidden) { const f = altaAn.f; altaAn = null; f(); }
  for (const el of document.querySelectorAll('[data-angraf]')) {
    if (!pideVelas(el.dataset.t)) continue;
    const i = (mio.ideas || []).find((x) => x.id === +el.dataset.angraf) || (el.closest('#modal') && window.vistaPreviaAn);
    if (i) el.outerHTML = graficoAn(i, estadoAn(i));
  }
}

// ---------- nuevo o editar: lado, idea, niveles con datos de verdad, plazo y seguridad ----------
// niveles del grafico para tocar en vez de inventar: maximos y minimos de 1 mes, 3 meses y 1 año
function nivelesReales(t) {
  const d = pideVelas(t)?.d || [], ult = (n) => d.slice(-n);
  const max = (n) => (d.length ? Math.max(...ult(n).map((v) => v[2])) : null), min = (n) => (d.length ? Math.min(...ult(n).map((v) => v[3])) : null);
  return { max: [['Máx. 1 mes', max(21)], ['Máx. 3 meses', max(63)], ['Máx. 1 año', max(252)]], min: [['Mín. 1 mes', min(21)], ['Mín. 3 meses', min(63)], ['Mín. 1 año', min(252)]] };
}
// el formulario abierto se rellena con los niveles de verdad cuando llegan las velas de esa empresa
let altaAn = null;
const PLAZOS_AN = [['1s', '1 semana', 7], ['1m', '1 mes', 30], ['3m', '3 meses', 91], ['6m', '6 meses', 182], ['', 'Sin fecha', 0]];
function nuevoAnalisis(t, editar) {
  if (E?.db && !motor.nube) return pedirClave();
  if (!t) {
    const populares = [...new Set([...favoritas(mio.yo), ...mias(), 'NVDA', 'TSLA', 'AAPL', 'AMD'])].filter((x) => RUTA_ID.test(x) && !x.includes('=')).slice(0, 12);
    const m = abrir(`<span class="paso">Nuevo análisis</span><h2>¿De qué empresa?</h2><input class="campo" id="qa" placeholder="Busca por nombre o símbolo" autocomplete="off"><div id="ra" class="resultados-c" hidden></div>
      <div id="pop"><span class="etq">Rápido</span><div class="rapido-c">${populares.map((x) => `<button data-nuevoan="${esc(x)}">${logo(x)}<b>${esc(alias(x))}</b></button>`).join('')}</div></div>`);
    const q = $('#qa', m);
    q.addEventListener('input', () => { $('#pop', m).hidden = !!q.value.trim(); });
    conectarBuscador(q, $('#ra', m), 'data-nuevoan');
    q.focus();
    return;
  }
  const x = empresa(t), ahora = +x.precio || 0, viejo = editar ? (mio.ideas || []).find((i) => i.id === editar) : null, pv = viejo ? planDe(viejo) : {};
  if (!viejo && enJuegoAn(t) >= MAX_AN) {
    abrir(`<h2>Ya tienes ${MAX_AN} de ${esc(alias(t))}</h2><p class="dim centro" style="margin:10px 0 18px">Como mucho ${MAX_AN} análisis abiertos por empresa. Cierra uno para apuntar otro.</p><a class="btn pri ancho" href="${enlace(t)}">Ver los de ${esc(alias(t))}</a>`);
    return;
  }
  pideVelas(t);
  let lado = viejo ? ladoAn(viejo) : 'sube', conf = viejo?.confianza ?? 60;
  let N = nivelesReales(t);
  const lados = [['sube', '▲ Alcista'], ['baja', '▼ Bajista'], ...(hayAnalisis12() ? [['neutral', '◆ Neutral']] : [])];
  // sin repetir el mismo precio con dos nombres
  const chips = (para, l) => l.filter(([, v], k) => v > 0 && l.findIndex((y) => precioAn(y[1]) === precioAn(v)) === k).map(([n, v]) => `<button type="button" data-nivel="${para}" data-v="${precioAn(v)}">${n} <b class="num">${dinero(v)}</b></button>`).join('');
  const v0 = (k) => { const v = pv[k]; return Array.isArray(v) ? v : v > 0 ? [v] : []; };
  const objs0 = viejo ? (v0('objetivos').length ? v0('objetivos') : +viejo.objetivo > 0 ? [+viejo.objetivo] : []) : [];
  const m = abrir(`<span class="paso">${viejo ? 'Editar análisis' : 'Nuevo análisis'}</span><div class="elegida">${logo(t, 'xl')}<b>${esc(x.nombre)}</b><span class="num">${esc(x.corto)} · ${usd(ahora, t)} <i class="${cls(x.pct)}">${sg(x.pct)}</i></span></div>
    <div class="seg ancho-s an-lados">${lados.map(([k, n]) => `<button type="button" data-anlado="${k}" class="${lado === k ? 'act' : ''}" ${viejo && k !== lado ? 'disabled' : ''}>${n}</button>`).join('')}</div>
    <label class="etq" for="an-tesis">Tu idea en pocas palabras</label><input class="campo" id="an-tesis" maxlength="80" autocomplete="off" value="${esc(pv.tesis || '')}">
    <div id="an-direccion">
      <div class="an-par"><label>Entrada desde<input class="campo num" id="an-e1" type="number" step="any" min="0" inputmode="decimal" value="${v0('entrada')[0] ?? ''}" placeholder="${ahora ? dinero(ahora) : ''}"></label><label>hasta<input class="campo num" id="an-e2" type="number" step="any" min="0" inputmode="decimal" value="${v0('entrada')[1] ?? ''}"></label></div>
      <p class="an-ayuda">Vacío: entras al precio de ahora.</p>
      <div class="an-par an-tres"><label>Objetivo<input class="campo num" id="an-o1" type="number" step="any" min="0" inputmode="decimal" value="${objs0[0] ?? ''}"></label><label>Objetivo 2<input class="campo num" id="an-o2" type="number" step="any" min="0" inputmode="decimal" value="${objs0[1] ?? ''}"></label><label>Objetivo 3<input class="campo num" id="an-o3" type="number" step="any" min="0" inputmode="decimal" value="${objs0[2] ?? ''}"></label></div>
      <div class="an-chips" id="an-co"></div>
      <label class="an-solo">Stop (si sale mal)<input class="campo num" id="an-st" type="number" step="any" min="0" inputmode="decimal" value="${pv.stop ?? ''}"></label>
      <div class="an-chips" id="an-cs"></div>
    </div>
    <div id="an-neutral" hidden><div class="an-par"><label>Se queda entre<input class="campo num" id="an-r1" type="number" step="any" min="0" inputmode="decimal" value="${v0('rango')[0] ?? ''}"></label><label>y<input class="campo num" id="an-r2" type="number" step="any" min="0" inputmode="decimal" value="${v0('rango')[1] ?? ''}"></label></div><div class="an-chips" id="an-cr"></div></div>
    <label class="etq">Hasta cuándo</label><div class="op-fechas an-plazos">${PLAZOS_AN.map(([k, n]) => `<button type="button" data-anplazo="${k}">${n}</button>`).join('')}</div><input class="campo num" id="an-vence" type="date" min="${hoyNY()}" value="${esc(pv.vence || '')}">
    <label class="etq" for="an-conf">Cómo de seguro estás · <b id="an-conf-n">${conf}%</b></label><input type="range" id="an-conf" min="0" max="100" step="5" value="${conf}">
    <textarea class="campo" id="an-nota" rows="2" maxlength="300" placeholder="Por qué (opcional)">${esc(viejo?.nota || '')}</textarea>
    <div class="an-prev" id="an-prev"></div><div class="error" id="err"></div>
    <button class="btn pri ancho" id="an-guarda">${viejo ? 'Guardar cambios' : 'Guardar análisis'}</button>${viejo ? '' : `<button class="btn ancho" id="an-dibuja" style="margin-top:8px">${ico('lapiz')} Dibujar en el gráfico</button>`}
    <p class="nota-c">Lo veis los dos. Sin importes: solo precios. No es un consejo.</p>`);
  $('.ventana', m).classList.add('ventana-an');
  const num = (id) => +$(id, m).value || null;
  const lee = () => {
    const e1 = num('#an-e1'), e2 = num('#an-e2'), objetivos = [num('#an-o1'), num('#an-o2'), num('#an-o3')].filter(Boolean), r = [num('#an-r1'), num('#an-r2')].filter(Boolean);
    const plan = { v: 1, tesis: $('#an-tesis', m).value.trim().slice(0, 80) || undefined, vence: $('#an-vence', m).value || undefined };
    if (lado === 'neutral') plan.rango = r.length === 2 ? r : undefined;
    else { plan.entrada = e1 || e2 ? [e1 || e2, e2 || e1] : undefined; plan.objetivos = objetivos.length ? objetivos : undefined; plan.stop = num('#an-st') || undefined; }
    return JSON.parse(JSON.stringify(plan));
  };
  // que el plan tenga sentido para su lado
  const revisa = (plan) => {
    const ref = plan.entrada ? (plan.entrada[0] + plan.entrada[1]) / 2 : ahora;
    if (lado === 'neutral') return !plan.rango ? 'Pon entre qué precios se queda.' : !(Math.min(...plan.rango) < ahora && ahora < Math.max(...plan.rango)) ? `El precio de ahora (${usd(ahora, t)}) tiene que quedar dentro del rango.` : '';
    if (!plan.objetivos && !plan.stop) return 'Pon al menos el objetivo o el stop.';
    const arriba = lado === 'sube';
    if (plan.objetivos?.some((v) => (arriba ? v <= ref : v >= ref))) return arriba ? 'En un alcista los objetivos van por encima de la entrada.' : 'En un bajista los objetivos van por debajo de la entrada.';
    if (plan.stop && (arriba ? plan.stop >= ref : plan.stop <= ref)) return arriba ? 'En un alcista el stop va por debajo de la entrada.' : 'En un bajista el stop va por encima de la entrada.';
    return '';
  };
  const muestra = () => ({ t, id: 0, por: mio.yo, dir: lado, precio: ahora, objetivo: lee().objetivos?.[0] || null, creada: viejo?.creada || new Date().toISOString(), confianza: conf, dibujo: { plan: lee() } });
  const previa = () => {
    $('#an-direccion', m).hidden = lado === 'neutral'; $('#an-neutral', m).hidden = lado !== 'neutral';
    m.querySelectorAll('[data-anlado]').forEach((b) => b.classList.toggle('act', b.dataset.anlado === lado));
    const vence = $('#an-vence', m).value;
    m.querySelectorAll('[data-anplazo]').forEach((b) => { const d = PLAZOS_AN.find((p) => p[0] === b.dataset.anplazo)[2]; b.classList.toggle('act', d ? vence === fechaMas(d) : !vence); });
    const i = muestra(), e = calculaAn(i, pideVelas(t), ahora, hoyNY()), aviso = revisa(i.dibujo.plan);
    window.vistaPreviaAn = i;
    const gana = e.objs.length ? Math.abs(pctAn(e.objs[0], e.ref)) : null, pierde = e.stop ? Math.abs(pctAn(e.stop, e.ref)) : null;
    $('#an-prev', m).innerHTML = `${graficoAn(i, e, 120)}<div class="an-cuentas">${e.rango ? `<span>Rango <b class="num">${sg(pctAn(e.rango[0], ahora), 1)} · ${sg(pctAn(e.rango[1], ahora), 1)}</b></span>` : `${gana != null ? `<span>Ganas <b class="num up">+${gana.toFixed(1)}%</b></span>` : ''}${pierde != null ? `<span>Arriesgas <b class="num dn">-${pierde.toFixed(1)}%</b></span>` : ''}${e.rr ? `<span><b class="num">${e.rr.toFixed(1)} a 1</b></span>` : ''}`}</div>`;
    $('#err', m).textContent = aviso && (num('#an-o1') || num('#an-st') || num('#an-r1')) ? aviso : '';
  };
  // los niveles de verdad del grafico, segun el lado
  const chipsNivel = () => {
    $('#an-co', m).innerHTML = chips('an-o1', lado === 'baja' ? N.min : N.max);
    $('#an-cs', m).innerHTML = chips('an-st', lado === 'baja' ? N.max.slice(0, 2) : N.min.slice(0, 2));
    $('#an-cr', m).innerHTML = chips('an-r1', N.min.slice(0, 2)) + chips('an-r2', N.max.slice(0, 2));
  };
  const fechaMas = (d) => { const f = new Date(hoyNY() + 'T12:00:00Z'); f.setUTCDate(f.getUTCDate() + d); return f.toISOString().slice(0, 10); };
  m.querySelector('.ventana').addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-anlado],[data-nivel],[data-anplazo]');
    if (!b) return;
    ev.stopPropagation();
    if (b.dataset.anlado) { lado = b.dataset.anlado; chipsNivel(); }
    else if (b.dataset.nivel) { $('#' + b.dataset.nivel, m).value = b.dataset.v; }
    else { const d = PLAZOS_AN.find((p) => p[0] === b.dataset.anplazo)[2]; $('#an-vence', m).value = d ? fechaMas(d) : ''; }
    previa();
  });
  m.querySelectorAll('input:not([type=range]), textarea').forEach((el) => { el.oninput = previa; });
  $('#an-conf', m).oninput = (ev) => { conf = +ev.target.value; $('#an-conf-n', m).textContent = conf + '%'; };
  $('#an-guarda', m).onclick = async (ev) => {
    ev.stopPropagation();
    const plan = lee(), aviso = revisa(plan);
    if (aviso) { $('#err', m).textContent = aviso; return; }
    if (!ahora) { $('#err', m).textContent = 'Aún no tengo el precio de esta empresa.'; return; }
    const datos = { objetivo: plan.objetivos?.[0] || null, nota: $('#an-nota', m).value.trim(), confianza: conf, plan };
    $('#an-guarda', m).disabled = true;
    try {
      if (viejo) await motor.ideaEditar(viejo.id, datos);
      else if (!(await hacerSitioAn(t))) throw new Error(`Ya tienes ${MAX_AN} análisis abiertos de ${alias(t)}: cierra uno`);
      else await motor.ideaPoner({ t, dir: lado, precio: ahora, objetivo: datos.objetivo, nota: datos.nota, confianza: conf, dibujo: { plan } });
      await refrescarMio(true); cerrar(); window.vistaPreviaAn = null;
      if (ruta.v !== 'analisis' && !(ruta.v === 'accion' && ruta.t === t)) location.hash = 'analisis'; else pintar();
      toast(viejo ? 'Análisis guardado' : `Análisis de ${alias(t)} guardado`);
    } catch (err) { $('#err', m).textContent = err.message; $('#an-guarda', m).disabled = false; }
  };
  // a dibujarlo sobre las velas, con todo lo escrito
  $('#an-dibuja', m)?.addEventListener('click', (ev) => {
    ev.stopPropagation();
    const plan = lee(), pon = () => { idea = { t, trazos: [], h: 'flecha', color: COLORES_TRAZO[0], dir: lado === 'baja' ? 'baja' : 'sube', confianza: conf, nota: $('#an-nota', m)?.value.trim() || '', objetivo: plan.objetivos?.[0] ? String(plan.objetivos[0]) : '', plan }; cerrar(); pintar(); $('#graf')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); };
    if (ruta.v === 'accion' && ruta.t === t) pon(); else { addEventListener('hashchange', pon, { once: true }); location.hash = 'accion/' + t; }
  });
  // nuevo: objetivo y stop con los niveles de verdad (maximo y minimo del ultimo mes), si aun estan vacios
  const ponNiveles = () => {
    if (viejo) return;
    const o = (lado === 'baja' ? N.min : N.max).find(([, v]) => v > 0 && (lado === 'baja' ? v < ahora : v > ahora)), s = (lado === 'baja' ? N.max : N.min).find(([, v]) => v > 0 && (lado === 'baja' ? v > ahora : v < ahora));
    if (o && !$('#an-o1', m).value) $('#an-o1', m).value = precioAn(o[1]);
    if (s && !$('#an-st', m).value) $('#an-st', m).value = precioAn(s[1]);
  };
  chipsNivel(); ponNiveles();
  altaAn = { t, f: () => { if (!m.contains($('#an-guarda', m))) return; N = nivelesReales(t); chipsNivel(); ponNiveles(); previa(); } };
  previa();
  $('#an-tesis', m).focus();
}
// cerrar: al precio de ahora o al nivel que ya toco
function cerrarAnalisis(id) {
  const i = (mio.ideas || []).find((x) => x.id === id);
  if (!i) return;
  const e = estadoAn(i), precio = e.terminado && e.salida ? e.salida : e.ahora;
  const m = abrir(`<h2>Cerrar análisis</h2><p class="dim centro" style="margin:6px 0 10px">${esc(alias(i.t))} · <span>${esc(LADOS_AN[e.lado][0])}</span>${planDe(i).tesis ? `<span class="an-propio"> · ${esc(planDe(i).tesis)}</span>` : ''}</p>
    <label class="etq" for="an-fin">Precio al cerrarlo</label><div class="con-sufijo"><input class="campo num" id="an-fin" type="number" step="any" min="0" inputmode="decimal" value="${precio ? precioAn(precio) : ''}"><button type="button" id="an-hoy">Precio de ahora</button></div>
    <div class="vista-previa" id="an-cp"></div><div class="error" id="err"></div>
    <button class="btn pri ancho" id="an-cierra">Cerrar y pasar al historial</button>`);
  const previa = () => { const v = +$('#an-fin', m).value, f = e.lado === 'neutral' ? null : pctAn(v, e.ref) * e.signo; $('#an-cp', m).innerHTML = v > 0 && f != null ? `<div><small>Resultado</small><b class="num ${cls(f)}">${sg(f, 1)}</b></div>` : ''; };
  $('#an-fin', m).oninput = previa;
  $('#an-hoy', m).onclick = (ev) => { ev.stopPropagation(); $('#an-fin', m).value = e.ahora ? precioAn(e.ahora) : ''; previa(); };
  $('#an-cierra', m).onclick = async (ev) => {
    ev.stopPropagation();
    const v = +$('#an-fin', m).value;
    if (!(v > 0)) { $('#err', m).textContent = 'Falta el precio.'; return; }
    try { await motor.ideaCerrar(id, v); await refrescarMio(true); cerrar(); pintar(); toast('Análisis cerrado: está en el historial'); }
    catch (err) { $('#err', m).textContent = err.message; }
  };
  previa();
}
// en el dibujo de la ficha: los mismos niveles (stop, otro objetivo y plazo) debajo del formulario de siempre
function camposDibujoAn() {
  const p = idea?.plan || {};
  return `<div class="an-par an-tres an-dibujo"><label>Stop<input class="campo num" id="idea-stop" type="number" step="any" min="0" inputmode="decimal" value="${p.stop ?? ''}"></label><label>Objetivo 2<input class="campo num" id="idea-o2" type="number" step="any" min="0" inputmode="decimal" value="${p.objetivos?.[1] ?? ''}"></label><label>Hasta<input class="campo num" id="idea-vence" type="date" min="${hoyNY()}" value="${esc(p.vence || '')}"></label></div>
    <input class="campo" id="idea-tesis" maxlength="80" autocomplete="off" placeholder="Tu idea en pocas palabras (opcional)" value="${esc(p.tesis || '')}">`;
}
function planDibujoAn(precio) {
  const v = (id) => +($(id)?.value || 0) || null, base = idea?.plan || {}, objetivo = +idea.objetivo || null;
  const plan = JSON.parse(JSON.stringify({ ...base, v: 1, tesis: $('#idea-tesis')?.value.trim().slice(0, 80) || undefined, stop: v('#idea-stop') || undefined, vence: $('#idea-vence')?.value || undefined, objetivos: [objetivo, v('#idea-o2')].filter(Boolean).length ? [objetivo, v('#idea-o2')].filter(Boolean) : undefined }));
  const arriba = idea.dir === 'sube', ref = base.entrada ? (base.entrada[0] + base.entrada[1]) / 2 : precio;
  if (plan.stop && (arriba ? plan.stop >= ref : plan.stop <= ref)) return { error: arriba ? 'En un alcista el stop va por debajo de la entrada.' : 'En un bajista el stop va por encima de la entrada.' };
  if (plan.objetivos?.some((x) => (arriba ? x <= ref : x >= ref))) return { error: arriba ? 'En un alcista los objetivos van por encima de la entrada.' : 'En un bajista los objetivos van por debajo de la entrada.' };
  return { plan };
}
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-nuevoan],[data-cierraan],[data-editaan],[data-aqhist]');
  if (!b || b.closest('.ventana-an')) return;
  if (b.dataset.aqhist) { op.aqtab = 'historial'; return; }
  if (b.dataset.nuevoan) nuevoAnalisis(b.dataset.nuevoan === '1' ? null : b.dataset.nuevoan);
  else if (b.dataset.cierraan) cerrarAnalisis(+b.dataset.cierraan);
  else if (b.dataset.editaan) { const i = (mio.ideas || []).find((x) => x.id === +b.dataset.editaan); if (i) nuevoAnalisis(i.t, i.id); }
});
