import './style.css'
import { advance, buy, dismissOrder, fireWindow, improve, invite, newSave, nextDay, serve, settle, startCooking, tick } from './business'
import type { Character, Save } from './business'
import { ingredientIds, looks, recipe, stalls } from './content'
import type { Ingredient, LookKey, StallId, Step } from './content'
import { decodeSave, eraseSave, rawSave, readSave, saveKey, writeSave } from './save'
import { mountStreet } from './street'
import { displayName } from './world'
import type { ObjectData } from './world'
import { portrait } from './pixel'
import { kitchenScene } from './kitchen-art'
import * as ui from './ui'

type Screen = 'title' | 'create' | 'intro' | 'street'
type Panel = 'stall' | 'warehouse' | 'book' | 'equipment' | 'notice' | 'settings' | 'locked' | 'place' | 'confirm'
const app = document.querySelector<HTMLElement>('#app')!
const screen = document.createElement('div')
screen.id = 'screen'
const dialog = document.createElement('dialog')
dialog.className = 'dialog'
dialog.setAttribute('aria-labelledby','dialog-title')
const live = document.createElement('div')
live.className = 'toast'
live.setAttribute('role','status')
live.hidden = true
const dialogLive = document.createElement('div')
dialogLive.className = 'dialog-feedback'
dialogLive.setAttribute('role','status')
dialogLive.hidden = true
app.append(screen, dialog, live)

let { game, notice: saveNotice } = readSave()
let view: Screen = 'title'
let panel: Panel | null = null
let place: ObjectData | null = null
let draft: Character = { name:'',gender:0,hair:0,hairColor:0,skin:0,outfit:0 }
let disposeMap: (()=>void) | undefined
let settingsReturn: Panel | null = null
let previousFocus: HTMLElement | null = null
let confirmation: { title: string; text: string; label: string; before: Panel | null; apply: () => void } | null = null
let conflict = false
let storageAlert = false
let toastTimer = 0
let sound = true
let audio: AudioContext | null = null
const kitchen = kitchenScene()
let flash: { effect: Step['effect']; at: number } | null = null

try { sound = localStorage.getItem('longtan-street.sound') !== 'off' } catch { /* 音效使用默认值 */ }

