import { contentVersion, customerIds, customers, dailyTasks, ingredientIds, ingredients, levels, recipe, recipeIds, spawn, upgrades } from './content'
import type { CustomerId, Ingredient, LookKey, RecipeId, StallId, Task } from './content'

export type Look = Record<LookKey, number>
export interface Character extends Look { name: string }
export interface Ticket { recipe: RecipeId; customer: CustomerId; mode: 'relaxed' | 'timed'; wait: number; stage: 'offered' | 'accepted' }
export interface Cooking {
  step: number; taps: number; heat: number | null; quality: number
  fryResult: 'pending' | 'pale' | 'golden' | 'dark'
}
export interface Day {
  number: number; orders: number; missed: number; sales: number; tips: number; spend: number
  satisfaction: number; popularity: number; excellent: number; dishes: Record<RecipeId, number>
}
export interface Summary extends Day { bonus: number; goals: string[] }
export interface Receipt {
  recipe: RecipeId; customer: CustomerId; coins: number; tip: number; quality: number; satisfaction: number; xp: number; popularity: number
}
export interface Save {
  saveVersion: 1; contentVersion: string
  character: Character; position: { x: number; y: number }
  coins: number; inventory: Record<Ingredient, number>
  popularity: number; xp: number; equipment: number
  unlockedStalls: StallId[]; knownRecipes: RecipeId[]
  served: number; mastery: Record<RecipeId, number>
  day: Day; summary: Summary | null
  ticket: Ticket | null; cooking: Cooking | null; receipt: Receipt | null
}

const dishCounts = () => ({ potato: 0, tofu: 0, meatballs: 0 })
const newDay = (number: number): Day => ({
  number, orders: 0, missed: 0, sales: 0, tips: 0, spend: 0, satisfaction: 0, popularity: 0, excellent: 0, dishes: dishCounts(),
})
export function newSave(character: Character): Save {
  return {
    saveVersion: 1, contentVersion, character, position: { ...spawn }, coins: 80,
    inventory: Object.fromEntries(ingredientIds.map(id => [id, ingredients[id].initial])) as Save['inventory'],
    popularity: 0, xp: 0, equipment: 0, unlockedStalls: ['fried'], knownRecipes: [...recipeIds], served: 0,
    mastery: dishCounts(), day: newDay(1), summary: null, ticket: null, cooking: null, receipt: null,
  }
}

export function levelOf(save: Save) {
  return levels.filter(threshold => save.xp >= threshold).length
}

export function invite(save: Save, mode: Ticket['mode'], random = Math.random) {
  if (save.ticket || save.summary) return
  const tutorial = save.day.number === 1 && mode === 'relaxed'
    ? recipeIds.findIndex(id => save.knownRecipes.includes(id) && save.day.dishes[id] === 0)
    : -1
  const available = save.knownRecipes.filter(id => enough(save, id))
  const menu = available.length ? available : save.knownRecipes
  const id = tutorial >= 0 ? recipeIds[tutorial] : menu[Math.floor(random() * menu.length)]
  const customer = tutorial >= 0 ? customerIds[tutorial] : customerIds[Math.floor(random() * customerIds.length)]
  const wait = customers[customer].wait
  save.receipt = null
  save.ticket = { recipe: id, customer, mode, wait, stage: 'offered' }
}

export function enough(save: Save, id: RecipeId) {
  const cost = recipe(id).cost
  return ingredientIds.every(item => save.inventory[item] >= (cost[item] ?? 0))
}

export function startCooking(save: Save) {
  const order = save.ticket
  if (!order || save.cooking || order.stage !== 'accepted' || !enough(save, order.recipe)) return false
  const cost = recipe(order.recipe).cost
  for (const item of ingredientIds) save.inventory[item] -= cost[item] ?? 0
  save.cooking = { step: 0, taps: 0, heat: null, quality: 100, fryResult: 'pending' }
  return true
}

export function fireWindow(save: Save) {
  const offsets: Record<RecipeId, number> = { potato: 0, tofu: -0.25, meatballs: 0.35 }
  const start = 2.3 + offsets[save.ticket?.recipe ?? 'potato']
  return { start, end: start + 1.7 + save.equipment * 0.55 }
}

