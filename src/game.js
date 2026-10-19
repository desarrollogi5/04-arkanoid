// Lógica del juego

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
const LAUNCH_ANGLE = 20;     // grados respecto a la vertical, hacia la derecha
const MIN_VERTICAL_RATIO = 0.2; // |vy| mínimo tras un rebote, como fracción de BALL_SPEED
const MAX_DT = 1 / 30;       // límite de dt para evitar tunneling

const state = {
  screen: 'start',       // 'start' | 'ready' | 'playing' | 'gameover' | 'victory'
  levelIndex: 0,         // 0..2
  score: 0,
  lives: INITIAL_LIVES,
  paddle: { x: 0, y: PADDLE_Y, w: PADDLE_W, h: PADDLE_H },
  ball: { x: 0, y: 0, vx: 0, vy: 0, size: BALL_SIZE },
  bricks: [],            // { x, y, w, h, color, alive, explodingSince }
};

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

let lastTime = 0;

const sounds = {
  bounce: new Audio('assets/sounds/ball-bounce.mp3'),
  brick: new Audio('assets/sounds/break-sound.mp3'),
};
// El audio solo se reproduce tras la primera pulsación de Espacio (política de autoplay)
let audioEnabled = false;

function playSound(sound) {
  if (!audioEnabled) return;
  const s = sound.cloneNode();
  s.play().catch(() => {});
}

function resetPaddle() {
  state.paddle.x = (CANVAS_W - PADDLE_W) / 2;
}

function updatePaddle(dt) {
  const dir = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
  const p = state.paddle;
  p.x = Math.max(0, Math.min(CANVAS_W - p.w, p.x + dir * PADDLE_SPEED * dt));
}

function buildBricks() {
  const layout = LEVELS[state.levelIndex];
  state.bricks = [];
  layout.forEach((row, r) => {
    row.forEach((color, c) => {
      if (!color) return;
      state.bricks.push({
        x: BRICKS_OFFSET_X + c * BRICK_W,
        y: BRICKS_OFFSET_Y + r * BRICK_H,
        w: BRICK_W,
        h: BRICK_H,
        color,
        alive: true,
        explodingSince: null,
      });
    });
  });
}

function stickBallToPaddle() {
  const p = state.paddle;
  const b = state.ball;
  b.x = p.x + (p.w - b.size) / 2;
  b.y = p.y - b.size;
  b.vx = 0;
  b.vy = 0;
}

function launchBall() {
  const angle = LAUNCH_ANGLE * Math.PI / 180;
  state.ball.vx = Math.sin(angle) * BALL_SPEED;
  state.ball.vy = -Math.cos(angle) * BALL_SPEED;
  state.screen = 'playing';
}

// Evita que la bola rebote casi en horizontal sin bajar ni subir
function enforceMinVertical() {
  const b = state.ball;
  const minVy = BALL_SPEED * MIN_VERTICAL_RATIO;
  if (Math.abs(b.vy) >= minVy) return;
  const sign = b.vy < 0 ? -1 : 1;
  b.vy = sign * minVy;
  b.vx = Math.sign(b.vx || 1) * Math.sqrt(BALL_SPEED * BALL_SPEED - minVy * minVy);
}

function bounceOffWalls() {
  const b = state.ball;
  let bounced = false;
  if (b.x < 0) {
    b.x = 0;
    b.vx = Math.abs(b.vx);
    bounced = true;
  } else if (b.x + b.size > CANVAS_W) {
    b.x = CANVAS_W - b.size;
    b.vx = -Math.abs(b.vx);
    bounced = true;
  }
  if (b.y < 0) {
    b.y = 0;
    b.vy = Math.abs(b.vy);
    bounced = true;
  }
  if (bounced) {
    enforceMinVertical();
    playSound(sounds.bounce);
  }
}

function bounceOffPaddle() {
  const b = state.ball;
  const p = state.paddle;
  if (b.vy <= 0) return;
  const overlapsX = b.x + b.size > p.x && b.x < p.x + p.w;
  const crossesTop = b.y + b.size >= p.y && b.y + b.size <= p.y + p.h + b.vy * MAX_DT;
  if (!overlapsX || !crossesTop) return;

  // -1 en el borde izquierdo, 0 en el centro, 1 en el borde derecho
  const offset = ((b.x + b.size / 2) - (p.x + p.w / 2)) / (p.w / 2);
  const hit = Math.max(-1, Math.min(1, offset));
  const angle = hit * MAX_BOUNCE_ANGLE * Math.PI / 180;
  b.vx = Math.sin(angle) * BALL_SPEED;
  b.vy = -Math.cos(angle) * BALL_SPEED;
  b.y = p.y - b.size;
  playSound(sounds.bounce);
}

