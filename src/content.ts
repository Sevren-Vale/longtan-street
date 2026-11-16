export const contentVersion = '1.0.0'
export const spawn = { x: 455, y: 286 }

export const ingredients = {
  pork: { name: '猪肉馅', pack: 3, price: 12, initial: 4 },
  seasoning: { name: '五香调味料', pack: 6, price: 9, initial: 6 },
  scallion: { name: '小葱', pack: 6, price: 7, initial: 8 },
  tofu: { name: '老豆腐', pack: 3, price: 9, initial: 4 },
  sauce: { name: '辣椒酱', pack: 5, price: 8, initial: 5 },
  potato: { name: '黄心土豆', pack: 3, price: 8, initial: 4 },
  chili: { name: '辣椒粉', pack: 5, price: 6, initial: 5 },
  cumin: { name: '孜然', pack: 5, price: 6, initial: 5 },
  salt: { name: '食盐', pack: 6, price: 5, initial: 6 },
} as const
export type Ingredient = keyof typeof ingredients
export const ingredientIds = Object.keys(ingredients) as Ingredient[]

export type FoodArt = Ingredient | 'washed' | 'peeled' | 'wedges' | 'cubes' | 'mixed' | 'rawballs' | 'goldpotato' | 'goldtofu' | 'goldballs' | 'brushed'
type Effect = 'wash' | 'peel' | 'cut' | 'add' | 'mix' | 'shape' | 'fry' | 'brush' | 'plate'
export interface Step { label: string; art: FoodArt; effect: Effect; taps?: number; note: string }
interface Recipe {
  name: string
  cost: Partial<Record<Ingredient, number>>
  price: number
  art: FoodArt
  steps: Step[]
}
export const recipes = {
  potato: {
    name: '金黄炸土豆', price: 18, cost: { potato: 1, chili: 1, cumin: 1, salt: 1 }, art: 'goldpotato',
    steps: [
      { label: '洗净土豆', art: 'washed', effect: 'wash', note: '用清水冲掉表皮泥沙。' },
      { label: '削掉外皮', art: 'peeled', effect: 'peel', note: '削出浅黄的薯肉。' },
      { label: '切成滚刀块', art: 'wedges', effect: 'cut', taps: 3, note: '分三次下刀，让块头大小接近。' },
      { label: '下锅油炸', art: 'goldpotato', effect: 'fry', note: '等油锅指针进入绿色火候区，再捞起土豆。' },
      { label: '拌辣椒粉、孜然与盐', art: 'goldpotato', effect: 'add', note: '趁热拌匀，香料更容易挂在表面。' },
      { label: '土豆装盘', art: 'goldpotato', effect: 'plate', note: '沥掉余油，盛入小盘。' },
    ],
  },
  tofu: {
    name: '香酥炸豆腐', price: 22, cost: { tofu: 1, sauce: 1, scallion: 1 }, art: 'goldtofu',
    steps: [
      { label: '豆腐切小方块', art: 'cubes', effect: 'cut', taps: 3, note: '轻轻下刀，保留完整的方角。' },
      { label: '下锅油炸', art: 'goldtofu', effect: 'fry', note: '待豆腐四角上色，到了绿色火候区就起锅。' },
      { label: '刷一层辣椒酱', art: 'brushed', effect: 'brush', note: '刷过金黄的豆腐表面。' },
      { label: '撒上葱花', art: 'brushed', effect: 'add', note: '撒些细葱花提香。' },
      { label: '豆腐装盘', art: 'brushed', effect: 'plate', note: '让刷过酱的一面朝上。' },
    ],
  },
  meatballs: {
    name: '桂阳风味油炸肉丸', price: 27, cost: { pork: 1, seasoning: 1, scallion: 1 }, art: 'goldballs',
    steps: [
      { label: '肉馅加五香调味料', art: 'pork', effect: 'add', note: '先给肉馅打底味。' },
      { label: '加切好的葱花', art: 'mixed', effect: 'add', note: '把葱花拌入肉馅。' },
      { label: '沿一个方向搅拌', art: 'mixed', effect: 'mix', taps: 3, note: '搅拌三下，让肉馅起黏。' },
      { label: '搓成小肉丸', art: 'rawballs', effect: 'shape', taps: 3, note: '分三次把肉馅搓圆。' },
      { label: '下锅油炸', art: 'goldballs', effect: 'fry', note: '炸至金棕色，在绿色火候区捞起。' },
      { label: '肉丸装盘', art: 'goldballs', effect: 'plate', note: '把沥过油的小肉丸盛起来。' },
    ],
  },
} satisfies Record<string, Recipe>
export type RecipeId = keyof typeof recipes
export const recipeIds = Object.keys(recipes) as RecipeId[]
export const recipe = (id: RecipeId): Recipe => recipes[id]

