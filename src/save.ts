import { contentVersion, customers, ingredientIds, looks, recipe, recipeIds, spawn, stalls } from './content'
import type { LookKey, RecipeId } from './content'
import { newSave } from './business'
import type { Character, Cooking, Day, Receipt, Save, Summary, Ticket } from './business'
import { passable } from './world'

export const saveKey = 'longtan-street.save'
const backupKey = saveKey + '.backup'
const saveLimit = 128_000
function invalid(): never { throw new Error('存档数据不完整或超出范围。') }
function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return invalid()
  return value as Record<string, unknown>
}
function number(value: unknown, min: number, max: number, integer = true): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max || (integer && !Number.isInteger(value))) return invalid()
  return value
}
const count = (value: unknown) => number(value, 0, Number.MAX_SAFE_INTEGER)
function select<T extends string>(value: unknown, ids: readonly T[]): T {
  if (!ids.includes(value as T)) return invalid()
  return value as T
}
function list<T extends string>(value: unknown, ids: readonly T[]): T[] {
  if (!Array.isArray(value) || value.length > ids.length) return invalid()
  return [...new Set(value.map(item => select(item, ids)))]
}
function readCounts<T extends string>(value: unknown, keys: readonly T[], defaults: Record<T, number>, max = Number.MAX_SAFE_INTEGER) {
  const input = record(value)
  return Object.fromEntries(keys.map(key => [key, number(input[key] ?? defaults[key], 0, max)])) as Record<T, number>
}
function dayFrom(value: unknown, defaults: Day): Day {
  const d = record(value)
  return {
    number: number(d.number, 1, Number.MAX_SAFE_INTEGER), orders: count(d.orders), missed: count(d.missed),
    sales: count(d.sales), tips: count(d.tips), spend: count(d.spend), satisfaction: count(d.satisfaction),
    popularity: count(d.popularity), excellent: count(d.excellent),
    dishes: readCounts(d.dishes, recipeIds, defaults.dishes),
  }
}
const customerKeys = Object.keys(customers) as Ticket['customer'][]
type Migration = (data: Record<string, unknown>) => Record<string, unknown>
// 以后增加新版本时，依次注册从旧版本到下一版本的迁移。
const migrations: ReadonlyMap<number, Migration> = new Map()

