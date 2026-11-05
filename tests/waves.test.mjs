import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

// Load the browser module as an isolated data module, so the wave rules can be
// checked in Node without importing Three.js or changing the app's module setup.
const source = await readFile(new URL('../js/waves.js', import.meta.url), 'utf8');
const { WaveManager, createWave, rewardForKill, MAX_WAVES } = await import(
  `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`
);

assert.ok(createWave(2).enemies.length > createWave(1).enemies.length);
assert.ok(createWave(5).enemies.includes('slime'));
assert.ok(rewardForKill({ type: 'slime' }) > rewardForKill({ type: 'crab' }));
assert.equal(createWave(10).enemies.at(-1), 'cursedCaptain');
assert.equal(createWave(10).boss, 'cursedCaptain');

const spawned = [];
const rewards = [];
let state;
const waves = new WaveManager({
  enemies: { spawn(type) { const enemy = { type }; spawned.push(enemy); return enemy; } },
  onReward(amount) { rewards.push(amount); },
  onChange(next) { state = next; },
});

assert.equal(waves.startNext(), true);
for (let i = 0; i < 100 && spawned.length < 5; i++) waves.update(1);
assert.equal(spawned.length, 5, 'wave 1 spawns its full sequence');
for (const enemy of spawned) waves.resolveEnemy(enemy);
assert.equal(rewards[0], 25, 'wave 1 bonus is paid once');
assert.equal(state.state, 'intermission');
waves.update(6);
assert.equal(state.state, 'ready', 'intermission unlocks the next wave');

spawned.length = 0;
assert.equal(waves.startNext(), true);
for (let i = 0; i < 100 && spawned.length < 7; i++) waves.update(1);
assert.equal(spawned.length, 7, 'wave 2 follows wave 1 and has more enemies');
const rewardCount = rewards.length;
waves.resolveEnemy(spawned[0]);
waves.resolveEnemy(spawned[0]);
assert.equal(rewards.length, rewardCount, 'duplicate resolution cannot grant a second bonus');

waves.fail();
assert.equal(state.state, 'defeat');
assert.equal(waves.startNext(), false, 'waves cannot continue after defeat');
assert.equal(MAX_WAVES, 10);
console.log('Wave tests passed.');
