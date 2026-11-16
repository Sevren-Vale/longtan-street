import type { Look } from './business'

export function canvas(width: number, height: number) {
  const element = document.createElement('canvas')
  element.width = width
  element.height = height
  const ctx = element.getContext('2d')!
  ctx.imageSmoothingEnabled = false
  return { element, ctx }
}
export type Brush = (x: number, y: number, w: number, h: number, color: string) => void
export function brush(ctx: CanvasRenderingContext2D): Brush {
  return (x, y, w, h, color) => {
    ctx.fillStyle = color
    ctx.fillRect(Math.round(x), Math.round(y), w, h)
  }
}
export function random(seed: number) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    return seed / 4294967296
  }
}
export function oval(p: Brush, x: number, y: number, w: number, h: number, color: string) {
  for (let row = 0; row < h; row++) {
    const width = Math.round(w * Math.sqrt(1 - ((row + 0.5 - h / 2) / (h / 2)) ** 2))
    p(x + (w - width) / 2, y + row, width, 1, color)
  }
}
export const outfits = [['#355060','#577e8e'],['#913c36','#cc6148'],['#436857','#6a9275'],['#9f653f','#dba75c']]
const skins = [['#aa654e','#dfa67f','#f4c39a'],['#8e5036','#bf8558','#e6a979'],['#633f38','#9a654f','#cb9067']]
const hairs = [['#302b2c','#58413f'],['#4b3029','#8d5843'],['#3c352b','#6d5840']]
export type Facing = 'down' | 'up' | 'left' | 'right'

export function person(ctx: CanvasRenderingContext2D, x: number, y: number, look: Look, facing: Facing, stride: number, shadow = true) {
  const p0 = brush(ctx)
  const p: Brush = (a, b, w, h, c) => p0(x + a, y + b, w, h, c)
  const [outline, skin, light] = skins[look.skin]
  const [hair, hairLight] = hairs[look.hairColor]
  const [clothes, top] = outfits[look.outfit]
  const line = '#302b2a'
  const side = facing === 'left' ? -1 : facing === 'right' ? 1 : 0
  const bob = stride === 0 ? 0 : -1
  if (shadow) oval(p, -12, -4, 24, 7, '#272e2440')
  p(-6, -10, 5, 8 + stride, '#35413d')
  p(1, -10, 5, 8 - stride, '#35413d')
  p(-7, -3 + stride, 6, 3, line)
  p(1, -3 - stride, 6, 3, line)
  p(-9, -23 + bob, 18, 13, clothes)
  p(-6, -23 + bob, 12, 10, top)
  if (facing !== 'up') {
    p(-4, -19 + bob, 8, 10, clothes)
    p(-4, -15 + bob, 8, 1, '#fff0b97a')
  }
  p(-10, -19 + bob - stride, 3, 7, skin)
  p(7, -19 + bob + stride, 3, 7, outline)
  if (look.hair === 2 || look.gender === 1) {
    p(-11, -33 + bob, 19, look.hair === 2 ? 15 : 12, hair)
    if (look.hair === 2) {
      p(-10, -42 + bob, 7, 7, hair)
      p(-9, -37 + bob, 5, 2, '#c47854')
    }
  }
  p(-7 + side, -39 + bob, 14, 4, hair)
  p(-9 + side, -35 + bob, 18, 13, hair)
  if (facing !== 'up') {
    p(-7 + side, -33 + bob, 14, 10, outline)
    p(-6 + side, -33 + bob, 13, 9, skin)
    p(-5 + side, -32 + bob, 11, 6, light)
    p(-5 + side * 2, -30 + bob, 2, 3, line)
    if (!side) p(3, -30 + bob, 2, 3, line)
    if (side) p(2 + side * 2, -29 + bob, 2, 2, line)
    p(-5 + side, -26 + bob, 2, 1, '#c66960')
    p(-1 + side, -25 + bob, 3, 1, outline)
    p(-8 + side, -35 + bob, 16, 2, hair)
    p(look.hair === 1 ? -7 + side : 5 + side, -33 + bob, 3, 3, hair)
  }
  p(-5 + side, -37 + bob, 8, 1, hairLight)
  p(-7 + side, -36 + bob, 4, 1, hairLight)
}
export function portrait(look: Look, width = 64) {
  const { element, ctx } = canvas(48, 54)
  person(ctx, 24, 48, look, 'down', 0)
  element.style.width = width + 'px'
  element.className = 'portrait'
  return element
}
