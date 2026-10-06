from pathlib import Path
import hashlib
import json
import zipfile

root = Path('public/assets/ecology')
batch = Path('output/tripo-p2/ecology-batch3')
validation = json.loads((root / 'validation.json').read_text())
manifest = json.loads((batch / 'manifest.json').read_text())
for asset in manifest['assets']:
    result = json.loads((batch / f"{asset['id']}-result.json").read_text())
    assert result['status'] == 'success'
    asset.update(generation_task=result['source_task_id'], conversion_task=result['task_id'], credits=result['credits_consumed'])
    asset['validation'] = next(v for v in validation if v['name'] == asset['id'])
    assert asset['validation']['triangles'] <= 20000
    assert all(t['width'] == t['height'] == 1024 for t in asset['validation']['textures'])
    asset['sha256'] = hashlib.sha256((root / f"{asset['id']}.glb").read_bytes()).hexdigest()
manifest['credits_total'] = sum(a['credits'] for a in manifest['assets'])
manifest_path = root / 'batch3-manifest.json'
previous = json.loads(manifest_path.read_text()) if manifest_path.exists() else {}
manifest['scene_integrated'] = previous.get('scene_integrated', False)
if 'scene_integration' in previous:
    manifest['scene_integration'] = previous['scene_integration']
(root / 'batch3-manifest.json').write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + '\n')
old = json.loads((batch / 'previous-assets-sha256.json').read_text())
assert all(hashlib.sha256((root / name).read_bytes()).hexdigest() == digest for name, digest in old.items())
readme = root / 'README.md'
text = readme.read_text().replace('All eight models are integrated into the game scene.', 'The first eight models (batches 1–2) are integrated into the game scene. Batch 3 remains generated review assets.')
marker = '\n## Batch 3 · 2026-10-06\n'
integration_notes = text[text.index('\nBatch 3 integration:'):] if '\nBatch 3 integration:' in text else ''
text = text.split(marker)[0] + marker + '\nFive additional P2 samples; each has three 1024×1024 PBR textures and fewer than 20,000 triangles. Preview: `/tripo-preview.html`. Prior batches: `/tripo-preview.html?batch=previous`. No game scene replacements in this batch.\n\n| Asset | Actual triangles | Bytes |\n|---|---:|---:|\n'
for a in manifest['assets']:
    text += f"| {a['id']}.glb | {a['validation']['triangles']:,} | {a['validation']['bytes']:,} |\n"
text += f"\nTotal credits: {manifest['credits_total']}. Prompts, source task IDs, conversion task IDs, checksums and measured budgets: `batch3-manifest.json`.\n"
if manifest['scene_integrated']:
    text = text.replace('No game scene replacements in this batch.', 'All five batch 3 models are now integrated into their matching scene placements.')
    text += integration_notes
readme.write_text(text)
with zipfile.ZipFile(batch / 'ecology-batch3-5-models.zip', 'w', zipfile.ZIP_DEFLATED) as archive:
    for a in manifest['assets']:
        p = root / f"{a['id']}.glb"
        archive.write(p, p.name)
    for name in ['README.md', 'batch3-manifest.json']:
        archive.write(root / name, name)
print(json.dumps([{'name':a['title'], 'triangles':a['validation']['triangles']} for a in manifest['assets']], ensure_ascii=False))
print('Preserved previous assets. Saved verified five-model archive.')
