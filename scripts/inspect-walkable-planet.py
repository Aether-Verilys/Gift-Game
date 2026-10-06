"""Measure the generated planet's spherical fit without changing the source asset."""
import json
import math
import struct
from pathlib import Path

path = Path('public/assets/ecology/walkable-planet.glb')
b = path.read_bytes()
length = struct.unpack_from('<I', b, 12)[0]
g = json.loads(b[20:20 + length])
binary = b[28 + length:]
points = []
for node in g['nodes']:
    if 'mesh' not in node:
        continue
    # P2 conversion currently emits identity nodes; refuse misleading metrics if changed.
    assert not any(key in node for key in ['matrix', 'translation', 'rotation', 'scale']), 'Transform-aware inspection needed'
    for primitive in g['meshes'][node['mesh']]['primitives']:
        accessor = g['accessors'][primitive['attributes']['POSITION']]
        assert accessor['componentType'] == 5126 and accessor['type'] == 'VEC3'
        view = g['bufferViews'][accessor['bufferView']]
        offset = view.get('byteOffset', 0) + accessor.get('byteOffset', 0)
        stride = view.get('byteStride', 12)
        points.extend(struct.unpack_from('<fff', binary, offset + i * stride) for i in range(accessor['count']))
points = sorted(set(points))
minimum = [min(p[i] for p in points) for i in range(3)]
maximum = [max(p[i] for p in points) for i in range(3)]
center = [(a + b) / 2 for a, b in zip(minimum, maximum)]
size = [b - a for a, b in zip(minimum, maximum)]
radii = sorted(math.dist(p, center) for p in points)
median = radii[len(radii) // 2]
result = {
    'asset': str(path), 'unique_vertices': len(points), 'bounds_size': size,
    'bounds_center': center, 'axis_ratio_max_to_min': max(size) / min(size),
    'radial_ratio_to_median': {'min': radii[0] / median, 'p05': radii[int(len(radii) * .05)] / median,
        'p95': radii[int(len(radii) * .95)] / median, 'max': radii[-1] / median},
    'radial_error_at_world_radius_70': {'min': 70 * (radii[0] / median - 1), 'max': 70 * (radii[-1] / median - 1)},
    'method': 'Vertex radii from bounding-box center, uniformly scaled so median radius is 70; not a collision or watertightness test.',
    'scene_integrated': False,
}
Path('output/tripo-p2/walkable-planet/sphere-inspection.json').write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps(result, indent=2))
