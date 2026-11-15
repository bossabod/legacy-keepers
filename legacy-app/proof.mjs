import { chromium } from 'playwright';
import fs from 'fs';
const URL='https://bossabod.github.io/legacy-keepers/';
const b = await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const ctx = await b.newContext({ viewport:{width:1600,height:1000}, bypassCSP:true });
const p = await ctx.newPage();
const errs=[]; p.on('pageerror',e=>{const s=String(e); if(!s.includes('Hydration'))errs.push(s.slice(0,150));});

async function enter(){
  await p.goto(URL,{waitUntil:'networkidle'}); await p.waitForTimeout(3200);
  await p.locator('.entry-zone').click(); await p.waitForTimeout(4200);
  await p.locator('input[type=text]').fill('Q-T-971');
  await p.locator('input[type=password]').fill('000000');
  await p.locator('button:has-text("AUTHENTICATE")').click();
  await p.waitForSelector('button:has-text("Archive")',{timeout:60000}); await p.waitForTimeout(2200);
}
await enter();
await p.locator('button:has-text("Projects")').first().click(); await p.waitForTimeout(3800);
const g=await p.locator('button:has-text("Enter Projects Section")').boundingBox();
await p.mouse.click(g.x+g.width/2,g.y+g.height/2); await p.waitForTimeout(3500);

// التبويبات + توسيطها
const nav = await p.evaluate(()=>{
  const n=[...document.querySelectorAll('nav')].pop();
  const bs=[...n.querySelectorAll('button')].map(x=>{const r=x.getBoundingClientRect();return{t:x.textContent.trim(),c:Math.round(r.x+r.width/2)};});
  return {labels:bs.map(x=>x.t), centre:Math.round((bs[0].c+bs[bs.length-1].c)/2), mid:Math.round(innerWidth/2)};
});
console.log('التبويبات :', nav.labels.join(' | '));
console.log('التوسيط   :', nav.centre, 'مقابل', nav.mid, nav.centre>0&&Math.abs(nav.centre-nav.mid)<25?'✅':'❌');
fs.writeFileSync('/tmp/p-tabs.png', await p.screenshot({timeout:60000}));

// Physical: بطاقات + عدد + لون الشريط
await p.locator('button:has-text("Physical Projects")').first().click(); await p.waitForTimeout(3200);
const t = await p.locator('body').innerText();
console.log('أغسطس نشط:', (t.match(/ACTIVE PROJECTS\s*(\d+)/i)||[])[1]);
console.log('الشريط    :', await p.evaluate(()=>getComputedStyle(document.querySelector('aside')).backgroundColor));
console.log('البطاقات  :', await p.evaluate(()=>document.querySelectorAll('main .grid > button, main [class*=grid] > button').length));
fs.writeFileSync('/tmp/p-cards.png', await p.screenshot({timeout:60000}));
console.log('errors:', errs.length?errs.join('|'):'none');
await b.close();
