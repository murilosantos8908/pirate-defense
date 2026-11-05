import {
  RARITIES, CATALOG, SUMMON_COST, SUMMON10_COST, MAX_TEAM, MAX_LEVEL,
  rarityOf, levelCost, effectiveChances, UPGRADES,
} from './collections.js';
import { DEFENDER_TYPES, statsFor } from './defenders.js';
import { iconUrl } from './icons.js';
import { MAX_WAVES } from './waves.js';

const CSS = `
.sh{position:fixed;inset:0;background:rgba(8,24,40,.92);display:flex;flex-direction:column;padding:max(16px,env(safe-area-inset-top)) 18px 18px;gap:12px;overflow:auto;z-index:20}
.sh-top{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.sh-top .coins{margin-left:auto;color:var(--gold);font-size:20px}
.sh-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:12px}
.sh-card{padding:12px;border:3px solid var(--c);border-radius:14px;background:rgba(15,42,67,.95);display:grid;gap:6px;font-size:14px}
.sh-card.locked{opacity:.45}.sh-card h4{margin:0;font-size:18px;color:var(--c)}
.sh-card .ic{height:84px}.sh-card .ic img{width:72px;height:72px;object-fit:contain}.sh-card .row{display:flex;justify-content:space-between}
.sh-card.team{box-shadow:0 0 0 3px #fff inset}
.sh-chances{display:grid;gap:4px;max-width:420px}.sh-chances div{display:flex;justify-content:space-between;padding:4px 10px;border-radius:8px;background:rgba(255,255,255,.07)}
.sh-reveal{display:flex;gap:12px;flex-wrap:wrap}.sh-reveal .sh-card{animation:pop .4s both;min-width:170px}
@keyframes pop{from{transform:scale(.3) rotate(-8deg);opacity:0}}
`;

