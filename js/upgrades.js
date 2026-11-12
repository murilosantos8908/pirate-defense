// Cada melhoria: {id, name, icon, cost, desc, mods:{dmg,range,speed (multiplicadores), flat...}, skill?}
const U = (name, icon, cost, desc, mods = {}) => ({ name, icon, cost, desc, mods });

export const PATHS = {
  sailor: [
    { name: 'Lâmina', color: '#ff5a4f', tiers: [
      U('Fio Afiado', '🗡️', 60, '+25% de dano.', { dmg: 1.25 }),
      U('Aço Pesado', '⚔️', 120, '+30% de dano.', { dmg: 1.3 }),
      U('Golpe Sangrento', '🩸', 220, 'Ataques causam sangramento (+8 por golpe).', { bleed: 8 }),
      U('Lâmina Dourada', '👑', 400, '+60% de dano e golpe duplo.', { dmg: 1.6, multi: 2 }) ] },
    { name: 'Marujo', color: '#3a8dde', tiers: [
      U('Passo Firme', '👢', 50, '+20% velocidade de ataque.', { speed: 1.2 }),
      U('Longo Alcance', '📏', 100, '+25% de alcance.', { range: 1.25 }),
      U('Fúria do Mar', '🌊', 200, '+35% velocidade de ataque.', { speed: 1.35 }),
      U('Furacão', '🌀', 380, 'Golpe atinge inimigos próximos (área 2).', { splash: 2 }) ] },
    { name: 'Saqueador', color: '#ffc83d', tiers: [
      U('Bolso Furado', '💰', 70, '+3 moedas por abate.', { bounty: 3 }),
      U('Olho de Ouro', '🪙', 130, '+6 moedas por abate.', { bounty: 6 }),
      U('Pilhagem', '🏴‍☠️', 210, 'Chance de 15% de dobrar a recompensa.', { lucky: 0.15 }),
      U('Rei do Butim', '💎', 390, '+12 moedas por abate e +15% de dano.', { bounty: 12, dmg: 1.15 }) ] },
  ],
  musketeer: [
    { name: 'Pólvora', color: '#ff5a4f', tiers: [
      U('Carga Dupla', '💥', 70, '+25% de dano por tiro.', { dmg: 1.25 }),
      U('Bala de Ferro', '🔩', 130, '+30% de dano.', { dmg: 1.3 }),
      U('Bala Perfurante', '🎯', 230, 'Tiros causam +14 de dano extra.', { bleed: 14 }),
      U('Tiro Real', '👑', 420, '+55% de dano e tiro duplo.', { dmg: 1.55, multi: 2 }) ] },
    { name: 'Mira', color: '#3a8dde', tiers: [
      U('Cano Longo', '📏', 60, '+20% de alcance.', { range: 1.2 }),
      U('Luneta', '🔭', 120, '+25% de alcance.', { range: 1.25 }),
      U('Mira Afiada', '🦅', 210, '+20% de velocidade de ataque.', { speed: 1.2 }),
      U('Olho de Águia', '👁️', 390, '+30% de alcance e +25% de velocidade.', { range: 1.3, speed: 1.25 }) ] },
    { name: 'Caçador', color: '#ffc83d', tiers: [
      U('Recompensa', '💰', 70, '+3 moedas por abate.', { bounty: 3 }),
      U('Caçador de Tesouros', '🪙', 130, '+6 moedas por abate.', { bounty: 6 }),
      U('Sorte do Pirata', '🍀', 220, '20% de chance de dobrar a recompensa.', { lucky: 0.2 }),
      U('Mestre do Butim', '💎', 400, '+10 moedas por abate e +15% de dano.', { bounty: 10, dmg: 1.15 }) ] },
  ],
  cannoneer: [
    { name: 'Artilharia', color: '#ff5a4f', tiers: [
      U('Pólvora Negra', '💣', 80, '+25% de dano.', { dmg: 1.25 }),
      U('Bala Pesada', '⚫', 150, '+30% de dano.', { dmg: 1.3 }),
      U('Bala Incendiária', '🔥', 250, 'Tiros causam +20 de dano de queimadura.', { bleed: 20 }),
      U('Canhão Dourado', '👑', 440, '+60% de dano.', { dmg: 1.6 }) ] },
    { name: 'Explosivos', color: '#3a8dde', tiers: [
      U('Estilhaços', '✴️', 90, 'Explosão em área (raio 1.5), 50% do dano.', { splash: 1.5 }),
      U('Barril de Pólvora', '🛢️', 160, 'Área maior (raio 2.2).', { splash: 0.7 }),
      U('Bomba Racha-Casco', '☄️', 270, '+30% de dano.', { dmg: 1.3 }),
      U('Tempestade de Fogo', '🌋', 460, 'Área (raio 3.2) e +20% de dano.', { splash: 1, dmg: 1.2 }) ] },
    { name: 'Tripulação', color: '#ffc83d', tiers: [
      U('Recarga Rápida', '⏱️', 80, '+20% de velocidade de ataque.', { speed: 1.2 }),
      U('Mira Calibrada', '📏', 140, '+20% de alcance.', { range: 1.2 }),
      U('Ajudante de Convés', '🧑‍🔧', 240, '+30% de velocidade de ataque.', { speed: 1.3 }),
      U('Fogo Cerrado', '🎆', 430, 'Dispara duas balas por ataque.', { multi: 2 }) ] },
  ],
  parrot: [
    { name: 'Bico', color: '#ff5a4f', tiers: [
      U('Bico Afiado', '🪶', 40, '+30% de dano.', { dmg: 1.3 }),
      U('Garras de Aço', '🦅', 80, '+35% de dano.', { dmg: 1.35 }),
      U('Bicada Venenosa', '☠️', 150, 'Bicadas causam +6 de dano extra.', { bleed: 6 }),
      U('Bico Dourado', '👑', 280, '+60% de dano e bicada dupla.', { dmg: 1.6, multi: 2 }) ] },
    { name: 'Asas', color: '#3a8dde', tiers: [
      U('Voo Ágil', '💨', 40, '+25% de velocidade de ataque.', { speed: 1.25 }),
      U('Rasante', '🌪️', 85, '+30% de velocidade de ataque.', { speed: 1.3 }),
      U('Visão Aguçada', '👁️', 150, '+30% de alcance.', { range: 1.3 }),
      U('Furacão de Penas', '🌀', 290, 'Ataques atingem inimigos próximos (raio 1.8).', { splash: 1.8 }) ] },
    { name: 'Tesouro', color: '#ffc83d', tiers: [
      U('Brilho Dourado', '✨', 45, '+2 moedas por abate.', { bounty: 2 }),
      U('Ladrão de Moedas', '🪙', 90, '+4 moedas por abate.', { bounty: 4 }),
      U('Papagaio Sortudo', '🍀', 160, '25% de chance de dobrar a recompensa.', { lucky: 0.25 }),
      U('Colar do Capitão', '📿', 300, '+8 moedas por abate e +20% de dano.', { bounty: 8, dmg: 1.2 }) ] },
  ],
  captain: [
    { name: 'Sabre', color: '#ff5a4f', tiers: [
      U('Fio do Sabre', '🗡️', 90, '+25% de dano.', { dmg: 1.25 }),
      U('Corte Profundo', '🩸', 160, 'Golpes causam +12 de sangramento.', { bleed: 12 }),
      U('Aço de Comando', '⚔️', 260, '+35% de dano.', { dmg: 1.35 }),
      U('Lâmina Dourada', '👑', 450, '+50% de dano e golpe duplo.', { dmg: 1.5, multi: 2 }) ] },
    { name: 'Comando', color: '#3a8dde', tiers: [
      U('Voz de Comando', '📣', 90, '+20% de velocidade de ataque.', { speed: 1.2 }),
      U('Postura Firme', '📏', 150, '+20% de alcance.', { range: 1.2 }),
      U('Grito de Guerra', '🔥', 250, '+30% de velocidade de ataque.', { speed: 1.3 }),
      U('Giro do Capitão', '🌀', 430, 'Golpe atinge inimigos em área (raio 2.2).', { splash: 2.2 }) ] },
    { name: 'Pilhagem', color: '#ffc83d', tiers: [
      U('Parte do Butim', '💰', 90, '+4 moedas por abate.', { bounty: 4 }),
      U('Mapa do Tesouro', '🗺️', 160, '+7 moedas por abate.', { bounty: 7 }),
      U('Sorte de Capitão', '🍀', 250, '20% de chance de dobrar a recompensa.', { lucky: 0.2 }),
      U('Rei dos Mares', '💎', 440, '+12 moedas por abate e +15% de dano.', { bounty: 12, dmg: 1.15 }) ] },
  ],
  markswoman: [
    { name: 'Precisão', color: '#ff5a4f', tiers: [
      U('Bala Calibrada', '🎯', 100, '+25% de dano.', { dmg: 1.25 }),
      U('Ponta Oca', '💥', 170, '+14 de dano extra por tiro.', { bleed: 14 }),
      U('Tiro Mortal', '☠️', 270, '+35% de dano.', { dmg: 1.35 }),
      U('Bala Dourada', '👑', 460, '+55% de dano e tiro duplo.', { dmg: 1.55, multi: 2 }) ] },
    { name: 'Luneta', color: '#3a8dde', tiers: [
      U('Lente Limpa', '🔭', 90, '+20% de alcance.', { range: 1.2 }),
      U('Cano Estriado', '📏', 160, '+25% de alcance.', { range: 1.25 }),
      U('Dedo Leve', '⚡', 250, '+25% de velocidade de ataque.', { speed: 1.25 }),
      U('Olho de Falcão', '🦅', 440, '+30% de alcance e +25% de velocidade.', { range: 1.3, speed: 1.25 }) ] },
    { name: 'Caçadora', color: '#ffc83d', tiers: [
      U('Troféu', '🏆', 100, '+4 moedas por abate.', { bounty: 4 }),
      U('Caça Premiada', '🪙', 170, '+7 moedas por abate.', { bounty: 7 }),
      U('Faro de Ouro', '🍀', 260, '20% de chance de dobrar a recompensa.', { lucky: 0.2 }),
      U('Lenda do Gatilho', '💎', 450, '+12 moedas por abate e +15% de dano.', { bounty: 12, dmg: 1.15 }) ] },
  ],
  seawitch: [
    { name: 'Magia', color: '#ff5a4f', tiers: [
      U('Maré Arcana', '🔮', 100, '+25% de dano.', { dmg: 1.25 }),
      U('Maldição', '🩸', 170, 'Rajadas causam +15 de dano mágico.', { bleed: 15 }),
      U('Feitiço Profundo', '🌑', 270, '+35% de dano.', { dmg: 1.35 }),
      U('Tempestade Arcana', '⚡', 470, '+50% de dano e rajada dupla.', { dmg: 1.5, multi: 2 }) ] },
    { name: 'Tempestade', color: '#3a8dde', tiers: [
      U('Redemoinho', '🌀', 110, 'Rajadas explodem em área (raio 1.5).', { splash: 1.5 }),
      U('Maré Alta', '🌊', 180, 'Área maior (raio 2.3).', { splash: 0.8 }),
      U('Conjuro Veloz', '💨', 270, '+30% de velocidade de ataque.', { speed: 1.3 }),
      U('Tsunami', '🌋', 480, 'Área (raio 3.3) e +20% de dano.', { splash: 1, dmg: 1.2 }) ] },
    { name: 'Oráculo', color: '#ffc83d', tiers: [
      U('Cristal Vidente', '🔭', 100, '+20% de alcance.', { range: 1.2 }),
      U('Poção da Sorte', '🧪', 170, '+5 moedas por abate.', { bounty: 5 }),
      U('Bola de Cristal', '🔮', 260, '25% de chance de dobrar a recompensa.', { lucky: 0.25 }),
      U('Profecia do Mar', '👁️', 450, '+30% de alcance e +10 moedas por abate.', { range: 1.3, bounty: 10 }) ] },
  ],
  skeleton: [
    { name: 'Ossos', color: '#ff5a4f', tiers: [
      U('Lâmina Afiada', '🗡️', 80, '+25% de dano.', { dmg: 1.25 }),
      U('Ferrugem Mortal', '☠️', 140, 'Golpes causam +10 de dano extra.', { bleed: 10 }),
      U('Ossos Reforçados', '🦴', 230, '+35% de dano.', { dmg: 1.35 }),
      U('Lâmina Polida', '👑', 400, '+50% de dano e golpe duplo.', { dmg: 1.5, multi: 2 }) ] },
    { name: 'Fúria', color: '#3a8dde', tiers: [
      U('Passo Ágil', '💨', 80, '+20% de velocidade de ataque.', { speed: 1.2 }),
      U('Fúria Ossuda', '🔥', 140, '+25% de velocidade de ataque.', { speed: 1.25 }),
      U('Dança Macabra', '💃', 230, 'Golpe atinge inimigos próximos (raio 1.8).', { splash: 1.8 }),
      U('Horda de Ossos', '💀', 410, '+30% de velocidade e área maior (+0.8).', { speed: 1.3, splash: 0.8 }) ] },
    { name: 'Saque', color: '#ffc83d', tiers: [
      U('Moedas Antigas', '🪙', 80, '+3 moedas por abate.', { bounty: 3 }),
      U('Tumba Saqueada', '⚱️', 140, '+6 moedas por abate.', { bounty: 6 }),
      U('Maldição da Sorte', '🍀', 230, '20% de chance de dobrar a recompensa.', { lucky: 0.2 }),
      U('Tesouro Maldito', '💎', 410, '+10 moedas por abate e +15% de dano.', { bounty: 10, dmg: 1.15 }) ] },
  ],
  brute: [
    { name: 'Martelo', color: '#ff5a4f', tiers: [
      U('Cabeça de Ferro', '🔨', 110, '+25% de dano.', { dmg: 1.25 }),
      U('Músculos de Aço', '💪', 180, '+30% de dano.', { dmg: 1.3 }),
      U('Esmaga-Cascos', '💥', 280, '+20 de dano extra por golpe.', { bleed: 20 }),
      U('Martelo Dourado', '👑', 480, '+60% de dano.', { dmg: 1.6 }) ] },
    { name: 'Terremoto', color: '#3a8dde', tiers: [
      U('Pancada Larga', '🌍', 120, 'Golpe atinge área (raio 1.8).', { splash: 1.8 }),
      U('Ombreiras Pesadas', '🛡️', 190, 'Área maior (+0.8).', { splash: 0.8 }),
      U('Marretada Veloz', '⚡', 290, '+30% de velocidade de ataque.', { speed: 1.3 }),
      U('Terremoto', '🌋', 490, 'Área (raio 3.5) e +20% de dano.', { splash: 0.9, dmg: 1.2 }) ] },
    { name: 'Brigão', color: '#ffc83d', tiers: [
      U('Cobrador', '💰', 110, '+4 moedas por abate.', { bounty: 4 }),
      U('Valentão', '🪙', 180, '+7 moedas por abate.', { bounty: 7 }),
      U('Sorte de Brigão', '🍀', 280, '20% de chance de dobrar a recompensa.', { lucky: 0.2 }),
      U('Rei da Taverna', '💎', 480, '+12 moedas por abate e +15% de dano.', { bounty: 12, dmg: 1.15 }) ] },
  ],
  ghostcaptain: [
    { name: 'Espectro', color: '#ff5a4f', tiers: [
      U('Lâmina Espectral', '👻', 130, '+25% de dano.', { dmg: 1.25 }),
      U('Toque Gélido', '❄️', 210, 'Golpes causam +16 de dano extra.', { bleed: 16 }),
      U('Corte Etéreo', '⚔️', 320, '+35% de dano.', { dmg: 1.35 }),
      U('Fúria Fantasma', '👑', 520, '+50% de dano e golpe duplo.', { dmg: 1.5, multi: 2 }) ] },
    { name: 'Névoa', color: '#3a8dde', tiers: [
      U('Névoa Gélida', '🌫️', 130, '+20% de alcance.', { range: 1.2 }),
      U('Lâmina Longa', '📏', 210, '+25% de alcance.', { range: 1.25 }),
      U('Assombração', '💨', 320, '+30% de velocidade de ataque.', { speed: 1.3 }),
      U('Maré de Almas', '🌀', 510, 'Corte atinge área (raio 2.5).', { splash: 2.5 }) ] },
    { name: 'Tesouro Maldito', color: '#ffc83d', tiers: [
      U('Moedas Fantasmas', '🪙', 130, '+5 moedas por abate.', { bounty: 5 }),
      U('Baú Assombrado', '📦', 210, '+8 moedas por abate.', { bounty: 8 }),
      U('Pacto de Sorte', '🍀', 320, '25% de chance de dobrar a recompensa.', { lucky: 0.25 }),
      U('Ouro do Além', '💎', 520, '+14 moedas por abate e +15% de dano.', { bounty: 14, dmg: 1.15 }) ] },
  ],
  admiral: [
    { name: 'Sabre Real', color: '#ff5a4f', tiers: [
      U('Sabre Afiado', '🗡️', 160, '+25% de dano.', { dmg: 1.25 }),
      U('Ordem de Fogo', '🔥', 250, '+18 de dano extra por ataque.', { bleed: 18 }),
      U('Aço Real', '⚔️', 380, '+35% de dano.', { dmg: 1.35 }),
      U('Brilho Supremo', '👑', 600, '+55% de dano e ataque duplo.', { dmg: 1.55, multi: 2 }) ] },
    { name: 'Esquadra', color: '#3a8dde', tiers: [
      U('Comando Rápido', '📣', 160, '+20% de velocidade de ataque.', { speed: 1.2 }),
      U('Luneta Real', '🔭', 250, '+20% de alcance.', { range: 1.2 }),
      U('Salva de Canhões', '💣', 380, 'Ataques em área (raio 2).', { splash: 2 }),
      U('Armada Dourada', '⚓', 600, '+30% de velocidade e área maior (+1).', { speed: 1.3, splash: 1 }) ] },
    { name: 'Tesouro Real', color: '#ffc83d', tiers: [
      U('Imposto Real', '💰', 160, '+6 moedas por abate.', { bounty: 6 }),
      U('Cofre da Coroa', '🪙', 250, '+10 moedas por abate.', { bounty: 10 }),
      U('Sorte Real', '🍀', 380, '25% de chance de dobrar a recompensa.', { lucky: 0.25 }),
      U('Rei do Ouro', '💎', 600, '+16 moedas por abate e +15% de dano.', { bounty: 16, dmg: 1.15 }) ] },
  ],
  poseidon: [
    { name: 'Tridente', color: '#ff5a4f', tiers: [
      U('Pontas Afiadas', '🔱', 180, '+25% de dano.', { dmg: 1.25 }),
      U('Onda Cortante', '🌊', 270, '+20 de dano extra por ataque.', { bleed: 20 }),
      U('Fúria do Oceano', '⚡', 400, '+35% de dano.', { dmg: 1.35 }),
      U('Tridente Dourado', '👑', 650, '+55% de dano e arremesso duplo.', { dmg: 1.55, multi: 2 }) ] },
    { name: 'Marés', color: '#3a8dde', tiers: [
      U('Maré Viva', '🌊', 180, 'Ondas atingem área (raio 1.8).', { splash: 1.8 }),
      U('Corrente Forte', '💨', 270, '+25% de velocidade de ataque.', { speed: 1.25 }),
      U('Maremoto', '🌀', 400, 'Área maior (+1) e +20% de alcance.', { splash: 1, range: 1.2 }),
      U('Tsunami Pirata', '🌋', 650, '+30% de velocidade e área maior (+1).', { speed: 1.3, splash: 1 }) ] },
    { name: 'Tesouros do Mar', color: '#ffc83d', tiers: [
      U('Pérolas', '🦪', 180, '+6 moedas por abate.', { bounty: 6 }),
      U('Coral Dourado', '🪸', 270, '+10 moedas por abate.', { bounty: 10 }),
      U('Bênção das Marés', '🍀', 400, '25% de chance de dobrar a recompensa.', { lucky: 0.25 }),
      U('Senhor dos Mares', '💎', 650, '+18 moedas por abate e +15% de dano.', { bounty: 18, dmg: 1.15 }) ] },
  ],
};

