# Tripo P2 ecology samples · 2026-10-06

Preview: `/tripo-preview.html` (run `npm run dev`, default port 3000).
The ecology props (batches 1–6) are integrated into the game scene. The ringed planet replaces the distant celestial prop, and the local black-and-white Moon GLB is used for the walkable surface.
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

## Batch 2 · 2026-10-06

Five additional P2 samples, all checked against 20,000 triangles and 1024×1024 embedded textures. Total: 600 credits. Prompts, task IDs and measurements: batch2-manifest.json.

| Asset | Actual triangles |
|---|---:|
| crystal-reeds.glb | 11,175 |
| spiral-fern.glb | 17,127 |
| lantern-plant.glb | 14,970 |
| moon-rock.glb | 9,257 |
| broken-arch.glb | 19,924 |

Scene integration uses shared instanced PBR geometry for scatter assets, preserves deterministic transforms and clearing behavior, adds height-weighted plant wind, and replaces arch visuals inside the existing animated ruin roots. Static authored placements stay empty until their GLB arrives and remain empty on load failure, so no procedural fallback geometry is allocated. Scene-owned GLB resources are released on teardown.

Batch 1 integration: mushrooms share the height-weighted two-axis wind shader; bird geometry is rotated from verified authored -X (beak) to scene +Z and animated with a continuous wing morph while retaining the existing flight path and glide bursts. Planet retains slow rotation. Plant wind now combines two gust frequencies and a secondary bend, with amplitudes tuned for the game camera.

Bird motion correction: verified head axis from a top-down asset render; banking uses local +Z rotation to preserve heading. Body lift follows the same wingbeat clock with a quarter-cycle lag and reduced amplitude during gliding.

Flight behavior now alternates 2.2–3.0 seconds of powered wingbeats with 3.8–5.6 seconds of fully still extended-wing gliding. Birds gain 0.65–1.05 world units during powered flight, smoothly descend during the glide, and never accumulate altitude drift. Per-bird timing offsets avoid synchronized motion. Heading follows the vertical path while the wingbeat-scale body response fades to zero for gliding. The existing 18 rad/s wingbeat and half-size bird scale are preserved. Behavioral checks: `node --import tsx --test src/utils/birdFlight.test.ts`.

## Batch 3 · 2026-10-06

Five additional P2 samples; each has three 1024×1024 PBR textures and fewer than 20,000 triangles. Preview: `/tripo-preview.html`. Prior batches: `/tripo-preview.html?batch=previous`. All five batch 3 models are now integrated into their matching scene placements.

| Asset | Actual triangles | Bytes |
|---|---:|---:|
| silver-grass.glb | 3,494 | 693,296 |
| crystal-spire.glb | 13,827 | 782,884 |
| weathered-obelisk.glb | 11,198 | 1,270,388 |
| broken-colonnade.glb | 14,045 | 1,575,184 |
| ancient-astrolabe.glb | 14,543 | 1,288,268 |

Total credits: 600. Prompts, source task IDs, conversion task IDs, checksums and measured budgets: `batch3-manifest.json`.

Batch 3 integration: silver grass replaces all 280 grass instances with the shared PBR GPU wind shader (two-axis gusts, height-squared root anchoring, 0.16 local amplitude). Seven crystal landmarks preserve their parent transforms and sit at the surface. Three colonnades, two astrolabes, and two obelisks replace only the visuals inside existing ruin roots, retaining clearing/sinking behavior and shared GPU resources. Rigid mineral/stone/metal models do not bend. Shader displacement bounds include wind movement.

Validation: actual GLBs loaded and rendered in `output/ecology-integration/check.html`; verified placements, grounding, clearing/restoration, changing rendered wind frames, and unchanged CPU vertex data. Type checking and production build pass.

## Walkable planet · 2026-10-06

