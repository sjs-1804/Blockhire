async function uploadFileToIPFS(file) {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch('https://api.lighthouse.storage/api/v0/add', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (data && data.Hash) {
      console.log('✅ File uploaded to IPFS with CID:', data.Hash);
      return data.Hash;  // Return the IPFS CID
    } else {
      console.error('❌ Lighthouse upload response did not contain a Hash:', data);
      throw new Error('Failed to upload file to Lighthouse');
    }
  } catch (error) {
    console.error('❌ Error uploading to IPFS:', error);
    throw error;
  }
}