export function advance(save: Save) {
  const order = save.ticket
  const cook = save.cooking
  if (!order || !cook) return
  const step = recipe(order.recipe).steps[cook.step]
  if (!step) return
  if (step.effect === 'fry') {
    if (cook.heat === null) {
      cook.heat = 0
      return
    }
    const { start, end } = fireWindow(save)
    if (cook.heat < start) {
      cook.quality -= 32
      cook.fryResult = 'pale'
    } else if (cook.heat > end) {
      cook.quality -= Math.min(65, 23 + Math.floor((cook.heat - end) * 13))
      cook.fryResult = 'dark'
    } else cook.fryResult = 'golden'
    cook.heat = null
  } else if (++cook.taps < (step.taps ?? 1)) return
  cook.step++
  cook.taps = 0
}

export function tick(save: Save, seconds: number) {
  const order = save.ticket
  if (!order || order.stage === 'offered') return false
  if (save.cooking?.heat != null) save.cooking.heat = Math.min(10, save.cooking.heat + seconds)
  if (order.mode === 'relaxed') return false
  order.wait = Math.max(0, order.wait - seconds)
  if (order.wait > 0) return false
  dismissOrder(save)
  return true
}

export function dismissOrder(save: Save) {
  if (!save.ticket) return
  save.day.missed += Number(save.ticket.stage === 'accepted')
  save.ticket = null
  save.cooking = null
}

export function serve(save: Save) {
  const order = save.ticket
  const cook = save.cooking
  if (!order || !cook || cook.step !== recipe(order.recipe).steps.length) return
  const quality = cook.quality
  const waiting = order.mode === 'timed' ? Math.round(25 * (1 - order.wait / customers[order.customer].wait)) : 0
  const satisfaction = Math.max(0, quality - waiting)
  const coins = Math.round(recipe(order.recipe).price * (0.6 + quality * 0.004))
  const tip = satisfaction >= 85 ? order.mode === 'timed' ? 6 : 3 : 0
  const xp = 8 + Math.floor(quality / 25) + (order.mode === 'timed' ? 2 : 0)
  const popularity = satisfaction >= 85 ? 3 : satisfaction >= 60 ? 2 : 1
  save.coins += coins + tip
  save.xp += xp
  save.popularity += popularity
  save.served++
  save.day.orders++
  save.day.sales += coins
  save.day.tips += tip
  save.day.popularity += popularity
  save.day.satisfaction += satisfaction
  save.day.dishes[order.recipe]++
  if (quality >= 90) {
    save.day.excellent++
    save.mastery[order.recipe]++
  }
  save.receipt = { recipe: order.recipe, customer: order.customer, coins, tip, quality, satisfaction, xp, popularity }
  save.ticket = null
  save.cooking = null
}

export function buy(save: Save, id: Ingredient) {
  const { pack, price } = ingredients[id]
  if (save.coins < price || save.inventory[id] + pack > 999) return false
  save.coins -= price
  if (!save.summary) save.day.spend += price
  save.inventory[id] += pack
  return true
}

export function improve(save: Save) {
  const upgrade = upgrades[save.equipment]
  if (!upgrade || save.coins < upgrade.cost || levelOf(save) < upgrade.level) return false
  save.coins -= upgrade.cost
  if (!save.summary) save.day.spend += upgrade.cost
  save.equipment++
  return true
}

export function taskProgress(day: Day, task: Task) {
  if (task.metric === 'recipe' && task.recipe) return day.dishes[task.recipe]
  if (task.metric === 'variety') return Object.values(day.dishes).filter(count => count > 0).length
  if (task.metric === 'excellent') return day.excellent
  return day.orders
}

export function settle(save: Save) {
  if (save.summary || save.ticket || !save.day.orders) return
  const achieved = dailyTasks(save.day.number).filter(task => taskProgress(save.day, task) >= task.target)
  const bonus = achieved.reduce((sum, task) => sum + task.reward, 0)
  save.coins += bonus
  save.summary = { ...save.day, bonus, goals: achieved.map(task => task.id) }
  save.receipt = null
}

export function nextDay(save: Save) {
  if (!save.summary) return
  save.day = newDay(save.day.number + 1)
  save.summary = null
}
