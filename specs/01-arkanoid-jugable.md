# SPEC 01 — Arkanoid jugable con 3 niveles

> **Status:** Aprobado
> **Depends on:** Ninguna
> **Date:** 2026-10-19
> **Objective:** Un juego de Arkanoid jugable en el navegador, con paleta controlada por teclado, 3 niveles de ladrillos, 3 vidas, puntaje en pantalla y pantallas de Game Over y Victoria.

---

## Scope

**In:**

- Página `index.html` con un `<canvas>` de 800x600 que se abre con doble clic (sin servidor ni build).
- Paleta que se mueve con `←` `→` o `A` `D`.
- Bola que rebota en paredes, techo, paleta y ladrillos; se lanza con `Espacio`.
- 3 niveles definidos como matrices de colores en `src/levels.js`.
- Ladrillos de 1 golpe, con los 7 colores del spritesheet (`gray`, `red`, `yellow`, `cyan`, `magenta`, `hotpink`, `green`) y animación de explosión `EXPLOSION_FRAMES`.
- Rebote en la paleta con ángulo según el punto de impacto.
- 3 vidas, puntaje (+10 por ladrillo) y nivel actual visibles en el HUD.
- Pantallas de Inicio, Game Over y Victoria; `Espacio` inicia, lanza y reinicia.
- Sonidos `assets/sounds/ball-bounce.mp3` y `assets/sounds/break-sound.mp3`.

**Out of scope (for future specs):**

- Power-ups (paleta grande, multibola, láser, etc.).
- Ladrillos indestructibles o de varios golpes.
- Pausa (`Esc` / `P`).
- Persistencia de high scores (localStorage u otra).
- Control con ratón o táctil.
- Menú navegable, ajustes, volumen o mute.
- Canvas responsive / adaptación a móviles.
- Velocidad creciente por nivel.

---

## Data model

Coordenadas: origen arriba a la izquierda, eje Y hacia abajo. Unidades en píxeles del canvas lógico (800x600). Velocidades en píxeles por segundo; el movimiento se multiplica por `dt` en segundos entre frames.

```js
// src/game.js — constantes
const CANVAS_W = 800;
const CANVAS_H = 600;
const BRICK_W = 64;          // sprite 32x16 escalado x2
const BRICK_H = 32;
const BRICK_COLS = 12;       // 12 * 64 = 768, margen lateral de 16
const BRICKS_OFFSET_X = 16;
const BRICKS_OFFSET_Y = 60;  // deja espacio al HUD
const PADDLE_W = 162;        // tamaño nativo del sprite
const PADDLE_H = 14;
const PADDLE_Y = 560;
const PADDLE_SPEED = 600;
const BALL_SIZE = 16;        // tamaño nativo del sprite
const BALL_SPEED = 420;
const MAX_BOUNCE_ANGLE = 60; // grados respecto a la vertical
const INITIAL_LIVES = 3;
const POINTS_PER_BRICK = 10;

// src/game.js — estado
const state = {
  screen: 'start',       // 'start' | 'ready' | 'playing' | 'gameover' | 'victory'
  levelIndex: 0,         // 0..2
  score: 0,
  lives: INITIAL_LIVES,
  paddle: { x: 0, y: PADDLE_Y, w: PADDLE_W, h: PADDLE_H },
  ball: { x: 0, y: 0, vx: 0, vy: 0, size: BALL_SIZE },
  bricks: [],            // { x, y, w, h, color, alive, explodingSince }
};
```

```js
// src/levels.js — 3 niveles; cada fila tiene 12 celdas
// Valor de celda: nombre de color de SPRITES.blocks, o null (sin ladrillo)
const LEVELS = [
  [
    ['red', 'red', 'red', 'red', 'red', 'red', 'red', 'red', 'red', 'red', 'red', 'red'],
    // ...
  ],
  // nivel 2, nivel 3
];
```

```js
// src/input.js
const keys = { left: false, right: false };
// Espacio se expone como evento de un solo disparo (no como estado sostenido)
```

Conventions:

- Los sprites y las funciones `loadSpritesheet`, `drawSprite` y `drawFrame` vienen de `assets/spritesheet.js`, sin modificarlo.
- El color `gray` usa el sprite `SPRITES.blocks.gray`; su explosión reutiliza `EXPLOSION_FRAMES.gray` (ya definido en el archivo).
- `imageSmoothingEnabled = false` en el contexto 2D para mantener el pixel art nítido.

