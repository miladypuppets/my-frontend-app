// Canvas.js

import React, { useState } from 'react';
import './Canvas.css';
import { Contract, BrowserProvider, parseEther } from 'ethers';
import axios from 'axios';
import contractABI from './PuppetNFTABI.json'; // Ensure this path is correct

function Canvas({ selectedAssets, categories, nftName, ethAddress, solanaAddress }) {
  const [imageCid, setImageCid] = useState(null);
  const [metadataCid, setMetadataCid] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [minting, setMinting] = useState(false);

  // Replace with your deployed contract address
  const contractAddress = '0x79bfaf858594934ea87150d82608ebf3052defef';

  const handleUploadToIPFSAndMint = async () => {
    setUploading(true);
    console.log('Starting asset upload to IPFS...');
    try {
      const images = categories.map((cat) => selectedAssets[cat]).filter(Boolean);
      if (images.length === 0) throw new Error('No assets selected.');
      if (!ethAddress) throw new Error('Please connect your wallet.');

      const loadedImages = await Promise.all(images.map(loadImage));
      const canvas = renderToCanvas(loadedImages);

      // Convert canvas to blob asynchronously
      const canvasBlob = await new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Canvas is empty'));
          }
        }, 'image/png');
      });

      const imageCid = await uploadToIPFS(canvasBlob, 'nft-image.png');
      if (!imageCid) throw new Error('Failed to upload image to IPFS');
      setImageCid(imageCid);

      const metadata = generateMetadata(imageCid, nftName, solanaAddress, selectedAssets);
      const metadataBlob = new Blob([JSON.stringify(metadata)], {
        type: 'application/json',
      });
      const metadataCid = await uploadToIPFS(metadataBlob, 'metadata.json');
      if (!metadataCid) throw new Error('Failed to upload metadata to IPFS');
      setMetadataCid(metadataCid);

      console.log(`Metadata CID: ${metadataCid}`);

      // Mint the NFT
      await mintNFT(metadataCid);
    } catch (error) {
      console.error('Error during upload/mint:', error);
      alert(error.message || 'An error occurred. Check the console for details.');
    } finally {
      setUploading(false);
    }
  };

  const mintNFT = async (metadataCid) => {
    setMinting(true);
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed');
      }

      const provider = new BrowserProvider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      const signer = await provider.getSigner();
      const contract = new Contract(contractAddress, contractABI, signer);

      // Update the tokenURI to use the full gateway URL
      const tokenURI = `https://gateway.pinata.cloud/ipfs/${metadataCid}`;

      // Call the mint function with the tokenURI and send the mint price
      const tx = await contract.mint(tokenURI, {
        value: parseEther('0.0003'), // Mint price per NFT
      });
      console.log('Transaction hash:', tx.hash);

      // Wait for the transaction to be mined
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);

      alert('NFT minted successfully!');
    } catch (error) {
      console.error('Error during minting:', error);
      alert(error.message || 'Minting failed. Check the console for details.');
    } finally {
      setMinting(false);
    }
  };

  const uploadToIPFS = async (fileBlob, fileName) => {
    console.log(`Uploading file ${fileName} to IPFS...`);
    
    const file = new File([fileBlob], fileName, { type: 'image/png' });
    const formData = new FormData();
    formData.append('file', file);
  
    try {
      const response = await axios.post('/api/upload', formData);
      if (response.status === 200) {
        const cid = response.data.cid;
        console.log(`File uploaded to IPFS, CID: ${cid}`);
        return cid;
      } else {
        throw new Error('Failed to upload to IPFS');
      }
    } catch (error) {
      console.error('IPFS upload error:', error);
      throw error;
    }
  };
  
  const generateMetadata = (imageCid, name, solanaAddress, assets) => {
    console.log('Generating metadata...');
    return {
      name: name || 'Build-a-Puppet',
      description: 'Puppetardio presents... Build-a-Puppet on Ethereum',
      image: `https://gateway.pinata.cloud/ipfs/${imageCid}`,
      attributes: [
        { trait_type: 'Creator\'s Solana Address', value: solanaAddress || 'Not provided' },
        ...Object.entries(assets).map(([cat, path]) => ({
          trait_type: cat,
          value: path.split('/').pop().split('.')[0],
        })),
      ],
    };
  };

  const renderToCanvas = (loadedImages) => {
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(...loadedImages.map((img) => img.width));
    canvas.height = Math.max(...loadedImages.map((img) => img.height));
    const ctx = canvas.getContext('2d');

    loadedImages.forEach((img) => ctx.drawImage(img, 0, 0));
    return canvas;
  };

  const loadImage = (src) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = `${process.env.PUBLIC_URL}${src}`;
    });
  };

  return (
    <div className="window canvas-wrapper">
      <div className="title-bar">
        <div className="title-bar-text">{nftName || 'build-a-puppet'}</div>
        <div className="title-bar-controls">
          <button aria-label="Minimize"></button>
          <button aria-label="Maximize"></button>
          <button aria-label="Close"></button>
        </div>
      </div>
      <div className="window-body">
        <div className="canvas">
          {categories.map((category, idx) => {
            const src = selectedAssets[category];
            return src ? (
              <img
                key={idx}
                src={`${process.env.PUBLIC_URL}${src}`}
                alt={category}
                className="canvas-layer"
              />
            ) : null;
          })}
        </div>
        <button
          onClick={handleUploadToIPFSAndMint}
          className="button upload-button"
          disabled={uploading || minting || !ethAddress}
        >
          {uploading
            ? 'Uploading...'
            : minting
            ? 'Minting NFT...'
            : 'Upload & Mint NFT'}
        </button>
      </div>
    </div>
  );
}

export default Canvas;
