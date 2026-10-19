// Entrada de teclado

const keys = { left: false, right: false };

// Espacio se expone como evento de un solo disparo (no como estado sostenido)
let spacePressed = false;

function consumeSpace() {
  const pressed = spacePressed;
  spacePressed = false;
  return pressed;
}

function setKey(code, value) {
  switch (code) {
    case 'ArrowLeft':
    case 'KeyA':
      keys.left = value;
      return true;
    case 'ArrowRight':
    case 'KeyD':
      keys.right = value;
      return true;
    default:
      return false;
  }
}

window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    e.preventDefault();
    if (!e.repeat) spacePressed = true;
  } else if (setKey(e.code, true)) {
    e.preventDefault();
  }
});

window.addEventListener('keyup', (e) => {
  if (setKey(e.code, false)) e.preventDefault();
});

// Evita teclas "pegadas" al perder el foco
window.addEventListener('blur', () => {
  keys.left = false;
  keys.right = false;
});
