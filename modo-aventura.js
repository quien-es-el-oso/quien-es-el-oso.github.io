/* MODO: La aventura del oso — runner en canvas por 3 zonas de la historia de la marca */
window.MODOS = window.MODOS || {};
window.MODOS.aventura = function (api, ganar) {
  const { screen, loop, listen, later, sfx, vibrar, rand, $, hud, piezasHTML, abrirPieza, setSkip, perdio, CFG } = api;

  const ZONAS = [
    { nombre: "Cerrillos · 2020", sub: "Una plancha chica, 45 burgers el primer día.", cielo: ["#0a1a55", "#2a4bc0"], edif: "#081c5e", vel: 240, dur: 20, meta: 5 },
    { nombre: "El primer local · 2022", sub: "Caerse también es parte de la receta.", cielo: ["#1b1446", "#5a3fa8"], edif: "#140f38", vel: 285, dur: 22, meta: 6 },
    { nombre: "Providencia · 2026", sub: "A la sombra de la torre más alta de Sudamérica.", cielo: ["#050f3a", "#0d2c91"], edif: "#06134a", vel: 330, dur: 24, meta: 7, torre: true },
  ];
  const GOOD = ["🧀", "🥓", "🍅", "🥬", "🧅", "🥒", "🥩"];
  const BAD = ["🍍", "🍬", "🦑", "🍭", "🍌", "🐙"];
  const OBST = [
    { e: "🚧", w: 34, h: 34 },
    { e: "📦", w: 34, h: 34 },
    { e: "🚧🚧", w: 66, h: 34 },
  ];
  const oso = new Image();
  oso.src = "assets/oso_cara.webp";

  let zona = 0;
  presentarZona();

  function presentarZona() {
    hud(ZONAS.length, zona);
    const Z = ZONAS[zona];
    const el = screen(`
      <div class="tag">Zona ${zona + 1} de ${ZONAS.length}</div>
      ${zona > 0 ? piezasHTML(ZONAS.length, zona - 1) : ""}
      ${zona > 0 ? `<p class="pista">“${CFG.teaser.pistas[zona - 1] || ""}”</p>` : ""}
      <h2>${Z.nombre}</h2>
      <p>${Z.sub}</p>
      <div class="card" style="text-align:left">
        <p><b>Toca</b> para saltar · <b>toca 2 veces</b> para doble salto</p>
        <p class="small">Junta al menos <b>${Z.meta} ingredientes</b> 🧀🥓🍅 y esquiva 🚧 y los inventos raros 🍍🦑.</p>
      </div>
      <button class="btn big" id="go">¡Correr!</button>`);
    if (zona > 0) abrirPieza(el, zona - 1);
    $("#go").onclick = () => { sfx.tap(); correr(); };
  }

  function terminarZona() {
    zona++;
    sfx.win(); vibrar([40, 60, 40]);
    if (zona >= ZONAS.length) {
      hud(ZONAS.length, zona);
      const el = screen(`
        <div class="tag">¡Llegaste!</div>
        ${piezasHTML(ZONAS.length, ZONAS.length - 1)}
        <p class="pista">“${CFG.teaser.pistas[ZONAS.length - 1] || ""}”</p>
        <button class="btn big" id="go">¡Ver mi premio!</button>`);
      abrirPieza(el, ZONAS.length - 1);
      $("#go").onclick = () => { sfx.tap(); ganar(); };
    } else presentarZona();
  }

  function correr() {
    const Z = ZONAS[zona];
    const el = screen(`<div class="runner" id="wrap"><canvas id="cv"></canvas></div>
      <p class="small">Toca la pantalla para saltar · ⬆️ / espacio en computador</p>`);
    const wrap = $("#wrap"), cv = $("#cv"), ctx = cv.getContext("2d");
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = wrap.clientWidth, H = wrap.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + "px"; cv.style.height = H + "px";
    ctx.scale(dpr, dpr);

    const SUELO = H - 56, BW = 52, BH = 62;
    const b = { x: 54, y: SUELO - BH, vy: 0, saltos: 0 };
    const ents = [];
    let t = 0, spawn = 1.2, vidas = 3, inv = 0, junt = 0, fin = false, scroll = 0, shake = 0;
    const pops = [];
    // skyline aleatorio por partida
    const edificios = [];
    for (let x = 0; x < W * 2.2; ) { const w = 30 + rand(50); edificios.push({ x, w, h: 50 + rand(120), win: rand(3) }); x += w + 4 + rand(14); }
    const estrellas = Array.from({ length: 30 }, () => ({ x: Math.random() * W, y: Math.random() * SUELO * 0.6, r: Math.random() * 1.4 + 0.3 }));

    setSkip(() => { fin = true; terminarZona(); });

    function saltar(e) {
      if (e) e.preventDefault();
      if (fin || b.saltos >= 2) return;
      b.vy = b.saltos === 0 ? -760 : -660;
      b.saltos++;
      sfx.jump();
    }
    listen(cv, "pointerdown", saltar);
    listen(window, "keydown", (e) => { if (e.code === "Space" || e.code === "ArrowUp") saltar(e); });

    function nuevo() {
      const r = Math.random();
      const vel = Z.vel + t * 4;
      if (r < 0.36) {
        const o = OBST[rand(OBST.length - (zona === 0 ? 1 : 0))];
        ents.push({ tipo: "obst", e: o.e, x: W + 20, y: SUELO - o.h, w: o.w, h: o.h, vel });
      } else if (r < 0.86) {
        const alto = Math.random() < 0.5;
        ents.push({ tipo: "good", e: GOOD[rand(GOOD.length)], x: W + 20, y: alto ? SUELO - 150 : SUELO - 42, w: 30, h: 30, vel });
        if (Math.random() < 0.5) ents.push({ tipo: "good", e: GOOD[rand(GOOD.length)], x: W + 60, y: alto ? SUELO - 150 : SUELO - 42, w: 30, h: 30, vel });
      } else {
        ents.push({ tipo: "bad", e: BAD[rand(BAD.length)], x: W + 20, y: SUELO - 110 - rand(30), w: 30, h: 30, vel: vel * 1.25 });
      }
    }

    function choca(a) {
      const m = 8;
      return b.x + m < a.x + a.w && b.x + BW - m > a.x && b.y + m < a.y + a.h && b.y + BH - 4 > a.y;
    }

    function dibujar() {
      const g = ctx.createLinearGradient(0, 0, 0, SUELO);
      g.addColorStop(0, Z.cielo[0]); g.addColorStop(1, Z.cielo[1]);
      ctx.save();
      if (shake > 0) ctx.translate((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 6);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "rgba(255,255,255,.7)";
      estrellas.forEach((s) => { ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.3); ctx.fill(); });
      // torre (zona Providencia)
      if (Z.torre) {
        const tx = W * 0.72 - scroll * 0.06, base = SUELO;
        ctx.fillStyle = "#0a226f";
        ctx.beginPath(); ctx.moveTo(tx - 34, base); ctx.lineTo(tx - 16, base - 300); ctx.lineTo(tx + 16, base - 300); ctx.lineTo(tx + 34, base); ctx.fill();
        ctx.fillStyle = "rgba(255,200,46,.5)";
        for (let yy = base - 290; yy < base - 10; yy += 14) ctx.fillRect(tx - 10, yy, 20, 3);
        ctx.fillStyle = "#ff5a5a"; ctx.beginPath(); ctx.arc(tx, base - 306, 3, 0, 6.3); ctx.fill();
      }
      // edificios con parallax
      const off = (scroll * 0.35) % (W * 2.2);
      ctx.fillStyle = Z.edif;
      edificios.forEach((e) => {
        let x = e.x - off; if (x + e.w < 0) x += W * 2.2;
        ctx.fillRect(x, SUELO - e.h, e.w, e.h);
        ctx.fillStyle = "rgba(255,200,46,.35)";
        for (let yy = SUELO - e.h + 10; yy < SUELO - 12; yy += 16) for (let xx = x + 6; xx < x + e.w - 8; xx += 12) if ((xx + yy + e.win) % 3) ctx.fillRect(xx, yy, 5, 6);
        ctx.fillStyle = Z.edif;
      });
      // suelo con cuadros de la marca
      ctx.fillStyle = "#081c5e"; ctx.fillRect(0, SUELO, W, H - SUELO);
      const sq = 14, so = scroll % (sq * 2);
      for (let x = -so; x < W; x += sq) {
        const i = Math.round((x + so) / sq);
        ctx.fillStyle = i % 2 ? "#fdf7ec" : "#0d2c91"; ctx.fillRect(x, SUELO, sq, sq / 2 + 1);
        ctx.fillStyle = i % 2 ? "#0d2c91" : "#fdf7ec"; ctx.fillRect(x, SUELO + sq / 2, sq, sq / 2);
      }
      // entidades
      ctx.textBaseline = "top";
      ents.forEach((a) => {
        ctx.font = `${a.h}px "Apple Color Emoji","Segoe UI Emoji",sans-serif`;
        ctx.fillText(a.e, a.x, a.y);
      });
      // oso
      if (!(inv > 0 && Math.floor(inv * 10) % 2)) {
        if (oso.complete) ctx.drawImage(oso, b.x, b.y, BW, BH);
        else { ctx.fillStyle = "#fdf7ec"; ctx.fillRect(b.x, b.y, BW, BH); }
      }
      // pops
      ctx.font = "900 18px Montserrat, sans-serif";
      pops.forEach((p) => { ctx.globalAlpha = Math.max(0, p.v); ctx.fillStyle = p.c; ctx.fillText(p.txt, p.x, p.y); });
      ctx.globalAlpha = 1;
      ctx.restore();
      // HUD
      ctx.font = "16px sans-serif"; ctx.textBaseline = "top";
      ctx.fillText("❤️".repeat(vidas) + "🖤".repeat(3 - vidas), 10, 12);
      ctx.font = "900 16px Montserrat, sans-serif"; ctx.fillStyle = junt >= Z.meta ? "#2ecc71" : "#fdf7ec";
      const txt = `🍔 ${junt}/${Z.meta}`; ctx.fillText(txt, W - 10 - ctx.measureText(txt).width, 12);
      const p = Math.min(1, t / Z.dur);
      ctx.fillStyle = "rgba(255,255,255,.2)"; ctx.fillRect(10, 40, W - 20, 6);
      ctx.fillStyle = "#ffc82e"; ctx.fillRect(10, 40, (W - 20) * p, 6);
      ctx.font = "16px sans-serif"; ctx.fillText("🏁", W - 26, 48);
      if (t < 2.5) {
        ctx.font = "800 15px Montserrat, sans-serif"; ctx.fillStyle = "#fdf7ec";
        const h = "Toca para saltar · 2 toques = doble salto"; ctx.fillText(h, (W - ctx.measureText(h).width) / 2, 70);
      }
    }

    loop((dtReal) => {
      if (fin) return false;
      // física en pasos de máx. 1/60 s: misma velocidad aunque el celular vaya lento
      for (let rem = dtReal; rem > 1e-4 && !fin; rem -= 1 / 60) paso(Math.min(rem, 1 / 60));
      dibujar();
    });

    function paso(dt) {
      t += dt; scroll += (Z.vel + t * 4) * dt;
      inv = Math.max(0, inv - dt); shake = Math.max(0, shake - dt);
      // física
      b.vy += 2300 * dt; b.y += b.vy * dt;
      if (b.y >= SUELO - BH) { b.y = SUELO - BH; b.vy = 0; b.saltos = 0; }
      // aparición
      if (t < Z.dur - 1.5) {
        spawn -= dt;
        if (spawn <= 0) { nuevo(); spawn = Math.max(0.55, 1.35 - t * 0.02 - zona * 0.12) * (0.75 + Math.random() * 0.6); }
      }
      for (let i = ents.length - 1; i >= 0; i--) {
        const a = ents[i];
        a.x -= a.vel * dt;
        if (a.x + a.w < -10) { ents.splice(i, 1); continue; }
        if (choca(a)) {
          if (a.tipo === "good") {
            junt++; sfx.tap(); pops.push({ x: a.x, y: a.y - 10, txt: "+1", c: "#ffc82e", v: 1 }); ents.splice(i, 1);
          } else if (inv <= 0) {
            vidas--; inv = 1.2; shake = 0.25; sfx.no(); vibrar(120);
            pops.push({ x: b.x, y: b.y - 16, txt: a.tipo === "bad" ? "¡Puaj!" : "¡Auch!", c: "#ff5a5a", v: 1 });
            if (a.tipo === "bad") ents.splice(i, 1);
          }
        }
      }
      for (let i = pops.length - 1; i >= 0; i--) { pops[i].y -= 40 * dt; pops[i].v -= dt * 1.4; if (pops[i].v <= 0) pops.splice(i, 1); }
      if (vidas <= 0) {
        fin = true; setSkip(null);
        later(() => perdio("Te tropezaste en " + Z.nombre.split(" ·")[0] + ".", presentarZona), 400);
      } else if (t >= Z.dur) {
        fin = true; setSkip(null);
        if (junt >= Z.meta) later(terminarZona, 300);
        else later(() => perdio(`Llegaste, pero con ${junt} de ${Z.meta} ingredientes. Sin ingredientes no hay burger.`, presentarZona), 300);
      }
    }
  }
};
