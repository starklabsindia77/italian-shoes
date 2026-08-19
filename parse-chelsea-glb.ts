import fs from 'fs';
import path from 'path';

type GltfMesh = { name?: string };
type GltfNode = { name?: string; mesh?: number };

function parseGlb(buffer: Buffer, name: string) {
  const magic = buffer.readUInt32LE(0);
  if (magic !== 0x46546C67) {
    throw new Error('Not a GLB file');
  }
  
  const chunkLength = buffer.readUInt32LE(12);
  const chunkType = buffer.readUInt32LE(16);
  if (chunkType !== 0x4E4F534A) {
    throw new Error('First chunk is not JSON');
  }
  
  const jsonBuffer = buffer.subarray(20, 20 + chunkLength);
  const json = JSON.parse(jsonBuffer.toString('utf8'));
  
  const meshes: GltfMesh[] = json.meshes || [];
  const nodes: GltfNode[] = json.nodes || [];

  console.log(`\n=== File: ${name} ===`);
  console.log(`Meshes (${meshes.length}):`);
  meshes.forEach((m, idx) => {
    console.log(` - Mesh ${idx}: ${m.name}`);
  });
  console.log(`Nodes (${nodes.length}):`);
  nodes.forEach((n, idx) => {
    if (n.name) console.log(` - Node ${idx}: ${n.name} ${n.mesh !== undefined ? `(Mesh: ${n.mesh})` : ''}`);
  });
}

function main() {
  try {
    const file = path.join(process.cwd(), 'public', 'GLB', '57ab59f9-09d7-4291-bb78-9299b707147e-Mens-luxury-chelsea-boots  Style 1 Sole 1.glb');
    if (fs.existsSync(file)) {
      const buffer = fs.readFileSync(file);
      parseGlb(buffer, 'Chelsea Boots');
    } else {
      console.log('File not found at ' + file);
    }
  } catch (e) {
    console.error(e);
  }
}

main();
