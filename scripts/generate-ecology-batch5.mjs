import fs from 'node:fs';
import { spawn } from 'node:child_process';

const asset = {
  id: 'toppled-statue',
  title: '倒落星像',
  faces: 12000,
  prompt: 'One complete toppled fragment of an ancient humanoid stone statue: a large weathered head with a partial neck and broken shoulder base, serene abstract facial planes without readable writing, asymmetrical chipped crown and cheek, dark charcoal basalt with worn pale silver edges and subtle crater scars, compact grounded fragment suitable for half burial, solid connected geometry, no pedestal, no surrounding landscape, no text. Mystical nocturnal cosmic tarot world, sculptural stylized realistic game prop, restrained charcoal and silver palette, clearly readable silhouette, complete isolated object, no background objects, no display stand.',
};
const root = 'output/tripo-p2/ecology-batch5';
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
  return ['make', asset.prompt, '--model', 'tripo-p2', '-p', `face_limit=${asset.faces}`, '-p', 'texture_quality=standard', '-p', 'pbr=true', '--then', 'convert:format=GLTF,texture_size=1024', '--name', 'ecology-toppled-statue-p2', '--out', `${root}/${asset.id}`, '--no-open', '--json', '--yes'];
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
