import { pathsFor, canBuy } from './upgrades.js';
import { iconUrl } from './icons.js';

const CSS = `
.up{position:fixed;right:12px;top:max(80px,env(safe-area-inset-top));bottom:12px;width:318px;overflow:auto;padding:12px;z-index:12;
 color:#fff4d6;background:linear-gradient(#7a4520,#5a3015);border:5px solid #ffc83d;border-radius:18px;
 box-shadow:0 0 0 4px #3b1d0b,0 10px 24px rgba(0,0,0,.45),inset 0 0 18px rgba(0,0,0,.35);display:grid;gap:8px;align-content:start}
.up h3{margin:0;font-size:21px;color:#ffc83d;text-shadow:0 2px 0 #3b1d0b}
.up-head{display:flex;gap:10px;align-items:center}
.up-head img{width:84px;height:84px;border-radius:12px;background:radial-gradient(#4fc3f7,#1b4467);border:3px solid #ffc83d}
.up-head small{display:block;color:#ffe39a}
.up-stats{display:grid;grid-template-columns:1fr auto;gap:2px 10px;padding:8px;font-size:14px;background:rgba(0,0,0,.3);border-radius:10px}
.up-stats b{color:#fff}.up-skill{font-size:12px;color:#ffe39a}
.up-tg{display:grid;grid-template-columns:1fr 1fr;gap:5px}
.up-tg button,.up-sell{font:inherit;font-size:12px;color:#fff;border:2px solid #3b1d0b;border-radius:10px;padding:6px;cursor:pointer;
 background:linear-gradient(#59b8ff,#2a6fd0);box-shadow:0 3px 0 #1b4a96}
.up-tg button.on{background:linear-gradient(#5be38a,#1f9e54);box-shadow:0 3px 0 #136b38;border-color:#fff}
.up-cols{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
.up-col h4{margin:0 0 4px;font-size:12px;text-align:center;color:var(--c);text-shadow:0 1px 0 #000}
.up-t{width:100%;margin-bottom:6px;padding:4px 2px;font:inherit;font-size:11px;color:#fff;text-align:center;cursor:pointer;
 background:linear-gradient(#8a5a30,#6a4020);border:3px solid var(--c);border-radius:14px;box-shadow:0 4px 0 #2a1408;display:grid;gap:1px}
.up-t i{font-style:normal;font-size:30px;line-height:1.1;filter:drop-shadow(0 2px 0 rgba(0,0,0,.4))}
.up-t em{font-style:normal;font-weight:bold;color:#ff4b3e;text-shadow:0 1px 0 #000;font-size:13px}
.up-t.done{background:linear-gradient(#4cd964,#1f9e54);border-color:#b8f56a;box-shadow:0 0 12px #4cd964,0 4px 0 #136b38}
.up-t.done em{color:#fff}
.up-t.poor{filter:saturate(.5)}.up-t.poor em{color:#ff4b3e}
.up-t.future,.up-t.locked{opacity:.45;filter:grayscale(.9);cursor:not-allowed}
.up-t.ok:not(.poor){animation:upglow 1.2s infinite}
.up-t:active:not(.locked):not(.future):not(.done){transform:translateY(3px);box-shadow:0 1px 0 #2a1408}
@keyframes upglow{50%{box-shadow:0 0 14px var(--c),0 4px 0 #2a1408}}
.up-tip{min-height:48px;padding:8px;font-size:12px;background:rgba(0,0,0,.35);border-radius:10px;color:#ffe39a}
.up-sell{background:linear-gradient(#ff8fa3,#d6405e);box-shadow:0 4px 0 #8a1f38;font-size:14px}
@media(max-width:640px){.up{top:auto;height:62vh;left:8px;right:8px;width:auto}}`;

const TARGETS = [['first', 'Primeiro'], ['last', 'Último'], ['close', 'Mais próximo'], ['strong', 'Mais forte']];
const COLORS = ['#ff5a4f', '#3a8dde', '#ffc83d'];

export class UpgradePanel {
  constructor(mgr) {
    this.m = mgr;
    const s = document.createElement('style'); s.textContent = CSS; document.head.appendChild(s);
    this.el = document.createElement('aside'); this.el.className = 'up'; this.el.hidden = true;
    document.body.appendChild(this.el);
    this.el.addEventListener('click', (e) => {
      const b = e.target.closest('[data-p],[data-sell],[data-tg]'); const d = mgr.selected;
      if (!b || !d) return;
      if (b.dataset.p !== undefined) mgr.buyPath(d, +b.dataset.p);
      else if ('sell' in b.dataset) mgr._sellSelected();
      else { d.targetMode = b.dataset.tg; this.render(d); }
    });
    this.el.addEventListener('mouseover', (e) => {
      const t = e.target.closest('[data-tip]'), box = this.el.querySelector('.up-tip');
      if (box) box.textContent = t ? t.dataset.tip : 'Passe o mouse sobre uma melhoria.';
    });
  }

  render(d) {
    this.el.hidden = !d;
    if (!d) return;
    const m = this.m, money = m.getMoney(), paths = pathsFor(d.type), src = iconUrl(d.type);
    const bought = paths ? paths.flatMap((p, i) => p.tiers.slice(0, d.up[i]).map((t) => t.name)) : [];
    const cols = paths ? paths.map((path, p) => `<div class="up-col" style="--c:${COLORS[p]}"><h4>${path.name}</h4>${path.tiers.map((t, i) => {
      const done = i < d.up[p], next = i === d.up[p];
      const st = done ? 'done' : !next ? 'future' : canBuy(d.up, p) !== 'ok' ? 'locked' : money < t.cost ? 'ok poor' : 'ok';
      const tip = `${t.name}${done ? ' (comprada)' : st === 'locked' ? ' (bloqueada por outro caminho)' : ''}: ${t.desc}`;
      return `<button class="up-t ${st}" data-tip="${tip}" ${st === 'ok' ? `data-p="${p}"` : ''}><i>${t.icon}</i>${t.name}<em>${done ? '✔' : t.cost + ' 🪙'}</em></button>`;
    }).join('')}</div>`).join('') : '<p class="up-skill">Melhorias deste personagem chegam nas próximas partes.</p>';
    this.el.innerHTML = `<div class="up-head">${src ? `<img src="${src}" alt="">` : ''}<div><h3>${d.name}</h3>
      <small>Nível ${d.level} · Compra: ${d.purchaseCost} 🪙</small><small>Abates: ${d.kills}</small></div></div>
      <div class="up-stats"><span>Dano</span><b>${d.damage}</b><span>Alcance</span><b>${d.range.toFixed(1)}</b>
      <span>Vel. de ataque</span><b>${d.attackSpeed.toFixed(2)}/s</b></div>
      <div class="up-skill">${bought.length ? '✨ ' + bought.join(' · ') : d.def.levels[d.level - 1]?.ability || ''}</div>
      <div class="up-tg">${TARGETS.map(([k, n]) => `<button data-tg="${k}" class="${d.targetMode === k ? 'on' : ''}">🎯 ${n}</button>`).join('')}</div>
      <div class="up-cols">${cols}</div><div class="up-tip">Passe o mouse sobre uma melhoria.</div>
      <button class="up-sell" data-sell>⚓ Vender · ${m._sellValue(d)} 🪙</button>`;
  }
}