import type { Save } from './business'
import { fireWindow } from './business'
import { recipe } from './content'
import type { FoodArt, RecipeId, Step } from './content'
import { brush, canvas, oval, random } from './pixel'
import { drawFood } from './food-art'

const raw: Record<RecipeId, FoodArt> = { potato: 'potato', tofu: 'tofu', meatballs: 'pork' }

export function kitchenScene() {
  const { element, ctx } = canvas(240, 118)
  const p = brush(ctx)
  const base = canvas(240, 118)
  const b = brush(base.ctx)
  b(0,0,240,118,'#96664c')
  for(let y=0;y<116;y+=14) {
    b(0,y,240,1,'#79533d');b(0,y+1,240,1,'#b3825e')
  }
  const rnd=random(640)
  for(let i=0;i<470;i++){
    b(rnd()*239,rnd()*118,1+rnd()*9,1,i%2?'#d7a27240':'#744d3540')
  }
  b(0,0,240,6,'#6b5040')
  b(0,116,240,2,'#694a3b')
  element.className='kitchen-canvas'
  element.setAttribute('aria-hidden','true')
  const sprites = new Map<string, HTMLCanvasElement>()
  function food(art: FoodArt, plated: boolean, seasoned: boolean) {
    const key = [art,plated,seasoned].join('/')
    if (!sprites.has(key)) {
      const layer = canvas(96,72)
      drawFood(layer.ctx, art, plated, seasoned)
      sprites.set(key, layer.element)
    }
    return sprites.get(key)!
  }
  function paint(save: Save, now: number, flash: { effect: Step['effect']; at: number } | null) {
    const ticket = save.ticket, cook = save.cooking
    if(!ticket || !cook) return
    const steps = recipe(ticket.recipe).steps
    const prev = steps[cook.step-1]
    const art = prev?.art ?? raw[ticket.recipe]
    const heat = cook.heat
    const cooking = heat !== null
    const finished = cook.step === steps.length
    const finishMove = finished && flash?.effect === 'plate' ? Math.max(0,1-(now-flash.at)/390) : 0
    const seasoned = steps.slice(0,cook.step).some(step => step.effect === 'add' && (step.art === 'brushed' || step.art === 'goldpotato'))
    const cookedColor = cook.fryResult === 'dark' ? 'brightness(0.76) saturate(0.8)'
      : cook.fryResult === 'pale' ? 'brightness(1.12) saturate(0.65)' : 'none'
    ctx.drawImage(base.element,0,0)
    p(13,18,31,80,'#574939')
    p(14,18,29,78,'#ac825d')
    p(15,21,27,73,'#d8b383')
    for(let i=0;i<5;i++) p(17,25+i*13,22,3,'#f0d2a2')
    p(197,28,31,72,'#533e32')
    p(199,28,27,68,'#567363')
    for(let i=0;i<5;i++)p(200,32+i*12,25,3,'#77917a')

    if (cooking) {
      oval(p,53,52,136,54,'#4e392f')
      p(48,64,14,7,'#443d35');p(177,64,21,7,'#443d35')
      oval(p,54,24,132,75,'#333832')
      oval(p,57,26,126,68,'#697167')
      oval(p,61,29,118,62,'#4c4b3d')
      oval(p,67,33,106,53,'#a56830')
      oval(p,70,36,100,47,'#bc863d')
      const { start, end } = fireWindow(save)
      const fryingMix = Math.min(1,heat/start)
      const y = 14 + Math.sin(now/165) * 2
      ctx.drawImage(food(art,false,false),72,y)
      ctx.globalAlpha = fryingMix
      if (heat > end + 0.4) ctx.filter = 'brightness(0.64) saturate(0.7)'
      ctx.drawImage(food(steps[cook.step].art,false,false),72,y)
      ctx.filter = 'none'
      ctx.globalAlpha = 1
      for(let i=0;i<23;i++){
        const t=(now/390+i*0.618)%1
        const x=77+(i*29)%86, dy=45+(i*13)%30
        const size=t<0.38?1:t<0.72?3:2
        p(x,dy-t*5,size,size,i%3?'#f3d27c':'#ffeab7')
      }
    } else if (finished) {
      ctx.filter = cookedColor
      ctx.drawImage(food(art,true,seasoned),53+finishMove*45,5+finishMove*18,134,100)
      ctx.filter = 'none'
    } else {
      p(54,27,133,71,'#533f32')
      p(53,21,133,70,'#8a603d')
      p(56,22,128,67,'#d0a36d')
      p(60,26,120,58,'#e0b984')
      p(62,79,116,2,'#e9c496')
      for(let i=0;i<8;i++) p(62+(i*37)%67,28+i*6,22+(i*11)%27,1,'#c89c6480')
      const movement = flash?.effect === 'mix' && now-flash.at < 320 ? Math.sin((now-flash.at)/42)*4 : 0
      ctx.filter = cookedColor
      ctx.drawImage(food(art,art==='pork'||art==='mixed',seasoned),72+movement,11)
      ctx.filter = 'none'
    }
    if(!flash || now-flash.at > 420) return
    const t=(now-flash.at)/420
    if(flash.effect==='cut'){
      const dy=Math.sin(t*Math.PI)*14
      p(127,29+dy,42,10,'#455650');p(127,30+dy,36,7,'#c6d0bd');p(131,37+dy,34,2,'#f6e5b8')
      p(163,29+dy,23,5,'#653f30');p(175,30+dy,8,2,'#ac7047')
    }
    if(flash.effect==='add'||flash.effect==='wash'||flash.effect==='peel'||flash.effect==='brush'){
      for(let i=0;i<14;i++){
        const x=90+(i*11)%65, y=25+(i*7)%22+Math.sin(t*Math.PI)*18
        const color=flash.effect==='wash'?'#b3ded3':flash.effect==='brush'?'#a74631':i%3?'#788d4d':'#eee0a8'
        p(x,y,2+i%3,2,color)
      }
    }
  }
  return { element, paint }
}
