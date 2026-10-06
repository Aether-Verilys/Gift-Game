import fs from 'node:fs';
import { spawn } from 'node:child_process';

const style = 'Mystical nocturnal cosmic tarot world, sculptural stylized realistic game prop, restrained charcoal and silver palette, clearly readable silhouette, complete isolated object, no background objects, no text, no display stand.';
const assets = [
  {
    id: 'surface-monolith', title: '地表黑曜碑', faces: 9000,
    prompt: 'One solitary tall monolithic basalt marker, a broad rectangular stone slab with a slightly tapered body, chipped asymmetrical top, shallow vertical celestial grooves and a few pale silver mineral seams, heavy grounded base, clean readable silhouette, no letters, no pedestal. ',
  },
  {
    id: 'impact-crater', title: '浅陨石坑', faces: 12000,
    prompt: 'One compact shallow lunar impact crater as a complete low circular terrain prop, broad uneven raised rim, gently depressed center, layered charcoal gray regolith and pale silver fractured edge bands, closed underside and stable flat bottom for placement, no landscape around it, no rocks outside the crater. ',
  },
  {
    id: 'star-beacon', title: '星际信标', faces: 10000,
    prompt: 'One compact alien star beacon tower, a narrow faceted dark metal mast with a small pointed antenna, two short support fins and one thin circular signal ring around its upper section, pale silver edge wear, stable integrated foot, solid readable geometry, no floating parts, no text. ',
  },
  {
    id: 'standing-stone-ring', title: '环形立石', faces: 15000,
    prompt: 'One complete circular arrangement of seven unequal weathered standing stones around a shallow engraved central glyph plate, each stone is a chunky dark basalt slab with worn silver edges, open gaps between stones, cohesive single ruin prop with a stable grounded underside, no surrounding terrain, no letters. ',
  },
  {
    id: 'ruined-stair', title: '断裂星阶', faces: 15000,
    prompt: 'One compact fragment of an ancient ruined stone staircase, six uneven broad steps climbing toward a broken empty doorway frame, chipped dark basalt blocks with pale silver worn edges, asymmetrical collapsed side stones, sturdy connected geometry and flat grounded base, no surrounding landscape, no text. ',
  },
];

const root = 'output/tripo-p2/ecology-batch4';
fs.mkdirSync(root, { recursive: true });
fs.writeFileSync(`${root}/manifest.json`, JSON.stringify({
  model: 'P2-20260801', texture_size: 1024,
  assets: assets.map(a => ({ ...a, prompt: a.prompt + style })),
}, null, 2));

function run(args, log) {
  return new Promise((resolve, reject) => {
    const child = spawn('tripo', args, {
      env: { ...process.env, HTTPS_PROXY: 'http://127.0.0.1:7897', HTTP_PROXY: 'http://127.0.0.1:7897' },
    });
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

function args(a) {
  return [
    'make', a.prompt + style,
    '--model', 'tripo-p2',
    '-p', `face_limit=${a.faces}`,
    '-p', 'texture_quality=standard',
    '-p', 'pbr=true',
    '--then', 'convert:format=GLTF,texture_size=1024',
    '--name', `ecology-${a.id}-p2`,
    '--out', `${root}/${a.id}`,
    '--no-open', '--json', '--yes',
  ];
}

for (const a of assets) {
  const plan = await run([...args(a), '--dry-run'], `${root}/${a.id}-plan.log`);
  if (!plan.valid) throw new Error(JSON.stringify(plan));
  fs.writeFileSync(`${root}/${a.id}-plan.json`, JSON.stringify(plan, null, 2));
}
console.log('Validated five P2 plans.');

const pending = [...assets];
async function worker() {
  while (pending.length) {
    const a = pending.shift();
    const resultPath = `${root}/${a.id}-result.json`;
    try {
      let result;
      if (fs.existsSync(resultPath)) result = JSON.parse(fs.readFileSync(resultPath, 'utf8'));
      else {
        console.log(`Generating ${a.id}`);
        result = await run(args(a), `${root}/${a.id}.log`);
        fs.writeFileSync(resultPath, JSON.stringify(result, null, 2));
      }
      if (result.status !== 'success') throw new Error(`Task ${result.task_id}: ${result.status}`);
      let modelFile = result.model_file;
      if (!modelFile || !fs.existsSync(modelFile)) {
        console.log(`Recovering download for ${a.id}`);
        const recovered = await run([
          'task', 'get', result.task_id, '--download', '-o', `${root}/${a.id}/recovered`, '--no-open', '--json',
        ], `${root}/${a.id}-download.log`);
        modelFile = recovered.model_file ?? recovered.files?.find(f => f.endsWith('.glb'));
      }
      if (!modelFile || !fs.existsSync(modelFile)) throw new Error(`Missing model for ${result.task_id}`);
      fs.copyFileSync(modelFile, `public/assets/ecology/${a.id}.glb`);
      console.log(`Saved ${a.id}; ${result.credits_consumed} credits`);
    } catch (error) {
      console.error(a.id, error.message);
      process.exitCode = 1;
    }
  }
}

await Promise.all([worker(), worker()]);
