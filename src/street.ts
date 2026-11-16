import type { Save } from './business'
import { worldSize, interactive, passable, displayName, walks } from './world'
import type { ObjectData } from './world'
import { ground, streetSprites } from './street-art'
import { canvas, oval, person, brush } from './pixel'
import type { Facing } from './pixel'

const directions = new Set(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowLeft','ArrowDown','ArrowRight'])
const looks = [
  { gender: 1, hair: 2, hairColor: 0, skin: 0, outfit: 0 },
  { gender: 0, hair: 1, hairColor: 1, skin: 1, outfit: 3 },
  { gender: 0, hair: 0, hairColor: 2, skin: 2, outfit: 2 },
]
function walker(path: number[][], distance: number) {
  const route = path.concat(path.slice(1, -1).reverse())
  const segments = route.map((point, i) => {
    const [x,y] = point, [nx,ny] = route[(i + 1) % route.length]
    const dx = nx - x, dy = ny - y
    return { x, y, dx, dy, length: Math.hypot(dx,dy) }
  })
  let offset = distance % segments.reduce((total,s) => total + s.length,0)
  for(const s of segments) {
    if(offset <= s.length) return { x: s.x + s.dx * offset / s.length, y: s.y + s.dy * offset / s.length, face: facing(s.dx, s.dy) }
    offset -= s.length
  }
  return { x: route[0][0], y: route[0][1], face: 'down' as const }
}
function facing(x: number, y: number): Facing {
  return Math.abs(x) > Math.abs(y) ? x < 0 ? 'left' : 'right' : y < 0 ? 'up' : 'down'
}

export function mountStreet(root: HTMLElement, save: Save, act: (o: ObjectData) => void, blocked: () => boolean) {
  const { element: display, ctx } = canvas(600, 420)
  display.className = 'street-canvas'
  display.setAttribute('aria-label','龙潭商业街像素地图')
  root.append(display)
  const input = new AbortController()
  const signal = input.signal
  const terrain = ground()
  let sprites = streetSprites(save.equipment)
  let equipment = save.equipment
  const layer = document.createElement('div')
  layer.className = 'hit-layer'
  root.append(layer)
  const hits = interactive.map(object => {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'map-hit'
    button.dataset.place = object.id
    button.setAttribute('aria-label',displayName(object))
    button.title = displayName(object)
    button.addEventListener('click', () => { if(!blocked()) act(object) }, { signal })
    layer.append(button)
    return { object, button }
  })
  const controls = document.createElement('div')
  controls.className = 'map-controls'
  controls.innerHTML = '<div class="joystick" aria-label="虚拟摇杆"><span></span></div><button class="map-interaction" type="button" hidden></button>'
  root.append(controls)
  const stick = controls.querySelector<HTMLDivElement>('.joystick')!
  const thumb = stick.querySelector('span')!
  const nearby = controls.querySelector<HTMLButtonElement>('.map-interaction')!
  let nearest: ObjectData | undefined
  let keys = new Set<string>()
  let pointer: number | null = null
  let stickX = 0, stickY = 0
  let cx = save.position.x - 300, cy = save.position.y - 210
  let size = { w: 600, h: 420, zoom: 1 }
  let face: Facing = 'down'
  let elapsed = 0, stride = 0

  function resize() {
    const { width, height } = root.getBoundingClientRect()
    if (!width || !height) return
    const zoom = width < 600 ? Math.max(0.88,Math.min(1.13,width/376)) : Math.max(1.05, width/815)
    size = { w: Math.min(worldSize.width,Math.round(width/zoom)), h: Math.min(worldSize.height,Math.round(height/zoom)), zoom }
    display.width = size.w
    display.height = size.h
    ctx.imageSmoothingEnabled = false
  }
  const observer = new ResizeObserver(resize)
  observer.observe(root)
  resize()
  window.addEventListener('keydown', event => {
    if (blocked() || event.ctrlKey || event.altKey || event.metaKey || (event.target as HTMLElement | null)?.matches('input,select,textarea')) return
    if (directions.has(event.code)) { keys.add(event.code); event.preventDefault() }
    if (event.code === 'KeyE' && nearest && !event.repeat) act(nearest)
  }, { signal })
  window.addEventListener('keyup', event => { keys.delete(event.code) }, { signal })
  window.addEventListener('blur', () => { keys.clear(); resetStick() }, { signal })
  nearby.addEventListener('click', () => { if(nearest && !blocked()) act(nearest) }, { signal })
  function track(event: PointerEvent) {
    if (event.pointerId !== pointer) return
    const rect = stick.getBoundingClientRect()
    const dx = event.clientX - rect.left - rect.width/2
    const dy = event.clientY - rect.top - rect.height/2
    const radius = rect.width*0.36
    const length = Math.max(radius, Math.hypot(dx,dy))
    stickX = dx / length; stickY = dy / length
    thumb.style.transform = 'translate(' + stickX*radius + 'px,' + stickY*radius + 'px)'
  }
  function resetStick() {
    pointer = null; stickX = 0; stickY = 0
    thumb.style.transform = ''
  }
  stick.addEventListener('pointerdown', event => {
    if (pointer !== null || blocked()) return
    pointer = event.pointerId
    stick.setPointerCapture(pointer)
    track(event)
  }, { signal })
  stick.addEventListener('pointermove',track,{ signal })
  for(const name of ['pointerup','pointercancel','lostpointercapture'] as const){
    stick.addEventListener(name,event=>{ if(event.pointerId===pointer)resetStick() },{ signal })
  }
  function motion(dt: number) {
    if (blocked()) {
      keys.clear()
      resetStick()
      stride = 0
      return
    }
    const right = keys.has('ArrowRight') || keys.has('KeyD'), left = keys.has('ArrowLeft') || keys.has('KeyA')
    const down = keys.has('ArrowDown') || keys.has('KeyS'), up = keys.has('ArrowUp') || keys.has('KeyW')
    const ix = Number(right)-Number(left)+stickX, iy = Number(down)-Number(up)+stickY
    const norm = Math.max(1,Math.hypot(ix,iy))
    const dx = 108*dt*ix/norm, dy = 108*dt*iy/norm
    const pos = save.position
    if (Math.abs(dx)+Math.abs(dy)>0.05) {
      face = facing(dx,dy)
      const oldX = pos.x, oldY = pos.y
      if (passable(pos.x+dx,pos.y)) pos.x += dx
      if (passable(pos.x,pos.y+dy)) pos.y += dy
      stride = pos.x !== oldX || pos.y !== oldY ? Math.floor(elapsed*11)%2 ? 2 : -2 : 0
    } else stride = 0
  }
  let last = performance.now()
  let frame = 0
  function draw(now: number) {
    const dt = Math.min((now-last)/1000,0.045)
    last = now
    elapsed += dt
    motion(dt)
    if(equipment !== save.equipment) { equipment = save.equipment; sprites = streetSprites(equipment) }
    const { x, y } = save.position
    const { w, h } = size
    const fit = (value: number, max: number) => Math.max(0,Math.min(max,value))
    cx=fit(cx+(x-w/2-cx)*Math.min(1,dt*8),worldSize.width-w)
    cy=fit(cy+(y-h/2-cy)*Math.min(1,dt*8),worldSize.height-h)
    const rx=Math.round(cx), ry=Math.round(cy)
    ctx.drawImage(terrain,rx,ry,w,h,0,0,w,h)
    ctx.save()
    ctx.translate(-rx,-ry)
    const actors = sprites.filter(s => s.x+s.element.width>rx && s.x<rx+w && s.y+s.element.height>ry && s.y<ry+h)
      .map(s => ({ depth:s.object.y+s.object.h, paint:()=>ctx.drawImage(s.element,s.x,s.y) }))
    for(const [i,path] of walks.entries()) {
      const npc=walker(path,83+i*106+elapsed*(22+i*4))
      actors.push({ depth:npc.y, paint:()=>person(ctx,npc.x,npc.y,looks[i],npc.face,Math.floor(elapsed*8+i)%2?1:-1) })
    }
    actors.push({ depth:y, paint:()=>{
      oval(brush(ctx),x-8,y-3,16,6,'#f7e5aa')
      person(ctx,x,y,save.character,face,stride,false)
    } })
    actors.sort((a,b)=>a.depth-b.depth).forEach(a=>a.paint())
    ctx.restore()

    let distance = 54
    nearest = undefined
    for(const {object:o,button} of hits) {
      const ox = Math.max(o.x,Math.min(o.x+o.w,x)), oy=Math.max(o.y,Math.min(o.y+o.h,y))
      const d=Math.hypot(ox-x,oy-y)
      if(d<distance){distance=d;nearest=o}
      const left = (o.x-rx)/w*100, top = (o.y-19-ry)/h*100
      const width = o.w/w*100, height = (o.h+25)/h*100
      button.hidden = left>=100 || left+width<=0 || top>=100 || top+height<=0
      if (!button.hidden){
        button.style.left=left+'%';button.style.top=top+'%'
        button.style.width=width+'%';button.style.height=height+'%'
      }
    }
    nearby.hidden = !nearest
    if (nearest) {
      const label = '互动 · ' + displayName(nearest)
      if(nearby.textContent!==label) nearby.textContent=label
    }
    frame = requestAnimationFrame(draw)
  }
  frame = requestAnimationFrame(draw)
  return () => { cancelAnimationFrame(frame); observer.disconnect(); input.abort() }
}
