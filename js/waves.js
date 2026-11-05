export const MAX_WAVES = 10;
export const INTERMISSION_SECONDS = 5;
export const BOSS_INTERVAL = 10;
export const BOSS_ROSTER = ['cursedCaptain'];
export const KILL_REWARDS = Object.freeze({ crab: 5, slime: 10, cursedCaptain: 250 });

export const bossFor = (n) =>
  n % BOSS_INTERVAL === 0 ? BOSS_ROSTER[(n / BOSS_INTERVAL - 1) % BOSS_ROSTER.length] : null;

/** Produces a deterministic, progressively harder wave composition. */
export function createWave(number) {
  if (!Number.isInteger(number) || number < 1) throw new RangeError('Wave deve começar em 1.');
  const count = 5 + (number - 1) * 2;
  const slimeCount = Math.min(Math.floor((number - 1) / 2), Math.floor(count / 2));
  const enemies = Array.from({ length: count }, (_, i) => i % 3 === 2 && i < slimeCount * 3 ? 'slime' : 'crab');
  const boss = bossFor(number);
  if (boss) enemies.push(boss);
  return {
    number, boss,
    reward: 20 + number * 5 + (boss ? 100 : 0),
    spawnInterval: Math.max(0.45, 1.5 - number * 0.07),
    enemies,
  };
}

export class WaveManager {
  constructor({ enemies, onChange = () => {}, onReward = () => {}, onVictory = () => {}, onDefeat = () => {} }) {
    this.enemies = enemies;
    this.onChange = onChange;
    this.onReward = onReward;
    this.onVictory = onVictory;
    this.onDefeat = onDefeat;
    this.reset();
  }

  reset() {
    this.number = 0;
    this.wave = null;
    this.spawnIndex = 0;
    this.spawnTimer = 0;
    this.remaining = 0;
    this.intermission = 0;
    this.state = 'ready';
    this._emit();
  }

  startNext() {
    if (this.state !== 'ready' || this.number >= MAX_WAVES) return false;
    return this.startWave(this.number + 1);
  }

  startWave(number) {
    if (this.state !== 'ready' || !Number.isInteger(number) || number < 1 || number > MAX_WAVES) return false;
    this.number = number;
    this.wave = createWave(number);
    this.spawnIndex = 0;
    this.remaining = this.wave.enemies.length;
    this.spawnTimer = 0;
    this.state = 'spawning';
    this._emit();
    return true;
  }

  resolveEnemy(enemy) {
    if (this.state !== 'spawning' && this.state !== 'active') return;
    if (enemy._waveResolved) return;
    enemy._waveResolved = true;
    this.remaining = Math.max(0, this.remaining - 1);
    this._checkComplete();
  }

  fail() {
    if (this.state === 'defeat' || this.state === 'victory') return;
    this.state = 'defeat';
    this.onDefeat();
    this._emit();
  }

  update(dt) {
    if (this.state === 'intermission') {
      this.intermission -= dt;
      if (this.intermission <= 0) this.state = 'ready';
      this._emit();
      return;
    }
    if (this.state !== 'spawning' && this.state !== 'active') return;
    if (this.spawnIndex < this.wave.enemies.length) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        this.enemies.spawn(this.wave.enemies[this.spawnIndex++]);
        this.spawnTimer = this.wave.spawnInterval;
        this.state = this.spawnIndex < this.wave.enemies.length ? 'spawning' : 'active';
      }
    }
    this._emit();
  }

  _checkComplete() {
    if (this.remaining || this.spawnIndex < this.wave.enemies.length) return;
    this.onReward(this.wave.reward);
    if (this.number >= MAX_WAVES) {
      this.state = 'victory';
      this.onVictory();
    } else {
      this.state = 'intermission';
      this.intermission = INTERMISSION_SECONDS;
    }
    this._emit();
  }

  _emit() {
    this.onChange({ number: this.number, remaining: this.remaining, state: this.state,
      seconds: Math.max(0, Math.ceil(this.intermission)), maxWaves: MAX_WAVES });
  }
}

export function rewardForKill(enemy) {
  return KILL_REWARDS[enemy.type] ?? 0;
}
