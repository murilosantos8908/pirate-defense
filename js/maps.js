// Catálogo de mapas implementados e planejados.
export const MAPS = [
  { id: 'castaway-island', name: 'Ilha dos Náufragos', available: true, boss: 'Capitão Amaldiçoado' },
  { id: 'pirate-graveyard', name: 'Cemitério dos Piratas', available: false, boss: 'Em breve' },
  { id: 'lost-volcano', name: 'Vulcão Perdido', available: false, boss: 'Em breve' },
  { id: 'kraken-fortress', name: 'Fortaleza do Kraken', available: false, boss: 'Kraken' },
];
export const getMap = (id) => MAPS.find((map) => map.id === id);