export function createShopUi(meta, { onTeamChange = () => {}, onCodeSubmit = () => '', onWaveSelect = () => '', getCodeStatus = () => ({}) } = {}) {
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  const root = document.createElement('div');
  root.className = 'sh';
  root.hidden = true;
  document.body.appendChild(root);
  let tab = 'shop';
  let lastResults = [];
  let codeMessage = '';

  const stats = (id, level) => {
    const value = statsFor(id, level);
    return `<div class="row"><span>Dano</span><b>${value.damage}</b></div>
      <div class="row"><span>Alcance</span><b>${value.range.toFixed(1)}</b></div>
      <div class="row"><span>Vel. ataque</span><b>${value.attackSpeed.toFixed(2)}/s</b></div>`;
  };

  const card = (character, extra = '') => {
    const rarity = rarityOf(character.rarity);
    const owned = meta.state.owned[character.id];
    const src = iconUrl(character.id);
    return `<div class="sh-card ${owned ? '' : 'locked'} ${meta.inTeam(character.id) ? 'team' : ''}" style="--c:${rarity.color}">
      <div class="ic">${src ? `<img src="${src}" alt="${character.name}">` : character.icon}</div><h4>${character.name}</h4>
      <div style="color:${rarity.color}">${rarity.name}</div>${extra}</div>`;
  };

  function shopHtml() {
    const chances = effectiveChances();
    const rows = RARITIES.map((rarity) =>
      `<div style="color:${rarity.color}"><span>${rarity.name}</span><b>${chances[rarity.id].toFixed(1)}%</b></div>`
    ).join('');
    const reveal = lastResults.map((result) => {
      const character = CATALOG.find((entry) => entry.id === result.id);
      return card(character, `<div>${result.isNew ? '✨ NOVO!' : '+1 cópia'}</div>`);
    }).join('');

    return `<h2>Loja de Invocação</h2>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <button class="btn btn-small" data-a="s1">Invocar ×1 (${SUMMON_COST} 🪙)</button>
        <button class="btn btn-small" data-a="s10">Invocar ×10 (${SUMMON10_COST} 🪙)</button>
      </div>
      <div class="sh-reveal">${reveal}</div>
      <h3>Chances</h3><div class="sh-chances">${rows}</div>
      <small>Raridades sem personagem liberado caem para a raridade disponível mais próxima. As chances exibidas já consideram isso.</small>`;
  }

  function collectionHtml() {
    const cards = CATALOG.map((character) => {
      const owned = meta.state.owned[character.id];
      if (!character.ready) return card(character, '<div>Em breve</div>');
      if (!owned) return card(character, '<div>Não obtido</div>');

      const copiesNeeded = levelCost(owned.level);
      return card(character, `${stats(character.id, owned.level)}
        <div class="row"><span>Nível</span><b>${owned.level}/${MAX_LEVEL}</b></div>
        <div class="row"><span>Cópias</span><b>${owned.copies}${owned.level < MAX_LEVEL ? `/${copiesNeeded}` : ''}</b></div>
        <small>${DEFENDER_TYPES[character.id].desc}</small>
        <button class="btn btn-small" data-a="team" data-id="${character.id}">${meta.inTeam(character.id) ? 'Remover da equipe' : 'Equipar'}</button>
        <button class="btn btn-small" data-a="evo" data-id="${character.id}" ${owned.level >= MAX_LEVEL || owned.copies < copiesNeeded ? 'disabled' : ''}>Evoluir</button>`);
    }).join('');

    return `<h2>Coleção — Equipe ${meta.state.team.length}/${MAX_TEAM}</h2><div class="sh-grid">${cards}</div>`;
  }

  function upgradesHtml() {
    const s = meta.state.stats;
    const cards = UPGRADES.map((u) => {
      const level = meta.upgradeLevel(u.id); const maxed = level >= u.max;
      return `<div class="sh-card" style="--c:#ffc83d"><h4>${u.name}</h4><small>${u.desc}</small>
        <div class="row"><span>Nível</span><b>${level}/${u.max}</b></div>
        <button class="btn btn-small" data-a="buyup" data-id="${u.id}" ${maxed || meta.coins < u.cost(level) ? 'disabled' : ''}>${maxed ? 'Máximo' : `Comprar · ${u.cost(level)} 🪙`}</button></div>`;
    }).join('');
    return `<h2>Melhorias permanentes</h2><div class="sh-grid">${cards}</div>
      <small>Partidas: ${s.runs} · Vitórias: ${s.wins} · Melhor wave: ${s.bestWave} · Inimigos: ${s.kills} · Chefes: ${s.bosses}</small>`;
  }

  function codesHtml() {
    const status = getCodeStatus();
    return `<h2>Códigos de teste</h2><p>Digite um código para liberar recursos de teste nesta sessão.</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><input id="code-input" aria-label="Código" autocomplete="off" placeholder="Digite um código">
      <button class="btn btn-small" data-a="code">Ativar código</button></div><p>${codeMessage}</p>
      <p>dinheiro: ${status.money ? 'ativado · compras da partida gratuitas' : 'bloqueado'}</p>
      <p>niveis: ${status.levels ? 'ativado · seleção de wave liberada' : 'bloqueado'}</p>
      ${status.levels ? `<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><label for="wave-select">Escolher wave</label>
        <select id="wave-select">${Array.from({ length: MAX_WAVES }, (_, i) => `<option value="${i + 1}">Wave ${i + 1}</option>`).join('')}</select>
        <button class="btn btn-small" data-a="wave">Iniciar wave</button></div>` : ''}`;
  }

  function render() {
    const menuCoins = document.getElementById('menu-coins');
    if (menuCoins) menuCoins.textContent = `Moedas: ${meta.coins}`;
    root.innerHTML = `<div class="sh-top">
      <button class="btn btn-small" data-a="tab" data-id="shop">Loja</button>
      <button class="btn btn-small" data-a="tab" data-id="coll">Coleção</button>
      <button class="btn btn-small" data-a="tab" data-id="upg">Melhorias</button>
      <button class="btn btn-small" data-a="tab" data-id="codes">Códigos</button>
      <button class="btn btn-small btn-ghost" data-a="close">Voltar</button>
      <span class="coins">🪙 ${meta.coins}</span>
    </div>${tab === 'shop' ? shopHtml() : tab === 'upg' ? upgradesHtml() : tab === 'codes' ? codesHtml() : collectionHtml()}`;
  }

  root.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    const { a, id } = button.dataset;

    if (a === 'tab') tab = id;
    else if (a === 'close') { root.hidden = true; return; }
    else if (a === 'code') codeMessage = onCodeSubmit(root.querySelector('#code-input')?.value || '');
    else if (a === 'wave') codeMessage = onWaveSelect(Number(root.querySelector('#wave-select')?.value));
    else if (a === 's1' || a === 's10') {
      const results = meta.summon(a === 's1' ? 1 : 10);
      if (!results) alert('Moedas insuficientes. Ganhe mais jogando partidas.');
      else lastResults = results;
    } else if (a === 'team') {
      if (!meta.toggleTeam(id)) alert(`A equipe pode ter de 1 a ${MAX_TEAM} personagens.`);
      onTeamChange();
    } else if (a === 'evo') {
      meta.evolve(id);
      onTeamChange();
    } else if (a === 'buyup') meta.buyUpgrade(id);
    render();
  });

  return {
    open(tabName = 'shop') { tab = tabName; lastResults = []; render(); root.hidden = false; },
    close() { const wasOpen = !root.hidden; root.hidden = true; return wasOpen; },
    refresh: render,
  };
}