// AABB: se invierte el eje de menor penetración. Una colisión por frame.
function bounceOffBricks() {
  const b = state.ball;
  for (const br of state.bricks) {
    if (!br.alive || br.explodingSince !== null) continue;

    const overlapX = Math.min(b.x + b.size, br.x + br.w) - Math.max(b.x, br.x);
    const overlapY = Math.min(b.y + b.size, br.y + br.h) - Math.max(b.y, br.y);
    if (overlapX <= 0 || overlapY <= 0) continue;

    if (overlapX < overlapY) {
      const fromLeft = b.x + b.size / 2 < br.x + br.w / 2;
      b.x += fromLeft ? -overlapX : overlapX;
      b.vx = fromLeft ? -Math.abs(b.vx) : Math.abs(b.vx);
    } else {
      const fromTop = b.y + b.size / 2 < br.y + br.h / 2;
      b.y += fromTop ? -overlapY : overlapY;
      b.vy = fromTop ? -Math.abs(b.vy) : Math.abs(b.vy);
    }
    enforceMinVertical();

    br.explodingSince = performance.now();
    state.score += POINTS_PER_BRICK;
    playSound(sounds.brick);
    return;
  }
}

function updateExplosions() {
  const now = performance.now();
  for (const br of state.bricks) {
    if (br.alive && br.explodingSince !== null && now - br.explodingSince >= EXPLOSION_DURATION) {
      br.alive = false;
    }
  }
}

function updateBall(dt) {
  const b = state.ball;
  b.x += b.vx * dt;
  b.y += b.vy * dt;
  bounceOffWalls();
  bounceOffPaddle();
  bounceOffBricks();
  if (b.y > CANVAS_H) loseBall();
}

function loseBall() {
  state.lives--;
  if (state.lives <= 0) {
    state.lives = 0;
    state.screen = 'gameover';
    return;
  }
  stickBallToPaddle();
  state.screen = 'ready';
}

function update(dt) {
  if (state.screen === 'start') {
    if (consumeSpace()) {
      audioEnabled = true;
      buildBricks();
      resetPaddle();
      stickBallToPaddle();
      state.screen = 'ready';
    }
    return;
  }
  if (state.screen === 'ready' || state.screen === 'playing') {
    updatePaddle(dt);
    updateExplosions();
  }
  if (state.screen === 'ready') {
    stickBallToPaddle();
    if (consumeSpace()) launchBall();
  } else if (state.screen === 'playing') {
    updateBall(dt);
  }
}

function drawBackground() {
  ctx.fillStyle = '#0b0b1e';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
}

function drawCenteredText(text, y, size, color) {
  ctx.fillStyle = color;
  ctx.font = `bold ${size}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, CANVAS_W / 2, y);
}

function drawStartScreen() {
  drawCenteredText('ARKANOID', CANVAS_H / 2 - 40, 64, '#ffffff');
  drawCenteredText('Pulsa Espacio', CANVAS_H / 2 + 30, 28, '#ffd24a');
}

function drawGameOverScreen() {
  drawCenteredText('GAME OVER', CANVAS_H / 2 - 40, 64, '#ff4a4a');
  drawCenteredText(`Puntaje: ${state.score}`, CANVAS_H / 2 + 20, 28, '#ffffff');
}

function drawBricks() {
  for (const br of state.bricks) {
    if (!br.alive) continue;
    if (br.explodingSince === null) {
      drawSprite(ctx, `block_${br.color}`, br.x, br.y, br.w, br.h);
      continue;
    }
    const frames = EXPLOSION_FRAMES[br.color];
    const t = (performance.now() - br.explodingSince) / EXPLOSION_DURATION;
    const i = Math.min(frames.length - 1, Math.floor(t * frames.length));
    drawFrame(ctx, frames[i], br.x, br.y, br.w, br.h);
  }
}

function drawPaddle() {
  const p = state.paddle;
  drawSprite(ctx, 'paddle', p.x, p.y, p.w, p.h);
}

function drawBall() {
  const b = state.ball;
  drawSprite(ctx, 'ball', b.x, b.y, b.size, b.size);
}

function draw() {
  drawBackground();
  if (state.screen === 'start') {
    drawStartScreen();
  } else if (state.screen === 'ready' || state.screen === 'playing') {
    drawBricks();
    drawPaddle();
    drawBall();
  } else if (state.screen === 'gameover') {
    drawGameOverScreen();
  }
}

function frame(now) {
  const dt = Math.min((now - lastTime) / 1000, MAX_DT);
  lastTime = now;
  update(dt);
  draw();
  requestAnimationFrame(frame);
}

loadSpritesheet(() => {
  requestAnimationFrame((now) => {
    lastTime = now;
    requestAnimationFrame(frame);
  });
});
