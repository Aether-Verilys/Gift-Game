import fs from 'node:fs';
import { spawn } from 'node:child_process';

const asset = {
  id: 'sacred-colossus-base',
  title: '神圣巨像底座',
  faces: 16000,
  prompt: 'One complete sacred monumental pedestal for a towering humanoid cosmic tarot colossus. A broad grounded multi-tier octagonal plinth with concentric stepped terraces, four cardinal buttresses, carved celestial geometric reliefs, inset pale silver metal inlay channels, small restrained luminous accents, dark charcoal basalt and obsidian stone with worn ivory-silver edges, complex ceremonial silhouette readable from a distance, stable flat closed underside for placement, solid connected geometry, no statue, no humanoid figure, no surrounding terrain, no floating pieces, no letters, no readable writing, no display stand. Mystical nocturnal cosmic tarot world, sculptural stylized realistic game prop, restrained charcoal silver and faint crimson palette, isolated complete object, no background objects.',
};
const root = 'output/tripo-p2/ecology-batch6';
fs.mkdirSync(root, { recursive: true });
fs.writeFileSync(`${root}/manifest.json`, JSON.stringify({ model: 'P2-20260801', texture_size: 1024, assets: [asset] }, null, 2));
function run(args, log) {
  return new Promise((resolve, reject) => {
    const child = spawn('tripo', args, { env: { ...process.env, HTTPS_PROXY: 'http://127.0.0.1:7897', HTTP_PROXY: 'http://127.0.0.1:7897' } });
    let stdout = '';
    const stream = fs.createWriteStream(log);
    child.stdout.on('data', b => { stdout += b; });
    child.stderr.pipe(stream);
    child.on('error', reject);
    child.on('close', code => {
      stream.end();
      if (code) return reject(new Error(`${code}: ${stdout}`));
      try { resolve(JSON.parse(stdout.trim())); } catch { reject(new Error(stdout)); }
    });
  });
}
function args() {
  return ['make', asset.prompt, '--model', 'tripo-p2', '-p', `face_limit=${asset.faces}`, '-p', 'texture_quality=standard', '-p', 'pbr=true', '--then', 'convert:format=GLTF,texture_size=1024', '--name', 'ecology-sacred-colossus-base-p2', '--out', `${root}/${asset.id}`, '--no-open', '--json', '--yes'];
}
const plan = await run([...args(), '--dry-run'], `${root}/${asset.id}-plan.log`);
if (!plan.valid) throw new Error(JSON.stringify(plan));
fs.writeFileSync(`${root}/${asset.id}-plan.json`, JSON.stringify(plan, null, 2));
console.log('Validated P2 plan.');
const result = await run(args(), `${root}/${asset.id}.log`);
fs.writeFileSync(`${root}/${asset.id}-result.json`, JSON.stringify(result, null, 2));
if (result.status !== 'success') throw new Error(`Task ${result.task_id}: ${result.status}`);
let modelFile = result.model_file;
if (!modelFile || !fs.existsSync(modelFile)) {
  const recovered = await run(['task', 'get', result.task_id, '--download', '-o', `${root}/${asset.id}/recovered`, '--no-open', '--json'], `${root}/${asset.id}-download.log`);
  modelFile = recovered.model_file ?? recovered.files?.find(f => f.endsWith('.glb'));
}
if (!modelFile || !fs.existsSync(modelFile)) throw new Error(`Missing model for ${result.task_id}`);
fs.copyFileSync(modelFile, `public/assets/ecology/${asset.id}.glb`);
console.log(`Saved ${asset.id}; ${result.task_id}; ${result.credits_consumed} credits`);
