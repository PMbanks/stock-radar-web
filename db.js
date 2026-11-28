// Alarmas, seguimiento y chat. Dos motores con la misma forma:
//  - nube: base compartida (lo veis los dos, y el vigilante lee vuestras alarmas)
//  - local: solo este navegador (mientras la base no este conectada)
'use strict';
const guarda = {
  leer: (k, d) => { try { return JSON.parse(localStorage.getItem('radar-' + k)) ?? d; } catch { return d; } },
  poner: (k, v) => { try { localStorage.setItem('radar-' + k, JSON.stringify(v)); return true; } catch { return false; } },
};

function motorNube(db, clave) {
  const rpc = async (fn, args = {}) => {
    const r = await fetch(`${db.url}/rest/v1/rpc/${fn}`, {
      method: 'POST',
      headers: { apikey: db.anon, Authorization: 'Bearer ' + db.anon, 'Content-Type': 'application/json' },
      body: JSON.stringify({ clave, ...args }),
    });
    const t = await r.text();
    if (!r.ok) {
      let m = '';
      try { m = JSON.parse(t).message; } catch {}
      throw new Error(m || 'No se pudo conectar (' + r.status + ')');
    }
    return t ? JSON.parse(t) : null;
  };
  return {
    nube: true,
    leer: () => rpc('radar_leer'),
    version: () => rpc('radar_version'),
    perfilGuardar: (p) => rpc('radar_perfil_guardar', { p }),
    imagen: (id) => rpc('radar_imagen', { p_id: id }),
    alarmaPoner: (t, dir, nivel) => rpc('radar_alarma_poner', { p_t: t, p_dir: dir, p_nivel: nivel }),
    alarmaQuitar: (id) => rpc('radar_alarma_quitar', { p_id: id }),
    seguir: (t, noticias) => rpc('radar_seguir', { p_t: t, p_noticias: noticias }),
    dejar: (t) => rpc('radar_dejar', { p_t: t }),
    chat: (desde) => rpc('radar_chat2', { desde }),
    decir: (texto, imagen, t) => rpc('radar_decir', { p_texto: texto, p_imagen: imagen, p_t: t }),
    borrar: (id) => rpc('radar_borrar', { p_id: id }),
    carteraPoner: (t, cantidad, precio, comprada) => (comprada ? rpc('radar_cartera_apuntar', { p: { t, cantidad, precio, comprada } }) : rpc('radar_cartera_poner', { p_t: t, p_cantidad: cantidad, p_precio: precio })),
    carteraFecha: (id, fecha) => rpc('radar_cartera_fecha', { p_id: id, p_fecha: fecha }),
    opcionAlarmas: (id, sube, baja) => rpc('radar_opcion_alarmas', { p_id: id, p_sube: sube, p_baja: baja }),
    carteraQuitar: (id) => rpc('radar_cartera_quitar', { p_id: id }),
    // db/radar-11: vender una parte o todo un lote (lo vendido queda en el historial) y deshacerlo
    carteraVender: (id, cantidad, precio, fecha) => rpc('radar_cartera_vender', { p_id: id, p_cantidad: cantidad, p_precio: precio, p_fecha: fecha }),
    carteraDevolver: (id) => rpc('radar_cartera_devolver', { p_id: id }),
    cambiarClave: (nueva) => rpc('radar_cambiar_clave', { nueva }),
    ideaPoner: (i) => rpc('radar_idea_nueva', { p_t: i.t, p_dir: i.dir, p_precio: i.precio, p_objetivo: i.objetivo, p_nota: i.nota, p_confianza: i.confianza, p_dibujo: i.dibujo }),
    ideaBorrar: (id) => rpc('radar_idea_borrar', { p_id: id }),
    // un analisis se cierra a un precio (ya estaba en la base); editarlo necesita db/radar-12
    ideaCerrar: (id, precio) => rpc('radar_idea_cerrar', { p_id: id, p_precio: precio }),
    ideaEditar: (id, c) => rpc('radar_idea_editar', { p_id: id, p_objetivo: c.objetivo, p_nota: c.nota, p_confianza: c.confianza, p_plan: c.plan }),
    opcionPoner: (o) => rpc('radar_opcion_poner', { p: o }),
    opcionCerrar: (id, prima) => rpc('radar_opcion_cerrar', { p_id: id, p_prima: prima }),
    opcionQuitar: (id) => rpc('radar_opcion_quitar', { p_id: id }),
    reacciones: () => rpc('radar_reacciones_leer'),
    reaccionar: (id, que) => rpc('radar_reaccionar', { p_id: id, p_que: que }),
  };
}

