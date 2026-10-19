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

function resetPaddle() {
  state.paddle.x = (CANVAS_W - PADDLE_W) / 2;
}

function updatePaddle(dt) {
  const dir = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
  const p = state.paddle;
  p.x = Math.max(0, Math.min(CANVAS_W - p.w, p.x + dir * PADDLE_SPEED * dt));
}

function update(dt) {
  if (state.screen === 'start') {
    if (consumeSpace()) {
      resetPaddle();
      state.screen = 'ready';
    }
    return;
  }
  if (state.screen === 'ready' || state.screen === 'playing') {
    updatePaddle(dt);
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

function drawPaddle() {
  const p = state.paddle;
  drawSprite(ctx, 'paddle', p.x, p.y, p.w, p.h);
}

function draw() {
  drawBackground();
  if (state.screen === 'start') {
    drawStartScreen();
  } else if (state.screen === 'ready' || state.screen === 'playing') {
    drawPaddle();
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
