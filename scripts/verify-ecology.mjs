import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const results = [];
for (const name of fs.readdirSync('public/assets/ecology').filter(name => name.endsWith('.glb')).map(name => name.slice(0, -4)).sort()) {
  const file = `public/assets/ecology/${name}.glb`;
  const bytes = fs.readFileSync(file);
  if (bytes.toString('ascii', 0, 4) !== 'glTF') throw Error(`${name}: invalid GLB`);
  const jsonLength = bytes.readUInt32LE(12);
  const gltf = JSON.parse(bytes.toString('utf8', 20, 20 + jsonLength));
  const binary = bytes.subarray(28 + jsonLength);
  let triangles = 0;
  for (const node of gltf.nodes) if (node.mesh !== undefined) for (const primitive of gltf.meshes[node.mesh].primitives) {
    if ((primitive.mode ?? 4) !== 4) throw Error('Non-triangle mesh');
    triangles += gltf.accessors[primitive.indices ?? primitive.attributes.POSITION].count / 3;
  }
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ecology-textures-'));
  const textures = (gltf.images ?? []).map((image, i) => {
    if (image.bufferView === undefined) throw Error('Expected embedded texture');
    const view = gltf.bufferViews[image.bufferView];
    const imageFile = path.join(tmp, `${i}.${image.mimeType === 'image/png' ? 'png' : 'jpg'}`);
    fs.writeFileSync(imageFile, binary.subarray(view.byteOffset ?? 0, (view.byteOffset ?? 0) + view.byteLength));
    const info = execFileSync('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', imageFile], { encoding: 'utf8' });
    const width = Number(info.match(/pixelWidth: (\d+)/)[1]);
    const height = Number(info.match(/pixelHeight: (\d+)/)[1]);
    if (width !== 1024 || height !== 1024) throw Error(`${name}: texture ${width}x${height}`);
    return { width, height, mimeType: image.mimeType };
  });
  fs.rmSync(tmp, { recursive: true });
  if (triangles > 20000) throw Error(`${name}: asset budget failed`);
  results.push({ name, triangles, textures, bytes: bytes.length });
}
fs.writeFileSync('public/assets/ecology/validation.json', JSON.stringify(results, null, 2) + '\n');
console.log(JSON.stringify(results, null, 2));
