/* ¿Quién es el oso? — núcleo: utilidades, ruleta de modos, revelación y retos cortos.
   Los modos grandes viven en modo-*.js y se registran en window.MODOS. */
(() => {
  const CFG = window.CONFIG;
  const $app = document.getElementById("app");
  const $ = (s, r = document) => r.querySelector(s);
  const params = new URLSearchParams(location.search);
  const DEMO = params.has("demo");
  const PARAM_P = (params.get("p") || "").toUpperCase();

  /* ---------- utilidades ---------- */
  let cleanups = [];
  const clear = () => { cleanups.forEach((f) => { try { f(); } catch (e) {} }); cleanups = []; };
  function screen(html) {
    clear();
    $app.innerHTML = `<section class="screen">${html}</section>`;
    window.scrollTo(0, 0);
    return $app.firstElementChild;
  }
  const rand = (n) => Math.floor(Math.random() * n);
  const shuffle = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = rand(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pick = (a, n) => shuffle(a).slice(0, n);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const later = (fn, ms) => { const t = setTimeout(fn, ms); cleanups.push(() => clearTimeout(t)); };
  function loop(fn) {
    let id, last = performance.now();
    const f = (t) => { const dt = Math.min(50, t - last) / 1000; last = t; if (fn(dt) !== false) id = requestAnimationFrame(f); };
    id = requestAnimationFrame(f);
    cleanups.push(() => cancelAnimationFrame(id));
  }
  function listen(target, ev, fn, opts) { target.addEventListener(ev, fn, opts); cleanups.push(() => target.removeEventListener(ev, fn, opts)); }
  const once = (fn) => { let done = false; return (...a) => { if (!done) { done = true; fn(...a); } }; };
  const vibrar = (ms) => { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) {} };
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  };
  function toast(msg) {
    const t = document.createElement("div");
    t.className = "toast"; t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 1800);
  }
  function hearts(el, vidas, total) {
    el.innerHTML = Array.from({ length: total }, (_, k) => `<span class="${k < vidas ? "" : "off"}">❤️</span>`).join("");
  }

  /* ---------- sonido (sin archivos: WebAudio) ---------- */
  let muted = !!store.get("ba_mute"), actx;
  function beep(freq = 600, dur = 0.08, type = "square", vol = 0.05) {
    if (muted) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = type; o.frequency.value = freq;
      g.gain.setValueAtTime(vol, actx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + dur);
      o.connect(g).connect(actx.destination);
      o.start(); o.stop(actx.currentTime + dur);
    } catch (e) {}
  }
  const sfx = {
    tap: () => beep(440, 0.04, "triangle", 0.04),
    ok: () => { beep(660, 0.08); setTimeout(() => beep(990, 0.1), 70); },
    no: () => beep(150, 0.25, "sawtooth", 0.06),
    jump: () => beep(520, 0.07, "triangle", 0.05),
    win: () => [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => beep(f, 0.15, "square", 0.05), i * 120)),
  };
  const $mute = $("#mute");
  const pintarMute = () => { $mute.textContent = muted ? "🔇" : "🔊"; };
  pintarMute();
  $mute.onclick = () => { muted = !muted; store.set("ba_mute", muted); pintarMute(); sfx.tap(); };

  /* ---------- ingredientes (capas CSS) ---------- */
  const ING = {
    pan_base: "Pan (base)", carne: "Carne 70/30", queso: "Queso", tocino: "Tocino",
    pepinillos: "Pepinillos", cebolla: "Cebolla", tomate: "Tomate", lechuga: "Lechuga",
    pan_top: "Pan (tapa)", pina: "Piña", platano: "Plátano", gomitas: "Gomitas",
  };
  const RAROS = ["pina", "platano", "gomitas"];
  const layer = (k) => `<div class="layer l-${k}"></div>`;

  /* ---------- HUD de progreso ---------- */
  const $hud = $("#hud"), $dots = $("#dots");
  function hud(n, i) {
    if (n === false || n == null) { $hud.hidden = true; return; }
    $hud.hidden = false;
    $dots.innerHTML = Array.from({ length: n }, (_, k) => `<span class="${k < i ? "done" : k === i ? "now" : ""}"></span>`).join("");
  }

  /* ---------- logo misterioso por piezas ---------- */
  function piezasHTML(n, abiertas) {
    return `<div class="mystery"><img src="assets/logo_blanco.webp" alt="">
      <div class="tiles" style="grid-template-columns:repeat(${n},1fr)">
        ${Array.from({ length: n }, (_, k) => `<div class="tile ${k < abiertas ? "gone" : ""}">?</div>`).join("")}
      </div></div>`;
  }
  function abrirPieza(el, idx) {
    later(() => { const t = el.querySelectorAll(".tile")[idx]; if (t) { t.classList.add("gone"); sfx.ok(); } }, 450);
  }

  /* ---------- modo demo ---------- */
  let skip = null;
  if (DEMO) {
    const b = document.createElement("button");
    b.className = "btn alt demo-skip"; b.textContent = "Saltar ⏭";
    b.onclick = () => { if (skip) { const f = skip; skip = null; f(); } };
    document.body.appendChild(b);
  }
  const setSkip = (fn) => { skip = fn; };

  /* =========================================================
     FLUJO PRINCIPAL
     ========================================================= */
  function intro() {
    hud(false);
    const prev = CFG.juego.unCodigoPorDispositivo && !DEMO ? store.get("ba_win") : null;
    if (prev && prev.codigo && window.Codigo.hoy() <= prev.vence) return revelacion(prev, true);
    // Si ya está en la cacería y llega desde un afiche, directo a la cacería
    const modoGuardado = DEMO ? null : store.get("ba_modo");
    if (modoGuardado === "caceria" && PARAM_P) return empezar("caceria");

    const demoBtns = DEMO ? `<p class="small">Modo demo — elegir modo:</p>
      <div class="btn-row">${CFG.juego.modos.map((m) => `<button class="btn alt" data-m="${m}">${CFG.modos[m].emoji} ${CFG.modos[m].nombre}</button>`).join("")}</div>` : "";
    const el = screen(`
      <div class="tag">Desafío Providencia</div>
      <h1>${CFG.teaser.titulo}</h1>
      <div class="silueta-wrap"><img class="silueta" src="assets/oso_blanco.webp" alt=""><div class="q">?</div></div>
      <p>${CFG.teaser.bajada}</p>
      <p class="small">Al final te espera una dirección… y un premio.</p>
      <button class="btn big" id="go">${modoGuardado ? "Seguir mi desafío" : "🎰 Girar la ruleta"}</button>
      ${demoBtns}`);
    $("#go").onclick = () => { sfx.ok(); ruleta(); };
    el.querySelectorAll("[data-m]").forEach((b) => (b.onclick = () => { sfx.ok(); presentar(b.dataset.m); }));
  }

  function ruleta() {
    const lista = CFG.juego.modos.filter((m) => window.MODOS && window.MODOS[m]);
    let modo = DEMO ? null : store.get("ba_modo");
    const yaTenia = !!(modo && lista.includes(modo));
    if (!yaTenia) {
      modo = lista[rand(lista.length)];
      if (!DEMO) store.set("ba_modo", modo);
    }
    if (yaTenia) return presentar(modo);
    hud(false);
    screen(`
      <div class="tag">Tu desafío es…</div>
      <div class="ruleta"><div class="ruleta-emoji" id="re">🎰</div><div class="ruleta-nombre" id="rn">…</div></div>`);
    const re = $("#re"), rn = $("#rn");
    let i = rand(lista.length), paso = 0;
    const pasos = 14 + lista.indexOf(modo) + lista.length * 2 - (i % lista.length);
    const tick = () => {
      const m = lista[i % lista.length];
      re.textContent = CFG.modos[m].emoji; rn.textContent = CFG.modos[m].nombre;
      beep(300 + paso * 25, 0.04, "triangle", 0.04);
      paso++; i++;
      if (paso < pasos) later(tick, 60 + paso * paso * 1.4);
      else later(() => { sfx.win(); vibrar([30, 40, 30]); presentar(modo); }, 700);
    };
    // asegura que caiga en el modo elegido
    i = (lista.indexOf(modo) - (pasos - 1) % lista.length + lista.length * 10) % lista.length;
    tick();
  }

  function presentar(modo) {
    const M = CFG.modos[modo];
    hud(false);
    screen(`
      <div class="tag">Te tocó</div>
      <div style="font-size:84px;line-height:1">${M.emoji}</div>
      <h2>${M.nombre}</h2>
      <p>${M.desc}</p>
      <button class="btn big" id="go">¡Vamos!</button>`);
    $("#go").onclick = () => { sfx.tap(); empezar(modo); };
  }

  function empezar(modo) {
    const t0 = Date.now();
    window.MODOS[modo](api, once(() => ganar(modo, t0)), { p: PARAM_P });
  }

  function ganar(modo, t0) {
    setSkip(null);
    const pesos = (CFG.modos[modo] && CFG.modos[modo].pesos) || CFG.promos.map((p) => p.peso);
    const tot = pesos.reduce((a, b) => a + b, 0);
    let r = Math.random() * tot, idx = 0;
    for (; idx < pesos.length - 1; idx++) { r -= pesos[idx]; if (r < 0) break; }
    while (!pesos[idx]) idx = (idx + 1) % pesos.length;
    const premio = { ...window.Codigo.generar(idx), promoIdx: idx, modo, segundos: Math.round((Date.now() - t0) / 1000) };
    if (!DEMO) store.set("ba_win", premio);
    revelacion(premio, false);
  }

  function revelacion(p, repetido) {
    hud(false);
    const promo = CFG.promos[p.promoIdx] || CFG.promos[0];
    const M = CFG.marca;
    const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(M.mapsQuery)}`;
    const tiempo = p.segundos && p.modo !== "caceria" ? ` Lo lograste en ${p.segundos} s.` : "";
    screen(`
      <div class="tag">${repetido ? "Ya descubriste al oso" : "¡Lo descubriste!"}</div>
      <img class="reveal-logo" src="assets/logo_blanco.webp" alt="${M.nombre}">
      <img class="oso-reveal" src="assets/oso_blanco.webp" alt="">
      <div class="cupon">
        <div class="tag">Desbloqueaste</div>
        <div class="promo">${promo.nombre}</div>
        <div class="precio">${promo.precio}</div>
        <p class="small">${promo.detalle}</p>
        <div class="code" id="code" title="Toca para copiar">${p.codigo}</div>
        <p class="small">Válido hasta el ${p.venceTexto} · muestra este código en caja</p>
      </div>
      <div class="card">
        <div class="info-row"><span class="ico">📍</span><div><b>Dónde encontrarme</b><p class="small">${M.direccion}</p></div></div>
      </div>
      <div class="btn-row">
        <a class="btn" href="${maps}" target="_blank" rel="noopener">Cómo llegar</a>
        <a class="btn alt" href="https://instagram.com/${M.instagram}" target="_blank" rel="noopener">@${M.instagram}</a>
      </div>
      <button class="btn alt" id="share">🐻 Desafía a un amigo</button>
      <p class="small">${M.slogan}${tiempo} Saca pantallazo y a comer.</p>`);
    $("#code").onclick = () => { navigator.clipboard?.writeText(p.codigo).then(() => toast("Código copiado"), () => {}); };
    $("#share").onclick = async () => {
      const data = { title: CFG.teaser.titulo, text: "¿Quién es el oso? 🐻🍔 Yo ya lo descubrí. Gira la ruleta y averígualo:", url: location.origin + location.pathname };
      try {
        if (navigator.share) await navigator.share(data);
        else { await navigator.clipboard.writeText(`${data.text} ${data.url}`); toast("Link copiado"); }
      } catch (e) {}
    };
    if (!repetido) { sfx.win(); confetti(); }
  }

  function confetti() {
    const c = document.createElement("div");
    c.className = "confetti";
    const cols = ["#fdf7ec", "#ffc82e", "#ffffff", "#3d5bd1", "#ff5a5a"];
    for (let i = 0; i < 70; i++) {
      const s = document.createElement("i");
      s.style.left = Math.random() * 100 + "%";
      s.style.background = cols[i % cols.length];
      s.style.animationDuration = 1.8 + Math.random() * 1.8 + "s";
      s.style.animationDelay = Math.random() * 0.6 + "s";
      c.appendChild(s);
    }
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 4500);
  }

  /* pantalla genérica de "perdiste, reintenta" */
  function perdio(msg, reintentar) {
    sfx.no(); vibrar(200);
    screen(`
      <div style="font-size:72px;line-height:1">🐻</div>
      <h2>¡Casi!</h2>
      <p><b>${msg || ""}</b></p>
      <p>El oso te da otra oportunidad… pero esta vez todo cambia.</p>
      <button class="btn big" id="go">Reintentar</button>`);
    $("#go").onclick = () => { sfx.tap(); reintentar(); };
  }

  /* =========================================================
     RETOS CORTOS — cada uno recibe win() y lose(mensaje).
     Se usan en cada afiche de la cacería.
     ========================================================= */
  const RETOS = {
    armar: { titulo: "Arma la burger", emoji: "🍔", desc: "Memoriza la receta secreta. Después ármala de abajo hacia arriba.", fn: jArmar },
    smash: { titulo: "Smash perfecto", emoji: "💥", desc: "Aplasta la carne justo cuando la aguja pase por la zona verde. Tres veces.", fn: jSmash },
    atrapa: { titulo: "Lo simple, hecho bien", emoji: "🐻", desc: "Mueve al oso y atrapa ingredientes de verdad. Esquiva los inventos raros.", fn: jAtrapa },
    memoria: { titulo: "Memoria del oso", emoji: "🧠", desc: "Encuentra todas las parejas antes de que se acabe el tiempo.", fn: jMemoria },
    pistas: { titulo: "Pistas del oso", emoji: "🔎", desc: "Responde 3 preguntas sobre el misterioso cocinero. Si te pierdes, pide una pista.", fn: jPistas },
  };

  /* juega un reto al azar con reintentos; llama onWin al ganarlo */
  function jugarReto(onWin, encabezado) {
    const key = CFG.juego.retos[rand(CFG.juego.retos.length)];
    const R = RETOS[key];
    screen(`
      ${encabezado || ""}
      <div style="font-size:72px;line-height:1">${R.emoji}</div>
      <h2>${R.titulo}</h2>
      <p>${R.desc}</p>
      <button class="btn big" id="go">¡Vamos!</button>`);
    $("#go").onclick = () => {
      sfx.tap();
      const win = once(() => { setSkip(null); sfx.win(); vibrar([40, 60, 40]); onWin(); });
      const lose = once((msg) => { setSkip(null); perdio(msg, () => jugarReto(onWin, encabezado)); });
      setSkip(win);
      R.fn(win, lose);
    };
  }

  /* 1. Arma la burger: memoria de receta aleatoria */
  function jArmar(win, lose) {
    const nombres = Object.keys(CFG.recetas);
    const nombre = nombres[rand(nombres.length)];
    const receta = CFG.recetas[nombre];
    const verMs = 2200 + receta.length * 350;
    screen(`
      <div class="tag">Memoriza la receta</div>
      <div class="receta-card">
        <div class="nombre">${nombre}</div>
        <div class="stack">${receta.map(layer).join("")}</div>
        <div class="timer-bar"><i id="tb"></i></div>
      </div>
      <p class="small">${receta.map((k) => ING[k]).join(" → ")}</p>`);
    $("#tb").animate([{ transform: "scaleX(1)" }, { transform: "scaleX(0)" }], { duration: verMs, fill: "forwards" });
    later(armar, verMs);

    function armar() {
      const extras = pick(Object.keys(ING).filter((k) => !receta.includes(k) && !RAROS.includes(k)), 1);
      const opciones = shuffle([...receta, ...pick(RAROS, 2), ...extras]);
      const total = CFG.juego.erroresPermitidos + 1;
      let pos = 0, vidas = total, fin = false;
      const el = screen(`
        <div class="tag">Arma la ${nombre}</div>
        <div class="lives" id="lv"></div>
        <div class="stack" id="st"></div>
        <div class="feedback" id="fb">&nbsp;</div>
        <div class="tray">${opciones.map((k) => `<button class="chip" data-k="${k}">${layer(k)}<span>${ING[k]}</span></button>`).join("")}</div>`);
      const lv = $("#lv"), st = $("#st"), fb = $("#fb");
      hearts(lv, vidas, total);
      el.querySelectorAll(".chip").forEach((b) => b.addEventListener("click", () => {
        if (fin) return;
        const k = b.dataset.k;
        if (k === receta[pos]) {
          st.insertAdjacentHTML("beforeend", layer(k));
          b.disabled = true; b.style.opacity = 0.35;
          pos++; sfx.tap();
          if (pos === receta.length) { fin = true; fb.className = "feedback ok"; fb.textContent = "¡Así se hace!"; later(win, 900); }
        } else {
          vidas--; hearts(lv, vidas, total); sfx.no(); vibrar(80);
          b.classList.remove("bad"); void b.offsetWidth; b.classList.add("bad");
          fb.className = "feedback no";
          fb.textContent = RAROS.includes(k) ? "¡¿" + ING[k] + "?! Nada de inventos raros" : "Ese no va ahí";
          if (vidas <= 0) { fin = true; later(() => lose(`Esa no era la receta de la ${nombre}.`), 700); }
        }
      }));
    }
  }

  /* 2. Smash perfecto: timing */
  function jSmash(win, lose) {
    screen(`
      <div class="tag">Smash perfecto</div>
      <div class="plancha"><div class="bolita" id="bol"></div><div class="humo" id="humo">💨💨</div></div>
      <div class="lives" id="lv"></div>
      <div class="meter"><div class="zone" id="zone"></div><div class="needle" id="needle"></div></div>
      <div class="feedback" id="fb">Smash 0 de 3</div>
      <button class="btn big" id="hit">¡SMASH!</button>`);
    const bol = $("#bol"), humo = $("#humo"), Z = $("#zone"), N = $("#needle"), fb = $("#fb"), lv = $("#lv");
    const total = CFG.juego.erroresPermitidos + 1;
    let hits = 0, vidas = total, pos = 0, dir = 1, speed = 0, zone = null, busy = false, fin = false;
    hearts(lv, vidas, total);
    function ronda() {
      const w = [24, 18, 13][hits];
      const a = 8 + Math.random() * (84 - w);
      zone = { a, b: a + w };
      Z.style.left = a + "%"; Z.style.width = w + "%";
      speed = 60 + hits * 25 + Math.random() * 30;
      dir = Math.random() < 0.5 ? 1 : -1;
      pos = dir > 0 ? 0 : 100;
      N.style.left = pos + "%";
    }
    ronda();
    loop((dt) => {
      if (!busy) {
        pos += dir * speed * dt;
        if (pos > 100) { pos = 100; dir = -1; }
        if (pos < 0) { pos = 0; dir = 1; }
        N.style.left = pos + "%";
      }
    });
    function golpe(e) {
      if (e) e.preventDefault();
      if (busy || fin) return;
      busy = true;
      if (pos >= zone.a && pos <= zone.b) {
        hits++;
        bol.className = "bolita s" + hits;
        humo.classList.remove("on"); void humo.offsetWidth; humo.classList.add("on");
        sfx.ok(); vibrar(60);
        fb.className = "feedback ok"; fb.textContent = `¡SMASH! ${hits} de 3`;
        if (hits >= 3) { fin = true; later(win, 900); }
        else later(() => { busy = false; ronda(); }, 650);
      } else {
        vidas--; hearts(lv, vidas, total); sfx.no(); vibrar(120);
        fb.className = "feedback no"; fb.textContent = "¡Fuera de la zona!";
        if (vidas <= 0) { fin = true; later(() => lose("La carne se te enfrió."), 700); }
        else later(() => { busy = false; ronda(); }, 650);
      }
    }
    listen($("#hit"), "pointerdown", golpe);
    listen(window, "keydown", (e) => { if (e.code === "Space" || e.code === "Enter") golpe(e); });
  }

  /* 3. Lo simple, hecho bien: atrapar ingredientes */
  function jAtrapa(win, lose) {
    const META = 10 + rand(4);
    const GOOD = ["🧀", "🥓", "🍅", "🥬", "🧅", "🥒", "🥩", "🍞"];
    const BAD = ["🍍", "🍬", "🍫", "🍓", "🐙", "🍌", "🍭", "🦑"];
    const total = CFG.juego.erroresPermitidos + 1;
    screen(`
      <div class="score-row"><span>🍔 <b id="sc">0</b> / ${META}</span><span class="lives" id="lv"></span></div>
      <div class="arena" id="ar">
        <div class="hint" id="hint">👆 Arrastra el dedo para mover al oso</div>
        <img class="oso" id="oso" src="assets/oso_cara.webp" alt="">
      </div>
      <p class="small">Ingredientes de verdad: sí. Inventos raros (🍍🍬🦑): no.</p>`);
    const ar = $("#ar"), oso = $("#oso"), sc = $("#sc"), lv = $("#lv");
    const OW = 84;
    let W = ar.clientWidth, H = ar.clientHeight, ox = W / 2, kv = 0;
    let spawn = 0.6, t = 0, score = 0, vidas = total, fin = false;
    const items = [];
    hearts(lv, vidas, total);
    const mover = (e) => {
      const r = ar.getBoundingClientRect();
      ox = clamp(e.clientX - r.left, OW / 2, W - OW / 2);
      const h = $("#hint"); if (h) h.remove();
    };
    listen(ar, "pointerdown", mover);
    listen(ar, "pointermove", mover);
    listen(window, "keydown", (e) => { if (e.key === "ArrowLeft") kv = -1; if (e.key === "ArrowRight") kv = 1; });
    listen(window, "keyup", (e) => { if (e.key === "ArrowLeft" || e.key === "ArrowRight") kv = 0; });
    function pop(x, y, txt, color) {
      const p = document.createElement("div");
      p.className = "pop"; p.textContent = txt; p.style.left = x - 14 + "px"; p.style.top = y + "px"; p.style.color = color;
      ar.appendChild(p); setTimeout(() => p.remove(), 650);
    }
    loop((dt) => {
      if (fin) return false;
      W = ar.clientWidth; H = ar.clientHeight;
      t += dt; spawn -= dt;
      if (spawn <= 0) {
        spawn = Math.max(0.42, 0.95 - t * 0.02) * (0.7 + Math.random() * 0.6);
        const bad = Math.random() < Math.min(0.5, 0.3 + t * 0.007);
        const e = document.createElement("span");
        e.className = "item";
        e.textContent = bad ? BAD[rand(BAD.length)] : GOOD[rand(GOOD.length)];
        ar.appendChild(e);
        items.push({ e, x: 22 + Math.random() * (W - 44), y: -40, v: 150 + Math.random() * 90 + t * 5, bad });
      }
      if (kv) ox = clamp(ox + kv * 420 * dt, OW / 2, W - OW / 2);
      oso.style.transform = `translateX(${ox - OW / 2}px)`;
      for (let i = items.length - 1; i >= 0; i--) {
        const it = items[i];
        it.y += it.v * dt;
        it.e.style.transform = `translate(${it.x - 17}px, ${it.y}px)`;
        const atrapado = it.y > H - 110 && it.y < H - 40 && Math.abs(it.x - ox) < OW / 2 + 6;
        if (atrapado) {
          it.e.remove(); items.splice(i, 1);
          if (it.bad) { vidas--; hearts(lv, vidas, total); sfx.no(); vibrar(100); pop(it.x, H - 130, "¡Puaj!", "#ff5a5a"); }
          else { score++; sc.textContent = score; sfx.tap(); pop(it.x, H - 130, "+1", "#ffc82e"); }
        } else if (it.y > H) { it.e.remove(); items.splice(i, 1); }
      }
      if (score >= META) { fin = true; later(win, 500); }
      else if (vidas <= 0) { fin = true; later(() => lose("El oso no acepta inventos raros."), 500); }
    });
  }

  /* 4. Memoria con los stickers de la marca */
  function jMemoria(win, lose) {
    const imgs = pick(["oso_cara", "burger_sticker", "mano_burger", "smash", "since", "steak", "aqui", "oso_circulo"], 6);
    const cards = shuffle([...imgs, ...imgs]);
    let T = 38 + rand(10), pares = 0, abiertas = [], lock = true, fin = false;
    const el = screen(`
      <div class="score-row"><span>⏱ <b id="tm">${T}</b> s</span><span>Parejas <b id="pr">0</b> / 6</span></div>
      <div class="grid-mem">${cards.map((k) => `
        <div class="mcard" data-k="${k}">
          <div class="f"><span class="script" style="font-size:34px;color:var(--crema)">?</span></div>
          <div class="b"><img src="assets/${k}.webp" alt=""></div>
        </div>`).join("")}</div>
      <p class="small">Un vistazo rápido al inicio… ¡atento!</p>`);
    const tm = $("#tm"), pr = $("#pr");
    const all = [...el.querySelectorAll(".mcard")];
    later(() => all.forEach((c) => c.classList.add("flip")), 300);
    later(() => { all.forEach((c) => c.classList.remove("flip")); lock = false; }, 1700);
    let acc = 0;
    later(() => loop((dt) => {
      if (fin) return false;
      acc += dt;
      if (acc >= 1) { acc -= 1; T--; tm.textContent = T; if (T <= 5) beep(880, 0.03); }
      if (T <= 0) { fin = true; lose("Se acabó el tiempo."); return false; }
    }), 1700);
    all.forEach((c) => c.addEventListener("click", () => {
      if (lock || fin || c.classList.contains("flip")) return;
      c.classList.add("flip"); sfx.tap();
      abiertas.push(c);
      if (abiertas.length === 2) {
        const [a, b] = abiertas;
        abiertas = [];
        if (a.dataset.k === b.dataset.k) {
          a.classList.add("match"); b.classList.add("match");
          pares++; pr.textContent = pares; sfx.ok();
          if (pares === 6) { fin = true; later(win, 700); }
        } else {
          lock = true;
          later(() => { a.classList.remove("flip"); b.classList.remove("flip"); lock = false; }, 650);
        }
      }
    }));
  }

  /* 5. Pistas del oso: trivia aleatoria */
  function jPistas(win, lose) {
    const qs = pick(CFG.preguntas, 3);
    const total = CFG.juego.erroresPermitidos + 1;
    let i = 0, vidas = total;
    function show() {
      const q = qs[i];
      const opts = shuffle([q.ok, ...q.no]);
      let fin = false;
      const el = screen(`
        <div class="tag">Pregunta ${i + 1} de ${qs.length}</div>
        <div class="lives" id="lv"></div>
        <p style="font-weight:900;font-size:21px">${q.q}</p>
        <div class="opts">${opts.map((o, k) => `<button class="opt" data-i="${k}">${o}</button>`).join("")}</div>
        <button class="hint-btn" id="hb">🐻 Pedir pista</button>
        <p class="small" id="ht"></p>`);
      hearts($("#lv"), vidas, total);
      $("#hb").onclick = () => { $("#ht").textContent = q.pista; $("#hb").remove(); sfx.tap(); };
      el.querySelectorAll(".opt").forEach((b) => b.addEventListener("click", () => {
        if (fin || b.disabled) return;
        if (opts[b.dataset.i] === q.ok) {
          fin = true; b.classList.add("ok"); sfx.ok();
          later(() => { i++; if (i >= qs.length) win(); else show(); }, 700);
        } else {
          b.classList.add("no"); b.disabled = true; vidas--; hearts($("#lv"), vidas, total); sfx.no(); vibrar(80);
          if (vidas <= 0) { fin = true; later(() => lose("El oso esperaba que lo conocieras mejor."), 700); }
        }
      }));
    }
    show();
  }

  /* ---------- API compartida con los modos ---------- */
  const api = {
    CFG, DEMO, $, screen, later, loop, listen, once, rand, shuffle, pick, clamp, vibrar, store, toast, hearts,
    beep, sfx, ING, RAROS, layer, hud, piezasHTML, abrirPieza, setSkip, perdio, jugarReto, RETOS,
  };
  window.BA = api;

  window.addEventListener("DOMContentLoaded", intro);
})();
