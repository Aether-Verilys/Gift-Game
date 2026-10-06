# Tripo P2 ecology samples · 2026-10-06

Preview: `/tripo-preview.html` (run `npm run dev`, default port 3000).
These are the initial review samples, not yet replacements in the game scene.
All assets use P2-20260801, PBR, standard textures, followed by GLTF conversion with texture_size=1024.
Each embedded texture has been checked as 1024×1024. See validation.json; rerun `node scripts/verify-ecology.mjs`.

| Asset | Actual triangles | Bytes | Generation task | 1K conversion task |
|---|---:|---:|---|---|
| mushroom.glb | 12,304 | 891,180 | 3dbd9cb6-527d-401a-b64a-c69b1bc5e6e7 | 4013f3e0-04c0-4423-9810-79f5d849ea4c |
| bird.glb | 18,736 | 1,677,952 | c2e7ebbb-8cc7-4abd-aed0-0e624375d634 | 90b5d004-3e64-4feb-82d3-9b6da1248798 |
| planet.glb | 18,890 | 1,384,496 | 04e7645a-acd6-4c40-aef9-5e6f8f284e37 | 1757f4e0-44d0-4fbb-8577-d87d87a41a34 |

Total credits: 360 (110 generation + 10 conversion per asset).
Requested generation face limits: mushroom 12,000; bird and planet 18,000. Actual output slightly exceeds the requested targets but remains below the required 20,000 triangle ceiling.

Visual review: bird is an unrigged static gliding pose; mushroom needs an emissive treatment for visible bioluminescence in the game; ringed planet is intended for the distant celestial prop, not the walkable sphere whose shape drives gameplay.
