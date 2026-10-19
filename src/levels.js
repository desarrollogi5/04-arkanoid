// Niveles del juego
// Cada fila tiene 12 celdas. Valor de celda: nombre de color de SPRITES.blocks, o null (sin ladrillo)

const _ = null;
const GR = 'gray';
const RE = 'red';
const YE = 'yellow';
const CY = 'cyan';
const MA = 'magenta';
const HP = 'hotpink';
const GN = 'green';

const LEVELS = [
  // Nivel 1: franjas horizontales de colores
  [
    [RE, RE, RE, RE, RE, RE, RE, RE, RE, RE, RE, RE],
    [YE, YE, YE, YE, YE, YE, YE, YE, YE, YE, YE, YE],
    [CY, CY, CY, CY, CY, CY, CY, CY, CY, CY, CY, CY],
    [GN, GN, GN, GN, GN, GN, GN, GN, GN, GN, GN, GN],
    [MA, MA, MA, MA, MA, MA, MA, MA, MA, MA, MA, MA],
  ],
  // Nivel 2: pirámide
  [
    [_, _, _, _, _, HP, HP, _, _, _, _, _],
    [_, _, _, _, MA, MA, MA, MA, _, _, _, _],
    [_, _, _, CY, CY, CY, CY, CY, CY, _, _, _],
    [_, _, GN, GN, GN, GN, GN, GN, GN, GN, _, _],
    [_, YE, YE, YE, YE, YE, YE, YE, YE, YE, YE, _],
    [RE, RE, RE, RE, RE, RE, RE, RE, RE, RE, RE, RE],
  ],
  // Nivel 3: tablero de ajedrez con marco gris
  [
    [GR, GR, GR, GR, GR, GR, GR, GR, GR, GR, GR, GR],
    [GR, RE, _, CY, _, YE, _, MA, _, GN, RE, GR],
    [GR, _, HP, _, CY, _, YE, _, MA, _, _, GR],
    [GR, GN, _, RE, _, HP, _, CY, _, YE, MA, GR],
    [GR, _, YE, _, MA, _, GN, _, RE, _, _, GR],
    [GR, CY, _, HP, _, RE, _, YE, _, GN, HP, GR],
    [GR, GR, GR, GR, GR, GR, GR, GR, GR, GR, GR, GR],
  ],
];
