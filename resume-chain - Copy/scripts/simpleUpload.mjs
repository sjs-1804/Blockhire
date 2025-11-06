import { NFTStorage, Blob } from 'nft.storage';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.NFT_STORAGE_API_KEY;

if (!API_KEY) {
  throw new Error('❌ Missing NFT_STORAGE_API_KEY in .env');
}

async function run() {
  const client = new NFTStorage({ token: API_KEY });
  const data = readFileSync('./resume.pdf');

  try {
    const metadata = await client.store({
      name: 'My Resume',
      description: 'Resume uploaded via NFT.Storage',
      image: new Blob(['placeholder image content'], { type: 'image/png' }), // Placeholder image
      properties: {
        resume: new Blob([data], { type: 'application/pdf' }),
      },
    });

    console.log('✅ IPFS URL:', metadata.url);
  } catch (err) {
    console.error('❌ Upload failed:', err);
  }
}

run();
