import {test,expect} from '@playwright/test';
async function fits(page){expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);}
for(const module of ['expedientes','agenda','seguimiento'])test('Distribución adaptable: '+module,async({page})=>{
 await page.route('https://**',r=>r.abort());await page.goto('/desarrollo/'+module);await expect(page.locator('.exp-content h1')).toBeVisible();
 for(const width of [1440,1024,768,360]){await page.setViewportSize({width,height:900});await fits(page);
 if(width>800){const sidebar=await page.locator('.exp-sidebar').boundingBox(),header=await page.locator('.exp-header').boundingBox();expect(header.x).toBeGreaterThanOrEqual(sidebar.x+sidebar.width-1);}
 const tabs=page.locator('.exp-tabs');if(await tabs.count()){expect(await tabs.evaluate(el=>[...el.children].every(c=>{const a=el.getBoundingClientRect(),b=c.getBoundingClientRect();return b.left>=a.left&&b.right<=a.right+1;}))).toBe(true);}
 }
 await page.getByRole('button',{name:'Abrir menú',exact:true}).click();await expect(page.getByRole('button',{name:'Cerrar navegación',exact:true})).toBeVisible();await page.getByRole('button',{name:'Cerrar navegación',exact:true}).click();await expect(page.getByRole('button',{name:'Cerrar navegación',exact:true})).not.toBeInViewport();
});
test('Distribución del portal: actividades y recursos dentro de la pantalla',async({page})=>{await page.route('https://**',r=>r.abort());await page.goto('/desarrollo/portal');await page.getByLabel('Código de acceso',{exact:true}).fill('PL-DEMO-101');await page.getByRole('button',{name:'Abrir mi seguimiento',exact:true}).click();await expect(page.getByRole('heading',{name:/^Hola,/})).toBeVisible();for(const width of [1440,1024,768,360]){await page.setViewportSize({width,height:900});await fits(page);}});
