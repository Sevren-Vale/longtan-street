import { stalls } from './content'
import { brush, canvas, oval, random } from './pixel'
import type { Brush } from './pixel'
import { district, objects, worldSize } from './world'
import type { ObjectData } from './world'

function text(ctx: CanvasRenderingContext2D, value: string, x: number, y: number, color: string, size = 10) {
  ctx.fillStyle = color
  ctx.font = 'bold ' + size + 'px "Microsoft YaHei", sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(value, Math.round(x), Math.round(y))
}
function paving(p: Brush, x: number, y: number, w: number, h: number, base: string, joint: string, accent: string) {
  p(x, y, w, h, base)
  for (let row = 0; row < h; row += 10) {
    p(x, y + row, w, 1, joint)
    for (let col = row % 20 ? 13 : 2; col < w; col += 21) {
      p(x + col, y + row, 1, Math.min(10, h - row), joint)
      p(x + col + 2, y + row + 2, Math.min(12, w - col - 2), 1, accent)
    }
  }
}
function road(p: Brush, x: number, y: number, w: number, h: number) {
  paving(p, x, y, w, h, '#9a9a80', '#888d72', '#b0ad90')
  p(x, y + 1, w, 3, '#e0cba1')
  p(x, y + h - 4, w, 3, '#d0b98f')
}
export function ground() {
  const { element, ctx } = canvas(worldSize.width, worldSize.height)
  const p = brush(ctx)
  const rnd = random(131)
  p(0, 0, worldSize.width, worldSize.height, '#708350')
  for (let i = 0; i < 7100; i++) {
    const x = Math.floor(rnd() * 1060), y = Math.floor(rnd() * 718)
    p(x, y, 1 + Math.floor(rnd() * 5), 1 + Math.floor(rnd() * 3), ['#80935a','#687b49','#778952','#657448','#92a461'][i % 5])
  }
  paving(p, 76, 110, 414, 110, '#a4a088', '#8c8d76', '#bcb391')
  road(p, 0, 170, 1060, 46)
  for (let x = 6; x < 1055; x += 37) p(x, 191, 16, 2, '#d8c999')
  p(717, 52, 327, 99, '#647b42')
  p(723, 55, 315, 90, '#879c54')
  for (let x = 726; x < 1035; x += 15) {
    p(x, 59, 2, 81, '#75904d')
    for (let j = 0; j < 9; j++) p(x + 2 + (j % 2) * 4, 62 + j * 8, 5, 3, '#a0a65e')
  }
  paving(p, 375, 214, 243, 107, '#cdb48c', '#b79d76', '#e0c59a')
  paving(p, 105, 284, 922, 100, '#c9a980', '#ba9875', '#dcba8f')
  road(p, 87, 375, 953, 62)
  paving(p, 350, 430, 345, 125, '#ceba95', '#bda480', '#e2cca2')
  paving(p, 456, 451, 132, 91, '#b89e75', '#ad936c', '#d2b78e')
  paving(p, 679, 497, 345, 141, '#a99e81', '#998f73', '#bcb293')
  paving(p, 84, 463, 227, 168, '#b8a17c', '#a78d6d', '#c8b189')
  paving(p, 295, 562, 446, 71, '#b8a17c', '#a78d6d', '#c8b189')
  paving(p, 24, 649, 278, 46, '#b4a584', '#9d8d6c', '#c3b391')
  for (let i = 0; i < 850; i++) {
    const x = 90 + rnd() * 941, y = 376 + rnd() * 57
    p(x, y, rnd() < 0.92 ? 2 : 5, 1, i % 2 ? '#7d836244' : '#e6d5a64d')
  }
  for (const [x,y] of [[323,391],[679,407],[857,595],[172,406],[506,250]]) {
    p(x, y, 13, 9, '#6f7461')
    p(x + 2, y + 1, 9, 5, '#858a70')
    for (let i = 2; i < 11; i += 3) p(x + i, y + 2, 1, 5, '#525a51')
  }
  for (let i = 0; i < 8; i++) {
    p(446+i*8, 178, 4, 26, '#eee0ae')
    p(550+i*8, 377, 5, 36, '#dfcda5')
  }
  for (const name of district) {
    if (name.name === '桂阳一中外沿') continue
    text(ctx, name.name, name.x, name.y, '#645641', 10)
  }
  return element
}

