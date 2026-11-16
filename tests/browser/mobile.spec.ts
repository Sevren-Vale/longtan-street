import { expect, test } from '@playwright/test'
import { cook, createPlayer, dialog, saved } from './helpers'

test('手机触控摇杆移动、点摊位开工、竖屏布局',async({page,context},info)=>{
  await createPlayer(page)
  const stick=page.getByLabel('虚拟摇杆')
  await expect(stick).toBeVisible()
  const rect=(await stick.boundingBox())!
  const start=await saved(page)
  const cdp=await context.newCDPSession(page)
  const touch={x:rect.x+rect.width*.25,y:rect.y+rect.height*.53}
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[touch]})
  await page.waitForTimeout(420)
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})
  await expect.poll(async()=>(await saved(page)).position.x, {timeout:5000}).toBeLessThan(start.position.x-22)
  await page.screenshot({path:info.outputPath('street-mobile.png')})
  await page.getByRole('button',{name:'龙潭炸香摊',exact:true}).tap()
  await dialog(page).getByRole('button',{name:'接待顾客',exact:true}).tap()
  await dialog(page).getByRole('button',{name:'接受订单',exact:true}).tap()
  await dialog(page).getByRole('button',{name:'取料开始制作',exact:true}).tap()
  await dialog(page).getByRole('button',{name:'洗净土豆',exact:true}).tap()
  await expect(dialog(page).getByRole('button',{name:'削掉外皮',exact:true})).toBeVisible()
  await page.screenshot({path:info.outputPath('kitchen-mobile.png')})
  expect((await saved(page)).cooking?.step).toBe(1)
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true)
  await page.setViewportSize({width:800,height:393})
  await expect(dialog(page).getByRole('button',{name:'削掉外皮'})).toBeVisible()
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true)
  await cook(page,'金黄炸土豆')
})
