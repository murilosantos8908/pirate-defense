// Configurações globais do PIRATE DEFENSE (etapa 1: mapa)

export const COLORS = {
  sky: 0x9fdcf2,
  sea: 0x37c1e6,
  foam: 0xffffff,

  grass: 0x78d34f,
  grassDark: 0x5bb940,
  grassTuft: 0x4aa83a,
  grassSide: 0x8b6b3d,

  sand: 0xf5da8f,
  sandDark: 0xd9b765,
  path: 0xeccb85,
  pathEdge: 0xc79c55,
  pathStone: 0xf8e2a8,

  rock: 0xa5abb5,
  rockDark: 0x757c88,
  rockLight: 0xc6cbd3,

  wood: 0xa8602e,
  woodDark: 0x6e3a1b,
  woodLight: 0xc98a4b,
  trunk: 0xb98042,
  trunkDark: 0x946130,

  leaf: 0x2fb04f,
  leafLight: 0x56cc5c,
  bush: 0x3fae45,

  gold: 0xffc83d,
  red: 0xe5483c,
  redDark: 0xb02f28,
  white: 0xfff7e8,
  black: 0x262633,
  cream: 0xfff0cf,
  stone: 0xb9b5aa,
  stoneDark: 0x8d897f,
  stoneLight: 0xd4d0c4,
  orange: 0xff9a2e,
  yellow: 0xffe066,
  blue: 0x3a8dde,
};

export const MAP = {
  name: 'Ilha dos Náufragos',

  // Meia-largura / meia-profundidade da ilha (unidades do mundo)
  radiusX: 28,
  radiusZ: 20,

  groundY: 0.3,
  pathY: 0.34,
  pathWidth: 2.8,
  waterY: -0.45,

  // Pontos do caminho de areia: do primeiro (entrada) ao último (base). [x, z]
  waypoints: [
    [-27, 10],
    [-20, 10.5],
    [-13, 8.5],
    [-8, 3],
    [-9, -4],
    [-4, -9],
    [3, -9],
    [7, -4],
    [5, 2],
    [8, 7.5],
    [14, 6],
    [15, 2.2],
    [17.5, 0.3],
  ],

  basePosition: { x: 21, z: 0 },
  campPosition: { x: -6, z: -14 },
  markPosition: { x: 11, z: -12 },

  // Limite de movimento da câmera (alvo) em x e z
  panLimit: { x: 26, z: 18 },
};

export const CAMERA = {
  fov: 45,
  near: 1,
  far: 400,
  start: { x: 0, y: 38, z: 36 },
  target: { x: 0, y: 0, z: 0 },
  minDistance: 14,
  maxDistance: 80,
};