---

## Implementation plan

1. Crear `index.html` con el `<canvas id="game" width="800" height="600">` y los scripts en orden: `assets/spritesheet.js`, `src/levels.js`, `src/input.js`, `src/game.js`. Probar: abrir el archivo y ver el canvas vacío sin errores en consola.
2. En `src/game.js`: cargar el spritesheet con `loadSpritesheet`, crear el bucle `requestAnimationFrame` con `dt` y dibujar un fondo y la pantalla de Inicio ("Pulsa Espacio"). Probar: se ve el texto.
3. En `src/input.js`: registrar `keydown`/`keyup` para `←` `→` `A` `D` y el disparo de `Espacio`. Probar: `console.log` de las teclas.
4. Dibujar la paleta con `drawSprite` y moverla con las teclas, limitada a los bordes del canvas. Probar: la paleta se mueve y no sale del canvas.
5. Añadir la bola pegada a la paleta (estado `ready`) y su lanzamiento con `Espacio` (estado `playing`) con ángulo inicial hacia arriba. Probar: la bola se mueve tras `Espacio`.
6. Rebote en paredes izquierda/derecha y techo, y rebote en la paleta con ángulo según el punto de impacto (máx. `MAX_BOUNCE_ANGLE`). Reproducir `ball-bounce.mp3` en cada rebote. Probar: la bola rebota y el ángulo cambia según dónde golpea.
7. Pérdida de bola: al cruzar el borde inferior, restar una vida y volver a `ready`; con 0 vidas pasar a `gameover`. Probar: se pierden 3 vidas y aparece Game Over.
8. En `src/levels.js`: definir los 3 niveles. En `game.js`: construir `state.bricks` desde `LEVELS[levelIndex]` y dibujarlos. Probar: se ve el nivel 1.
9. Colisión bola–ladrillo (AABB, invirtiendo el eje de menor penetración): marcar el ladrillo con `explodingSince`, sumar 10 puntos y reproducir `break-sound.mp3`. Probar: los ladrillos se rompen y suben los puntos.
10. Animar la explosión con `EXPLOSION_FRAMES[color]` durante `EXPLOSION_DURATION` ms y luego marcar `alive = false`. Probar: se ve la animación y el ladrillo desaparece.
11. Dibujar el HUD (puntaje, vidas, nivel) y añadir la progresión: al romper todos los ladrillos pasar al siguiente nivel con la bola en `ready`; tras el nivel 3, pasar a `victory`. Probar: se completan los 3 niveles.
12. Reinicio: con `Espacio` en `gameover` o `victory` reiniciar `score`, `lives` y `levelIndex` y volver a `start`/`ready`. Probar: se puede jugar de nuevo sin recargar la página.

---

## Acceptance criteria

- [ ] Abrir `index.html` con doble clic muestra el juego sin errores en la consola.
- [ ] Al cargar aparece la pantalla de Inicio y `Espacio` empieza la partida.
- [ ] `←` y `A` mueven la paleta a la izquierda; `→` y `D` a la derecha.
- [ ] La paleta no puede salir de los límites 0 y 800 del canvas.
- [ ] La bola empieza pegada a la paleta y solo se mueve tras pulsar `Espacio`.
- [ ] La bola rebota en las paredes laterales, el techo y la paleta.
- [ ] Golpear la bola con el borde derecho de la paleta la desvía hacia la derecha; con el borde izquierdo, hacia la izquierda; con el centro, casi vertical.
- [ ] El ángulo de salida respecto a la vertical nunca supera 60°.
- [ ] Cada ladrillo se rompe con un solo golpe y muestra la animación de explosión de su color.
- [ ] Romper un ladrillo suma exactamente 10 puntos al puntaje del HUD.
- [ ] Se oye `ball-bounce.mp3` en cada rebote y `break-sound.mp3` al romper un ladrillo.
- [ ] Si la bola cae por debajo de la paleta, las vidas bajan en 1 y la bola vuelve a la paleta.
- [ ] Con 0 vidas aparece la pantalla de Game Over y `Espacio` reinicia la partida desde el nivel 1 con puntaje 0 y 3 vidas.
- [ ] Al romper todos los ladrillos del nivel 1 se carga el nivel 2, y del 2 al 3, conservando puntaje y vidas.
- [ ] Al romper todos los ladrillos del nivel 3 aparece la pantalla de Victoria y `Espacio` reinicia la partida.
- [ ] El HUD muestra puntaje, vidas y nivel actual en todo momento durante la partida.
- [ ] Los 3 niveles tienen layouts distintos entre sí.
- [ ] El archivo `assets/spritesheet.js` no fue modificado.

