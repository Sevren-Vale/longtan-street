import { stalls } from './content'
import type { StallId } from './content'

export const worldSize = { width: 1060, height: 718 }
export const district = [
  { name: '桂阳一中外沿', x: 220, y: 104 },
  { name: '龙潭街入口', x: 467, y: 267 },
  { name: '中央休息广场', x: 546, y: 491 },
  { name: '后勤补货巷', x: 864, y: 637 },
  { name: '夜市预留区', x: 212, y: 664 },
]
export type Kind = 'stall' | 'school' | 'arch' | 'board' | 'warehouse' | 'supply' | 'future' | 'tree' | 'bench' | 'planter' | 'lamp'
export interface ObjectData {
  id: string; kind: Kind; x: number; y: number; w: number; h: number
  label?: string; stall?: StallId; solid?: boolean
}
const fixed: ObjectData[] = [
  { id: 'school', kind: 'school', x: 95, y: 80, w: 381, h: 80, label: '桂阳一中', solid: true },
  { id: 'entry', kind: 'arch', x: 403, y: 216, w: 160, h: 29, label: '龙潭商业街' },
  { id: 'notice', kind: 'board', x: 575, y: 221, w: 51, h: 20, label: '街区公告栏', solid: true },
  { id: 'fried', kind: 'stall', x: 277, y: 309, w: 108, h: 45, stall: 'fried', solid: true },
  { id: 'tea', kind: 'stall', x: 145, y: 309, w: 104, h: 45, stall: 'tea', solid: true },
  { id: 'rice', kind: 'stall', x: 638, y: 308, w: 108, h: 45, stall: 'rice', solid: true },
  { id: 'noodles', kind: 'stall', x: 774, y: 317, w: 109, h: 45, stall: 'noodles', solid: true },
  { id: 'breakfast', kind: 'stall', x: 906, y: 312, w: 109, h: 45, stall: 'breakfast', solid: true },
  { id: 'warehouse', kind: 'warehouse', x: 849, y: 493, w: 156, h: 73, label: '街区仓库', solid: true },
  { id: 'supply', kind: 'supply', x: 745, y: 544, w: 61, h: 35, label: '后勤补货点', solid: true },
  { id: 'future', kind: 'future', x: 61, y: 487, w: 169, h: 72, label: '临街店铺预留区', solid: true },
  { id: 'night_market', kind: 'future', x: 73, y: 595, w: 194, h: 27, label: '夜市筹备区', solid: true },
  { id: 'plaza_west', kind: 'planter', x: 377, y: 462, w: 51, h: 37, solid: true },
  { id: 'plaza_east', kind: 'planter', x: 622, y: 462, w: 51, h: 37, solid: true },
  { id: 'bench_north', kind: 'bench', x: 478, y: 461, w: 69, h: 11, label: '长椅', solid: true },
  { id: 'bench_south', kind: 'bench', x: 478, y: 529, w: 69, h: 11, label: '长椅', solid: true },
]
const trees = [[52,136],[536,133],[589,141],[697,132],[774,150],[946,152],[38,282],[105,304],[45,427],[145,440],[245,456],[309,509],[62,548],[305,622],[385,575],[450,624],[592,601],[678,557],[1020,454],[1032,561],[988,658],[61,681],[733,677],[851,671]]
const lamps = [[270,394],[421,365],[611,371],[909,377],[368,566],[685,546],[804,621],[491,182]]
export const objects = fixed.concat(
  trees.map(([x, y], i) => ({ id: 'tree_' + i, kind: 'tree', x, y, w: 12, h: 11, solid: true })),
  lamps.map(([x, y], i) => ({ id: 'lamp_' + i, kind: 'lamp', x, y, w: 8, h: 7, solid: true })),
)
export const displayName = (object: ObjectData) => object.stall ? stalls[object.stall].name : object.label ?? ''
export const interactive = objects.filter(displayName)

export function passable(x: number, y: number) {
  if (x < 17 || y < 25 || x > worldSize.width - 17 || y > worldSize.height - 15) return false
  return !objects.some(o => o.solid && x + 6 > o.x && x - 6 < o.x + o.w && y + 3 > o.y && y - 3 < o.y + o.h)
}
export const walks = [
  [[80, 182], [355, 182], [389, 197], [389, 389], [311, 415], [132, 415], [80, 391]],
  [[968, 393], [675, 404], [570, 426], [561, 506], [598, 544], [724, 581], [1001, 612]],
  [[302, 597], [435, 570], [571, 568], [692, 590], [686, 651], [343, 657]],
]
