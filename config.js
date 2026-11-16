/* =========================================================
   CONFIGURACIÓN DEL JUEGO — editar solo este archivo
   para cambiar marca, dirección, promos o dificultad.
   ========================================================= */
window.CONFIG = {
  marca: {
    nombre: "Burgeadictos",
    slogan: "Lo simple, hecho bien.",
    instagram: "burgeadictoschile",
    // PENDIENTE: dirección exacta del local
    direccion: "Galería frente al Hospital Metropolitano, a pasos del Costanera Center · Providencia",
    mapsQuery: "Burgeadictos Providencia",
  },

  // Texto del teaser (antes de revelar la marca)
  teaser: {
    titulo: "Gánate tu burger",
    bajada: "Gira la ruleta, supera el desafío que te toque y desbloquea una promo en Burgeadictos.",
    // Pistas que se desbloquean después de cada desafío ganado
    pistas: [
      "Dato: nacimos en 2020 en una cocina de Cerrillos. El primer día vendimos 45 burgers.",
      "Dato: carne 70/30, una sola molienda y grano grueso. Por eso es tan jugosa.",
      "Dato: estamos frente al Hospital Metropolitano, a pasos del Costanera Center.",
    ],
  },

  // Promos vigentes (no se cambian precios: el código da acceso a la promo).
  // "peso" = probabilidad relativa de salir como premio.
  promos: [
    { id: "OKLA", nombre: "Oklahoma simple", precio: "$5.990", detalle: "Smash con cebolla, técnica especial.", peso: 3 },
    { id: "COMBO", nombre: "Combo dobles + papas + bebida", precio: "$10.990", detalle: "Para llegar con hambre de verdad.", peso: 2 },
    { id: "DUO", nombre: "2X hamburguesas simples", precio: "$15.990", detalle: "Trae a alguien. O no, no juzgamos.", peso: 2 },
  ],

  juego: {
    // Modos grandes: a cada jugador le toca uno al azar (ruleta) y queda guardado
    modos: ["aventura", "cocina", "caceria"],
    // Minijuegos cortos que se usan en cada afiche de la cacería
    retos: ["armar", "smash", "atrapa", "memoria", "pistas"],
    erroresPermitidos: 2,
    unCodigoPorDispositivo: true,
  },

  modos: {
    aventura: {
      nombre: "La aventura del oso", emoji: "🏃",
      desc: "Corre con el oso desde Cerrillos hasta Providencia. Salta obstáculos, junta ingredientes y esquiva los inventos raros.",
    },
    cocina: {
      nombre: "Hora peak en la plancha", emoji: "🔥",
      desc: "Los pedidos no paran. Haz smash, saca la carne dorada antes de que se queme y arma 5 burgers antes de que los clientes se aburran.",
      pedidosMeta: 5,
    },
    caceria: {
      nombre: "La cacería del oso", emoji: "🗺️",
      desc: "El oso dejó afiches por Providencia. Encuéntralos, supera el desafío de cada uno y junta las 3 piezas. Es el más difícil… y da los mejores premios.",
      // pesos de premio propios (mismo orden que "promos"): sin Oklahoma sola
      pesos: [0, 1, 2],
    },
  },

  // Afiches de la cacería. Cada afiche tiene un QR con ?p=<id> y su palabra secreta impresa.
  // PENDIENTE: definir los lugares reales donde se pegan.
  caceria: {
    estaciones: [
      { id: "A", lugar: "El mirador", pista: "Empieza donde miles suben al mirador más alto de Sudamérica.", palabra: "PLANCHA" },
      { id: "B", lugar: "El metro", pista: "Donde dos líneas de metro se cruzan en Tobalaba, un oso te espera.", palabra: "SMASH" },
      { id: "C", lugar: "La galería", pista: "Frente a un hospital, dentro de una galería, el oso guarda su último secreto.", palabra: "SETENTATREINTA" },
    ],
  },

  codigo: {
    prefijo: "BA",
    diasValidez: 2,
    epoch: "2026-01-01", // día 0 del contador de fechas del código
    // Clave para firmar códigos. En el prototipo vive en el navegador;
    // en la versión real se mueve a un servidor.
    secreto: "oso-polar-70/30-smash",
  },

  // Recetas (de abajo hacia arriba). Aproximadas: confirmar con el local.
  recetas: {
    Rover:    ["pan_base", "carne", "queso", "tocino", "pepinillos", "pan_top"],
    Oklahoma: ["pan_base", "carne", "cebolla", "queso", "pan_top"],
    Libra:    ["pan_base", "carne", "queso", "tomate", "pepinillos", "cebolla", "pan_top"],
    TLC:      ["pan_base", "carne", "queso", "tomate", "lechuga", "pan_top"],
  },

  // Banco de preguntas para el desafío "Pistas del oso"
  preguntas: [
    { q: "Vivo cerca de la torre más alta de Sudamérica. ¿Cuál es?", ok: "Costanera Center", no: ["Torre Entel", "Torre Eiffel", "Cerro San Cristóbal"], pista: "Tiene un mall abajo y un mirador arriba." },
    { q: "Soy un oso al que no le da frío. ¿Qué oso soy?", ok: "Oso polar", no: ["Oso panda", "Oso pardo", "Oso hormiguero"], pista: "Mira mi pelaje blanco." },
    { q: "¿En qué comuna está mi local?", ok: "Providencia", no: ["Maipú", "Puente Alto", "La Florida"], pista: "La misma comuna del Costanera." },
    { q: "Nací en 2020 en la cocina de una casa en…", ok: "Cerrillos", no: ["Vitacura", "Lo Barnechea", "Valparaíso"], pista: "Rima con «membrillos»." },
    { q: "Aplastar la carne contra la plancha bien caliente se llama…", ok: "Smash", no: ["Flambé", "Sous-vide", "Al vapor"], pista: "En inglés significa «aplastar»." },
    { q: "Mi lema: «Lo ___, hecho bien».", ok: "simple", no: ["rápido", "barato", "gigante"], pista: "Nada de inventos raros." },
    { q: "Mi carne tiene grano grueso y una sola…", ok: "Molienda", no: ["Marinada", "Fritura", "Congelación"], pista: "Pasa una vez por la máquina." },
    { q: "Frente a mi local hay un…", ok: "Hospital", no: ["Estadio", "Aeropuerto", "Zoológico"], pista: "El Metropolitano." },
    { q: "Mi primer día quería vender 20 burgers a la semana. ¿Cuántas vendí ese día?", ok: "45", no: ["5", "12", "20"], pista: "Más del doble de la meta." },
  ],
};