Tripo P2 original: `walkable-planet.glb`, 16,854 triangles, three embedded 1024×1024 textures, 1,316,260 bytes. Total: 120 credits. Preview: `/tripo-preview.html?batch=planet`. Generation task: `c1e37a6f-6276-4d31-9d0d-7bf31dce67c6`; 1K conversion: `60909c09-3e7c-4237-bab1-5691e49e4bf1`.

Near-equal axis sizes (max/min 1.00196) do not imply a perfectly spherical surface. Vertex radii at median radius 70 range from -6.84 to +2.03 world units. Before replacing the walking surface, radially constrain its geometry or make grounded entities follow sampled terrain height. This asset is not yet integrated. Full prompt, budget checks and measurements: `walkable-planet-manifest.json`.

## Batch 4 · 2026-10-06

Five additional P2 samples replace the remaining static procedural markers and ruin placeholders. Each uses three embedded 1024×1024 PBR textures and stays below 20,000 triangles. Preview: `/tripo-preview.html?batch=batch4`.

| Asset | Actual triangles | Generation task |
|---|---:|---|
| surface-monolith.glb | 9,315 | `51008f89-1fde-49d7-8c60-0aa0d34f9e02` |
| impact-crater.glb | 12,713 | `0cccf922-4279-4933-af38-37c1aa0aaf27` |
| star-beacon.glb | 10,041 | `0802f059-eb1e-4435-a6d2-4e34f76840d2` |
| standing-stone-ring.glb | 15,428 | `551e98bc-d5f2-40c7-9fc0-5926b58b32da` |
| ruined-stair.glb | 15,694 | `04570d02-4123-4b2b-bb89-afec6e42d7fe` |

The authored meshes replace the matching marker and ruin visuals after loading. Their placement roots remain empty until the GLB arrives, so failed loads do not allocate duplicate procedural geometry. Clearing and sinking behavior stays attached to the existing placement roots. Full prompts, checksums and measurements: `output/tripo-p2/ecology-batch4/manifest.json`.


## Batch 5 · 2026-10-06

The final remaining static ruin slot now uses the Tripo P2 **toppled-statue.glb** asset. It contains a weathered fallen statue head and broken shoulder fragment, with 12,306 triangles, three embedded 1024×1024 PBR textures, and a size of 1,102,664 bytes. Preview: `/tripo-preview.html?batch=batch5`.

The model is attached to the existing final ruin placement root after asynchronous loading, so clearing and sinking behavior are preserved. If the GLB fails to load, the root stays empty and no procedural replacement geometry is allocated. Full prompt, task IDs, checksum and measurements: `output/tripo-p2/ecology-batch5/manifest.json`.


## Batch 6 · 2026-10-06

The procedural four-tier cylinder footing under each tarot colossus is replaced by **sacred-colossus-base.glb**, a Tripo P2 sacred multi-tier octagonal pedestal with cardinal buttresses and celestial reliefs. It contains 13,564 triangles, three embedded 1024×1024 PBR textures, and is 1,719,388 bytes. Preview: `/tripo-preview.html?batch=batch6`.

The pedestal is loaded asynchronously into the existing colossus encounter group, shares the encounter's offering sweep shader and shadows, and expands the clearing radius. If it fails to load, no procedural cylinder geometry is allocated. Full prompt, task IDs, checksum and measurements: `output/tripo-p2/ecology-batch6/manifest.json`.


## Batch 7 · 2026-10-06

The previous **crystal-spire.glb** was replaced with a cleaner Tripo P2 revision and then given one 1024×1024 diffuse texture (no PBR maps). The new silhouette uses a single elegant spear-like hexagonal crystal with controlled facet growth and a compact fused base. It has 13,827 triangles, one embedded JPEG texture, and is 782,884 bytes. The existing crystal landmark placement and GPU wind-disabled mineral behavior are unchanged. Full prompt, task IDs, checksum and measurements: `output/tripo-p2/ecology-batch8/manifest.json`.
