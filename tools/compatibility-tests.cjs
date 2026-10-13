const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromeAdapter,firefoxAdapter,wait}=require('./browser-tests.cjs');
const R=require('../src/core/rules.js');
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function run(create) {
  const b=await create(),checks=[],views=[];
  const record=name=>{checks.push(name);console.log(b.name+': '+name);};
  try {
    const tab=await b.newPage(),editor=await b.newPage();await b.goto(editor,b.base+'/ui/options.html');
    await wait(b,editor,'!!document.getElementById("rules")','Options not loaded');
    async function settings(changes={}) {
      const result=await b.eval(editor,`(async()=>{const api=globalThis.browser||globalThis.chrome;const current=await api.runtime.sendMessage({type:'getSettings'});return api.runtime.sendMessage({type:'replaceSettings',expectedRevision:current.value.revision,settings:${JSON.stringify({...R.defaults(),...changes})}});})()`);
      assert(result.ok,'Settings rejected');await pause(180);
    }
    await b.goto(tab,'https://www.twitch.tv/hexstream-test/');await pause(300);
    await settings({channels:Array.from({length:10000},(_,i)=>'fictional_channel_'+i)});
    const perf=await b.eval(tab,`(async()=>{
      const main=document.querySelector('main');main.innerHTML=Array.from({length:500},(_,i)=>'<article><a data-a-target="preview-card-channel-link" href="/fictional_channel_'+i+'">Fictional channel</a><h4>Fictional game time</h4><span class="tw-tag">FictionalTag</span></article>').join('');
      const began=performance.now();await new Promise((resolve,reject)=>{const observer=new MutationObserver(()=>{if(document.querySelectorAll('[data-hexstream-hidden]').length===500){clearTimeout(deadline);observer.disconnect();resolve();}});const deadline=setTimeout(()=>{observer.disconnect();reject(new Error('500-card scan timed out'));},15000);observer.observe(main,{subtree:true,attributes:true,attributeFilter:['data-hexstream-hidden']});});
      const initialMilliseconds=performance.now()-began;
      const outside=document.createElement('section');document.body.append(outside);await new Promise(r=>setTimeout(r,180));
      let transitions=0;const observer=new MutationObserver(changes=>transitions+=changes.length);observer.observe(main,{subtree:true,attributes:true,attributeFilter:['data-hexstream-hidden']});
      try {for(let i=0;i<10;i++){outside.textContent='Player clock '+i;await new Promise(r=>setTimeout(r,100));}return {cards:500,exactRules:10000,initialMilliseconds:Math.round(initialMilliseconds*10)/10,unrelatedUpdates:10,visibilityTransitions:transitions};}finally{observer.disconnect();}
    })()`);
    assert.equal(perf.visibilityTransitions,0);record('500 cards with 10,000 exact rules remain stable during unrelated player updates');
    await settings();
    const routes=[['home','https://www.twitch.tv/'],['categories','https://www.twitch.tv/directory'],['search','https://www.twitch.tv/search?term=fortnite'],['following-signed-out','https://www.twitch.tv/directory/following'],['live-category','https://www.twitch.tv/directory/category/fortnite'],['category-clips','https://www.twitch.tv/directory/category/fortnite/clips'],['category-videos','https://www.twitch.tv/directory/category/fortnite/videos/all']];
    for(const [view,url] of routes) {
      await b.goto(tab,url);await pause(4000);
      if(view==='following-signed-out'){views.push({view,authenticatedCoverage:false});record('signed-out Following loads; account-only content remains unverified');continue;}
      await wait(b,tab,'document.querySelectorAll("[data-hexstream-card]").length>5','No cards recognized in '+view);
      const snapshot=await b.eval(tab,`(()=>{const tiles=[...document.querySelectorAll('.game-card')].filter(c=>c.closest('[data-hexstream-card]'));const side=document.querySelectorAll('.side-nav-card[data-hexstream-card],[data-a-target="side-nav-card"][data-hexstream-card]');return{tiles:tiles.length,sidebar:side.length,controlled:document.querySelectorAll('[data-hexstream-card]').length,externalHelpControlled:[...document.querySelectorAll('article[data-hexstream-card]')].filter(c=>{const a=c.querySelector('a[href]');return a&&new URL(a.href).origin!==location.origin;}).length};})()`);
      assert.equal(snapshot.externalHelpControlled,0,'External help was treated as a card');views.push({view,...snapshot});
      if(view==='categories') {
        assert(snapshot.tiles>5,'Current category tiles were missed');
        const value=await b.eval(tab,`(()=>{const c=[...document.querySelectorAll('.game-card')].find(c=>c.closest('[data-hexstream-card]'));return{name:c.querySelector('h2').textContent.trim(),path:new URL(c.querySelector('a[href]').href).pathname};})()`);await settings({categories:[R.literalRule(value.name)]});
        await wait(b,tab,`[...document.querySelectorAll('.game-card a[href]')].some(a=>new URL(a.href).pathname===${JSON.stringify(value.path)}&&a.closest('[data-hexstream-hidden]'))`,'Category rule missed tile');record('live category tiles obey category rules');
      } else if(view==='category-clips'||view==='category-videos') {
        const value=await b.eval(tab,`(()=>{const h=[...document.querySelectorAll('article h4')].find(h=>h.closest('[data-hexstream-card]'));return h?{title:h.textContent.trim(),path:new URL(h.closest('article').querySelector('a[data-a-target="preview-card-image-link"]').href).pathname}:null;})()`);assert(value?.title,'No media title found');await settings({titles:[R.literalRule(value.title)]});
        await wait(b,tab,`[...document.querySelectorAll('[data-hexstream-hidden] a[data-a-target="preview-card-image-link"]')].some(a=>new URL(a.href).pathname===${JSON.stringify(value.path)})`,'Media title rule missed card');record('live '+view+' titles filter without borrowing stream tags');
      } else {
        const evidence=await b.eval(tab,`(()=>{const c=[...document.querySelectorAll('article,[data-a-target="search-result-live-channel"]')].find(c=>c.closest('[data-hexstream-card]')||c.hasAttribute('data-hexstream-card'));const a=c?.querySelector('a[data-a-target="preview-card-channel-link"]')||c?.querySelector('a[href]');if(!a)return null;const login=new URL(a.href).pathname.split('/')[1].toLowerCase();const record=window.__hexstreamTestPackets.findLast(p=>p.login===login&&p.fullTags);const visible=[...c.querySelectorAll('.tw-tag,[data-a-target="tag"],[data-test-selector="Tag"]')].map(t=>t.textContent.trim());return{login,tag:record?.tags.find(t=>!visible.includes(t))};})()`);
        assert(evidence?.login,'No stream identity found');await settings({channels:[evidence.login]});
        await wait(b,tab,'document.querySelectorAll("[data-hexstream-hidden]").length>0','Channel rule missed '+view);record('live '+view+' channel filtering');
        if(evidence.tag){await settings({tags:[R.literalRule(evidence.tag)]});await wait(b,tab,'document.querySelectorAll("[data-hexstream-hidden]").length>0','Hidden tag missed '+view);record('live '+view+' undisplayed tag filtering');views.at(-1).hiddenTagVerified=true;}
        if(view==='home') {
          assert(snapshot.sidebar>0,'Current sidebar rows were missed');
          const login=await b.eval(tab,`(()=>{const c=document.querySelector('.side-nav-card[data-hexstream-card],[data-a-target="side-nav-card"][data-hexstream-card]');const a=c.matches('a')?c:c.querySelector('a[href]');return new URL(a.href).pathname.split('/')[1];})()`);
          await settings({channels:[login]});await wait(b,tab,'document.querySelectorAll(".side-nav-card[data-hexstream-hidden],[data-a-target=side-nav-card][data-hexstream-hidden]").length>0','Sidebar channel rule missed');record('live sidebar channel filtering');
        }
      }
      await settings();await wait(b,tab,'document.querySelectorAll("[data-hexstream-hidden]").length===0','Clearing audit rules did not restore cards');
    }
    return {browser:b.name,version:b.version,checks,views,performance:perf};
  } finally {await b.close();}
}
(async()=>{const outcomes=[];for(const create of process.env.HEXSTREAM_TEST_BROWSER==='chrome'?[chromeAdapter]:process.env.HEXSTREAM_TEST_BROWSER==='firefox'?[firefoxAdapter]:[firefoxAdapter,chromeAdapter]){try{outcomes.push(await run(create));}catch(error){outcomes.push({browser:create===firefoxAdapter?'firefox':'chrome',error:error.message});console.error(error.stack);process.exitCode=1;}}fs.writeFileSync(path.resolve(__dirname,'../test-results/compatibility-verification.json'),JSON.stringify(outcomes,null,2));console.log(JSON.stringify(outcomes,null,2));})().catch(error=>{console.error(error.stack);process.exitCode=1;});
