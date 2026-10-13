const {spawn} = require('node:child_process');
const fs = require('node:fs');
const net = require('node:net');
const path = require('node:path');
async function launchFirefox() {
  const server = net.createServer(); await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const port = server.address().port; await new Promise(resolve=>server.close(resolve));
  const profile = fs.mkdtempSync(path.join(require('node:os').tmpdir(),'hexstream-firefox-test-'));
  const extensionUUID = '34abae29-8670-44f4-b594-44745ec65216';
  fs.writeFileSync(path.join(profile,'user.js'), 'user_pref("extensions.webextensions.uuids", ' + JSON.stringify(JSON.stringify({'hexstream-filter@itstriplesix.github.io':extensionUUID})) + ');\nuser_pref("browser.shell.checkDefaultBrowser", false);\nuser_pref("browser.startup.homepage_override.mstone", "ignore");\n');
  const child = spawn(process.env.FIREFOX_BINARY || 'C:/Program Files/Mozilla Firefox/firefox.exe', ['--headless','--no-remote','--profile',profile,'--remote-debugging-port',String(port)], {windowsHide:true,env:{...process.env,MOZ_HEADLESS:'1',MOZ_REMOTE_ALLOW_SYSTEM_ACCESS:'1'}});
  let stderr=''; child.stderr.on('data',chunk=>stderr+=chunk);
  child.on('error',()=>{});
  const pending = new Map(); let counter=0, ws;
  for (let attempt=0;attempt<100;attempt++) {
    try { ws = await new Promise((resolve,reject)=>{const socket=new WebSocket(`ws://127.0.0.1:${port}/session`);socket.addEventListener('open',()=>resolve(socket),{once:true});socket.addEventListener('error',reject,{once:true});}); break; }
    catch { if (child.exitCode !== null) throw new Error('Test Firefox exited: '+stderr.slice(-800)); await new Promise(resolve=>setTimeout(resolve,100)); }
  }
  if (!ws) {child.kill();throw new Error('Could not connect to isolated Firefox.');}
  const listeners = new Map();
  ws.addEventListener('message',event=>{const message=JSON.parse(event.data);if(message.id){const entry=pending.get(message.id);if(entry){clearTimeout(entry.timer);pending.delete(message.id);message.type==='error'?entry.reject(new Error(message.error+': '+message.message)):entry.resolve(message.result);}}else for(const listener of listeners.get(message.method)||[])listener(message.params);});
  function command(method,params={}) {return new Promise((resolve,reject)=>{const id=++counter;const timer=setTimeout(()=>{pending.delete(id);reject(new Error(method+' timed out'));},45000);pending.set(id,{resolve,reject,timer});ws.send(JSON.stringify({id,method,params}));});}
  async function evaluate(context,expression) {const result=await command('script.evaluate',{expression:`(async()=>JSON.stringify(await (${expression})))()`,target:{context},awaitPromise:true});if(result.type==='exception')throw new Error(result.exceptionDetails.text);return result.result.type==='undefined'?undefined:JSON.parse(result.result.value);}
  const session = await command('session.new',{capabilities:{alwaysMatch:{acceptInsecureCerts:false}}});
  return {command,evaluate,version:session.capabilities.browserVersion,profile,extensionOrigin:'moz-extension://'+extensionUUID,on(method,listener){if(!listeners.has(method))listeners.set(method,[]);listeners.get(method).push(listener);},async close(){try{await command('browser.close');}catch{}ws.close();if(child.exitCode===null)await new Promise(resolve=>{const timer=setTimeout(()=>{child.kill();resolve();},5000);child.once('exit',()=>{clearTimeout(timer);resolve();});});}};
}
module.exports={launchFirefox};