function motorLocal() {
  const todo = () => ({ alarmas: [], seguidas: [], mensajes: [], ideas: [], cartera: [], opciones: [], perfiles: [], n: 1, ...guarda.leer('local', {}) });
  const cambia = async (fn) => { const d = todo(); fn(d); if (!guarda.poner('local', d)) throw new Error('El navegador está lleno: borra alguna imagen.'); };
  return {
    nube: false,
    leer: async () => ({ yo: 'Yo', ...todo() }),
    version: async () => null,
    perfilGuardar: (p) => cambia((d) => { d.perfiles = [...d.perfiles.filter((x) => x.nombre !== 'Yo'), { ...p, nombre: 'Yo' }]; }),
    imagen: async (id) => todo().mensajes.find((m) => m.id === id)?.imagen || null,
    alarmaPoner: (t, dir, nivel) => cambia((d) => d.alarmas.unshift({ id: d.n++, t, dir, nivel, por: 'Yo', creada: new Date().toISOString() })),
    alarmaQuitar: (id) => cambia((d) => { d.alarmas = d.alarmas.filter((a) => a.id !== id); }),
    seguir: (t, noticias) => cambia((d) => { const x = d.seguidas.find((s) => s.t === t); if (x) x.noticias = noticias; else d.seguidas.push({ t, noticias, por: 'Yo' }); }),
    dejar: (t) => cambia((d) => { d.seguidas = d.seguidas.filter((s) => s.t !== t); }),
    chat: async (desde) => todo().mensajes.filter((m) => m.id > desde),
    decir: (texto, imagen, t) => cambia((d) => { d.mensajes.push({ id: d.n++, por: 'Yo', texto, imagen, t, creada: new Date().toISOString() }); d.mensajes = d.mensajes.slice(-60); }),
    borrar: (id) => cambia((d) => { d.mensajes = d.mensajes.filter((m) => m.id !== id); }),
    ideaPoner: (i) => cambia((d) => { d.ideas.unshift({ ...i, id: d.n++, por: 'Yo', creada: new Date().toISOString() }); }),
    ideaBorrar: (id) => cambia((d) => { d.ideas = d.ideas.filter((x) => x.id !== id); }),
    ideaCerrar: (id, precio) => cambia((d) => { const x = d.ideas.find((i) => i.id === id); if (x && !x.cerrada) { x.cerrada = new Date().toISOString(); x.precio_fin = precio; } }),
    ideaEditar: (id, c) => cambia((d) => { const x = d.ideas.find((i) => i.id === id); if (x && !x.cerrada) { x.objetivo = c.objetivo; x.nota = c.nota; x.confianza = c.confianza; x.dibujo = { ...(x.dibujo || {}), plan: c.plan }; x.editada = new Date().toISOString(); } }),
    opcionPoner: (o) => cambia((d) => { d.opciones.push({ ...o, id: d.n++, por: 'Yo', creada: new Date().toISOString(), cerrada: null, prima_fin: null }); }),
    opcionCerrar: (id, prima) => cambia((d) => { const o = d.opciones.find((x) => x.id === id); if (o) { o.cerrada = new Date().toISOString(); o.prima_fin = prima; } }),
    opcionQuitar: (id) => cambia((d) => { d.opciones = d.opciones.filter((x) => x.id !== id); }),
    reacciones: async () => todo().reacciones || [],
    reaccionar: (id, que) => cambia((d) => { const l = d.reacciones || [], hay = l.some((r) => r.mensaje === id && r.que === que && r.por === 'Yo'); d.reacciones = hay ? l.filter((r) => !(r.mensaje === id && r.que === que && r.por === 'Yo')) : [...l, { mensaje: id, que, por: 'Yo' }]; }),
    carteraPoner: (t, cantidad, precio, comprada) => cambia((d) => { d.cartera.push({ id: d.n++, t, cantidad, precio, comprada: comprada || null, por: 'Yo', creada: new Date().toISOString() }); }),
    carteraFecha: (id, fecha) => cambia((d) => { const x = d.cartera.find((c) => c.id === id); if (x) x.comprada = fecha; }),
    opcionAlarmas: (id, sube, baja) => cambia((d) => { const o = d.opciones.find((x) => x.id === id); if (o) { o.avisa_sube = sube; o.avisa_baja = baja; } }),
    carteraQuitar: (id) => cambia((d) => { d.cartera = d.cartera.filter((x) => x.id !== id); }),
    carteraVender: (id, cantidad, precio, fecha) => cambia((d) => {
      const c = d.cartera.find((x) => x.id === id && !x.vendida);
      if (!c) return;
      if (cantidad >= +c.cantidad - 1e-9) { c.vendida = fecha; c.precio_venta = precio; return; }
      c.cantidad = +(+c.cantidad - cantidad).toFixed(8);
      d.cartera.push({ ...c, id: d.n++, cantidad, vendida: fecha, precio_venta: precio });
    }),
    carteraDevolver: (id) => cambia((d) => { const c = d.cartera.find((x) => x.id === id); if (c) { c.vendida = null; c.precio_venta = null; } }),
  };
}
