/* MODO: La cacería del oso — afiches físicos con QR (?p=A) o palabra secreta.
   En cada afiche se supera un reto corto y se gana una pieza del misterio. */
window.MODOS = window.MODOS || {};
window.MODOS.caceria = function (api, ganar, ctx) {
  const { screen, sfx, $, hud, piezasHTML, abrirPieza, store, jugarReto, toast, DEMO, CFG } = api;
  const EST = CFG.caceria.estaciones;
  const KEY = "ba_caza";
  const estado = (!DEMO && store.get(KEY)) || { found: [] };
  const guardar = () => { if (!DEMO) store.set(KEY, estado); };
  const tiene = (id) => estado.found.includes(id);
  const porId = (id) => EST.find((e) => e.id === id);
  const porPalabra = (w) => EST.find((e) => e.palabra === w.toUpperCase().replace(/[^A-Z0-9]/g, ""));

  if (ctx && ctx.p && porId(ctx.p)) llegar(porId(ctx.p));
  else mapa();

  function mapa(msg) {
    hud(EST.length, estado.found.length);
    const siguiente = EST.find((e) => !tiene(e.id));
    const el = screen(`
      <div class="tag">La cacería del oso · ${estado.found.length} de ${EST.length}</div>
      ${piezasHTML(EST.length, estado.found.length)}
      ${msg ? `<p class="pista">${msg}</p>` : ""}
      ${siguiente ? `<div class="card pista-card"><div class="tag">Tu próxima pista</div><p><b>“${siguiente.pista}”</b></p></div>` : ""}
      <div class="estaciones">
        ${EST.map((e, i) => `<div class="estacion ${tiene(e.id) ? "ok" : ""}">
          <span class="num">${tiene(e.id) ? "✓" : i + 1}</span>
          <div><b>${tiene(e.id) ? e.lugar : "Afiche escondido"}</b><p class="small">${tiene(e.id) ? "Pieza conseguida" : "Escanea su QR o escribe su palabra secreta"}</p></div>
        </div>`).join("")}
      </div>
      <div class="palabra-row">
        <input id="pw" placeholder="Palabra secreta del afiche" autocomplete="off" autocapitalize="characters" spellcheck="false">
        <button class="btn" id="pwb">OK</button>
      </div>
      ${DEMO ? `<p class="small">Modo demo — simular escaneo:</p><div class="btn-row">${EST.map((e) => `<button class="btn alt" data-sim="${e.id}">Afiche ${e.id}</button>`).join("")}</div>` : ""}
      <p class="small">Tu avance queda guardado en este celular. Puedes cerrar y volver cuando encuentres el siguiente afiche.</p>`);
    const enviar = () => {
      const e = porPalabra($("#pw").value);
      if (e) { sfx.ok(); llegar(e); } else { sfx.no(); toast("Esa palabra no es de ningún afiche"); }
    };
    $("#pwb").onclick = enviar;
    $("#pw").addEventListener("keydown", (ev) => { if (ev.key === "Enter") enviar(); });
    el.querySelectorAll("[data-sim]").forEach((b) => (b.onclick = () => llegar(porId(b.dataset.sim))));
  }

  function llegar(e) {
    if (tiene(e.id)) return mapa(`Ya tienes la pieza de “${e.lugar}”. Sigue buscando.`);
    jugarReto(() => {
      estado.found.push(e.id); guardar();
      const n = estado.found.length;
      hud(EST.length, n);
      const completo = n >= EST.length;
      const el = screen(`
        <div class="tag">¡Pieza ${n} de ${EST.length}!</div>
        ${piezasHTML(EST.length, n - 1)}
        <p class="pista">“${CFG.teaser.pistas[n - 1] || ""}”</p>
        <button class="btn big" id="go">${completo ? "¡Ver mi premio!" : "Ver la siguiente pista"}</button>`);
      abrirPieza(el, n - 1);
      $("#go").onclick = () => { sfx.tap(); if (completo) { if (!DEMO) store.set(KEY, { found: [] }); ganar(); } else mapa(); };
    }, `<div class="tag">Encontraste el afiche “${e.lugar}”</div><p class="small">Para quedarte con su pieza, supera este desafío:</p>`);
  }
};
