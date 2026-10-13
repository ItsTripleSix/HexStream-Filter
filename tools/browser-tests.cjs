const {chromium}=require('playwright');
const {launchFirefox}=require('./firefox-bidi.cjs');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),results=path.join(root,'test-results');fs.mkdirSync(results,{recursive:true});
const R=require('../src/core/rules.js');
const L=require('../src/core/language-presets.js');
// Optional user-supplied export stays in memory. Never copy it into fixtures, screenshots or reports.
const privateImport=process.env.HEXSTREAM_PRIVATE_IMPORT ? fs.readFileSync(process.env.HEXSTREAM_PRIVATE_IMPORT,'utf8') : null;
function removeTestProfile(profile,prefix) {const target=path.resolve(profile);if(path.dirname(target)!==path.resolve(os.tmpdir())||!path.basename(target).startsWith(prefix)||fs.lstatSync(target).isSymbolicLink())throw new Error('Invalid test profile path.');fs.rmSync(target,{recursive:true,force:true,maxRetries:8,retryDelay:150});}
const fixtureURL='https://www.twitch.tv/hexstream-test/';
const tags=Array.from({length:10},(_,i)=>i===9?'HiddenFixtureTag':'FixtureTag'+i);
const stream=(name,fullTags=tags)=>({__typename:'Stream',id:'stream_'+name,broadcaster:{id:'101',login:name,displayName:name},title:'Sample game time',game:{name:'Sample Game'},freeformTags:fullTags.map(name=>({name})),access_token:'PRIVATE_FIXTURE_SENTINEL',cookie:'PRIVATE_FIXTURE_SENTINEL'});
const card=(name)=>`<div data-target="directory-item"><article><a href="/${name}" data-a-target="preview-card-image-link">Preview</a><a href="/${name}" data-a-target="preview-card-channel-link">${name}</a><h3 data-a-target="preview-card-title-link">Sample game time</h3><a href="/directory/category/sample-game">Sample Game</a><button class="tw-tag">FixtureTag0</button><button class="tw-tag">FixtureTag1</button></article></div>`;
const fixture=`<!doctype html><html lang="en"><head><meta charset="utf-8"><title>HexStream browser fixture</title><style>body{font:16px system-ui;background:#151a17;color:#fff5e6}main{display:flex;gap:20px}article{width:320px;padding:24px;background:#25342b}a{display:block;color:#9ee4bc}</style></head><body><main>${card('sample_channel_a')}${card('sample_channel_b')}</main><script>window.fixtureFetch=()=>fetch('https://gql.twitch.tv/gql').then(r=>r.json());addEventListener('DOMContentLoaded',fixtureFetch);</script></body></html>`;
const capture=`() => { window.__hexstreamTestPackets=[]; addEventListener('message',event=>{if(event.source===window&&event.data?.topic==='hexstream:public-metadata:v1')window.__hexstreamTestPackets.push(...event.data.items);}); }`;
async function chromeAdapter() {
  const profile=fs.mkdtempSync(path.join(os.tmpdir(),'hexstream-chrome-test-'));
  const extension=path.join(root,'dist/chrome');
  const context=await chromium.launchPersistentContext(profile,{executablePath:process.env.CHROME_BINARY||path.resolve(root,'../toolchain/chrome-testing/chrome-win64/chrome.exe'),headless:true,args:[`--disable-extensions-except=${extension}`,`--load-extension=${extension}`],viewport:{width:1280,height:950}});
  const pageErrors=[];context.on('page',page=>page.on('pageerror',error=>pageErrors.push(error.message)));
  await context.addInitScript('('+capture+')()');
  const worker=context.serviceWorkers()[0]||await context.waitForEvent('serviceworker',{timeout:15000});
  const workerURL=new URL(worker.url()),base=workerURL.protocol+'//'+workerURL.host;
  let body=[];
  await context.route(fixtureURL,route=>route.fulfill({status:200,contentType:'text/html',body:fixture}));
  await context.route('https://gql.twitch.tv/gql',route=>route.request().frame().url()===fixtureURL?route.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'https://www.twitch.tv'},body:JSON.stringify(body)}):route.continue());
  return {name:'chrome',version:context.browser()?.version()||'',base,pageErrors,async newPage(){return context.newPage();},async goto(page,url){if(url!==fixtureURL&&url.startsWith('https://www.twitch.tv/'))await context.unroute('https://gql.twitch.tv/gql');await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});},eval(page,expression){return page.evaluate(`(async()=>(${expression}))()`);},async viewport(page,size){await page.setViewportSize(size);},fixtureBody(value){body=value;},async screenshot(page,file){await page.screenshot({path:file,fullPage:true});},async close(){await context.close();removeTestProfile(profile,'hexstream-chrome-test-');}};
}
async function firefoxAdapter() {
  const browser=await launchFirefox();
  await browser.command('webExtension.install',{extensionData:{type:'path',path:path.join(root,'dist/firefox')},'moz:allowPrivateBrowsing':true});
  await browser.command('script.addPreloadScript',{functionDeclaration:capture});
  await browser.command('session.subscribe',{events:['network.beforeRequestSent','network.responseCompleted','network.fetchError']});
  const interception=await browser.command('network.addIntercept',{phases:['beforeRequestSent'],urlPatterns:[{type:'string',pattern:fixtureURL},{type:'string',pattern:'https://gql.twitch.tv/gql'}]});
  let body=[],fixtureMode=true;const networkErrors=[],responseStatuses=[];
  browser.on('network.responseCompleted',params=>{if(params.request.url.startsWith('https://gql.twitch.tv/'))responseStatuses.push(params.response.status);});
  browser.on('network.fetchError',params=>{if(params.request.url.startsWith('https://gql.twitch.tv/'))networkErrors.push(params.errorText);});
  browser.on('network.beforeRequestSent',params=>{
    if(!params.isBlocked)return;
    const url=params.request.url;
    if(url==='https://gql.twitch.tv/gql'&&!fixtureMode){browser.command('network.continueRequest',{request:params.request.request}).catch(error=>networkErrors.push(error.message));return;}
    const html=url===fixtureURL;
    browser.command('network.provideResponse',{request:params.request.request,statusCode:200,headers:[{name:'content-type',value:{type:'string',value:html?'text/html':'application/json'}},{name:'access-control-allow-origin',value:{type:'string',value:'https://www.twitch.tv'}}],body:{type:'string',value:html?fixture:JSON.stringify(body)}}).catch(error=>networkErrors.push(error.message));
  });
  return {name:'firefox',version:browser.version,base:browser.extensionOrigin,async newPage(){return (await browser.command('browsingContext.create',{type:'tab'})).context;},async goto(page,url){if(url!==fixtureURL&&url.startsWith('https://www.twitch.tv/')&&fixtureMode){fixtureMode=false;await browser.command('network.removeIntercept',{intercept:interception.intercept});}await browser.command('browsingContext.navigate',{context:page,url,wait:'interactive'});},eval:browser.evaluate,fixtureBody(value){body=value;},async screenshot(page,file){const result=await browser.command('browsingContext.captureScreenshot',{context:page});fs.writeFileSync(file,Buffer.from(result.data,'base64'));},networkErrors,responseStatuses,async close(){await browser.close();removeTestProfile(browser.profile,'hexstream-firefox-test-');}};
}
async function wait(browser,page,expression,message,timeout=20000) {const start=Date.now();while(Date.now()-start<timeout){if(await browser.eval(page,expression))return;await new Promise(resolve=>setTimeout(resolve,100));}throw new Error(message);}
async function run(create) {
  const browser=await create(),checks=[];
  const record=(name)=>{checks.push(name);console.log(browser.name+': '+name);};
  try {
    const editor=await browser.newPage();await browser.goto(editor,browser.base+'/ui/options.html');
    await wait(browser,editor,'document.getElementById("rules") && document.getElementById("enabled").checked','Options failed to load');
    assert.equal(await browser.eval(editor,'document.getElementById("rules").value'),'');record('empty defaults and working background storage');
    async function edit(field,values,save=true,page=editor) {
      await browser.eval(page,`(()=>{const field=${JSON.stringify(field)};if(field.startsWith('allowed')){document.getElementById('tab-whitelists').click();document.querySelector('[data-field="'+field+'"]').click();}else document.getElementById('tab-'+field).click();const rules=document.getElementById('rules');rules.value=${JSON.stringify(values.join('\n'))};rules.dispatchEvent(new Event('input'));return true;})()`);
      if(save){await browser.eval(page,`(()=>{document.getElementById('status').textContent='';document.getElementById('save').click();return true;})()`);await wait(browser,page,'document.getElementById("status").textContent.startsWith("Saved.")','Settings save failed');}
    }
    async function toggle(enabled) {await browser.eval(editor,`(()=>{document.getElementById('enabled').checked=${enabled};document.getElementById('status').textContent='';document.getElementById('save').click();return true;})()`);await wait(browser,editor,'document.getElementById("status").textContent.startsWith("Saved.")','Enable setting failed');}
    async function reset() {await browser.eval(editor,`(()=>{document.getElementById('reload').click();return true;})()`);await wait(browser,editor,'document.getElementById("status").textContent==="Loaded saved rules."','Reload failed');for(const field of ['categories','channels','tags','titles','allowedChannels','allowedUsernames','allowedTitles','allowedTags'])await edit(field,[],false);await toggle(true);}
    async function importAndSave(text) {
      const expected=R.parseImport(text).settings;
      await browser.eval(editor,`(()=>{const transfer=new DataTransfer();transfer.items.add(new File([${JSON.stringify(text)}],'filters.json',{type:'application/json'}));const input=document.getElementById('import');input.files=transfer.files;input.dispatchEvent(new Event('change'));return true;})()`);
      await wait(browser,editor,'document.getElementById("status").textContent.startsWith("Imported ")','Import failed');
      const staged=await browser.eval(editor,`(()=>Object.fromEntries([...document.querySelectorAll('[data-count]')].map(node=>[node.dataset.count,Number(node.textContent)])))()`);
      for(const field of ['tags','titles','channels','categories'])assert.equal(staged[field],expected[field].length);
      await browser.eval(editor,"document.getElementById('tab-languages').click()");
      const languageScopes=await browser.eval(editor,`Object.fromEntries(['tags','titles','channels'].map(field=>[field,document.querySelectorAll('#language-rows input[data-scope="'+field+'"]:checked').length]))`);
      for(const field of L.SCOPES)assert.equal(languageScopes[field],expected[field].filter(L.isCharacterRule).length);
      await browser.eval(editor,"document.getElementById('tab-tags').click()");
      await browser.eval(editor,`(()=>{document.getElementById('save').click();return true;})()`);
      await wait(browser,editor,'document.getElementById("status").textContent.startsWith("Saved.")','Imported settings save failed');
      assert.equal(await browser.eval(editor,`(async()=>{const api=globalThis.browser||globalThis.chrome;const result=await api.runtime.sendMessage({type:'getSettings'});return ${JSON.stringify(R.FIELDS)}.every(field=>JSON.stringify(result.value[field])===JSON.stringify(${JSON.stringify(expected)}[field]));})()`),true);
      await reset();
    }
    for(const field of R.FIELDS)await edit(field,['Sample_'+field],false);
    assert.equal(await browser.eval(editor,'document.querySelector("[data-count=whitelists]").textContent'),'4');
    await edit('tags',['Sample_tags'],false);assert.equal(await browser.eval(editor,'document.getElementById("rules").value'),'Sample_tags');
    await reset();await edit('tags',[],false);record('visible tabs preserve drafts and expose all whitelist types');
    assert.equal(await browser.eval(editor,'document.documentElement.scrollWidth<=innerWidth'),true);
    if (browser.name === 'chrome') {
      await browser.screenshot(editor,path.join(results,'chrome-options.png'));
      await browser.eval(editor,"document.getElementById('tab-whitelists').click()");
      await browser.screenshot(editor,path.join(results,'chrome-whitelists.png'));
      await browser.viewport(editor,{width:390,height:900});
      assert.equal(await browser.eval(editor,'document.documentElement.scrollWidth<=innerWidth'),true);
      await browser.screenshot(editor,path.join(results,'chrome-narrow-options.png'));
      await browser.viewport(editor,{width:1280,height:950});
      await browser.eval(editor,"document.getElementById('tab-tags').click()");
    }
    record('list navigation fits the tested viewport without horizontal overflow');
    await importAndSave(JSON.stringify({tags:['/'+Array.from({length:80},(_,i)=>'FictionalTeam'+i).join('|')+'/'],channels:['sample_channel'],titles:['/^team(red|blue)\\s+.+/i'],categories:[]}));record('Unwanted Twitch imports with long regexes save and reload intact');
    if(privateImport){await importAndSave(privateImport);record('supplied private export imports and saves intact without shipping its contents');}
    await browser.eval(editor,"document.getElementById('tab-languages').click()");
    assert.equal(await browser.eval(editor,'document.querySelectorAll("#language-rows input:checked").length'),0);
    await browser.eval(editor,`(()=>{const input=document.getElementById('language-search');input.value='Russian';input.dispatchEvent(new Event('input'));return true;})()`);
    assert.deepEqual(await browser.eval(editor,'[...document.querySelectorAll("#language-rows tr")].filter(row=>!row.hidden).map(row=>row.dataset.language)'),['cyrillic']);
    await browser.eval(editor,`(()=>{document.querySelector('[data-language="cyrillic"] [data-scope="titles"]').click();document.getElementById('save').click();return true;})()`);
    await wait(browser,editor,'document.getElementById("status").textContent.startsWith("Saved.")','Language scope save failed');
    const languageSaved=await browser.eval(editor,`(async()=>{const result=await (globalThis.browser||globalThis.chrome).runtime.sendMessage({type:'getSettings'});return result.value;})()`);
    assert.deepEqual(languageSaved.titles,[L.PRESETS.find(p=>p.id==='cyrillic').rule]);assert.equal(languageSaved.tags.length,0);assert.equal(languageSaved.channels.length,0);record('Languages presets search and save independent scopes with empty defaults');
    await browser.eval(editor,`(()=>{const input=document.getElementById('language-search');input.value='';input.dispatchEvent(new Event('input'));return true;})()`);
    if(browser.name==='chrome'){await browser.screenshot(editor,path.join(results,'chrome-languages.png'));await browser.viewport(editor,{width:390,height:1100});assert.equal(await browser.eval(editor,'document.documentElement.scrollWidth<=innerWidth'),true);await browser.screenshot(editor,path.join(results,'chrome-languages-narrow.png'));await browser.viewport(editor,{width:1280,height:950});record('Languages controls fit a 390-pixel viewport');}
    await reset();
    const tab=await browser.newPage();browser.fixtureBody([{data:{game:{streams:{edges:[{node:stream('sample_channel_a')},{node:stream('sample_channel_b',['FixtureTag0','FixtureTag1'])}]}}}}]);
    await browser.goto(tab,fixtureURL);
    try{await wait(browser,tab,'document.querySelectorAll(".hexstream-card-button").length===2 && window.__hexstreamTestPackets.some(p=>p.tags.length===10)','Full tag metadata did not reach content script');}catch(error){console.log(browser.name+' fixture diagnostic '+JSON.stringify(await browser.eval(tab,'({url:location.href,title:document.title,articles:document.querySelectorAll("article").length,buttons:document.querySelectorAll(".hexstream-card-button").length,packets:window.__hexstreamTestPackets?.length,bridge:window.__hexstreamMetadataBridge,metadata:typeof HexStreamMetadata})')));console.log({pageErrors:browser.pageErrors});throw error;}
    assert(!(await browser.eval(tab,'JSON.stringify(window.__hexstreamTestPackets)')).includes('PRIVATE_FIXTURE_SENTINEL'));record('full tenth tag crosses the bridge without credential fields');
    await edit('tags',['/^Hidden(Fixture|Other)Tag$/']);
    await wait(browser,tab,`document.querySelector('[href="/sample_channel_a"]').closest('[data-hexstream-card]').getAttribute('data-hexstream-hidden')==='true'`,'Hidden tenth tag was not filtered');
    assert.equal(await browser.eval(tab,`document.querySelector('[href="/sample_channel_b"]').closest('[data-hexstream-card]').hasAttribute('data-hexstream-hidden')`),false);record('only the stream with an invisible blocked tag is hidden');
    await browser.eval(tab,`(()=>{const root=document.querySelector('[href="/sample_channel_a"]').closest('[data-hexstream-card]');window.__hexstreamVisibilityChanges=0;window.__hexstreamVisibilityObserver=new MutationObserver(changes=>{window.__hexstreamVisibilityChanges+=changes.length;});window.__hexstreamVisibilityObserver.observe(root,{attributes:true,attributeFilter:['data-hexstream-hidden']});for(const tag of root.querySelectorAll('.tw-tag'))tag.remove();return true;})()`);
    const player=stream('sample_channel_a');delete player.freeformTags;
    for(let i=0;i<4;i++){player.tags=i%2?[{localizedName:'LegacyPlayerTag'}]:[];browser.fixtureBody([{data:{stream:player}}]);await browser.eval(tab,'window.fixtureFetch()');await browser.eval(tab,'new Promise(resolve=>setTimeout(resolve,200))');}
    assert.equal(await browser.eval(tab,'window.__hexstreamVisibilityChanges'),0);record('partial player responses and responsive chip removal never toggle a filtered card');
    assert.equal(await browser.eval(tab,`(async()=>{const initial=location.href;history.pushState({fixture:true},'','/hexstream-player-fixture/');history.back();await new Promise(resolve=>setTimeout(resolve,250));return location.href===initial;})()`),true);
    assert.equal(await browser.eval(tab,'window.__hexstreamVisibilityChanges'),0);record('stream-route back navigation does not toggle existing directory cards');
    await browser.eval(tab,`(()=>{const a=document.createElement('a');a.href='/sample_channel_a';a.dataset.aTarget='search-result-channel';document.querySelector('article').append(a);return true;})()`);
    await browser.eval(tab,'new Promise(resolve=>setTimeout(resolve,200))');assert.equal(await browser.eval(tab,'window.__hexstreamVisibilityChanges'),0);record('nested directory selectors do not compete over card visibility');
    const soakMs=Number(process.env.HEXSTREAM_SOAK_MS||0);
    if(soakMs>0){
      assert(soakMs>=305000&&soakMs<=3600000,'Soak must cross the five-minute metadata TTL');
      await browser.eval(tab,`(()=>{window.__hexstreamSoakTimer=setInterval(()=>{window.fixtureFetch().catch(()=>{});dispatchEvent(new Event('pageshow'));document.dispatchEvent(new Event('visibilitychange'));},1000);return true;})()`);
      const began=Date.now();while(Date.now()-began<soakMs){await new Promise(resolve=>setTimeout(resolve,Math.min(30000,soakMs-(Date.now()-began))));assert.equal(await browser.eval(tab,'window.__hexstreamVisibilityChanges'),0);console.log(browser.name+': resume/player stability '+Math.round((Date.now()-began)/1000)+' seconds, zero visibility transitions');}
      await browser.eval(tab,'clearInterval(window.__hexstreamSoakTimer)');record('filtering stays stable past five-minute cache expiry with repeated player updates');
    }
    await browser.eval(tab,'window.__hexstreamVisibilityObserver.disconnect()');
    await browser.eval(tab,`document.querySelector('[href="/sample_channel_b"]').closest('[data-hexstream-card]').querySelector('.hexstream-card-button').click()`);
    await wait(browser,tab,'!!document.getElementById("hexstream-panel")','Tag inspector did not open');record('tag inspector opens');
    await toggle(false);await wait(browser,tab,'document.querySelectorAll("[data-hexstream-hidden]").length===0','Pause failed');
    await toggle(true);await wait(browser,tab,'document.querySelectorAll("[data-hexstream-hidden]").length===1','Resume failed');record('global pause and resume update loaded cards');
    await edit('allowedChannels',['sample_channel_a']);await wait(browser,tab,'document.querySelectorAll("[data-hexstream-hidden]").length===0','Channel exemption failed');
    await edit('allowedChannels',[]);await wait(browser,tab,'document.querySelectorAll("[data-hexstream-hidden]").length===1','Removing exception failed');record('channel exceptions apply and undo cleanly');
    const second=await browser.newPage();await browser.goto(second,browser.base+'/ui/options.html');await wait(browser,second,'document.getElementById("enabled").checked','Second editor did not load');
    await edit('channels',['sample_fixture_c']);await edit('titles',['Sample unrelated title'],false,second);
    await browser.eval(second,`(()=>{document.getElementById('save').click();return true;})()`);
    await wait(browser,second,'document.getElementById("status").textContent.includes("another tab")','Stale editor was not rejected');record('stale saves from a second editor are rejected');
    browser.fixtureBody([{data:{game:{streams:{edges:[{node:stream('sample_channel_a',['FixtureTag0'])},{node:stream('sample_channel_b',['FixtureTag0'])}]}}}}]);await browser.eval(tab,'window.fixtureFetch()');
    await wait(browser,tab,'document.querySelectorAll("[data-hexstream-hidden]").length===0','New full tag metadata did not replace old tags');record('fresh full metadata removes an obsolete tag match');
    await browser.eval(tab,`(()=>{const card=document.querySelector('article');for(const a of card.querySelectorAll('a[href="/sample_channel_a"]'))a.href='/sample_channel_d';return true;})()`);
    await wait(browser,tab,'document.querySelectorAll("[data-hexstream-hidden]").length===0','Recycled card retained old match');record('recycled cards do not retain another channel’s filter state');
    await reset();
    await browser.goto(tab,'https://www.twitch.tv/directory/category/fortnite');
    try {await wait(browser,tab,'document.querySelectorAll(".hexstream-card-button").length>5 && window.__hexstreamTestPackets.length>5','Live Twitch did not produce metadata',25000);}catch(error){console.log(browser.name+' live diagnostic '+JSON.stringify(await browser.eval(tab,'({title:document.title,articles:document.querySelectorAll("article").length,buttons:document.querySelectorAll(".hexstream-card-button").length,packets:window.__hexstreamTestPackets?.length,ready:document.readyState})')));console.log({networkErrors:browser.networkErrors,responseStatuses:browser.responseStatuses});throw error;}
    const evidenceQuery=`(()=>{for(const article of document.querySelectorAll('article')){const a=article.querySelector('a[data-a-target="preview-card-channel-link"]');if(!a)continue;const login=new URL(a.href).pathname.slice(1).toLowerCase();const record=window.__hexstreamTestPackets.findLast(p=>p.login===login&&p.fullTags);const visible=[...article.querySelectorAll('.tw-tag')].map(t=>t.textContent.trim());const hidden=record?.tags.find(tag=>!visible.includes(tag));if(hidden)return{login,hidden,fullCount:record.tags.length,visibleCount:visible.length};}return null;})()`;
    await wait(browser,tab,`!!${evidenceQuery}`,'Live directory did not supply an undisplayed tag',25000);
    const evidence=await browser.eval(tab,evidenceQuery);
    assert(evidence,'No live card with undisplayed tags was found');await edit('tags',[evidence.hidden]);
    await wait(browser,tab,`(()=>{const a=[...document.querySelectorAll('article a[data-a-target="preview-card-channel-link"]')].find(a=>new URL(a.href).pathname.slice(1).toLowerCase()===${JSON.stringify(evidence.login)});return a?.closest('[data-hexstream-card]')?.getAttribute('data-hexstream-hidden')==='true';})()`,'Actual hidden Twitch tag did not hide its card');
    record('actual Twitch directory hidden-tag filtering verified');
    await reset();
    return {browser:browser.name,version:browser.version,checks,liveEvidence:{completeTagCount:evidence.fullCount,visibleTagCount:evidence.visibleCount,hiddenTagMatchVerified:true},networkErrors:browser.networkErrors||[]};
  } finally {await browser.close();}
}
module.exports={chromeAdapter,firefoxAdapter,wait};
if(require.main===module)(async()=>{const outcomes=[];const adapters=process.env.HEXSTREAM_TEST_BROWSER==='chrome'?[chromeAdapter]:process.env.HEXSTREAM_TEST_BROWSER==='firefox'?[firefoxAdapter]:[firefoxAdapter,chromeAdapter];for(const create of adapters){try{outcomes.push(await run(create));}catch(error){outcomes.push({browser:create===firefoxAdapter?'firefox':'chrome',error:error.message});console.error(error.stack);process.exitCode=1;}}const report=process.env.HEXSTREAM_TEST_REPORT||'browser-verification.json';if(!/^[a-z-]+\.json$/.test(report))throw new Error('Invalid report filename');fs.writeFileSync(path.join(results,report),JSON.stringify(outcomes,null,2));console.log(JSON.stringify(outcomes,null,2));})().catch(error=>{console.error(error.stack);process.exitCode=1;});
