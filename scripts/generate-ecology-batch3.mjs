import fs from 'node:fs';
import { spawn } from 'node:child_process';
const style = 'Mystical nocturnal cosmic tarot world, sculptural stylized realistic game prop, restrained charcoal and silver palette, clearly readable silhouette, complete isolated object, no background objects, no text, no display stand.';
const assets = [
 { id:'silver-grass', title:'银叶草丛', faces:3500, prompt:'One small low tuft of nine broad tapered grass blades radiating from a compact natural root. Gracefully curved blades of different heights, thick solid leaves suitable for low polygon game geometry, dark sage gray surfaces with pale silver edges, simple clean shapes, no flowers, no pot, no ground patch. ' },
 { id:'crystal-spire', title:'月晶尖塔', faces:10000, prompt:'One monumental natural mineral spire formed by a tall six-sided smoky quartz crystal with a pointed tip, two smaller crystals fused at the foot, dark graphite opaque crystal faces, pale icy silver edges and subtle lavender mineral seams, sharply faceted silhouette, broad natural rock footing, no plant stems, no surrounding terrain. ' },
 { id:'weathered-obelisk', title:'星纹方尖碑', faces:13000, prompt:'One tall slender ancient four-sided stone obelisk with a pyramidal pointed top, rectangular tapering shaft, shallow geometric celestial engravings, weathered dark basalt and worn ivory edge chips, a single low square stone footing integrated with the monument, narrow upright silhouette, no writing, no floating elements. ' },
 { id:'broken-colonnade', title:'残星柱廊', faces:16000, prompt:'One compact ruined colonnade with three fluted stone columns of unequal heights in a row, one surviving horizontal lintel bridging the two tallest columns, one fallen column drum at their feet, ancient eroded dark gray limestone with worn silver edges, open gaps between columns, clear structural silhouette, small individual square footings, no surrounding landscape. ' },
 { id:'ancient-astrolabe', title:'古代星盘', faces:16000, prompt:'One ancient weathered armillary sphere instrument with three thick intersecting continuous metal rings around a small central celestial orb, readable generous open spaces between rings, dark aged silver with restrained tarnished bronze edge accents, subtle etched celestial tick marks, tilted rings fixed to a low compact stone socket so the instrument stands upright, robust solid construction, no thin wires, no text. ' },
];
const root = 'output/tripo-p2/ecology-batch3';
fs.mkdirSync(root, { recursive:true });
fs.writeFileSync(`${root}/manifest.json`, JSON.stringify({ model:'P2-20260801', texture_size:1024, assets:assets.map(a=>({...a,prompt:a.prompt+style})) },null,2));
function run(args, log) {
 return new Promise((resolve,reject) => {
  const child = spawn('tripo',args,{env:{...process.env,HTTPS_PROXY:'http://127.0.0.1:7897',HTTP_PROXY:'http://127.0.0.1:7897'}});
  let stdout=''; const stream=fs.createWriteStream(log);
  child.stdout.on('data',b=>stdout+=b); child.stderr.pipe(stream); child.on('error',reject);
  child.on('close',code=>{stream.end();if(code)reject(Error(`${code}: ${stdout}`));else{try{resolve(JSON.parse(stdout.trim()));}catch{reject(Error(stdout));}}});
 });
}
function args(a) { return ['make',a.prompt+style,'--model','tripo-p2','-p',`face_limit=${a.faces}`,'-p','texture_quality=standard','-p','pbr=true','--then','convert:format=GLTF,texture_size=1024','--name',`ecology-${a.id}-p2`,'--out',`${root}/${a.id}`,'--no-open','--json','--yes']; }
for(const a of assets) {
 const plan=await run([...args(a),'--dry-run'],`${root}/${a.id}-plan.log`);
 if(!plan.valid)throw Error(JSON.stringify(plan));
 fs.writeFileSync(`${root}/${a.id}-plan.json`,JSON.stringify(plan,null,2));
}
console.log('Validated five P2 plans.');
const pending=[...assets];
async function worker() {
 while(pending.length) {
  const a=pending.shift(); const resultPath=`${root}/${a.id}-result.json`;
  try {
   let result;
   if(fs.existsSync(resultPath)) result=JSON.parse(fs.readFileSync(resultPath,'utf8'));
   else {
    console.log(`Generating ${a.id}`);
    result=await run(args(a),`${root}/${a.id}.log`);
    fs.writeFileSync(resultPath,JSON.stringify(result,null,2));
   }
   if(result.status!=='success')throw Error(`Task ${result.task_id}: ${result.status}`);
   let modelFile=result.model_file;
   if(!modelFile || !fs.existsSync(modelFile)) {
    console.log(`Recovering download for ${a.id}`);
    const recovered=await run(['task','get',result.task_id,'--download','-o',`${root}/${a.id}/recovered`,'--no-open','--json'],`${root}/${a.id}-download.log`);
    modelFile=recovered.model_file ?? recovered.files?.find(f=>f.endsWith('.glb'));
   }
   if(!modelFile || !fs.existsSync(modelFile))throw Error(`Missing model for ${result.task_id}`);
   fs.copyFileSync(modelFile,`public/assets/ecology/${a.id}.glb`);
   console.log(`Saved ${a.id}; ${result.credits_consumed} credits`);
  } catch(error) { console.error(a.id,error.message); process.exitCode=1; }
 }
}
await Promise.all([worker(),worker()]);
