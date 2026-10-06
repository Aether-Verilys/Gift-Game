import fs from 'node:fs';
import { spawn } from 'node:child_process';
const style = 'Mystical nocturnal cosmic tarot world, sculptural stylized realistic game prop, restrained charcoal and silver palette, clearly readable silhouette, complete isolated object, no background objects, no text, no display stand.';
const assets = [
 { id:'walkable-planet', title:'旅途主星球', faces:16000, prompt:'One complete perfectly round spherical rocky planet, a mathematically smooth continuous ball silhouette, equal diameter on all three axes. Low-relief moonlike geology: broad quiet charcoal gray basalt plains, shallow small craters, subtle weathered silver mineral veins and sparse dark gray plate boundaries. Terrain details mostly painted and normal mapped; very shallow relief only, no tall mountains or deep holes. Matte rough stone, diffuse mid gray highlights, restrained monochrome palette. Entire sphere fully visible, seamless terrain across all sides, a solid closed sphere with no cutaway, no rings, no base, no pedestal, no atmosphere shell, no buildings, no plants, no text. Designed as a small walkable world for a mystical cosmic tarot game. ' },
];
const root = 'output/tripo-p2/walkable-planet';
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
console.log('Validated walkable planet P2 plan.');
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
await worker();