function chime(kind: 'click' | 'finish' | 'step') {
  if (!sound || typeof AudioContext === 'undefined') return
  try {
    audio ??= new AudioContext()
    if (audio.state === 'suspended') void audio.resume().catch(()=>{})
    const tones = kind === 'finish' ? [392, 440, 587.33, 659.25] : kind === 'step' ? [440,587.33] : [392]
    for (const [i, pitch] of tones.entries()) {
      const at = audio.currentTime + i*0.07
      const note=audio.createOscillator(), volume=audio.createGain()
      note.type='triangle'
      note.frequency.value=pitch
      volume.gain.setValueAtTime(0.001,at)
      volume.gain.exponentialRampToValueAtTime(0.075,at+0.012)
      volume.gain.exponentialRampToValueAtTime(0.001,at+0.13)
      note.connect(volume)
      volume.connect(audio.destination)
      note.start(at)
      note.stop(at+0.15)
    }
  } catch { /* 音效可用性与游戏进度无关 */ }
}
function toast(message: string, persistent = false) {
  clearTimeout(toastTimer)
  const target = dialog.open ? dialogLive : live
  live.hidden = dialogLive.hidden = true
  target.textContent=message
  target.hidden=false
  if(!persistent) toastTimer=window.setTimeout(() => { target.hidden=true },3800)
}
function persist() {
  if(!game||conflict) return false
  const ok=writeSave(game)
  if(!ok&&!storageAlert)toast('自动保存失败，请在设置中导出当前进度。',true)
  if(ok&&storageAlert){
    for(const status of [live,dialogLive]){
      if(status.textContent?.startsWith('自动保存失败'))status.hidden=true
    }
  }
  storageAlert=!ok
  return ok
}
function updateStats() {
  const target=screen.querySelector('#hud-stats')
  if(target&&game)target.innerHTML=ui.stats(game)
}
function refreshAfterChange() {
  persist()
  updateStats()
  if(panel) renderPanel(false)
}
function moveTo(next: Screen) {
  disposeMap?.()
  disposeMap=undefined
  closePanel(false)
  view=next
  if(next==='title')screen.innerHTML=ui.title(!!game,saveNotice)
  if(next==='create'){
    screen.innerHTML=ui.creation(draft)
    screen.querySelector('#look-preview')?.append(portrait(draft,132))
  }
  if(next==='intro'){
    screen.innerHTML=ui.intro(draft)
    screen.querySelector('#story-portrait')?.append(portrait(draft,70))
  }
  if(next==='street'&&game){
    screen.innerHTML=ui.streetShell(game)
    updateStats()
    disposeMap=mountStreet(screen.querySelector('#street-view')!,game,interact,()=>panel!==null||document.hidden)
  }
}
function setPanel(next: Panel) {
  if (!dialog.open) previousFocus = document.activeElement as HTMLElement | null
  panel=next
  renderPanel(true)
}
function closePanel(restore = true) {
  panel=null
  confirmation=null
  if(dialog.open)dialog.close()
  dialogLive.hidden=true
  if(restore && previousFocus?.isConnected)previousFocus.focus({preventScroll:true})
  previousFocus=null
}
function back() {
  if(panel==='confirm'){
    const before=confirmation?.before
    confirmation=null
    if(before)setPanel(before)
    else closePanel()
  } else if(panel==='settings'&&settingsReturn){
    const next=settingsReturn
    settingsReturn=null
    setPanel(next)
  } else closePanel()
}
function interact(object: ObjectData) {
  if(object.stall){place=object;setPanel(object.stall==='fried'?'stall':'locked')}
  else if(object.kind==='warehouse'||object.kind==='supply')setPanel('warehouse')
  else if(object.kind==='board')setPanel('notice')
  else {place=object;setPanel('place')}
}
const placeLines: Record<string,string> = {
  school:'放学铃响过了。桂阳一中的学生有时会来老街买点热食。',
  entry:'龙潭西路连着校门和小吃街。沿主街向东是广场，穿过广场就能去仓库。',
  future:'这排临街铺面留给街区扩建，正在等新店主。',
  night_market:'街灯和摊位正在筹备。这里留给以后的夜市。',
  bench_north:'奔波了一天，在广场长椅上歇一会儿。',
  bench_south:'有人在这里等朋友，也有人坐下来把炸土豆吃完。',
}
function renderPanel(initial: boolean) {
  if(!panel)return
  let title='', html=''
  const focus = !initial && document.activeElement instanceof HTMLButtonElement ? document.activeElement.dataset.action : undefined
  const scroll=initial?0:dialog.querySelector('.dialog-body')?.scrollTop||0
  if(panel==='settings'){
    title='设置'
    html=ui.settings(!!game||!!rawSave(),sound)
    if(conflict)html+='<p class="small-note">另一个页面更新了存档。刷新后继续，或先导出本页进度。</p>'
  } else if(panel==='confirm'&&confirmation){
    const c=confirmation
    title=c.title
    html=`<p>${c.text}</p><div class="actions">${ui.button('返回','back')}${ui.button(c.label,'confirm','danger')}</div>`
  } else if(game){
    switch(panel){
      case 'stall': ({title,html}=ui.stallPanel(game)); break
      case 'warehouse': title='街区仓库 · 采购'; html=ui.warehouse(game); break
      case 'book': title='菜谱图鉴'; html=ui.book(game); break
      case 'equipment': title='摊位设备'; html=ui.equipment(game); break
      case 'notice': title='街区公告栏'; html=ui.notice(game); break
      case 'locked': {
        const id=place!.stall as StallId
        title=stalls[id].name;html=ui.locked(game,id);break
      }
      case 'place':
        title=displayName(place!)
        html='<p>'+placeLines[place!.id]+'</p>';break
    }
  }
  dialog.dataset.panel=panel
  dialog.innerHTML=`<header class="dialog-header"><h2 id="dialog-title" tabindex="-1">${title}</h2>${ui.button('返回','back','close')}</header><div class="dialog-body">${html}</div>`
  dialog.append(dialogLive)
  if(game&&panel==='warehouse')ui.fillWarehouse(dialog)
  if(game&&panel==='book')ui.fillBook(dialog,game)
  if(game&&panel==='stall'){
    ui.fillStall(dialog,game)
    const slot=dialog.querySelector('#workbench')
    if(slot){slot.append(kitchen.element); kitchen.paint(game,performance.now(),flash)}
    updateCookingUI()
  }
  dialog.querySelector('.dialog-body')!.scrollTop=scroll
  if(!dialog.open)dialog.showModal()
  if(initial)dialog.querySelector<HTMLElement>('#dialog-title')?.focus({preventScroll:true})
  else if(focus) {
    const next=Array.from(dialog.querySelectorAll<HTMLButtonElement>('button')).find(button=>button.dataset.action===focus&&!button.disabled)
    ;(next ?? dialog.querySelector<HTMLElement>('#dialog-title'))?.focus({preventScroll:true})
  }
}
function ask(title: string, text: string, label: string, apply: () => void) {
  confirmation={title,text,label,before:panel,apply}
  setPanel('confirm')
}
function handleNew() {
  const start=()=>{
    draft={name:'',gender:0,hair:0,hairColor:0,skin:0,outfit:0}
    moveTo('create')
  }
  if(game||rawSave())ask('开始新游戏','进入新游戏后会覆盖此浏览器现有的经营存档。','创建新角色',start)
  else start()
}
function exportSave() {
  const raw=game?JSON.stringify(game,null,2):rawSave()
  if(!raw)return
  const url=URL.createObjectURL(new Blob([raw+'\n'],{type:'application/json'}))
  const link=document.createElement('a')
  link.href=url;link.download='龙潭商业街-存档.json'
  link.click()
  window.setTimeout(()=>URL.revokeObjectURL(url),1000)
  toast('已导出存档。')
}
async function loadFile(file: File) {
  if(conflict){toast('另一个页面更新了存档，请刷新后再导入。',true);return}
  try {
    if(file.size>256_000)throw new Error('存档文件太大。')
    const next=decodeSave(await file.text())
    if(panel!=='settings')return
    const importGame=()=>{
      if(conflict){back();toast('另一个页面更新了存档，请刷新后再导入。',true);return}
      if(!writeSave(next)){back();toast('导入失败，浏览器无法写入本地存储。');return}
      game=next
      saveNotice=''
      moveTo('street')
      toast('已导入存档，欢迎回到龙潭。')
    }
    if(game||rawSave())ask('导入并替换存档','将用导入文件替换当前经营进度。','替换当前存档',importGame)
    else importGame()
  } catch(error) {
    toast(error instanceof SyntaxError ? '文件格式有误，请选择游戏导出的存档文件。' : error instanceof Error ? error.message : '读取文件失败。')
  }
}
function operate(action: string) {
  if(action==='back'){back();return}
  if(action==='confirm'){confirmation?.apply();return}
  if(action==='settings'){settingsReturn=panel;setPanel('settings');return}
  if(action==='new'){handleNew();return}
  if(action==='continue'&&game){moveTo('street');return}
  if(action==='title'){moveTo('title');return}
  if(action==='edit-character'){moveTo('create');return}
  if(action==='enter'&&view==='intro'){
    game=newSave({...draft})
    saveNotice=''
    persist()
    moveTo('street')
    toast('先到红布棚的龙潭炸香摊接待第一位街坊。')
    return
  }
  if(action==='export'){exportSave();return}
  if(action==='import'){dialog.querySelector<HTMLInputElement>('#import-file')?.click();return}
  if(action==='erase'){
    if(conflict){toast('另一个页面更新了存档，请刷新后再清空。',true);return}
    ask('确认清空存档','清空后，本机保存的角色、金币、库存和营业进度都将移除。','确认清空存档',()=>{
      if(conflict){back();toast('另一个页面更新了存档，请刷新后再清空。',true);return}
      if(!eraseSave()){back();toast('浏览器拒绝清空存档。');return}
      game=null;saveNotice=''
      moveTo('title');toast('本机存档已清空。')
    })
    return
  }
  if(action==='sound'){
    sound=!sound
    try{localStorage.setItem('longtan-street.sound',sound?'on':'off')}catch{/* 本次会话生效 */}
    if(sound)chime('click')
    renderPanel(false)
    return
  }
  if(!game)return
  if(['stall','warehouse','equipment','book','notice'].includes(action)){setPanel(action as Panel);return}
  if(action==='invite:relaxed'||action==='invite:timed'){
    flash=null;invite(game,action==='invite:relaxed'?'relaxed':'timed')
  } else if(action==='accept'&&game.ticket?.stage==='offered')game.ticket.stage='accepted'
  else if(action==='start-cooking')startCooking(game)
  else if(action==='advance'&&game.ticket&&game.cooking){
    const step=recipe(game.ticket.recipe).steps[game.cooking.step]
    if(step)flash={effect:step.effect,at:performance.now()}
    advance(game);chime('step')
  } else if(action==='serve'){
    const before=game.served
    serve(game)
    if(game.served>before)chime('finish')
  } else if(action==='cancel-order'){
    const cancel=()=>{
      if(!game)return
      dismissOrder(game)
      flash=null
      closePanel(false)
      setPanel('stall')
      refreshAfterChange()
    }
    if(game.cooking){
      ask('取消这份订单？','顾客会离开，已经取用的食材计入损耗。','确认取消订单',cancel)
      return
    }
    cancel()
    return
  } else if(action==='settle'){settle(game);chime('finish')}
  else if(action==='next-day')nextDay(game)
  else if(action==='upgrade'){if(improve(game))toast('设备已装好，油锅火候更好掌握了。')}
  else if(action.startsWith('buy:')){
    const id=action.slice(4) as Ingredient
    if(ingredientIds.includes(id)&&buy(game,id))chime('click')
  } else return
  refreshAfterChange()
}
app.addEventListener('click',event=>{
  const target=(event.target as Element).closest<HTMLButtonElement>('button[data-action]')
  if(target?.dataset.action&&!target.disabled)operate(target.dataset.action)
})
app.addEventListener('input',event=>{
  const target=event.target
  if(view!=='create'||!(target instanceof HTMLInputElement||target instanceof HTMLSelectElement))return
  if(target.name==='name'){draft.name=target.value;return}
  const key=target.name as LookKey
  if(Object.hasOwn(looks,key)){
    draft[key]=Number(target.value)
    screen.querySelector('#look-preview')?.replaceChildren(portrait(draft,132))
  }
})
app.addEventListener('submit',event=>{
  if(view!=='create'||(event.target as HTMLFormElement).id!=='create-form')return
  event.preventDefault()
  const form=event.target as HTMLFormElement
  const name=form.elements.namedItem('name') as HTMLInputElement
  const cleaned=name.value.trim()
  if(!cleaned||/[\u0000-\u001f]/.test(cleaned)){toast('请输入有效的摊主名字。');name.focus();return}
  draft.name=cleaned.slice(0,16)
  moveTo('intro')
})
dialog.addEventListener('change',event=>{
  const target=event.target
  if(target instanceof HTMLInputElement&&target.id==='import-file'&&target.files?.length){
    const file=target.files[0]
    target.value=''
    void loadFile(file)
  }
})
dialog.addEventListener('cancel',event=>{event.preventDefault();back()})