/** Caminho genérico de reserva até os demais personagens receberem conteúdo próprio. */
export const pathsFor = (id) => PATHS[id] || null;

/** Regra de compatibilidade: um caminho vai até o fim; um segundo só até o nível 2; o terceiro fica bloqueado. */
export function canBuy(owned, p) {
  if (owned[p] >= 4) return 'max';
  const others = owned.filter((_, i) => i !== p);
  if (owned[p] === 0 && others.filter((v) => v > 0).length >= 2) return 'locked'; // third path
  if (others.some((v) => v > 2) && owned[p] >= 2) return 'locked'; // second path is capped at level 2
  return 'ok';
}

/** Soma os modificadores de todas as melhorias compradas. */
export function foldMods(id, owned) {
  const m = { dmg: 1, range: 1, speed: 1, bleed: 0, bounty: 0, lucky: 0, splash: 0, multi: 1 };
  (pathsFor(id) || []).forEach((path, p) => path.tiers.slice(0, owned[p]).forEach((t) => {
    for (const [k, v] of Object.entries(t.mods)) {
      if (['dmg', 'range', 'speed'].includes(k)) m[k] *= v;
      else if (k === 'multi') m.multi = Math.max(m.multi, v);
      else m[k] += v;
    }
  }));
  return m;
}
