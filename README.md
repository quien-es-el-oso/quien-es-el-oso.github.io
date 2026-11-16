# ¿Quién es el oso?

Juego teaser web (mobile-first) para una campaña de awareness: el afiche muestra solo un oso y un QR; el juego revela la marca, la dirección y un código de promo único al superar 3 desafíos aleatorios.

- `index.html` — el juego
- `validar.html` — validador de códigos para caja
- `config.js` — **todo lo editable**: marca, dirección, promos, recetas, preguntas, dificultad
- `codigo.js` — generación/validación de códigos firmados (`BA-PDDRRR-CCCC`)

Modo presentación: agrega `?demo=1` a la URL para tener un botón "Saltar desafío" y jugar sin el bloqueo de un código por dispositivo.

Prototipo: la firma de los códigos vive en el navegador. La versión real mueve la validación y el registro de canjes a un servidor (ej. Supabase).