export function decodeSave(raw: string): Save {
  if (raw.length > saveLimit) throw new Error('存档文件太大。')
  let input = record(JSON.parse(raw))
  let version = number(input.saveVersion, 0, Number.MAX_SAFE_INTEGER)
  while (version < 1) {
    const migrate = migrations.get(version)
    if (!migrate) throw new Error('这个旧版存档暂时无法读取。')
    input = migrate(input)
    if (input.saveVersion !== version + 1) return invalid()
    version++
  }
  if (version !== 1) throw new Error('请用更新版本的游戏打开该存档。')
  if (typeof input.contentVersion !== 'string' || !/^\d+\.\d+\.\d+$/.test(input.contentVersion)) return invalid()
  const current = contentVersion.split('.').map(Number)
  const incoming = input.contentVersion.split('.').map(Number)
  const differs = incoming.findIndex((value, i) => value !== current[i])
  if (differs >= 0 && incoming[differs] > current[differs]) throw new Error('请用更新版本的游戏打开该存档。')
  const c = record(input.character)
  if (typeof c.name !== 'string' || c.name.trim().length === 0 || c.name.length > 16 || /[\u0000-\u001f]/.test(c.name)) return invalid()
  const character = { name: c.name.trim() } as Character
  for (const key of Object.keys(looks) as LookKey[]) character[key] = number(c[key], 0, looks[key].length - 1)
  const defaults = newSave(character)
  const p = record(input.position)
  const x = number(p.x, 0, 100_000, false)
  const y = number(p.y, 0, 100_000, false)
  const day = dayFrom(input.day, defaults.day)
  let summary: Summary | null = null
  if (input.summary != null) {
    const s = record(input.summary)
    const totals = dayFrom(s, defaults.day)
    if (!totals.orders || totals.number !== day.number || !Array.isArray(s.goals) || s.goals.length > 16 ||
        s.goals.some(id => typeof id !== 'string' || id.length > 64)) return invalid()
    summary = { ...totals, bonus: count(s.bonus), goals: s.goals as string[] }
  }
  let ticket: Ticket | null = null
  if (input.ticket != null) {
    const t = record(input.ticket)
    if (summary) return invalid()
    const customer = select(t.customer, customerKeys)
    ticket = {
      recipe: select(t.recipe, recipeIds), customer, mode: select(t.mode, ['relaxed', 'timed']),
      stage: select(t.stage, ['offered', 'accepted']), wait: number(t.wait, Number.MIN_VALUE, customers[customer].wait, false),
    }
  }
  let cooking: Cooking | null = null
  if (input.cooking != null) {
    if (ticket?.stage !== 'accepted') return invalid()
    const value = record(input.cooking)
    const steps = recipe(ticket.recipe).steps
    const step = number(value.step, 0, steps.length)
    const active = steps[step]
    if (value.heat != null && active?.effect !== 'fry') return invalid()
    cooking = {
      step, taps: number(value.taps, 0, (active?.taps ?? 1) - 1),
      heat: value.heat == null ? null : number(value.heat, 0, 10, false), quality: number(value.quality, 0, 100),
      fryResult: select(value.fryResult, ['pending', 'pale', 'golden', 'dark']),
    }
  }
  let receipt: Receipt | null = null
  if (input.receipt != null) {
    if (ticket || summary) return invalid()
    const r = record(input.receipt)
    receipt = {
      recipe: select(r.recipe, recipeIds), customer: select(r.customer, customerKeys),
      coins: count(r.coins), tip: count(r.tip), xp: count(r.xp), popularity: count(r.popularity),
      quality: number(r.quality, 0, 100), satisfaction: number(r.satisfaction, 0, 100),
    }
  }
  const knownRecipes = list(input.knownRecipes, recipeIds)
  const unlockedStalls = list(input.unlockedStalls, Object.keys(stalls) as Save['unlockedStalls'])
  if (!knownRecipes.length || !unlockedStalls.includes('fried') || (ticket && !knownRecipes.includes(ticket.recipe))) return invalid()
  return {
    ...defaults, position: passable(x, y) ? { x, y } : { ...spawn },
    coins: count(input.coins), popularity: count(input.popularity), xp: count(input.xp),
    inventory: readCounts(input.inventory, ingredientIds, defaults.inventory, 999), equipment: number(input.equipment, 0, 2),
    unlockedStalls, knownRecipes, served: count(input.served),
    mastery: readCounts<RecipeId>(input.mastery, recipeIds, defaults.mastery), day, summary, ticket, cooking, receipt,
  }
}

export function readSave(): { game: Save | null; notice: string } {
  try {
    const raw = localStorage.getItem(saveKey)
    const previous = localStorage.getItem(backupKey)
    if (raw) {
      try { return { game: decodeSave(raw), notice: '' } }
      catch {
        if (previous) {
          try { return { game: decodeSave(previous), notice: '主存档读取失败，已加载上一次可用的备份。' } }
          catch { /* 保留两份原始数据供导出 */ }
        }
        return { game: null, notice: '存档读取失败。可在设置导出原文件。' }
      }
    }
    if (previous) return { game: decodeSave(previous), notice: '已加载上一次可用的备份。' }
    return { game: null, notice: '' }
  } catch {
    return { game: null, notice: '无法读取浏览器存档。请检查浏览器的本地存储设置。' }
  }
}
export function writeSave(game: Save) {
  try {
    const json = JSON.stringify(game)
    const previous = localStorage.getItem(saveKey)
    if (previous === json) return true
    if (previous) {
      try { decodeSave(previous); localStorage.setItem(backupKey, previous) }
      catch { /* 无有效旧存档时继续写入当前进度。 */ }
    }
    localStorage.setItem(saveKey, json)
    return true
  } catch { return false }
}
export function rawSave() {
  try { return localStorage.getItem(saveKey) ?? localStorage.getItem(backupKey) }
  catch { return null }
}
export function eraseSave() {
  try {
    localStorage.removeItem(backupKey)
    localStorage.removeItem(saveKey)
    return true
  } catch { return false }
}
