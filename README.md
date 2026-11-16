# ¿Quién es el oso?

Juego teaser web (mobile-first) para una campaña de awareness. El afiche muestra solo un oso y un QR; una ruleta le asigna a cada jugador uno de 3 modos, y al ganarlo se revelan la marca, la dirección y un código de promo único.

## Modos (uno al azar por jugador, queda guardado)
- **La aventura del oso** (`modo-aventura.js`): runner en canvas por 3 zonas (Cerrillos 2020 → primer local 2022 → Providencia 2026). Saltar obstáculos, juntar ingredientes, esquivar "inventos raros".
- **Hora peak en la plancha** (`modo-cocina.js`): pedidos en tiempo real; poner carne, smash, sacarla dorada antes de que se queme, armar 5 pedidos.
- **La cacería del oso** (`modo-caceria.js`): cada afiche físico tiene un QR `?p=A|B|C` y una palabra secreta. En cada uno se supera un reto corto (los 5 de `game.js`) y se gana una pieza. Da mejores premios.

## Archivos
- `config.js` — **todo lo editable**: marca, dirección, promos, modos, estaciones de la cacería, recetas, preguntas
- `game.js` — núcleo: ruleta, revelación, retos cortos y utilidades compartidas (`window.BA`)
- `codigo.js` — códigos firmados `BA-PDDRRR-CCCC` (promo + vencimiento + firma)
- `validar.html` — validador de caja

## Demo para presentar
`?demo=1` muestra botones para elegir el modo, simular escaneos de afiches y saltar desafíos, sin guardar nada.

Prototipo: la firma de los códigos vive en el navegador. La versión real mueve la validación y el registro de canjes a un servidor (ej. Supabase).
