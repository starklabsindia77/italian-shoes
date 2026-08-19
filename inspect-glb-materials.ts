import https from 'https';

function parseGlb(buffer: Buffer) {
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
  
  console.log('=== GLTF Materials ===');
  console.log(JSON.stringify(json.materials, null, 2));
  
  console.log('=== GLTF Meshes ===');
  console.log(JSON.stringify(json.meshes, null, 2));

  console.log('=== GLTF Nodes ===');
  console.log(JSON.stringify(json.nodes, null, 2));
}

async function main() {
  const cdnUrl = 'https://italian-shoes-color.s3.us-east-1.amazonaws.com';
  const glbPath = '/GLB/57ab59f9-09d7-4291-bb78-9299b707147e-Mens-luxury-chelsea-boots  Style 1 Sole 1.glb';
  const fullUrl = `${cdnUrl}${glbPath}`;

  const fetchBuffer = (url: string): Promise<Buffer> => {
    return new Promise((resolve, reject) => {
      https.get(url, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`Failed to load: ${res.statusCode}`));
          return;
        }
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => resolve(Buffer.concat(chunks)));
      }).on('error', reject);
    });
  };

  try {
    const buffer = await fetchBuffer(fullUrl);
    parseGlb(buffer);
  } catch (e) {
    console.error('Error:', e instanceof Error ? e.message : e);
  }
}

main();
