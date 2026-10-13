import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {chromium} from 'playwright';
const base=process.env.TEST_BOOTH_URL||'http://127.0.0.1:3100',hardware=process.env.TEST_HARDWARE_URL||'http://127.0.0.1:3101';
const password=randomBytes(24).toString('base64url'),email=`qa-english-${Date.now()}@example.invalid`;
const adminEnvOriginals=[];
const user={cookie:''};let browser,checks=0;
async function request(url,route,{method='GET',body,status=200}={}){
 const response=await fetch(url+route,{method,headers:{Origin:url,'Content-Type':'application/json',Cookie:user.cookie},body:body===undefined?undefined:JSON.stringify(body)});
 const data=await response.json();assert.equal(response.status,status,`${route}: expected ${status}, got ${response.status}`);checks++;return data;
}
function english(text){assert.equal(/[\u3400-\u9fff]/u.test(text),false,'English fixture has untranslated interface text');assert.equal(text.includes('两个 Agent 共用你的账号与偏好。'),false);checks++;}
try{
 browser=await chromium.launch({channel:'msedge',headless:true,...(process.env.TEST_PROXY?{proxy:{server:process.env.TEST_PROXY}}:{})});
 const context=await browser.newContext({viewport:{width:1280,height:900}}),page=await context.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const dir='runtime/english-verification';await mkdir(dir,{recursive:true});
 await page.goto(base+'/?lang=en');await page.getByRole('heading',{name:'Welcome back'}).waitFor();english(await page.locator('body').innerText());await page.screenshot({path:dir+'/login-desktop.png',fullPage:true});
 await page.getByRole('button',{name:'New here? Create an account'}).click();
 await page.getByLabel('Nickname (optional)',{exact:true}).fill('English QA');await page.getByLabel('Email',{exact:true}).fill(email);await page.getByLabel('Password',{exact:true}).fill(password);await page.getByLabel('Confirm password',{exact:true}).fill('different-password');await page.getByRole('button',{name:'Register and complete the questionnaire'}).click();await page.getByRole('alert').filter({hasText:'do not match'}).waitFor();english(await page.locator('body').innerText());
 await page.getByLabel('Confirm password',{exact:true}).fill(password);await page.getByRole('button',{name:'Register and complete the questionnaire'}).click();await page.getByRole('heading',{name:'Let us get to know the scents you enjoy'}).waitFor();
 user.cookie=(await context.cookies(base)).map(c=>`${c.name}=${c.value}`).join('; ');
 await page.getByRole('radio',{name:'Never or rarely use perfume',exact:true}).check();await page.getByRole('checkbox',{name:'Work / commuting',exact:true}).check();english(await page.locator('body').innerText());
 await page.getByRole('button',{name:'Next',exact:true}).click();await page.getByRole('button',{name:'Mark unanswered families as “not sure”'}).click();assert.equal(await page.locator('input[type=radio]:checked').count(),8);
 await page.getByRole('button',{name:'ZH',exact:true}).click();await page.getByRole('heading',{name:/4. 对下面/}).waitFor();assert.equal(await page.locator('input[type=radio]:checked').count(),8);await page.getByRole('button',{name:'EN',exact:true}).click();await page.getByRole('heading',{name:/4. How/}).waitFor();assert.equal(await page.locator('input[type=radio]:checked').count(),8);checks++;english(await page.locator('body').innerText());
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:dir+'/families-mobile.png',fullPage:true});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);checks++;await page.setViewportSize({width:1280,height:900});
 await page.getByRole('button',{name:'Next',exact:true}).click();await page.getByRole('radio',{name:'A little sweetness',exact:true}).check();await page.getByRole('radio',{name:'Moderate: noticeable to people nearby',exact:true}).check();await page.getByRole('checkbox',{name:'No particular avoidances',exact:true}).check();await page.getByRole('radio',{name:'No known materials to exclude',exact:true}).check();await page.getByRole('radio',{name:'Stay close to scents I already enjoy',exact:true}).check();english(await page.locator('body').innerText());
 await page.getByRole('button',{name:'Next',exact:true}).click();english(await page.locator('body').innerText());await page.getByRole('button',{name:'Review preference summary'}).click();english(await page.locator('body').innerText());await page.getByRole('radio',{name:'Save to my account for future visits',exact:true}).check();
 const saved=page.waitForResponse(r=>r.url().endsWith('/api/me/questionnaire')&&r.request().method()==='PUT');await page.getByRole('button',{name:'Save preferences and start creating'}).click();assert.equal((await saved).status(),200);await page.getByRole('heading',{name:'Your everyday preference summary'}).waitFor({state:'hidden'});
 const me=await request(base,'/api/me');assert.equal(me.profile.answers.familyAffinity.woody,'unknown');assert.equal(me.profile.answers.sweetnessPreference,'slight');assert.equal(me.profile.answers.presencePreference,'medium');
 await page.reload();await page.getByRole('button',{name:'Preferences & memories',exact:true}).waitFor();english(await page.locator('body').innerText());
 await page.locator('.idea-input').fill('A fresh scent for commuting');const generatedResponse=page.waitForResponse(r=>r.url().endsWith('/api/generate'));await page.getByRole('button',{name:'Generate scent card',exact:true}).click();const generated=await(await generatedResponse).json();assert.ok(generated.generationId);assert.equal(generated.formula.quantitativeAnalysis.targetVector.sweet,1);await page.getByRole('heading',{name:'Feedback',exact:true}).waitFor();english(await page.locator('body').innerText());
 await page.getByRole('button',{name:'3',exact:true}).click();await page.locator('.feedback-input').fill('For everyday use, make it lighter and less sweet.');await page.getByRole('checkbox',{name:'I have smelled a perfume sample made from this formula',exact:true}).check();await page.getByLabel('Where should this feedback apply?').selectOption('global');const feedbackResponse=page.waitForResponse(r=>r.url().endsWith('/api/feedback'));await page.getByRole('button',{name:'Submit feedback',exact:true}).click();assert.equal((await feedbackResponse).status(),200);
 await page.getByRole('button',{name:'Preferences & memories · Awaiting confirmation'}).click();await page.getByRole('heading',{name:'Your preferences & memories'}).waitFor();english(await page.locator('body').innerText());assert.equal(await page.getByRole('button',{name:'Confirm memory',exact:true}).count(),2);await page.screenshot({path:dir+'/preferences-desktop.png',fullPage:true});
 await page.goto(hardware+'/?lang=en');await page.getByRole('button',{name:/Preferences & memories/}).waitFor({timeout:5000}).catch(()=>{});
 // Different production domains require a separate sign-in; local ports share cookies.
 if(await page.getByRole('heading',{name:'Welcome back'}).isVisible()){await page.getByLabel('Email',{exact:true}).fill(email);await page.getByLabel('Password',{exact:true}).fill(password);await page.getByRole('button',{name:'Sign in',exact:true}).click();}
 await page.getByRole('button',{name:/Preferences & memories/}).waitFor();english(await page.locator('body').innerText());await page.screenshot({path:dir+'/hardware-desktop.png',fullPage:true});
 await request(base,'/api/admin',{status:403});
 if(process.env.TEST_ADMIN_ROLE){
  assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));
  for(const folder of ['aroma-agent','perfume_agent_hardware']){const file=path.resolve('..',folder,'.env.local'),original=await readFile(file,'utf8');adminEnvOriginals.push({file,original});const ids=original.match(/^ADMIN_USER_IDS=(.*)$/m)?.[1]||'';await writeFile(file,original.replace(/^ADMIN_USER_IDS=.*\r?\n?/m,'')+'\nADMIN_USER_IDS='+[ids,me.user.id].filter(Boolean).join(',')+'\n');}
  for(let i=0;i<10;i++){await new Promise(r=>setTimeout(r,1000));const r=await fetch(base+'/api/admin',{headers:{Cookie:user.cookie}});if(r.ok)break;}
  await page.goto(base+'/admin?lang=en');await page.getByRole('heading',{name:'Accounts, profiles & feedback'}).waitFor();await page.getByLabel('Search accounts').fill(email);const filtered=page.waitForResponse(r=>r.url().includes('/api/admin?search='));await page.getByRole('button',{name:'Search',exact:true}).click();assert.equal((await filtered).status(),200);await page.getByRole('button',{name:/English QA/}).click();await page.getByRole('heading',{name:'English QA',exact:true}).waitFor();english(await page.locator('body').innerText());await page.screenshot({path:dir+'/admin-desktop.png',fullPage:true});await page.setViewportSize({width:390,height:844});english(await page.locator('body').innerText());assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:dir+'/admin-mobile.png',fullPage:true});checks++;
 }
 assert.deepEqual(errors,[]);checks++;
 console.log(`PASS: ${checks} English UI/API checks; registration, all questionnaire steps, language switching, saved answers, generation, feedback and hardware UI verified.`);
}finally{
 if(browser)await browser.close();
 try{if(user.cookie){await request(base,'/api/auth/delete-user',{method:'POST',body:{password}});await request(base,'/api/me',{status:401});}}finally{for(const item of adminEnvOriginals)await writeFile(item.file,item.original);}
}
