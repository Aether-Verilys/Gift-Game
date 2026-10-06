import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import './tripoPreview.css';

const planetAssets = [
  { id: 'walkable-planet', title: '旅途主星球', subtitle: 'WORLD / 14', description: '已接入脚下场景的黑白月球模型；加载失败时保持空白挂载位。' },
  { id: 'external-moon', title: '本地月球候选', subtitle: 'LOCAL / 15', description: 'public/assets/planet/moon.glb 的黑白月球候选，直接查看真实导入效果。' },
];
const batch4Assets = [
  { id: 'surface-monolith', title: '地表黑曜碑', subtitle: 'RUINS / 16', description: '替换地表高耸黑曜碑，保留原位置与清场逻辑。' },
  { id: 'impact-crater', title: '浅陨石坑', subtitle: 'TERRAIN / 17', description: '替换地表陨石坑环，使用低矮可落地模型。' },
  { id: 'star-beacon', title: '星际信标', subtitle: 'RELIC / 18', description: '替换地表信标塔，保留原脉冲环位置。' },
  { id: 'standing-stone-ring', title: '环形立石', subtitle: 'RUINS / 19', description: '替换环形立石遗迹，保留清场与下沉行为。' },
  { id: 'ruined-stair', title: '断裂星阶', subtitle: 'RUINS / 20', description: '替换断阶遗迹，保留原有行进路径上的位置。' },
];
const batch5Assets = [
  { id: 'toppled-statue', title: '倒落星像', subtitle: 'RUINS / 21', description: '替换遗迹末槽的倒落雕像头与残缺肩座，保留清场与下沉行为。' },
];
const batch6Assets = [
  { id: 'sacred-colossus-base', title: '神圣巨像底座', subtitle: 'COLOSSUS / 22', description: '多层八角圣坛、四方扶座与星象浮雕组成的复杂底座，接入巨像遭遇场景。' },
];
const newestAssets = [
  { id: 'silver-grass', title: '银叶草丛', subtitle: 'FLORA / 09', description: '低矮弯曲的银边草叶，适合路径两侧成片分布。' },
  { id: 'crystal-spire', title: '月晶尖塔', subtitle: 'MINERAL / 10', description: '棱面分明的高耸矿晶，为沿途地标补充轮廓。' },
  { id: 'weathered-obelisk', title: '星纹方尖碑', subtitle: 'RUINS / 11', description: '带浅刻星纹与风化边缘的石碑，作为旅途中的古老标记。' },
  { id: 'broken-colonnade', title: '残星柱廊', subtitle: 'RUINS / 12', description: '高低残柱、横梁与倒落柱段，形成开放的遗迹空间。' },
  { id: 'ancient-astrolabe', title: '古代星盘', subtitle: 'RELIC / 13', description: '交错金属环与中央星核，作为半埋星盘遗迹的候选模型。' },
];
const previousAssets = [
  { id: 'crystal-reeds', title: '紫晶芦苇', subtitle: 'FLORA / 04', description: '高低错落的晶体尖端与紧凑根部，适合沿路成簇分布。' },
  { id: 'spiral-fern', title: '螺旋星蕨', subtitle: 'FLORA / 05', description: '卷曲蕨尖与层叠叶片，补充地表植物的横向层次。' },
  { id: 'lantern-plant', title: '垂灯花', subtitle: 'FLORA / 06', description: '弯曲茎秆与琥珀色垂挂种荚，作为路径旁的暖色点缀。' },
  { id: 'moon-rock', title: '月岩簇', subtitle: 'TERRAIN / 07', description: '深色风化岩层与浅色矿脉，适合地表散布。' },
  { id: 'broken-arch', title: '残月拱门', subtitle: 'RUINS / 08', description: '不对称破损的石拱与立柱，保留清晰的通行空间。' },
  { id: 'mushroom', title: '微光菌伞', subtitle: 'FLORA / 01', description: '青绿色菌褶、弯曲菌柄，观察近景植物的细节与轮廓。' },
  { id: 'bird', title: '银羽星燕', subtitle: 'FAUNA / 02', description: '展翼滑翔姿态，观察羽毛层次与远景辨识度。场景中已加入振翅动画。' },
  { id: 'planet', title: '环带行星', subtitle: 'CELESTIAL / 03', description: '银灰岩质球体与宽阔星环，作为远景天体样例。' },
];
// Limit the gallery to one batch per page to avoid accumulating WebGL contexts.
const selectedBatch = new URLSearchParams(location.search).get('batch');
const showPrevious = selectedBatch === 'previous';
const showPlanet = selectedBatch === 'planet';
const showBatch4 = selectedBatch === 'batch4';
const showBatch5 = selectedBatch === 'batch5';
const showBatch6 = selectedBatch === 'batch6';
const assets = showPlanet ? planetAssets : showBatch6 ? batch6Assets : showBatch5 ? batch5Assets : showBatch4 ? batch4Assets : showPrevious ? previousAssets : newestAssets;
document.querySelector('#preview')!.innerHTML = `
<header><span class="eyebrow">GIFT GAME · ASSET STUDY 001—006</span><h1>星际生态<span>生态模型收藏</span></h1><p>Tripo P2 · 每个模型 ≤ 20,000 三角面 · 1K 贴图</p><div class="tools"><a href="/tripo-preview.html?batch=planet" ${showPlanet ? 'aria-current="page"' : ''}>主星球</a><a href="/tripo-preview.html?batch=batch6" ${showBatch6 ? 'aria-current="page"' : ''}>第六批 · 1 件</a><a href="/tripo-preview.html?batch=batch5" ${showBatch5 ? 'aria-current="page"' : ''}>第五批 · 1 件</a><a href="/tripo-preview.html?batch=batch4" ${showBatch4 ? 'aria-current="page"' : ''}>第四批 · 5 件</a><a href="/tripo-preview.html" ${!showPrevious && !showPlanet && !showBatch4 && !showBatch5 && !showBatch6 ? 'aria-current="page"' : ''}>第三批 · 5 件</a><a href="/tripo-preview.html?batch=previous" ${showPrevious ? 'aria-current="page"' : ''}>前两批 · 8 件</a><button id="rotate">暂停旋转</button><button id="light">切换明亮背景</button><a href="/">返回场景</a></div></header>
<main>${assets.map(a => `<article><div class="viewport" id="${a.id}"><span class="loading">加载模型…</span></div><section><span class="eyebrow">${a.subtitle}</span><h2>${a.title}</h2><p>${a.description}</p><div class="stats">正在核验模型…</div>${a.id === 'external-moon' ? '<a href="/assets/planet/moon.glb" download>下载 GLB ↗</a>' : `<a href="/assets/ecology/${a.id}.glb" download>下载 GLB ↗</a>`}</section></article>`).join('')}</main><footer>拖动旋转 · 滚轮缩放 · 右键平移 ｜ ${showPlanet ? '主星球候选与接入预览' : showBatch6 ? '第六批底座已接入巨像' : showBatch5 ? '第五批模型已接入场景' : showBatch4 ? '第四批模型已接入场景' : '场景生态模型'} · 此页为静态资产展示</footer>`;
let autoRotate = true;
let bright = false;
const views: { renderer: THREE.WebGLRenderer; scene: THREE.Scene; camera: THREE.PerspectiveCamera; controls: OrbitControls; element: HTMLElement }[] = [];
for (const a of assets) {
  const element = document.getElementById(a.id)!;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x080c15);
  const camera = new THREE.PerspectiveCamera(36, 1, 0.01, 100);
  camera.position.set(3.3, 2.1, 4.6);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.3;
  // PBR metals need a reflected environment to show their authored surfaces.
  const room = new RoomEnvironment();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(room, 0.04).texture;
  scene.environmentIntensity = 0.6;
  room.dispose();
  pmrem.dispose();
  element.appendChild(renderer.domElement);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.8;
  controls.minDistance = 1.5;
  controls.maxDistance = 14;
  scene.add(new THREE.HemisphereLight(0xc9e1ff, 0x45465c, 2.4));
  for (const [color, intensity, x, y, z] of [[0xffffff, 4, 3, 5, 4], [0x8bd9ff, 3, -4, 2, -3], [0xffd7a7, 1.5, 2, -1, -2]]) {
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(x, y, z); scene.add(light);
  }
  const modelUrl = a.id === 'external-moon'
    ? '/assets/planet/moon.glb'
    : `/assets/ecology/${a.id}.glb`;
  new GLTFLoader().load(modelUrl, gltf => {
    const model = gltf.scene;
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const scale = 2.9 / Math.max(size.x, size.y, size.z);
    model.scale.setScalar(scale);
    model.position.copy(center).multiplyScalar(-scale);
    scene.add(model);
    let triangles = 0;
    const textures = new Map<string, string>();
    model.traverse(node => {
      if (!(node instanceof THREE.Mesh)) return;
      triangles += (node.geometry.index?.count ?? node.geometry.getAttribute('position').count) / 3;
      const materials = Array.isArray(node.material) ? node.material : [node.material];
      for (const material of materials) for (const value of Object.values(material)) {
        if (value instanceof THREE.Texture && value.image) textures.set(value.uuid, `${value.image.width}×${value.image.height}`);
      }
    });
    element.querySelector('.loading')?.remove();
    const textureSummary = textures.size ? `${[...new Set(textures.values())].join(' / ')} · ${textures.size} 张贴图` : '白模 · 无贴图';
    element.parentElement!.querySelector('.stats')!.textContent = `${triangles.toLocaleString()} 三角面 · ${textureSummary}`;
    element.dataset.loaded = 'true';
  }, undefined, error => {
    element.querySelector('.loading')!.textContent = '模型暂时无法加载，请刷新重试';
    element.parentElement!.querySelector('.stats')!.textContent = '加载失败';
    console.error(a.id, error);
  });
  const resize = () => { const w = element.clientWidth, h = element.clientHeight; renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); };
  new ResizeObserver(resize).observe(element);
  resize();
  views.push({ renderer, scene, camera, controls, element });
}
document.getElementById('rotate')!.onclick = e => {
  autoRotate = !autoRotate;
  for (const v of views) v.controls.autoRotate = autoRotate;
  (e.target as HTMLButtonElement).textContent = autoRotate ? '暂停旋转' : '自动旋转';
};
document.getElementById('light')!.onclick = e => {
  bright = !bright;
  for (const v of views) v.scene.background = new THREE.Color(bright ? 0xc5ced8 : 0x080c15);
  (e.target as HTMLButtonElement).textContent = bright ? '切换深色背景' : '切换明亮背景';
};
// Skip off-screen renderers as the asset collection grows.
const visibleElements = new Set<HTMLElement>();
const visibility = new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (entry.isIntersecting) visibleElements.add(entry.target as HTMLElement);
    else visibleElements.delete(entry.target as HTMLElement);
  }
});
for (const view of views) visibility.observe(view.element);
const clock = new THREE.Clock();
function animate() { requestAnimationFrame(animate); const dt = Math.min(clock.getDelta(), 0.05); for (const v of views) { if (!visibleElements.has(v.element)) continue; v.controls.update(dt); v.renderer.render(v.scene, v.camera); } }
animate();
