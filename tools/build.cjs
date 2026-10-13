const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'src/manifest.json')));
// Keep the shipped library identical to the pinned dependency, including its upstream notices.
const re2Build = path.dirname(require.resolve('re2js'));
if (!fs.readFileSync(path.join(re2Build,'index.umd.js')).equals(fs.readFileSync(path.join(root,'src/vendor/re2js.js')))) throw new Error('Vendored regex engine differs from the pinned dependency.');
if (!fs.readFileSync(path.join(re2Build,'../LICENSE')).equals(fs.readFileSync(path.join(root,'src/vendor/RE2JS-LICENSE.txt')))) throw new Error('Regex engine license is missing or changed.');
// Stored ZIPs keep packaging dependency-free and deterministic.
function crc32(bytes) { let crc = -1; for (const byte of bytes) { crc ^= byte; for (let n = 0; n < 8; n++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0); } return (crc ^ -1) >>> 0; }
function zip(entries) {
  const local = [], central = []; let offset = 0;
  for (const [name, bytes] of entries) {
    const filename = Buffer.from(name), crc = crc32(bytes), head = Buffer.alloc(30), record = Buffer.alloc(46);
    head.writeUInt32LE(0x04034b50); head.writeUInt16LE(20,4); head.writeUInt16LE(0x800,6); head.writeUInt16LE(0x5c21,12); head.writeUInt32LE(crc,14); head.writeUInt32LE(bytes.length,18); head.writeUInt32LE(bytes.length,22); head.writeUInt16LE(filename.length,26);
    record.writeUInt32LE(0x02014b50); record.writeUInt16LE(20,4); record.writeUInt16LE(20,6); record.writeUInt16LE(0x800,8); record.writeUInt16LE(0x5c21,14); record.writeUInt32LE(crc,16); record.writeUInt32LE(bytes.length,20); record.writeUInt32LE(bytes.length,24); record.writeUInt16LE(filename.length,28); record.writeUInt32LE(offset,42);
    local.push(head,filename,bytes); central.push(record,filename); offset += head.length + filename.length + bytes.length;
  }
  const directory = Buffer.concat(central), end = Buffer.alloc(22); end.writeUInt32LE(0x06054b50); end.writeUInt16LE(entries.length,8); end.writeUInt16LE(entries.length,10); end.writeUInt32LE(directory.length,12); end.writeUInt32LE(offset,16);
  return Buffer.concat([...local,directory,end]);
}
function entries(dir, prefix = '') { return fs.readdirSync(dir, {withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name)).flatMap(entry => entry.isDirectory() ? entries(path.join(dir,entry.name),prefix+entry.name+'/') : [[prefix+entry.name,fs.readFileSync(path.join(dir,entry.name))]]); }
for (const browser of ['firefox','chrome']) {
  const target = path.resolve(root,'dist',browser), dist = path.resolve(root,'dist');
  if (path.dirname(target) !== dist || !['firefox','chrome'].includes(path.basename(target))) throw new Error('Refusing to replace a directory outside the generated browser output.');
  if ((fs.existsSync(dist) && fs.lstatSync(dist).isSymbolicLink()) || (fs.existsSync(target) && fs.lstatSync(target).isSymbolicLink())) throw new Error('Generated output cannot be a symbolic link.');
  fs.rmSync(target,{recursive:true,force:true}); fs.mkdirSync(target,{recursive:true});
  for (const [name,bytes] of entries(path.join(root,'src'))) { if (name === 'bridge.js') continue; const file = path.join(target,name); fs.mkdirSync(path.dirname(file),{recursive:true}); fs.writeFileSync(file,bytes); }
  // Distinct script paths are required when the same helper is used in MAIN and ISOLATED worlds.
  fs.writeFileSync(path.join(target,'bridge.bundle.js'),fs.readFileSync(path.join(root,'src/core/metadata.js'),'utf8')+'\n'+fs.readFileSync(path.join(root,'src/bridge.js'),'utf8'));
  const browserManifest = structuredClone(manifest);
  if (browser === 'chrome') { delete browserManifest.browser_specific_settings; browserManifest.background = {service_worker:'background.js'}; browserManifest.minimum_chrome_version = '120'; }
  fs.writeFileSync(path.join(target,'manifest.json'),JSON.stringify(browserManifest,null,2)+'\n');
  fs.copyFileSync(path.join(root,'LICENSE'),path.join(target,'LICENSE'));
  fs.copyFileSync(path.join(root,'CREDITS.md'),path.join(target,'CREDITS.md'));
  fs.mkdirSync(path.join(root,'artifacts'),{recursive:true});
  const name = `HexStream-Filter-${manifest.version}-${browser}.zip`;
  fs.writeFileSync(path.join(root,'artifacts',name),zip(entries(target))); console.log(name);
}
