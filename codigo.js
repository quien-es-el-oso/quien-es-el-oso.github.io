/* Generación y validación de códigos de descuento.
   Formato: BA-PDDRRR-CCCC
     P   = promo (índice en CONFIG.promos)
     DD  = día de vencimiento (días desde CONFIG.codigo.epoch)
     RRR = aleatorio
     CCCC = firma (hash de secreto + PDDRRR)
   Alfabeto sin caracteres confusos (sin 0, 1, O, I). */
(function () {
  const ALPH = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  const C = window.CONFIG.codigo;

  function cyrb53(str, seed = 0) {
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    for (let i = 0, ch; i < str.length; i++) {
      ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
    h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
    h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
  }
  const enc = (n, len) => {
    let s = "";
    for (let i = 0; i < len; i++) { s = ALPH[n % 32] + s; n = Math.floor(n / 32); }
    return s;
  };
  const dec = (s) => [...s].reduce((n, ch) => {
    const v = ALPH.indexOf(ch);
    if (v < 0) throw new Error("char");
    return n * 32 + v;
  }, 0);

  const epochMs = Date.parse(C.epoch + "T00:00:00Z");
  const hoy = () => Math.floor((Date.now() - epochMs) / 86400000);
  const diaAFecha = (d) => {
    const f = new Date(epochMs + d * 86400000);
    return f.toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" });
  };
  const firma = (payload) => enc(cyrb53(C.secreto + payload) % 1048576, 4);

  function generar(promoIdx) {
    const vence = hoy() + C.diasValidez;
    const rnd = new Uint32Array(1);
    crypto.getRandomValues(rnd);
    const payload = ALPH[promoIdx] + enc(vence, 2) + enc(rnd[0] % 32768, 3);
    return { codigo: `${C.prefijo}-${payload}-${firma(payload)}`, vence, venceTexto: diaAFecha(vence) };
  }

  // Devuelve {estado: "valido"|"vencido"|"invalido", promo, venceTexto}
  function validar(texto) {
    const limpio = String(texto).toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!limpio.startsWith(C.prefijo) || limpio.length !== C.prefijo.length + 10) return { estado: "invalido" };
    const payload = limpio.slice(C.prefijo.length, C.prefijo.length + 6);
    const chk = limpio.slice(-4);
    try {
      if (firma(payload) !== chk) return { estado: "invalido" };
      const promo = window.CONFIG.promos[dec(payload[0])];
      if (!promo) return { estado: "invalido" };
      const vence = dec(payload.slice(1, 3));
      const codigo = `${C.prefijo}-${payload}-${chk}`;
      return { estado: hoy() > vence ? "vencido" : "valido", promo, vence, venceTexto: diaAFecha(vence), codigo };
    } catch (e) {
      return { estado: "invalido" };
    }
  }

  window.Codigo = { generar, validar, hoy };
})();