window.addEventListener('storage',event=>{
  if(event.key!==saveKey&&event.key!==null)return
  if(view==='title'&&!dialog.open){({game,notice:saveNotice}=readSave());moveTo('title');return}
  conflict=true
  toast('另一个页面更新了存档。当前页已暂停自动保存。',true)
})
document.addEventListener('visibilitychange',()=>{last=performance.now(); if(document.hidden&&view==='street')persist()})
window.addEventListener('pagehide',()=>{if(view==='street')persist()})

function updateCookingUI(){
  if(!game?.ticket)return
  const wait=dialog.querySelector('#wait')
  if(wait)wait.textContent=String(Math.ceil(game.ticket.wait))
  const heat=game.cooking?.heat
  if(heat==null)return
  const pointer=dialog.querySelector<HTMLElement>('#heat-pointer')
  const label=dialog.querySelector<HTMLElement>('#heat-label')
  const {start,end}=fireWindow(game)
  if(pointer)pointer.style.left=(heat/10*100)+'%'
  if(label){
    const text=heat<start?'还在上色':heat<=end?'火候正好 · 捞出锅':'火候偏老'
    if(label.textContent!==text)label.textContent=text
    label.dataset.state=heat<start?'early':heat<=end?'ready':'late'
  }
}
let last=performance.now(), lastSave=last
function frame(now: number){
  const dt=Math.max(0,Math.min((now-last)/1000,0.10))
  last=now
  if(view==='street'&&game&&!document.hidden){
    if(panel==='stall'&&game.ticket){
      if (tick(game,dt)){
        flash=null
        toast('这位顾客已经离开。今天还可以继续营业。')
        refreshAfterChange()
      } else {
        if(game.cooking)kitchen.paint(game,now,flash)
        updateCookingUI()
      }
    }
    if(now-lastSave>1400){persist();lastSave=now}
  }
  requestAnimationFrame(frame)
}
moveTo('title')
requestAnimationFrame(frame)
