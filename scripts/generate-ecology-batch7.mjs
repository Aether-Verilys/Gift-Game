import fs from 'node:fs';
import { spawn } from 'node:child_process';

const asset = {
  id: 'crystal-spire',
  title: '月晶尖塔（白模重制）',
  faces: 12000,
  prompt: 'One elegant monumental lunar crystal spire as a single complete isolated game prop: a tall asymmetric spear-like hexagonal prism with a clean sharp tip, three broad controlled crystal facets, one gently twisted secondary facet, and two smaller fused shards forming a deliberate balanced base. Strong readable silhouette, graceful tapered proportions, crisp planar edges, subtle stepped crystal growth lines modeled into the geometry, matte charcoal and pale silver monochrome material, simple dark-to-light facet contrast, no colorful surface texture, no UV textures, no PBR maps. Stable wide closed base, solid connected geometry, no messy rubble, no large rock mound, no flowers, no plants, no surrounding terrain, no floating pieces, no pedestal, no letters, no text. Mystical nocturnal cosmic tarot world, sculptural stylized realistic low-poly game asset, visually striking from a distance, complete isolated object, no background objects.',
};
const root = 'output/tripo-p2/ecology-batch7';
fs.mkdirSync(root, { recursive: true });
fs.writeFileSync(`${root}/manifest.json`, JSON.stringify({ model: 'P2-20260801', texture_size: null, texture: false, pbr: false, assets: [asset] }, null, 2));
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
  return ['make', asset.prompt, '--model', 'tripo-p2', '-p', `face_limit=${asset.faces}`, '-p', 'texture=false', '-p', 'pbr=false', '--then', 'convert:format=GLTF', '--name', 'ecology-crystal-spire-bare-p2', '--out', `${root}/${asset.id}`, '--no-open', '--json', '--yes'];
}
const plan = await run([...args(), '--dry-run'], `${root}/${asset.id}-plan.log`);
if (!plan.valid) throw new Error(JSON.stringify(plan));
fs.writeFileSync(`${root}/${asset.id}-plan.json`, JSON.stringify(plan, null, 2));
console.log('Validated bare-geometry P2 plan.');
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
