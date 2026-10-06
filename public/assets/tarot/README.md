# Tarot colossi

Twelve prepared Tripo P2 GLB sculptures copied from `output/tripo-p2/<name>/tripo-out/*/model.glb`.
The GLBs include their PBR textures and require no external texture files.

`src/utils/createTarotEntities.ts` maps encounter types to these assets, loads them on demand,
normalizes their height/footprint, and adds a stepped stone plinth with a muted metallic rim.
Sculptures retain their authored materials and receive the existing gift-offering effect.
