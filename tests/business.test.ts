import { describe, expect, it } from 'vitest'
import { advance, buy, fireWindow, improve, invite, levelOf, newSave, nextDay, serve, settle, startCooking, tick } from '../src/business'
import { recipe, recipeIds } from '../src/content'
import { decodeSave } from '../src/save'
import { passable } from '../src/world'

const player = { name: '小岚', gender: 1, hair: 2, hairColor: 1, skin: 1, outfit: 2 }

describe('首日与经济', () => {
  it('按配方扣料，且三种招牌可各自收款一次，再完成日结', () => {
    const save = newSave(player)
    for (const id of recipeIds) {
      invite(save, 'relaxed')
      expect(save.ticket?.recipe).toBe(id)
      expect(startCooking(save)).toBe(false)
      save.ticket!.stage = 'accepted'
      const stock = { ...save.inventory }
      expect(startCooking(save)).toBe(true)
      expect(startCooking(save)).toBe(false)
      for (const [item, used] of Object.entries(recipe(id).cost)) {
        expect(save.inventory[item as keyof typeof stock]).toBe(stock[item as keyof typeof stock] - used)
      }
      for (const step of recipe(id).steps) {
        for (let i = 0; i < (step.taps ?? 1); i++) advance(save)
        if (step.effect === 'fry') {
          const { start, end } = fireWindow(save)
          tick(save, (start + end) / 2)
          advance(save)
        }
      }
      const coins = save.coins
      serve(save)
      expect(save.receipt?.quality).toBe(100)
      expect(save.coins).toBe(coins + recipe(id).price + 3)
      serve(save)
      expect(save.coins).toBe(coins + recipe(id).price + 3)
    }
    expect(levelOf(save)).toBe(2)
    expect(save.popularity).toBe(9)
    settle(save)
    expect(save.summary).toMatchObject({ orders: 3, bonus: 28, sales: 67 })
    const balance = save.coins
    settle(save)
    expect(save.coins).toBe(balance)
    nextDay(save)
    expect(save.day).toMatchObject({ number: 2, orders: 0 })
    expect(save.mastery).toEqual({ potato: 1, tofu: 1, meatballs: 1 })
  })
  it('限时挑战、火候区间、缺料与设备受状态约束', () => {
    const save = newSave(player)
    invite(save, 'timed', () => 0.5)
    expect(save.ticket!.recipe).toBe('tofu')
    expect(tick(save, 100)).toBe(false)
    save.ticket!.stage = 'accepted'
    save.inventory.tofu = 0
    expect(startCooking(save)).toBe(false)
    expect(buy(save, 'tofu')).toBe(true)
    expect(save.coins).toBe(71)
    expect(startCooking(save)).toBe(true)
    for (let i=0;i<4;i++) advance(save)
    advance(save)
    expect(save.cooking).toMatchObject({ quality:68, fryResult:'pale' })
    expect(tick(save, 100)).toBe(true)
    expect(save.ticket).toBeNull()
    expect(save.day.missed).toBe(1)
    expect(save.inventory.tofu).toBe(2)
    expect(improve(save)).toBe(false)
    save.xp = 28
    const window = fireWindow(save)
    expect(improve(save)).toBe(true)
    expect(fireWindow(save).end).toBeGreaterThan(window.end)
  })
  it('火候过老会拉低质量和收入，休闲客人仍会等候', () => {
    const save = newSave(player)
    invite(save, 'relaxed')
    save.ticket!.stage = 'accepted'
    startCooking(save)
    for (let i=0;i<6;i++)advance(save)
    expect(tick(save,30)).toBe(false)
    advance(save)
    expect(save.cooking?.fryResult).toBe('dark')
    advance(save)
    advance(save)
    serve(save)
    expect(save.receipt?.quality).toBeLessThan(70)
    expect(save.receipt?.tip).toBe(0)
    expect(save.receipt?.coins).toBeLessThan(recipe('potato').price)
  })
})

describe('存档与地图', () => {
  it('正在烹饪的进度可以解码，缺少新增食材时有默认值', () => {
    const save = newSave(player)
    invite(save, 'relaxed')
    save.ticket!.stage = 'accepted'
    startCooking(save)
    advance(save)
    expect(decodeSave(JSON.stringify(save))).toEqual(save)
    const copy = JSON.parse(JSON.stringify(save))
    delete copy.inventory.cumin
    expect(decodeSave(JSON.stringify(copy)).inventory.cumin).toBe(5)
  })
  it('拦截未来版本、坏烹饪状态、库存溢出与伪造的摊位编号', () => {
    const save = newSave(player)
    expect(() => decodeSave(JSON.stringify({ ...save, saveVersion: 2 }))).toThrow('更新版本')
    expect(() => decodeSave(JSON.stringify({ ...save, contentVersion: '2.0.0' }))).toThrow('更新版本')
    expect(() => decodeSave(JSON.stringify({ ...save, cooking: { step: 2, heat: 0, taps: 0, quality: 100 } }))).toThrow()
    expect(() => decodeSave(JSON.stringify({ ...save, inventory: { ...save.inventory, salt: 1000 } }))).toThrow()
    expect(() => decodeSave(JSON.stringify({ ...save, unlockedStalls: ['__proto__'] }))).toThrow()
  })
  it('柜台阻挡角色脚底，边界外不可通行，旧坐标落在新障碍时送回入口', () => {
    const save = newSave(player)
    expect(passable(save.position.x,save.position.y)).toBe(true)
    expect(passable(330,331)).toBe(false)
    expect(passable(5,330)).toBe(false)
    expect(decodeSave(JSON.stringify({ ...save, position:{ x:330, y:331 } })).position).toEqual(save.position)
  })
})