export const customers = {
  student: { name: '放学路过的小禾', line: '放学闻着香味就过来了。', outfit: 0, wait: 58 },
  neighbor: { name: '隔壁的陈阿姨', line: '我去广场坐会儿，买份热乎的。', outfit: 1, wait: 52 },
  worker: { name: '下班的阿杰', line: '带份小吃，回去跟家里人分着吃。', outfit: 2, wait: 46 },
  elder: { name: '在广场散步的周叔', line: '这张街凳晒了半下午，坐着正好。', outfit: 3, wait: 62 },
}
export type CustomerId = keyof typeof customers
export const customerIds = Object.keys(customers) as CustomerId[]

export const stalls = {
  fried: { name: '龙潭炸香摊', sign: '龙潭炸香摊', color: '#b43c2c', preview: '现炸肉丸、豆腐和土豆。', conditions: [] },
  tea: { name: '龙潭鲜果茶摊', sign: '龙潭鲜果茶', color: '#48774f', preview: '手打柠檬茶、草莓鲜榨汁与芒果冰沙。', conditions: ['炸香摊达到四级', '累计经营五天', '三道炸物各有三次拿手评价', '人气四十，开业资金八百'] },
  rice: { name: '龙潭铁板炒饭', sign: '铁板炒饭', color: '#a96737', preview: '金黄蛋炒饭、火腿鸡蛋炒饭与香辣肉末炒饭。', conditions: ['鲜果茶摊开业并达到四级', '通过鲜果茶摊的招牌饮品考验'] },
  noodles: { name: '栖凤渡鱼粉摊', sign: '栖凤渡鱼粉', color: '#496559', preview: '鲜鱼熬汤，现烫米粉，最后舀一勺红油。', conditions: ['铁板炒饭摊开业并达到四级', '完成铁板翻炒考验'] },
  breakfast: { name: '龙潭中式早点铺', sign: '龙潭早点铺', color: '#84504a', preview: '蒸鲜肉包、香菇烧卖，磨豆浆，再炸一锅油条。', conditions: ['鱼粉摊开业并达到五级', '掌握汤底、烫粉和装碗'] },
}
export type StallId = keyof typeof stalls
export const levels = [0, 28, 75, 145, 240]
export const upgrades = [
  { name: '长柄笊篱', cost: 55, level: 2, benefit: '绿色火候区延长约半秒，摊前挂上红灯笼。' },
  { name: '恒温油锅', cost: 95, level: 3, benefit: '绿色火候区再延长约半秒，摊台添上铜边。' },
]
export const looks = {
  gender: ['男生', '女生'],
  hair: ['齐整短发', '偏分短发', '扎发'],
  hairColor: ['墨黑', '栗棕', '深茶'],
  skin: ['浅暖', '麦色', '深暖'],
  outfit: ['靛蓝围裙', '柿红围裙', '竹青围裙', '杏黄上衣'],
}
export type LookKey = keyof typeof looks

export interface Task { id: string; name: string; target: number; reward: number; metric: 'orders' | 'variety' | 'excellent' | 'recipe'; recipe?: RecipeId }
const service: Task = { id: 'serve_three', name: '接待三位街坊', target: 3, reward: 12, metric: 'orders' }
export function dailyTasks(day: number): Task[] {
  if (day === 1) return [service, { id: 'sample_menu', name: '三道招牌各做一份', target: 3, reward: 16, metric: 'variety' }]
  const featured = recipeIds[(day - 2) % recipeIds.length]
  return [
    service,
    { id: 'featured_' + featured, name: '今日推荐 · ' + recipe(featured).name, target: 2, reward: 14, metric: 'recipe', recipe: featured },
    { id: 'excellent_two', name: '两份拿手好菜', target: 2, reward: 12, metric: 'excellent' },
  ]
}