---

## Decisions

- **Sí:** HTML + Canvas + JS vanilla. Sin build ni dependencias, y `spritesheet.js` ya usa `document` y canvas.
- **No:** Vite / ES modules. Obligarían a un servidor local y a adaptar `spritesheet.js`, que usa variables globales.
- **No:** Phaser u otro framework. Haría inútil `spritesheet.js` y es excesivo para el alcance.
- **Sí:** scripts clásicos cargados en orden (`spritesheet.js`, `levels.js`, `input.js`, `game.js`). Permite abrir el juego con doble clic.
- **Sí:** 3 niveles como matrices en `src/levels.js`. Separa el diseño de niveles de la lógica y es fácil de editar.
- **No:** niveles procedurales. Menos control sobre el diseño.
- **Sí:** ladrillos de 1 golpe, incluido `gray`. Mantiene simple la condición de victoria del nivel (todos los ladrillos rotos).
- **No:** ladrillos indestructibles o de 2 golpes. Complican los datos y la condición de victoria; irán en otro spec.
- **Sí:** 3 vidas + Game Over. Sin ellas el jugador no podría perder.
- **Sí:** teclado únicamente (`←` `→` / `A` `D`). Es el control más simple y fiable.
- **No:** ratón ni táctil. Táctil implica canvas responsive; ambos van en otro spec.
- **Sí:** canvas lógico 800x600; ladrillos a x2 (64x32); paleta y bola a tamaño nativo. Mantiene el pixel art nítido con `imageSmoothingEnabled = false`.
- **Sí:** movimiento por `dt` en px/s. La velocidad no depende de la tasa de refresco del monitor.
- **Sí:** rebote en paleta con ángulo según el punto de impacto (máx. 60°). Da control al jugador y evita bucles previsibles.
- **No:** rebote especular simple. Genera trayectorias repetitivas.
- **Sí:** velocidad constante entre niveles. La dificultad progresiva queda para otro spec.
- **Sí:** sin persistencia. No se guarda nada entre sesiones.
- **No:** pausa. No se pidió y queda fuera del alcance.
- **Sí:** `Espacio` como única tecla de acción (iniciar, lanzar, reiniciar).
- **Sí:** el audio se reproduce solo después de la primera pulsación de `Espacio`, para cumplir las políticas de autoplay del navegador.

---

## Risks

| Risk                                                                    | Mitigation                                                                                          |
| ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| La bola atraviesa ladrillos o la paleta a alta velocidad (tunneling).   | Con 420 px/s a 60 fps la bola avanza ~7 px por frame, menos que su tamaño; limitar `dt` a 1/30 s.  |
| La bola queda atrapada rebotando en horizontal sin bajar.               | Garantizar un componente vertical mínimo (`vy`) tras cada rebote.                                   |
| Los navegadores bloquean el audio antes de una interacción del usuario. | Primera reproducción solo tras `Espacio`; ignorar errores de `play()` para no romper el bucle.      |
| `file://` puede impedir cargar `spritesheet-breakout.png` en el canvas. | `spritesheet.js` solo dibuja la imagen (no lee píxeles), así que funciona; si falla, usar servidor estático. |
| Cierre de pestaña/foco: teclas "pegadas" al perder el foco.             | Poner `keys.left/right` a `false` en el evento `blur` de la ventana.                                |

---

## What is **not** in this spec

- Power-ups.
- Ladrillos indestructibles o de varios golpes.
- Pausa.
- High scores y cualquier persistencia.
- Control con ratón o táctil.
- Menús, ajustes o control de volumen.
- Versión responsive o móvil.
- Dificultad progresiva por nivel.

Cada uno de ellos, si se hace, va en su propio spec.
