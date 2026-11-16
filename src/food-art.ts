import type { FoodArt } from './content'
import { brush, canvas, oval, random } from './pixel'
import type { Brush } from './pixel'

function shape(ctx: CanvasRenderingContext2D, color: string, ...points: [number, number][]) {
  ctx.fillStyle = color
  ctx.beginPath()
  points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))
  ctx.closePath()
  ctx.fill()
}
function ceramics(p: Brush, bowl: boolean) {
  oval(p, 13, 48, 73, 17, '#402a232b')
  oval(p, 13, 28, 72, bowl ? 34 : 32, '#536a60')
  oval(p, 13, 26, 70, 29, '#d9dbc1')
  oval(p, 16, 28, 64, 24, '#f8efce')
  oval(p, 21, 31, 54, 17, bowl ? '#b9b898' : '#ddd1ac')
  oval(p, 24, 32, 48, 14, '#ece1be')
  if (bowl) {
    p(25, 54, 44, 3, '#e0dec0'); p(33, 59, 29, 2, '#c2c7ac')
    p(36, 55, 13, 2, '#739082'); p(58, 54, 10, 1, '#739082')
  } else {
    p(27, 51, 11, 1, '#698d87'); p(53, 51, 16, 1, '#698d87'); p(36, 53, 26, 1, '#6e9891')
  }
}
function root(p: Brush, x: number, y: number, prepared: boolean) {
  oval(p, x, y, 38, 24, '#744e35')
  oval(p, x + 1, y + 1, 36, 21, prepared ? '#e1bd70' : '#b48147')
  oval(p, x + 3, y + 2, 31, 16, prepared ? '#f2d594' : '#ce9e60')
  oval(p, x + 5, y + 3, 24, 10, prepared ? '#ffe6a5' : '#d7aa6a')
  if (prepared) return
  for (const [a,b] of [[8,9],[25,5],[18,14],[29,16],[9,18],[22,10]]) {
    p(x+a,y+b,2,1,'#9c6c42');p(x+a+2,y+b+1,1,1,'#dec48a')
  }
}
function tofu(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, fried: boolean, sauce: boolean) {
  const p = brush(ctx)
  const h = Math.max(7, Math.round(w * 0.45))
  shape(ctx,fried?'#92562f':'#afa67f',[x,y+5],[x+w,y+5],[x+w,y+h+6],[x+6,y+h+9],[x,y+h+3])
  shape(ctx,fried?'#bb7740':'#d8cdae',[x+1,y+5],[x+w-1,y+6],[x+w-1,y+h+5],[x+6,y+h+8],[x+1,y+h+3])
  shape(ctx,fried?'#e8a54b':'#f1e8cd',[x+1,y+5],[x+6,y],[x+w-5,y],[x+w,y+6],[x+6,y+9])
  p(x+6,y+2,w-12,2,fried?'#ffc663':'#fff9e5')
  for(let i=0;i<Math.floor(w/3);i++)p(x+3+(i*7)%(w-5),y+5+i%5,1+i%2,1,fried?'#c78745':'#ddd1aa')
  if(sauce) {
    p(x+4,y+3,w-9,3,'#aa4934');p(x+7,y+5,w-11,2,'#c95736');p(x+8,y+3,w-13,1,'#eb7746')
  }
}
function wedges(ctx: CanvasRenderingContext2D, fried: boolean) {
  const p = brush(ctx)
  for(const [x,y,flip] of [[32,24,0],[49,26,1],[19,33,1],[58,36,0],[36,37,0],[27,45,1],[47,45,1]]) {
    const edge = fried ? '#a56027' : '#ba954c', flesh = fried ? '#e8a135' : '#efc775'
    if(flip) shape(ctx,edge,[x,y],[x+18,y+4],[x+21,y+9],[x+8,y+14],[x,y+8])
    else shape(ctx,edge,[x+16,y],[x+19,y+5],[x+16,y+13],[x+1,y+11],[x,y+7])
    shape(ctx,flesh,[x+(flip?2:14),y+1],[x+17,y+4],[x+15,y+10],[x+4,y+10],[x+2,y+6])
    p(x+6,y+6,8,2,fried?'#ffc65f':'#ffe3a0')
    p(x+10,y+9,2,1,fried?'#c98328':'#dbb463')
  }
}
function meat(ctx: CanvasRenderingContext2D, rolled: boolean, cooked: boolean, mixed: boolean) {
  const p = brush(ctx)
  if (rolled) {
    for (const [x,y] of [[36,24],[52,26],[24,34],[42,35],[59,37],[31,44],[48,47]]) {
      oval(p,x,y,20,16,cooked?'#7a3c28':'#9c5146')
      oval(p,x+1,y,18,14,cooked?'#b76839':'#c47768')
      oval(p,x+2,y+1,15,10,cooked?'#ce8745':'#dc8f7f')
      p(x+5,y+3,5,2,cooked?'#eaae59':'#efad98')
      p(x+11,y+7,2,1,cooked?'#9f542e':'#f6b49e')
      p(x+6,y+10,2,1,cooked?'#9e552d':'#647944')
      p(x+3,y+8,2,1,cooked?'#d08b48':'#b1685a')
    }
    return
  }
  oval(p,23,24,52,27,'#95514b'); oval(p,24,23,50,25,'#c77869')
  const rnd = random(27)
  for(let i=0;i<96;i++){
    const x=28+Math.floor(rnd()*42),y=25+Math.floor(rnd()*21)
    if(((x-49)/22)**2+((y-35)/11)**2>1)continue
    p(x,y,2+i%4,1+i%2,(mixed && i%6===0)?'#748b48':['#e2927f','#a75751','#ecb19b','#bd685b'][i%4])
  }
}
function garnish(p: Brush, style: 'scallion' | 'spice') {
  const rnd = random(701)
  for(let i=0;i<17;i++){
    const x=29+Math.round(rnd()*41),y=30+Math.round(rnd()*20)
    p(x,y,style==='scallion'?2:1,1,style==='scallion'?i%2?'#648741':'#a5ad5a':i%3?'#9a492d':'#eed084')
  }
}
export function drawFood(ctx: CanvasRenderingContext2D, art: FoodArt, plated = true, seasoned = false) {
  const p = brush(ctx)
  if (plated) ceramics(p, ['seasoning','pork','mixed','salt','chili','sauce','cumin'].includes(art))
  switch(art){
    case 'potato': case 'washed': case 'peeled':
      root(p, 20, 32, art === 'peeled');root(p, 40, 23, art === 'peeled')
      if(art==='washed') for(const [x,y] of [[25,32],[53,26],[69,35],[46,43]]){ p(x,y,2,4,'#92c8c6');p(x,y,1,2,'#e4f0d4') }
      break
    case 'wedges': case 'goldpotato': wedges(ctx,art==='goldpotato'); if(seasoned)garnish(p,'spice');break
    case 'tofu': tofu(ctx,23,24,49,false,false);p(31,20,32,4,'#fff1cf');break
    case 'cubes': case 'goldtofu': case 'brushed':
      for(const [x,y] of [[32,22],[51,25],[22,33],[42,34],[61,36],[33,44],[53,47]]) tofu(ctx,x,y,16,art!=='cubes',art==='brushed')
      if(seasoned)garnish(p,'scallion')
      break
    case 'pork': case 'mixed': case 'rawballs': case 'goldballs':
      meat(ctx,art==='rawballs'||art==='goldballs',art==='goldballs',art==='mixed');break
    case 'scallion':
      for(const [x,y] of [[23,46],[21,39],[27,42],[28,50],[33,45]]) {
        shape(ctx,'#3b653f',[x,y],[x+28,y-21],[x+43,y-25],[x+40,y-21],[x+17,y-5],[x+8,y+3])
        shape(ctx,'#79a553',[x+4,y],[x+34,y-23],[x+38,y-23],[x+24,y-11],[x+7,y+2])
        shape(ctx,'#e7dfb4',[x,y-1],[x+11,y-7],[x+15,y-6],[x+6,y+3])
      }
      p(36,40,3,5,'#b66a45');break
    default: {
      const [dark, middle, bright] = {
        seasoning: ['#745037','#ac7847','#d4a167'], sauce: ['#7e3429','#b64531','#e26f41'],
        chili: ['#853a2b','#b94a2a','#e96b38'], cumin: ['#796046','#aa8950','#d0b26e'],
        salt: ['#c5ba9a','#ede4ca','#fff5de'],
      }[art]
      oval(p,25,30,48,21,dark);oval(p,28,27,43,21,middle)
      const rnd=random(42)
      for(let i=0;i<55;i++){
        const x=30+rnd()*39,y=29+rnd()*17
        if(((x-49)/21)**2+((y-37)/9)**2<1)p(x,y,art==='cumin'?3:2,1,i%3?bright:dark)
      }
    }
  }
}
const icons = new Map<FoodArt, HTMLCanvasElement>()
export function foodIcon(art: FoodArt, className = 'food-icon') {
  if (!icons.has(art)) {
    const { element, ctx } = canvas(96, 72)
    drawFood(ctx, art, true, ['goldpotato', 'goldtofu', 'brushed'].includes(art))
    icons.set(art, element)
  }
  const { element, ctx } = canvas(96, 72)
  ctx.drawImage(icons.get(art)!, 0, 0)
  element.className = className
  element.setAttribute('aria-hidden', 'true')
  return element
}
