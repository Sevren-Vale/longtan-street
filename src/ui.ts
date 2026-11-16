import type { Character, Save } from './business'
import { enough, fireWindow, levelOf, taskProgress } from './business'
import { customers, dailyTasks, ingredientIds, ingredients, levels, looks, recipe, stalls, upgrades } from './content'
import type { StallId } from './content'
import { foodIcon } from './food-art'
import { portrait } from './pixel'

export function escapeText(text: string) {
  return text.replace(/[&<>"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[character]!)
}
export function button(label: string, action: string, theme = '', disabled = false) {
  return '<button type="button" class="button '+ theme +'" data-action="' + action + '"' + (disabled ? ' disabled' : '') + '>' + label + '</button>'
}
export function title(hasSave: boolean, notice: string) {
  return `<main class="title-screen">
    <img class="title-art" src="${import.meta.env.BASE_URL}longtan-title.png" alt="">
    <div class="title-shade"></div>
    <header class="title-top"><span class="seal">龙潭</span><span>湖南 · 桂阳</span></header>
    <section class="title-content">
      <p class="eyebrow title-eyebrow">一条街，一间摊</p>
      <h1>龙潭<span>商业街</span></h1>
      <p class="title-lead">从校门口走回熟悉的街巷。<br>摆一间炸物小摊，迎接放学后的街坊。</p>
      <div class="title-actions">
        ${button(hasSave ? '继续游戏' : '开始游戏', hasSave ? 'continue' : 'new', 'primary')}
        ${hasSave ? button('开始新游戏', 'new', 'light') : ''}
        ${button('设置','settings','glass')}
      </div>
      ${notice ? '<p class="title-notice" role="status">'+escapeText(notice)+'</p>' : ''}
    </section>
    <footer class="title-footer"><span>龙潭西路 · 放学以后</span><span>首发版 1.0</span></footer>
  </main>`
}
const lookLabels = { gender:'角色',hair:'发型',hairColor:'发色',skin:'肤色',outfit:'服装' }
export function creation(draft: Character) {
  return `<main class="paper-screen">
    <div class="paper-card create-card">
      <header class="paper-heading"><div class="eyebrow">返乡开摊</div><h1>今天起，当个小摊主</h1><p>桂阳一中的毕业照收好了。新招牌上，写谁的名字？</p></header>
      <form id="create-form">
        <div class="create-body"><div class="preview-frame"><div id="look-preview"></div><span>主角预览</span></div>
          <div class="creation-fields">
            <label class="name-field"><span>摊主名字</span><input required maxlength="16" name="name" placeholder="给摊主取个名字" value="${escapeText(draft.name)}" autocomplete="off"></label>
            ${Object.entries(looks).map(([key, choices]) => `<div class="look-field"><label for="look-${key}">${lookLabels[key as keyof typeof looks]}</label>
              <select id="look-${key}" name="${key}">${choices.map((name, i) => '<option value="'+ i+'"'+(draft[key as keyof typeof looks]===i?' selected':'')+'>'+name+'</option>').join('')}</select></div>`).join('')}
          </div>
        </div>
        <div class="actions">${button('回到标题','title')}<button type="submit" class="button primary">写上我的名字</button></div>
      </form>
    </div>
  </main>`
}
export function intro(draft: Character) {
  return `<main class="paper-screen"><section class="paper-card story">
    <div class="eyebrow">第一天 · 放学之后</div><h1>又见龙潭</h1>
    <div id="story-portrait"></div>
    <p>桂阳一中的放学铃从街口传来。${escapeText(draft.name)}提着一袋土豆，走过从前天天经过的校门。</p>
    <p>「摊车给你擦干净了，第一锅油，等你来开。」隔壁陈阿姨指了指挂着红布的小摊。街巷里飘着葱香，你把写好名字的招牌挂了起来。</p>
    <div class="actions">${button('修改角色','edit-character')}${button('走进龙潭商业街','enter','primary')}</div>
  </section></main>`
}

export function streetShell(game: Save) {
  return `<main class="street-screen">
    <header class="hud"><div class="hud-brand"><span class="seal">龙潭</span><div><strong>龙潭商业街</strong><small>桂阳 · 龙潭西路</small></div></div>
      <div class="hud-stats" id="hud-stats"></div>
      ${button('设置','settings','hud-button')}
    </header>
    <div class="street-view" id="street-view"></div>
    <footer class="street-footer">
      <div class="map-caption"><span class="district-dot"></span><div><b>龙潭街区</b><small class="key-help">方向键或字母键移动，按互动键 E 或点击摊位</small><small class="touch-help">拖动摇杆，轻触摊位或靠近互动</small></div></div>
      <nav aria-label="街区快捷入口">${button('炸香摊','stall','nav-active')}${button('采购','warehouse')}${button('图鉴','book')}${button('公告','notice')}</nav>
    </footer>
    <span class="visually-hidden">经营者 ${escapeText(game.character.name)}</span>
  </main>`
}
export function stats(game: Save) {
  return `<div><span>营业日</span><strong>第 ${game.day.number} 天</strong></div>
    <div><span>金币</span><strong class="gold">${game.coins}</strong></div>
    <div><span>街区人气</span><strong>${game.popularity}</strong></div>
    <div><span>炸香摊</span><strong>${levelOf(game)} 级</strong></div>`
}
function artMarkup() { return '<div class="food-slot"></div>' }
function tasks(game: Save) {
  return `<ul class="task-list">${dailyTasks(game.day.number).map(task => {
    const progress = taskProgress(game.day,task)
    return `<li><span class="task-mark ${progress>=task.target?'complete':''}" aria-hidden="true"></span><div><strong>${task.name}</strong><small>${Math.min(progress,task.target)} / ${task.target} · 收摊奖励 ${task.reward} 金币</small></div><progress max="${task.target}" value="${progress}" aria-label="${task.name}"></progress></li>`
  }).join('')}</ul>`
}
function receipt(game: Save) {
  const r = game.receipt!
  const quality = r.quality >= 90 ? '拿手好菜' : r.quality >= 70 ? '火候稍偏' : '下次再练练'
  const feedback = r.satisfaction >= 85 ? '趁热咬了一口，笑着说下次再来。' : r.satisfaction >= 60 ? '接过热腾腾的小吃，向你道了谢。' : '带走了这份小吃，希望下一锅火候更匀。'
  return `<section class="receipt"><div class="receipt-people"><div id="receipt-portrait"></div>${artMarkup()}</div><div><span class="eyebrow">已交付 · ${quality}</span><h3>${recipe(r.recipe).name}</h3><p>${customers[r.customer].name}${feedback}</p>
  <div class="metric-row"><span>实收 <b>+${r.coins+r.tip}</b> 金币</span><span>经验 <b>+${r.xp}</b></span><span>人气 <b>+${r.popularity}</b></span></div>
  <small>菜品质量 ${r.quality} · 顾客满意度 ${r.satisfaction} · 小费 ${r.tip}</small></div></section>`
}
function summary(game: Save) {
  const s = game.summary!
  const avg = Math.round(s.satisfaction/s.orders)
  return `<div class="summary"><p class="eyebrow">第 ${s.number} 天</p><h3>摊上的灯熄了</h3>
    <div class="summary-grid">
      ${[['完成订单',s.orders+' 单'],['走失顾客',s.missed+' 位'],['菜款与小费','+'+(s.sales+s.tips)+' 金币'],['采购与升级','−'+s.spend+' 金币'],['任务奖励','+'+s.bonus+' 金币'],['经营净额',(s.sales+s.tips+s.bonus-s.spend)+' 金币'],['平均满意度',avg+' 分'],['街区人气','+'+s.popularity]].map(([label,value])=>'<div><small>'+label+'</small><b>'+value+'</b></div>').join('')}
    </div>
    <p>明日目标：${dailyTasks(s.number+1).map(t=>t.name).join('、')}。</p>
    <div class="actions">${button('开始下一天','next-day','primary')}</div>
  </div>`
}
export function stallPanel(game: Save) {
  if (game.summary) return { title:'今日收摊', html:summary(game) }
  const order = game.ticket
  const cook = game.cooking
  if (!order) {
    const next = levels[levelOf(game)]
    const hint = game.day.number===1 && game.day.orders<3 ? '头一回开摊，先跟着三位街坊熟悉菜谱。' : '下一位街坊会从现有菜谱里点一份炸物。'
    return { title:'龙潭炸香摊', html:`
    ${game.receipt ? receipt(game) : '<div class="stall-lead"><span class="eyebrow">今日开张</span><h3>锅热了，接下一位客人</h3><p>'+hint+'</p></div>'}
    <div class="actions shift-actions">${button('接待顾客','invite:relaxed','primary')}${button('限时挑战','invite:timed')}${button('收摊结算','settle','',game.day.orders===0)}</div>
    <div class="subheading"><b>第 ${game.day.number} 天 · 今日目标</b><small>${next ? '摊位 '+levelOf(game)+' 级 · 经验 '+game.xp+' / '+next : '摊位已达五级'}</small></div>
    ${tasks(game)}<div class="text-actions">${button('采购食材','warehouse','quiet')}${button('设备升级','equipment','quiet')}${button('菜谱图鉴','book','quiet')}</div>` }
  }
  const dish = recipe(order.recipe)
  const customer = customers[order.customer]
  const arrival = `<div class="customer-card"><div id="customer-portrait"></div><div><b>${customer.name}</b><p>「${customer.line}」</p></div><span class="tag">${order.mode === 'timed' ? (order.stage==='accepted'?'剩余 <b id="wait">'+Math.ceil(order.wait)+'</b> 秒':'接单后 '+customer.wait+' 秒') : '随时出餐'}</span></div>`
  if (!cook) {
    const inStock = enough(game,order.recipe)
    return { title:order.stage==='offered'?'街坊点单':'备齐食材', html:`${arrival}
      <div class="order-dish">${artMarkup()}<div><p class="eyebrow">一份 · ${dish.price} 金币起</p><h3>${dish.name}</h3><p>${order.mode === 'timed' ? '挑战用时影响满意度，打开其他面板时计时暂停。' : '街坊愿意等一等，按自己的节奏做。'}</p></div></div>
      <ul class="ingredients-needed">${ingredientIds.filter(id=>dish.cost[id]).map(id=>`<li class="${game.inventory[id] < (dish.cost[id] ?? 0) ? 'short':''}">${ingredients[id].name} × ${dish.cost[id]} <small>库存 ${game.inventory[id]}</small></li>`).join('')}</ul>
      <div class="actions">
        ${order.stage==='offered'?button('接受订单','accept','primary'):button('取料开始制作','start-cooking','primary',!inStock)}
        ${!inStock?button('补齐食材','warehouse'):''}
        ${button(order.stage==='offered'?'婉拒订单':'取消订单','cancel-order')}
      </div>` }
  }
  const step = dish.steps[cook.step]
  const inOil = cook.heat !== null
  const window = fireWindow(game)
  return { title:dish.name, html:`${arrival}
    <div id="workbench"></div>
    <div class="step-strip" aria-label="制作进度">${dish.steps.map((s,i)=>`<span class="${i<cook.step?'done':i===cook.step?'current':''}" title="${s.label}"></span>`).join('')}</div>
    <div class="step-details">
      <div><b>${step ? step.label : '已装盘，可以出餐'}</b><p>${step ? step.note : '热腾腾的炸物盛好了，交到顾客手上。'}${step?.taps?' 进度 '+cook.taps+' / '+step.taps:''}</p></div>
      <span class="tag">${cook.fryResult==='pale'?'捞得偏早 · ':cook.fryResult==='dark'?'火候偏老 · ':''}质量 ${cook.quality}</span>
    </div>
    ${inOil ? `<div class="heat-info"><div class="heat-meter" aria-label="油炸火候" style="--heat-start:${window.start/10*100}%;--heat-end:${window.end/10*100}%;"><i id="heat-pointer"></i></div><span id="heat-label">上色中</span></div>` : ''}
    <div class="actions">${step?button(inOil?'捞出锅':step.label,'advance','primary'):button('交付给顾客','serve','primary')}${button('取消订单','cancel-order','quiet')}</div>` }
}
export function fillStall(element: HTMLElement, game: Save) {
  const slot = element.querySelector('.food-slot')
  const order = game.ticket
  if (slot && (order || game.receipt)) slot.append(foodIcon(recipe((order ?? game.receipt!).recipe).art, 'menu-food'))
  const guest = order ? customers[order.customer] : game.receipt ? customers[game.receipt.customer] : null
  const portraitSlot = element.querySelector('#customer-portrait, #receipt-portrait')
  if (guest && portraitSlot) portraitSlot.append(portrait({ gender:guest.outfit===0||guest.outfit===1?1:0, hair:guest.outfit===1?2:1, hairColor:0, skin:1, outfit:guest.outfit }, 52))
}

export function warehouse(game: Save) {
  return `<div class="subheading"><b>现有金币 ${game.coins}</b><small>按份进货，取料时扣库存</small></div>
  <ul class="stock-list">${ingredientIds.map(id=>{
    const item=ingredients[id]
    return `<li>${artMarkup()}<div><strong>${item.name}</strong><small>库存 ${game.inventory[id]} 份</small></div>${button('购买 '+item.pack+' 份 · '+item.price+' 金币','buy:'+id,'',game.coins<item.price||game.inventory[id]+item.pack>999)}</li>`
  }).join('')}</ul><div class="actions">${button('回炸香摊','stall','primary')}</div>`
}
export function fillWarehouse(element: HTMLElement) {
  element.querySelectorAll('.food-slot').forEach((slot,i)=>slot.append(foodIcon(ingredientIds[i])))
}
export function book(game: Save) {
  return `<ul class="book-list">${game.knownRecipes.map(id=>{
    const r=recipe(id)
    return `<li>${artMarkup()}<div><h3>${r.name}</h3><p>${r.steps.map(step=>step.label).join(' · ')}</p><small>拿手评价 ${game.mastery[id]} 次 · 标价 ${r.price} 金币</small></div></li>`
  }).join('')}</ul>`
}
export function fillBook(element: HTMLElement, game: Save) {
  element.querySelectorAll('.food-slot').forEach((slot,i)=>slot.append(foodIcon(recipe(game.knownRecipes[i]).art,'menu-food')))
}
export function equipment(game: Save) {
  return `<p>摊位 ${levelOf(game)} 级 · 手头 ${game.coins} 金币</p>
    <ul class="equipment-list">${upgrades.map((upgrade,i)=>`<li><div><b>${upgrade.name}</b><p>${upgrade.benefit}</p><small>需要摊位 ${upgrade.level} 级 · ${upgrade.cost} 金币</small></div>
    ${button(i<game.equipment?'已装备':'购买升级','upgrade','',i!==game.equipment||levelOf(game)<upgrade.level||game.coins<upgrade.cost)}</li>`).join('')}</ul>
    <div class="actions">${button('回炸香摊','stall','primary')}</div>`
}
export function notice(game: Save) {
  return `<div class="subheading"><b>第 ${game.day.number} 天 · 营业目标</b><small>${game.summary?'今日已收摊':'收摊时发放奖励'}</small></div>
  ${tasks(game)}<div class="notice-entry"><span class="eyebrow">街区公告 · 首发版</span><h3>龙潭炸香摊开张</h3><p>欢迎来尝现炸土豆、香酥豆腐和桂阳风味肉丸。补货点在广场东南边，仓库门口也可以采购。</p></div>
  <p class="small-note">地图以桂阳一中和龙潭商业街为现实地标，街巷与摊位布局为游戏化创作。</p>`
}
export function locked(game: Save, id: StallId) {
  const s=stalls[id]
  const tea = [
    levelOf(game)+' / 4 级', Math.max(0,game.day.number - (game.summary?0:1))+' / 5 天',
    (Object.values(game.mastery).filter(n=>n>=3).length)+' / 3 道',
    game.popularity+' / 40 人气，'+game.coins+' / 800 金币',
  ]
  return `<div class="locked-lead"><span class="tag">筹备中</span><p>${s.preview}</p></div>
    <div class="subheading"><b>开业条件预览</b></div><ul class="lock-list">${s.conditions.map((text,i)=>'<li>'+text+(id==='tea'?'<small>'+tea[i]+'</small>':'')+'</li>').join('')}</ul>
    <p class="small-note">本版开放龙潭炸香摊。其余摊位将在后续更新中依次开业。</p>`
}
export function settings(hasSave: boolean, sound: boolean) {
  return `<div class="subheading"><b>操作</b></div>
    <p>电脑用方向键或 W、A、S、D 移动，按 E 互动。手机可拖动左下摇杆。点击摊位或建筑也能打开对应功能。</p>
    <div class="subheading"><b>音效</b>${button(sound?'关闭音效':'开启音效','sound')}</div>
    <div class="subheading"><b>本地存档</b></div>
    <p>进度自动存入当前浏览器。不同设备暂不自动同步，可用存档文件手动转移。</p>
    <div class="actions settings-actions">${button('导出存档','export','',!hasSave)}${button('导入存档','import')}${button('清空存档','erase','danger',!hasSave)}</div>
    <input type="file" accept=".json,application/json" id="import-file" hidden>`
}
