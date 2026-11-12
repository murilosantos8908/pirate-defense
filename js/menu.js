import { MAPS } from './maps.js';
import { ENEMY_TYPES } from './enemies.js';
import { DEFENDER_TYPES } from './defenders.js';
import { CATALOG, UPGRADES, MAX_TEAM, MAX_LEVEL, levelCost, rarityOf } from './collections.js';
import { iconUrl } from './icons.js';

const $ = (id) => document.getElementById(id);
const DAY = new Date().toDateString();

export function initMenu({ meta, shop, selectMap, startGame, isInGame }) {
  const stats = () => meta.state.stats;
  const nameEl = $('mm-name');
  nameEl.value = localStorage.getItem('pd-name') || 'Capitão';
  nameEl.onchange = () => localStorage.setItem('pd-name', nameEl.value.trim() || 'Capitão');

  const toast = (t) => { const e = document.createElement('div'); e.className = 'toast'; e.textContent = t; document.body.appendChild(e); setTimeout(() => e.remove(), 3200); };
  const modal = (title, html) => {
    const m = document.createElement('div'); m.className = 'mm-modal';
    m.innerHTML = `<div class="mm-box"><h2>${title}</h2><div>${html}</div><button class="btn btn-small" data-x>Fechar</button></div>`;
    m.onclick = (e) => { if (e.target === m || e.target.closest('[data-x]')) m.remove(); };
    document.body.appendChild(m); return m;
  };
  const icon = (id, c) => iconUrl(id) ? `<img src="${iconUrl(id)}" alt="">` : c.icon;

  function refresh() {
    const s = stats(), xp = s.kills + s.wins * 50 + s.runs * 10;
    $('mm-lvl').textContent = 1 + Math.floor(xp / 100);
    $('mm-xpfill').style.width = (xp % 100) + '%';
    const o = meta.state.owned;
    $('mm-gift').classList.toggle('new', localStorage.getItem('pd-gift') !== DAY);
    $('mm-crew').classList.toggle('new', Object.entries(o).some(([, v]) => v.level < MAX_LEVEL && v.copies >= levelCost(v.level)));
    $('mm-pow').classList.toggle('new', UPGRADES.some((u) => meta.upgradeLevel(u.id) < u.max && meta.coins >= u.cost(meta.upgradeLevel(u.id))));
    $('mm-shop').classList.toggle('new', meta.coins >= 100);
  }
  setInterval(refresh, 800); refresh();

  const screens = {
    shop: () => shop.open('shop'),
    crew: () => shop.open('coll'),
    powers: () => shop.open('upg'),
    play() {
      const m = modal('Escolha o mapa', `<div class="mm-grid">${MAPS.map((x, i) =>
        `<button class="mm-card mm-btn" data-i="${i}"><b>${i + 1}. ${x.name}</b><small>${x.note}</small></button>`).join('')}</div>`);
      m.addEventListener('click', (e) => { const b = e.target.closest('[data-i]'); if (b) { selectMap(+b.dataset.i); m.remove(); startGame(); } });
    },
    heroes() {
      const hs = CATALOG.filter((c) => ['epic', 'legendary', 'mythic'].includes(c.rarity));
      const draw = () => hs.map((c) => { const o = meta.state.owned[c.id], r = rarityOf(c.rarity);
        return `<div class="mm-card ${o ? '' : 'off'}" style="--c:${r.color}">${icon(c.id, c)}<b style="color:${r.color}">${c.name}</b>
          <small>${r.name} · ${o ? `Nv ${o.level}/${MAX_LEVEL}` : 'Não obtido'}</small>
          ${o ? `<button class="btn btn-small" data-t="${c.id}">${meta.inTeam(c.id) ? 'Remover da equipe' : 'Equipar'}</button>` : '<small>Invoque na Loja</small>'}</div>`; }).join('');
      const m = modal('Heróis', `<div class="mm-grid" id="hg">${draw()}</div>`);
      m.addEventListener('click', (e) => { const b = e.target.closest('[data-t]'); if (!b) return;
        if (!meta.toggleTeam(b.dataset.t)) toast(`Equipe: 1 a ${MAX_TEAM} personagens.`);
        m.querySelector('#hg').innerHTML = draw(); });
    },
    achv() {
      const s = stats(), o = Object.keys(meta.state.owned).length;
      const L = [['Primeira partida', s.runs, 1], ['Vencedor', s.wins, 1], ['100 inimigos derrotados', s.kills, 100], ['Caçador de chefes', s.bosses, 1],
        ['Chegar à wave 10', s.bestWave, 10], ['Equipe completa', meta.state.team.length, MAX_TEAM], ['Colecionador (6 personagens)', o, 6]];
      modal('Conquistas', `<div class="mm-grid">${L.map(([n, v, g]) => `<div class="mm-card ${v >= g ? '' : 'off'}"><b>${v >= g ? '🏆' : '🔒'} ${n}</b>
        <div class="mm-bar"><i style="width:${Math.min(100, v / g * 100)}%"></i></div><small>${Math.min(v, g)}/${g}</small></div>`).join('')}</div>`);
    },
    social() {
      const s = stats(); let id = localStorage.getItem('pd-id');
      if (!id) localStorage.setItem('pd-id', id = Math.random().toString(36).slice(2, 8).toUpperCase());
      const m = modal('Social', `<div class="mm-card"><b>${nameEl.value}</b><small>Código de amigo: ${id}</small>
        <small>Partidas ${s.runs} · Vitórias ${s.wins} · Melhor wave ${s.bestWave} · Abates ${s.kills}</small></div>
        <button class="btn btn-small" data-s>Compartilhar o jogo</button><small>Ranking online exige servidor (ainda não existe).</small>`);
      m.querySelector('[data-s]').onclick = async () => {
        const data = { title: 'PIRATE DEFENSE', text: `Jogue comigo! Meu código: ${id}`, url: location.href };
        try { if (navigator.share) await navigator.share(data); else { await navigator.clipboard.writeText(`${data.text} ${data.url}`); toast('Link copiado!'); } } catch {}
      };
    },
    codex() {
      const en = Object.values(ENEMY_TYPES).map((e) => `<div class="mm-card"><b>${e.boss ? '👑 ' : ''}${e.name}</b><small>Vida ${e.hp} · Vel. ${e.speed} · Dano ${e.damage}</small></div>`).join('');
      const de = Object.entries(DEFENDER_TYPES).map(([id, d]) => `<div class="mm-card">${icon(id, { icon: '⚓' })}<b>${d.name}</b><small>${d.desc}</small><small>Custo ${d.cost}</small></div>`).join('');
      const mp = MAPS.map((x) => `<div class="mm-card"><b>${x.name}</b><small>${x.note}</small></div>`).join('');
      modal('Códice', `<h3>Mapas</h3><div class="mm-grid">${mp}</div><h3>Defensores</h3><div class="mm-grid">${de}</div><h3>Inimigos</h3><div class="mm-grid">${en}</div>`);
    },
    settings() {
      const R = window.__pirate.renderer, low = R.getPixelRatio() <= 1;
      const m = modal('Ajustes', `<div style="display:grid;gap:10px"><button class="btn btn-small" data-q>Qualidade: ${low ? 'Baixa' : 'Alta'}</button>
        <button class="btn btn-small" data-r>Apagar progresso salvo</button></div>`);
      m.querySelector('[data-q]').onclick = (e) => { const nl = R.getPixelRatio() > 1; R.setPixelRatio(nl ? 1 : Math.min(devicePixelRatio, 2));
        R.setSize(innerWidth, innerHeight); e.target.textContent = `Qualidade: ${nl ? 'Baixa' : 'Alta'}`; };
      m.querySelector('[data-r]').onclick = () => { if (confirm('Apagar moedas, equipe e coleção?')) { localStorage.removeItem('pirate-defense-save-v1'); location.reload(); } };
    },
    gift() {
      if (localStorage.getItem('pd-gift') === DAY) return toast('Recompensa de hoje já coletada. Volte amanhã!');
      localStorage.setItem('pd-gift', DAY); meta.addCoins(100); $('menu-coins').textContent = `${meta.coins}`; toast('🎁 +100 moedas!'); refresh();
    },
    profile() { screens.achv(); },
    minigames() { modal('Minijogos', '<p>Ainda não há minijogos implementados neste projeto. Em breve!</p>'); },
  };

  $('menu').addEventListener('click', (e) => {
    const b = e.target.closest('[data-go]'); if (!b) return;
    b.classList.remove('click'); void b.offsetWidth; b.classList.add('click');
    screens[b.dataset.go]?.();
  });

  // Tripulação decorativa animada no cenário (reaproveita os modelos dos defensores)
  const { scene } = window.__pirate, crew = new (scene.constructor)(), rigs = [];
  scene.add(crew);
  [['sailor', 13, -7], ['captain', 15.5, 6], ['parrot', 12, 9], ['cannoneer', 18, -6], ['markswoman', 17, 8.5], ['skeleton', -6, -9]].forEach(([id, x, z], i) => {
    const g = new (scene.constructor)(), m = new (scene.constructor)(); g.add(m);
    rigs.push(DEFENDER_TYPES[id].build(m, 3)); m.rotation.y = 0.6 + i * 0.7;
    g.position.set(x, 0.3, z); crew.add(g);
  });
  (function loop() { crew.visible = !isInGame(); if (crew.visible) rigs.forEach((r) => r.pose(-1)); requestAnimationFrame(loop); })();
}