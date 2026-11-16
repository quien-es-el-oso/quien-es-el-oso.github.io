/* MODO: Hora peak en la plancha — simulador de cocina en tiempo real */
window.MODOS = window.MODOS || {};
window.MODOS.cocina = function (api, ganar) {
  const { screen, loop, later, sfx, vibrar, rand, $, hud, setSkip, perdio, hearts, layer, ING, CFG } = api;
  const META = (CFG.modos.cocina && CFG.modos.cocina.pedidosMeta) || 5;
  const MAX_FALLAS = 3;
  const COCCION = 4.2, QUEMA = 4.0; // segundos hasta dorada / hasta quemarse después de dorada
  const CLIENTES = ["🧑", "👩", "🧔", "👵", "🧑‍🎓", "👨‍🍳", "🧑‍💼", "👧"];
  const BANDEJA = ["pan_base", "carne", "queso", "tocino", "pepinillos", "cebolla", "tomate", "lechuga", "pan_top"];

  instrucciones();

  function instrucciones() {
    hud(false);
    screen(`
      <div class="tag">Hora peak en la plancha</div>
      <div style="font-size:64px;line-height:1">🔥</div>
      <div class="card" style="text-align:left">
        <p><b>1.</b> Toca la plancha para poner una bolita de carne.</p>
        <p><b>2.</b> Tócala de nuevo para hacer el <b>SMASH</b>: recién ahí se empieza a cocinar.</p>
        <p><b>3.</b> Cuando esté <b>dorada</b>, tócala para sacarla. Si esperas mucho, se quema.</p>
        <p><b>4.</b> Arma el pedido de abajo hacia arriba con la bandeja.</p>
      </div>
      <p class="small">Entrega ${META} pedidos. Si ${MAX_FALLAS} clientes se aburren, pierdes.</p>
      <button class="btn big" id="go">¡Abrir la cocina!</button>`);
    $("#go").onclick = () => { sfx.tap(); jugar(); };
  }

  function jugar() {
    hud(META, 0);
    const el = screen(`
      <div class="score-row"><span>✅ <b id="ok">0</b> / ${META}</span><span class="lives" id="lv"></span></div>
      <div class="pedidos" id="ped"></div>
      <div class="plancha2" id="pl">
        ${[0, 1, 2].map((i) => `<button class="slot" data-i="${i}"><div class="patty"></div><span class="slot-txt">+</span></button>`).join("")}
      </div>
      <div class="mesa">
        <div class="receta-guia" id="guia"></div>
        <div class="mesa-row">
          <div class="stack mini" id="st"></div>
          <div class="listas">🥩 listas<br><b id="ls">0</b></div>
        </div>
      </div>
      <div class="feedback" id="fb">&nbsp;</div>
      <div class="tray tray9" id="tr">${BANDEJA.map((k) => `<button class="chip" data-k="${k}">${layer(k)}<span>${ING[k].replace(" 70/30", "")}</span></button>`).join("")}</div>`);

    const $ped = $("#ped"), $ok = $("#ok"), $lv = $("#lv"), $st = $("#st"), $ls = $("#ls"), $fb = $("#fb"), $guia = $("#guia");
    const slots = [...el.querySelectorAll(".slot")].map((n) => ({ n, estado: "vacia", t: 0 }));
    let pedidos = [], activo = null, armado = [], listas = 0, entregados = 0, fallas = 0, fin = false, idSeq = 0;
    let proximo = 0.5, tTotal = 0;
    hearts($lv, MAX_FALLAS - fallas, MAX_FALLAS);
    setSkip(() => { fin = true; ganar(); });

    const nombres = Object.keys(CFG.recetas);
    function nuevoPedido() {
      const nombre = nombres[rand(nombres.length)];
      const tMax = Math.max(24, 42 - entregados * 3) + rand(6);
      const p = { id: ++idSeq, nombre, receta: CFG.recetas[nombre], t: tMax, tMax, cliente: CLIENTES[rand(CLIENTES.length)] };
      const card = document.createElement("button");
      card.className = "pedido";
      card.innerHTML = `<span class="cara">${p.cliente}</span><span class="pn">${nombre}</span><i class="pbar"><b></b></i>`;
      card.onclick = () => { if (!fin) { seleccionar(p); sfx.tap(); } };
      p.card = card; p.bar = card.querySelector("b"); p.cara = card.querySelector(".cara");
      $ped.appendChild(card);
      pedidos.push(p);
      if (!activo) seleccionar(p);
    }

    function seleccionar(p) {
      if (activo === p) return;
      activo = p; armado = [];
      pedidos.forEach((q) => q.card.classList.toggle("activo", q === p));
      pintarArmado();
    }

    function pintarArmado() {
      $st.innerHTML = armado.map(layer).join("");
      if (!activo) { $guia.innerHTML = `<span class="small">Esperando pedidos…</span>`; return; }
      $guia.innerHTML = `<b class="script" style="font-size:22px">${activo.nombre}</b> ` +
        activo.receta.map((k, i) => `<span class="paso ${i < armado.length ? "hecho" : i === armado.length ? "sig" : ""}">${ING[k].replace(" 70/30", "").replace(" (base)", "↓").replace(" (tapa)", "↑")}</span>`).join("");
    }

    function aviso(txt, ok) { $fb.className = "feedback " + (ok ? "ok" : "no"); $fb.textContent = txt; }

    // plancha
    slots.forEach((s) => s.n.addEventListener("click", () => {
      if (fin) return;
      if (s.estado === "vacia") { s.estado = "bola"; s.t = 0; sfx.tap(); }
      else if (s.estado === "bola") { s.estado = "cocinando"; s.t = 0; sfx.ok(); vibrar(40); aviso("¡SMASH!", true); }
      else if (s.estado === "cocinando") { aviso("¡Todavía está cruda!", false); sfx.no(); }
      else if (s.estado === "lista") { s.estado = "vacia"; listas++; $ls.textContent = listas; sfx.ok(); }
      else if (s.estado === "quemada") { s.estado = "vacia"; aviso("A la basura… 🗑️", false); sfx.no(); }
      pintarSlot(s);
    }));

    function pintarSlot(s) {
      s.n.className = "slot " + s.estado;
      const txt = { vacia: "+", bola: "SMASH", cocinando: "", lista: "¡SACAR!", quemada: "🔥" }[s.estado];
      s.n.querySelector(".slot-txt").textContent = txt;
      const p = s.estado === "cocinando" ? s.t / COCCION : s.estado === "lista" ? 1 : 0;
      s.n.style.setProperty("--p", (p * 100).toFixed(1) + "%");
    }

    // bandeja
    el.querySelectorAll(".tray9 .chip").forEach((btn) => btn.addEventListener("click", () => {
      if (fin || !activo) return;
      const k = btn.dataset.k, esperado = activo.receta[armado.length];
      if (k !== esperado) {
        aviso(`Ese no va ahora: toca ${ING[esperado].toLowerCase()}`, false); sfx.no(); vibrar(60);
        btn.classList.remove("bad"); void btn.offsetWidth; btn.classList.add("bad");
        activo.t = Math.max(0.5, activo.t - 2);
        return;
      }
      if (k === "carne") {
        if (listas <= 0) { aviso("¡Primero saca una carne dorada de la plancha!", false); sfx.no(); return; }
        listas--; $ls.textContent = listas;
      }
      armado.push(k); sfx.tap(); $fb.innerHTML = "&nbsp;";
      if (armado.length === activo.receta.length) entregar();
      else pintarArmado();
    }));

    function entregar() {
      const p = activo;
      entregados++; $ok.textContent = entregados; hud(META, entregados);
      aviso(`${p.cliente} ¡Gracias! Lo simple, hecho bien.`, true); sfx.win();
      quitarPedido(p);
      if (entregados >= META) { fin = true; setSkip(null); later(ganar, 900); }
    }

    function quitarPedido(p) {
      pedidos = pedidos.filter((q) => q !== p);
      p.card.remove();
      if (activo === p) { activo = null; armado = []; if (pedidos[0]) seleccionar(pedidos[0]); else pintarArmado(); }
    }

    pintarArmado();
    slots.forEach(pintarSlot);

    loop((dt) => {
      if (fin) return false;
      tTotal += dt;
      // nuevos pedidos
      proximo -= dt;
      if (proximo <= 0 && pedidos.length < 3 && entregados + pedidos.length < META + MAX_FALLAS) {
        nuevoPedido();
        proximo = Math.max(5, 10 - entregados) + Math.random() * 4;
      }
      // tiempos de pedidos
      for (const p of [...pedidos]) {
        p.t -= dt;
        const r = Math.max(0, p.t / p.tMax);
        p.bar.style.width = (r * 100).toFixed(1) + "%";
        p.bar.style.background = r > 0.5 ? "var(--verde)" : r > 0.25 ? "var(--amarillo)" : "var(--rojo)";
        p.cara.textContent = r > 0.5 ? p.cliente : r > 0.25 ? "😐" : "😠";
        if (p.t <= 0) {
          fallas++; hearts($lv, MAX_FALLAS - fallas, MAX_FALLAS);
          aviso(`Un cliente se fue sin su ${p.nombre} 😤`, false); sfx.no(); vibrar(150);
          quitarPedido(p);
          if (fallas >= MAX_FALLAS) { fin = true; setSkip(null); later(() => perdio("Se te acumularon los pedidos.", instrucciones), 600); return false; }
        }
      }
      // plancha
      slots.forEach((s) => {
        if (s.estado === "cocinando") { s.t += dt; if (s.t >= COCCION) { s.estado = "lista"; s.t = 0; sfx.tap(); } pintarSlot(s); }
        else if (s.estado === "lista") { s.t += dt; if (s.t >= QUEMA) { s.estado = "quemada"; aviso("¡Se quemó una carne!", false); sfx.no(); pintarSlot(s); } }
      });
    });
  }
};
