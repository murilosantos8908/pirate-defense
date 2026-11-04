import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../js/collections.js', import.meta.url), 'utf8');
const { Meta, effectiveChances, levelCost, MAX_TEAM } = await import(
  `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`
);

const mem = () => { const m = {}; return { getItem: (k) => m[k] ?? null, setItem: (k, v) => (m[k] = v) }; };
const sum = Object.values(effectiveChances()).reduce((a, b) => a + b, 0);
assert.ok(Math.abs(sum - 100) < 1e-9, 'chances somam 100%');

let m = new Meta(mem(), () => 0.9);          // 90% -> raridade comum -> Marinheiro
m.state.coins = 1000;
assert.equal(m.summonOne().id, 'sailor');
assert.equal(m.state.owned.sailor.copies, 1, 'repetido vira cópia');
m = new Meta(mem(), () => 0.6);              // 60% -> incomum -> Mosqueteiro
m.state.coins = 100;
assert.equal(m.summon(1)[0].isNew, true);
assert.equal(m.summon(1), null, 'sem moedas não invoca');

m = new Meta(mem(), () => 0.9);
m.state.owned.sailor.copies = levelCost(1);
assert.ok(m.evolve('sailor')); assert.equal(m.state.owned.sailor.level, 2);
assert.equal(m.evolve('sailor'), false, 'cópias insuficientes');

for (const id of ['musketeer']) m.state.owned[id] = { level: 1, copies: 0 };
assert.ok(m.toggleTeam('musketeer'));
assert.equal(m.toggleTeam('parrot'), false, 'não possui');
assert.ok(m.state.team.length <= MAX_TEAM);
console.log('Collection tests passed.');