function roof(p: Brush, x: number, y: number, w: number, h: number, palette: string[]) {
  p(x + 4, y - 3, w - 8, 4, palette[1])
  p(x, y, w, h, palette[0])
  p(x + 3, y + 1, w - 6, h - 6, palette[1])
  for (let i = 2; i < w - 3; i += 6) {
    p(x+i, y + 2, 1, h - 6, palette[2])
    p(x+i+1, y + 5, 1, h - 8, palette[0])
  }
  p(x - 4, y + h - 5, w + 8, 6, palette[0])
  p(x - 2, y + h - 6, w + 4, 2, palette[2])
}
const teal = ['#304b44','#49675a','#5d8170']
const clay = ['#724936','#9b6048','#c48459']
function banner(ctx: CanvasRenderingContext2D, p: Brush, name: string, x: number, y: number, w: number, fill: string, size = 11) {
  p(x - 1, y, w + 2, 18, '#4d3c30')
  p(x, y + 1, w, 15, fill)
  p(x + 2, y + 2, w - 4, 1, '#f8d68e7c')
  text(ctx, name, x + w / 2, y + 9, '#ffedc1', size)
}
function lantern(p: Brush, x: number, y: number) {
  p(x + 4, y - 4, 1, 4, '#4e392c')
  p(x + 2, y, 6, 10, '#a0392c')
  p(x, y + 2, 10, 6, '#b6432a')
  p(x + 3, y + 1, 4, 8, '#e76539')
  p(x + 3, y - 1, 4, 1, '#eab756')
  p(x + 3, y + 9, 4, 2, '#eab756')
  p(x + 4, y + 11, 2, 3, '#b77e37')
}
function crate(p: Brush, x: number, y: number, w = 18) {
  p(x, y, w, 13, '#785039')
  p(x+1, y, w-2, 4, '#c59961')
  p(x+2, y+5, w-4, 1, '#ad754b')
  p(x+2, y+9, w-4, 1, '#aa7447')
  p(x+2, y+1, 2, 11, '#d29f64')
  p(x+w-4, y+1, 2, 11, '#ae7a50')
}
function window(p: Brush,x: number,y: number,w: number,h: number) {
  p(x-1,y-1,w+2,h+2,'#887c63')
  p(x,y,w,h,'#48605a')
  p(x+1,y+1,w-2,3,'#92a193')
  p(x+w/2,y,1,h,'#d2bb98')
  p(x,y+h-3,w,1,'#c9b591')
}
function tree(p: Brush, id: string, x: number, y: number) {
  const rnd = random(Number(id.split('_')[1]) + 46)
  oval(p,x-16,y-3,49,15,'#34402d4e')
  p(x+3,y-30,7,37,'#664a34')
  p(x+4,y-24,2,28,'#a5754b')
  p(x-4,y-38,6,20,'#7a573b')
  p(x+9,y-35,5,14,'#805d3b')
  for (let i=0;i<19;i++){
    const a = rnd()*Math.PI*2, r = 7+14*rnd()
    const lx = Math.round(x + 6 + Math.cos(a)*r - 15), ly = Math.round(y - 37 + Math.sin(a)*r - 13)
    const w = 18 + Math.floor(rnd()*12), h = 13 + Math.floor(rnd()*9)
    oval(p,lx,ly,w,h,'#3d5a3c')
    oval(p,lx+1,ly,w-3,h-3,['#527941','#5b8147','#668849','#73954e'][i%4])
    p(lx+5,ly+3,6,2,'#9ca962')
    p(lx+9,ly+5,5,1,'#8ca357')
  }
}
export function building(ctx: CanvasRenderingContext2D, o: ObjectData, equipment: number) {
  const p = brush(ctx)
  const { x, y, w, h } = o
  if (o.solid && o.kind !== 'tree') p(x-3,y+h-6,w+10,12,'#342d2550')
  switch (o.kind) {
    case 'tree': tree(p,o.id,x,y); return
    case 'lamp':
      p(x,y-26,2,32,'#464e40'); p(x,y-27,11,2,'#464e40')
      p(x+7,y-27,7,7,'#6c6246'); p(x+8,y-25,5,3,'#ffe19c'); return
    case 'bench':
      p(x,y-5,w,11,'#83593c'); p(x+2,y-6,w-4,4,'#bc8553')
      p(x+3,y+4,4,7,'#635443'); p(x+w-8,y+4,4,7,'#635443'); return
    case 'planter':
      p(x,y,w,h,'#766757'); p(x+2,y+2,w-4,h-5,'#c3ad85')
      p(x+5,y+5,w-10,h-10,'#5c7348')
      for(let i=0;i<13;i++){const dx=(i*23)%39,dy=(i*13)%24;p(x+6+dx,y+6+dy,5,3,i%2?'#dc8e6b':'#ecca77');p(x+8+dx,y+5+dy,1,5,'#d89e74')}
      return
    case 'school':
      p(x,y,w,h,'#b79f84')
      p(x+4,y+3,w-8,h-13,'#d8bf9f')
      for(let i=5;i<w-38;i+=36) {
        window(p,x+i,y+12,21,16)
        window(p,x+i,y+37,21,16)
        p(x+i,y+56,23,4,'#ab7a63')
      }
      roof(p,x-5,y-22,w+10,29,clay)
      p(x+158,y+22,78,58,'#dfc8a8')
      roof(p,x+151,y+11,91,13,teal)
      for(let i=0;i<13;i++) p(x+161+i*5,y+46,3,33,'#516258')
      banner(ctx,p,'桂阳一中',x+160,y+26,72,'#823f35',12)
      return
    case 'arch':
      p(x+4,y-9,10,45,'#853d30'); p(x+6,y-7,3,43,'#be6348')
      p(x+w-14,y-9,10,45,'#853d30'); p(x+w-12,y-7,3,43,'#be6348')
      roof(p,x,y-34,w,18,teal)
      banner(ctx,p,'龙潭商业街',x+20,y-15,w-40,'#923f30',16)
      lantern(p,x+20,y+2); lantern(p,x+w-29,y+2); return
    case 'board':
      p(x+3,y-12,4,31,'#795439'); p(x+w-7,y-12,4,31,'#795439')
      p(x,y-17,w,30,'#8a573a')
      p(x+3,y-14,w-6,22,'#dbc293')
      p(x+5,y-12,20,17,'#f3e2b8'); p(x+28,y-11,17,15,'#dfac79')
      for(let i=0;i<3;i++){p(x+8,y-8+i*4,14,1,'#9d815c');p(x+30,y-8+i*4,11,1,'#a27d5d')}
      p(x-2,y-18,w+4,3,'#5f4734')
      text(ctx,'公告栏',x+w/2,y+27,'#4f4031',10); return
    case 'stall': {
      const stall = stalls[o.stall!]
      const open = o.stall === 'fried'
      roof(p,x+2,y-21,w-4,11,open?clay:teal)
      p(x+6,y-10,w-12,45,'#534638')
      p(x+9,y-9,w-18,37,open?'#8e6443':'#6f6b55')
      p(x+9,y+4,5,38,'#b58b58'); p(x+w-14,y+4,5,38,'#af774b')
      banner(ctx,p,stall.sign,x+11,y-10,w-22,stall.color,12)
      for(let i=0;i<10;i++){
        const start = Math.floor(w*i/10), width = Math.ceil(w/10)
        p(x+start,y+9,width,9,i%2?'#e1c18d':stall.color)
        p(x+start,y+17,width,3,i%2?'#b89366':'#754b38')
      }
      if(open){
        p(x+13,y+27,w-26,15,'#615043')
        p(x+14,y+25,w-28,5,'#c99459')
        oval(p,x+25,y+20,30,10,'#292f2a'); oval(p,x+30,y+21,19,5,'#bb8545')
        p(x+51,y+22,15,2,'#3e3b2e')
        crate(p,x+71,y+20,17)
        p(x+8,y+32,w-16,13,'#a76040')
        p(x+10,y+32,w-20,2,equipment===2?'#fbb66a':'#cd9160')
        for(let j=13;j<w-9;j+=9) p(x+j,y+35,1,8,'#84523d')
        text(ctx,'营业中',x+w/2,y+h+8,'#6d432c',10)
        if(equipment){lantern(p,x+3,y+16);lantern(p,x+w-11,y+16)}
      } else {
        p(x+14,y+22,w-28,21,'#777968')
        for(let i=0;i<6;i++) p(x+15,y+23+i*3,w-30,1,'#555d56')
        text(ctx,'尚未开业',x+w/2,y+h+8,'#63533f',10)
      }
      return
    }
    case 'warehouse':
      p(x,y,w,h,'#9e9477'); p(x+3,y+12,w-6,h-14,'#cfbd97')
      roof(p,x-2,y-17,w+4,34,teal)
      window(p,x+11,y+31,25,20);window(p,x+w-34,y+31,23,20)
      p(x+47,y+34,58,38,'#6a7164')
      for(let i=0;i<8;i++) p(x+48,y+36+i*4,56,1,'#454f47')
      banner(ctx,p,'街区仓库',x+36,y+16,81,'#596748',13)
      crate(p,x+5,y+56,27);crate(p,x+w-30,y+55,23); return
    case 'supply':
      roof(p,x+1,y-11,w-2,16,clay)
      p(x+2,y+5,w-4,h-5,'#967750')
      crate(p,x+2,y+16,23);crate(p,x+26,y+18,31);crate(p,x+23,y+9,25)
      text(ctx,'补货',x+w/2,y+h+8,'#664c3b',10);return
    case 'future':
      p(x,y,w,h,'#92785b')
      if(h<35){
        p(x,y,w,h-5,'#6a8075')
        for(let i=1;i<w;i+=9) p(x+i,y+2,2,h-6,'#80988b')
        banner(ctx,p,o.label!,x+w/2-44,y+4,88,'#916048');return
      }
      roof(p,x,y-14,w,31,clay)
      p(x+3,y+18,w-6,h-19,'#c2ad85')
      window(p,x+13,y+36,28,27);window(p,x+w-43,y+36,28,27)
      p(x+55,y+37,56,34,'#786d57')
      for(let i=0;i<9;i++) p(x+57,y+38+i*3,52,1,'#989077')
      banner(ctx,p,'铺面招租',x+40,y+17,w-80,'#82583e');return
  }
}

export function streetSprites(equipment: number) {
  return objects.map(object => {
    const { element, ctx } = canvas(object.w + 120, object.h + 96)
    ctx.translate(60 - object.x, 73 - object.y)
    building(ctx, object, equipment)
    return { object, element, x: object.x - 60, y: object.y - 73 }
  })
}
