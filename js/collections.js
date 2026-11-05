export const RARITIES = [
  { id: 'common', name: 'Comum', chance: 50, color: '#b8c4cc' },
  { id: 'uncommon', name: 'Incomum', chance: 26, color: '#4cd964' },
  { id: 'rare', name: 'Raro', chance: 14, color: '#3a8dde' },
  { id: 'epic', name: 'Épico', chance: 7, color: '#b05cff' },
  { id: 'legendary', name: 'Lendário', chance: 2.5, color: '#ffc83d' },
  { id: 'mythic', name: 'Mítico', chance: 0.5, color: '#ff4b8b' },
];

// ready:true = já implementado em js/defenders.js. Os demais entram um por vez.
export const CATALOG = [
  { id: 'sailor', name: 'Marinheiro', rarity: 'common', icon: '⚓', ready: true },
  { id: 'musketeer', name: 'Mosqueteiro', rarity: 'uncommon', icon: '🔫', ready: true },
  { id: 'cannoneer', name: 'Canhoneiro', rarity: 'uncommon', icon: '💣', ready: true },
  { id: 'parrot', name: 'Papagaio', rarity: 'common', icon: '🦜', ready: true },
  { id: 'captain', name: 'Capitão', rarity: 'rare', icon: '🏴‍☠️', ready: true },
  { id: 'markswoman', name: 'Atiradora', rarity: 'rare', icon: '🎯', ready: true },
  { id: 'seawitch', name: 'Bruxa do Mar', rarity: 'epic', icon: '🔮', ready: true },
  { id: 'skeleton', name: 'Esqueleto Pirata', rarity: 'epic', icon: '💀', ready: true },
  { id: 'brute', name: 'Brutamontes', rarity: 'epic', icon: '🪓', ready: true },
  { id: 'ghostcaptain', name: 'Capitão Fantasma', rarity: 'legendary', icon: '👻', ready: true },
  { id: 'admiral', name: 'Almirante Dourado', rarity: 'mythic', icon: '👑', ready: true },
  { id: 'poseidon', name: 'Poseidon Pirata', rarity: 'mythic', icon: '🔱', ready: true },
];

export const SUMMON_COST = 100;
export const SUMMON10_COST = 900;
export const MAX_TEAM = 5;
export const MAX_LEVEL = 10;
const KEY = 'pirate-defense-save-v1';
export const UPGRADES = [
  { id: 'baseHp', name: 'Casco Reforçado', desc: '+5 de vida da base por nível', max: 5, cost: (l) => 150 * (l + 1) },
  { id: 'startMoney', name: 'Cofre do Capitão', desc: '+50 moedas iniciais por nível', max: 5, cost: (l) => 120 * (l + 1) },
  { id: 'damage', name: 'Pólvora Seca', desc: '+5% de dano por nível', max: 5, cost: (l) => 200 * (l + 1) },
];

export const rarityOf = (id) => RARITIES.find((r) => r.id === id);
/** Cópias necessárias para subir do nível `level` para `level + 1`. */
export const levelCost = (level) => level;

/** Raridade sem personagem liberado cai para a inferior mais próxima (ou superior, se não houver). */
export function resolveRarity(rarityId) {
  const has = (rid) => CATALOG.some((c) => c.ready && c.rarity === rid);
  const i = RARITIES.findIndex((r) => r.id === rarityId);
  for (let k = i; k >= 0; k--) if (has(RARITIES[k].id)) return RARITIES[k].id;
  for (let k = i + 1; k < RARITIES.length; k++) if (has(RARITIES[k].id)) return RARITIES[k].id;
  return null;
}

/** Chance efetiva exibida por raridade (já considerando as raridades vazias). */
export function effectiveChances() {
  const out = Object.fromEntries(RARITIES.map((r) => [r.id, 0]));
  for (const r of RARITIES) out[resolveRarity(r.id)] += r.chance;
  return out;
}

