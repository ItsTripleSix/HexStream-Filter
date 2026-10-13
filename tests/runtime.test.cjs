const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
function background() {
  let listener,stored={},fail=false;
  const api={runtime:{id:'test-extension',onMessage:{addListener(value){listener=value;}}},storage:{local:{async get(){return structuredClone(stored);},async set(value){if(fail){fail=false;throw new Error('Storage unavailable');}stored=structuredClone(value);}}}};
  const context=vm.createContext({browser:api,console});
  for(const name of ['vendor/re2js.js','core/rules.js','background.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../src',name),'utf8'),context);
  return {call(message,sender={id:'test-extension'}){return new Promise(resolve=>{if(!listener(message,sender,resolve))resolve(null);});},failNextWrite(){fail=true;}};
}
test('simultaneous rule additions serialize without losing another tab’s edit',async()=>{const bg=background();const results=await Promise.all(Array.from({length:50},(_,i)=>bg.call({type:'addRule',field:'tags',rule:'SampleTag'+i})));assert(results.every(result=>result.ok));const state=await bg.call({type:'getSettings'});assert.equal(state.value.tags.length,50);assert.equal(state.value.revision,50);});
test('stale editor replacement cannot overwrite newer rules',async()=>{const bg=background();await bg.call({type:'addRule',field:'tags',rule:'SampleTag'});const result=await bg.call({type:'replaceSettings',expectedRevision:0,settings:{tags:[]}});assert.equal(result.ok,false);assert.match(result.error,/another tab/);assert.equal((await bg.call({type:'getSettings'})).value.tags.length,1);});
test('failed storage write does not poison following operations',async()=>{const bg=background();bg.failNextWrite();assert.equal((await bg.call({type:'addRule',field:'tags',rule:'SampleTag'})).ok,false);assert.equal((await bg.call({type:'addRule',field:'tags',rule:'AnotherTag'})).ok,true);assert.deepEqual(JSON.parse(JSON.stringify((await bg.call({type:'getSettings'})).value.tags)),['AnotherTag']);});
test('other extension senders cannot read or mutate rules',async()=>{const bg=background();assert.equal(await bg.call({type:'getSettings'},{id:'other-extension'}),null);assert.equal(await bg.call({type:'addRule',field:'tags',rule:'SampleTag'},{}),null);});
test('invalid lists and regexes never replace a working setting',async()=>{const bg=background();await bg.call({type:'addRule',field:'tags',rule:'SampleTag'});for(const rule of [' /[invalid/ ',' /foo(?=bar)/ '])assert.equal((await bg.call({type:'replaceSettings',expectedRevision:1,settings:{tags:[rule]}})).ok,false);assert.equal((await bg.call({type:'getSettings'})).value.tags[0],'SampleTag');});
test('duplicate addition is idempotent and does not bump revision',async()=>{const bg=background();await bg.call({type:'addRule',field:'tags',rule:'SampleTag'});const next=await bg.call({type:'addRule',field:'tags',rule:'SampleTag'});assert.equal(next.value.changed,false);assert.equal(next.value.revision,1);});
test('unknown requests and list names are rejected',async()=>{const bg=background();assert.equal((await bg.call({type:'executeCode'})).ok,false);assert.equal((await bg.call({type:'addRule',field:'__proto__',rule:'SampleTag'})).ok,false);});
test('bridge observes only the exact HTTPS Twitch metadata endpoint and preserves fetch return identity',async()=>{
  const messages=[],listeners={},responses=[];
  function Request(url){this.url=url;}
  function XHR(){}XHR.prototype.open=function(){};XHR.prototype.send=function(){};
  const window={fetch(input){const response={ok:true,url:String(input),headers:{get(){return null;}},clone(){return{text:async()=>JSON.stringify({data:{stream:{broadcaster:{id:'101',login:'sample_channel'},freeformTags:[{name:'HiddenFixtureTag'}],token:'PRIVATE_SENTINEL'}}})};}};const promise=Promise.resolve(response);responses.push(promise);return promise;},postMessage(message){messages.push(message);},addEventListener(type,listener){listeners[type]=listener;}};
  const context=vm.createContext({window,location:{origin:'https://www.twitch.tv',href:'https://www.twitch.tv/directory'},URL,XMLHttpRequest:XHR,console,Request});
  for(const file of ['core/metadata.js','bridge.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../src',file),'utf8'),context);
  for(const url of ['https://evil.invalid/gql','https://gql.twitch.tv.evil.invalid/gql','http://gql.twitch.tv/gql','https://gql.twitch.tv/other'])assert.equal(window.fetch(url),responses.at(-1));
  await new Promise(resolve=>setImmediate(resolve));assert.equal(messages.length,0);
  const result=window.fetch('https://gql.twitch.tv/gql');assert.equal(result,responses.at(-1));await new Promise(resolve=>setImmediate(resolve));assert.equal(messages.length,1);assert.equal(messages[0].items[0].tags[0],'HiddenFixtureTag');assert(!JSON.stringify(messages).includes('PRIVATE_SENTINEL'));
});
