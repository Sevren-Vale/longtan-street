import { expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import type { Save } from '../../src/business'
import { saveKey } from '../../src/save'

export const saved = async (page: Page): Promise<Save> =>
  JSON.parse(await page.evaluate(key => localStorage.getItem(key) ?? 'null', saveKey))
export const dialog = (page: Page) => page.getByRole('dialog')
export async function createPlayer(page: Page) {
  await page.goto('./')
  await page.getByRole('button',{name:'开始游戏',exact:true}).click()
  await page.getByRole('textbox',{name:'摊主名字'}).fill('小岚')
  await page.getByLabel('角色',{exact:true}).selectOption('1')
  await page.getByLabel('发型',{exact:true}).selectOption('2')
  await page.getByLabel('发色',{exact:true}).selectOption('1')
  await page.getByLabel('肤色',{exact:true}).selectOption('1')
  await page.getByLabel('服装',{exact:true}).selectOption('2')
  await page.getByRole('button',{name:'写上我的名字'}).click()
  await expect(page.getByRole('heading',{name:'又见龙潭'})).toBeVisible()
  await page.getByRole('button',{name:'走进龙潭商业街'}).click()
  await expect(page.locator('.street-canvas')).toBeVisible()
}
export async function beginDish(page: Page, name: string) {
  const panel = dialog(page)
  await panel.getByRole('button',{name:'接待顾客',exact:true}).click()
  await expect(panel.getByRole('heading',{name})).toBeVisible()
  await panel.getByRole('button',{name:'接受订单',exact:true}).click()
  await panel.getByRole('button',{name:'取料开始制作',exact:true}).click()
}
export async function cook(page: Page, name: string) {
  const panel = dialog(page)
  await expect(panel.getByRole('heading',{name})).toBeVisible()
  const advance = panel.locator('[data-action="advance"]')
  const serve = panel.getByRole('button',{name:'交付给顾客',exact:true})
  for(let i=0;i<18;i++){
    if(await serve.isVisible())break
    if(await advance.textContent()==='捞出锅') {
      await expect(panel.locator('#heat-label')).toHaveAttribute('data-state','ready')
    }
    await advance.click()
  }
  await serve.click()
  await expect(panel.locator('.receipt')).toContainText('菜品质量 100')
}