export class Meta {
  constructor(storage = globalThis.localStorage, rng = Math.random) {
    this.storage = storage;
    this.rng = rng;
    let s = null;
    try { s = JSON.parse(storage?.getItem(KEY)); } catch { /* save inválido */ }
    this.state = s || { coins: 10000, owned: { sailor: { level: 1, copies: 0 } }, team: ['sailor'] };
    this.state.upgrades = { ...(this.state.upgrades || {}) };
    this.state.stats = { runs: 0, wins: 0, bestWave: 0, kills: 0, bosses: 0, ...(this.state.stats || {}) };
    if (!this.state.owned || !this.state.owned.sailor) this.state.owned = { ...(this.state.owned || {}), sailor: { level: 1, copies: 0 } };
    this.state.team = (Array.isArray(this.state.team) ? this.state.team : []).filter((id) => this.state.owned[id]);
    if (!this.state.team.length) this.state.team = ['sailor'];
    // Bonus de teste: eleva saves existentes sem apagar o progresso.
    if (this.state.coins < 10000) {
      this.state.coins = 10000;
      this.save();
    }
  }
  save() { try { this.storage?.setItem(KEY, JSON.stringify(this.state)); } catch { /* sem storage */ } }

  get coins() { return this.state.coins; }
  addCoins(n) { this.state.coins += n; this.save(); }
  upgradeLevel(id) { return this.state.upgrades[id] || 0; }
  bonuses() { return { baseHp: this.upgradeLevel('baseHp') * 5, startMoney: this.upgradeLevel('startMoney') * 50, damageMult: 1 + this.upgradeLevel('damage') * 0.05 }; }
  buyUpgrade(id) {
    const u = UPGRADES.find((entry) => entry.id === id); const level = this.upgradeLevel(id);
    if (!u || level >= u.max || this.state.coins < u.cost(level)) return false;
    this.state.coins -= u.cost(level); this.state.upgrades[id] = level + 1; this.save(); return true;
  }
  grantCopy(id) { const owned = this.state.owned[id]; if (owned) owned.copies++; else this.state.owned[id] = { level: 1, copies: 0 }; this.save(); }
  recordRun({ victory, wave, kills, bosses }) {
    const s = this.state.stats; s.runs++; if (victory) s.wins++;
    s.bestWave = Math.max(s.bestWave, wave); s.kills += kills; s.bosses += bosses; this.save();
  }

  summonOne() {
    let roll = this.rng() * 100;
    let rarity = RARITIES[RARITIES.length - 1].id;
    for (const r of RARITIES) { if (roll < r.chance) { rarity = r.id; break; } roll -= r.chance; }
    const pool = CATALOG.filter((c) => c.ready && c.rarity === resolveRarity(rarity));
    const pick = pool[Math.floor(this.rng() * pool.length)];
    const o = this.state.owned[pick.id];
    const isNew = !o;
    if (isNew) this.state.owned[pick.id] = { level: 1, copies: 0 };
    else o.copies++;
    return { id: pick.id, rarity: pick.rarity, isNew };
  }

  /** Retorna a lista de resultados, ou null se não houver moedas. */
  summon(count = 1) {
    const cost = count === 10 ? SUMMON10_COST : SUMMON_COST * count;
    if (this.state.coins < cost) return null;
    this.state.coins -= cost;
    const res = Array.from({ length: count }, () => this.summonOne());
    this.save();
    return res;
  }

  evolve(id) {
    const o = this.state.owned[id];
    if (!o || o.level >= MAX_LEVEL || o.copies < levelCost(o.level)) return false;
    o.copies -= levelCost(o.level);
    o.level++;
    this.save();
    return true;
  }

  inTeam(id) { return this.state.team.includes(id); }
  toggleTeam(id) {
    if (!this.state.owned[id]) return false;
    const t = this.state.team;
    if (t.includes(id)) { if (t.length === 1) return false; t.splice(t.indexOf(id), 1); }
    else if (t.length < MAX_TEAM) t.push(id);
    else return false;
    this.save();
    return true;
  }
  teamEntries() { return this.state.team.map((id) => ({ id, level: this.state.owned[id].level })); }
}
