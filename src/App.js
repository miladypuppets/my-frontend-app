// App.js

import React, { useState, useEffect } from 'react';
import './App.css';
import assets from './assetsList';
import AssetSelector from './components/AssetSelector';
import Canvas from './components/Canvas';
import { BrowserProvider } from 'ethers'; // Updated import

function App() {
  // NFT Categories
  const categories = [
    'BACKGROUND',
    'BODY',
    'HAIR',
    'RACE',
    'EYES',
    'HEADWEAR',
    'CARRY',
    'OVERLAY',
  ];
  const [selectedAssets, setSelectedAssets] = useState({});
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);

  // NFT Name State
  const [nftName, setNftName] = useState('');

  // Ethereum Address State
  const [ethAddress, setEthAddress] = useState('');
  const [provider, setProvider] = useState(null);

  // **Solana Address State**
  const [solanaAddress, setSolanaAddress] = useState('');

  // Handle Asset Selection
  const handleSelect = (category, option) => {
    setSelectedAssets((prevState) => {
      let newState = { ...prevState, [category]: option };

      const bodyAssetsToCheck = [
        '/assets/BODY/elven-armor-and-helmet.png',
        '/assets/BODY/ghost-costume.png',
        '/assets/BODY/among-us-suit.png',
        '/assets/BODY/black-niqab.png',
      ];

      // Logic for "RACE" and "BODY"
      if (category === 'RACE' && option === '/assets/RACE/aura.png') {
        delete newState['BODY']; // "BODY" is incompatible with "aura"
      } else if (category === 'BODY') {
        if (prevState['RACE'] === '/assets/RACE/aura.png') {
          delete newState['RACE']; // "RACE" is incompatible with certain "BODY" assets
        }

        if (bodyAssetsToCheck.includes(option)) {
          delete newState['HEADWEAR']; // Certain "BODY" assets disable "HEADWEAR"

          // Ensure BODY assets render above "RACE" and "HAIR"
          if (prevState['RACE']) {
            newState['RACE'] = prevState['RACE']; // Keep RACE but render under BODY
          }
          if (prevState['HAIR']) {
            newState['HAIR'] = prevState['HAIR']; // Keep HAIR but render under BODY
          }
        }
      }

      // Logic for "HEADWEAR"
      if (category === 'HEADWEAR') {
        if (prevState['BODY'] && bodyAssetsToCheck.includes(prevState['BODY'])) {
          delete newState['BODY']; // Certain "BODY" assets are incompatible with "HEADWEAR"
        }
      }

      return newState;
    });
  };

  const handleClear = (category) => {
    setSelectedAssets((prevState) => {
      const newState = { ...prevState };
      delete newState[category];
      return newState;
    });
  };

  const handlePreviousCategory = () => {
    setCurrentCategoryIndex((prev) =>
      prev === 0 ? categories.length - 1 : prev - 1
    );
  };

  const handleNextCategory = () => {
    setCurrentCategoryIndex((prev) =>
      prev === categories.length - 1 ? 0 : prev + 1
    );
  };

  const currentCategory = categories[currentCategoryIndex];

  // Ethereum Wallet Connection
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const tempProvider = new BrowserProvider(window.ethereum); // Updated
        const signer = await tempProvider.getSigner(); // Updated
        const userAddress = await signer.getAddress();
        setEthAddress(userAddress);
        setProvider(tempProvider);
      } catch (error) {
        console.error('User rejected the request.');
      }
    } else {
      alert('Please install MetaMask!');
    }
  };

  useEffect(() => {
    // Auto-connect if already connected
    if (window.ethereum && window.ethereum.selectedAddress) {
      connectWallet();
    }
  }, []);

  return (
    <div className="app-container">
      <div className="window app-window">
        <div className="title-bar">
          <div className="title-bar-text">Puppetardio.exe</div>
          <div className="title-bar-controls">
            <button aria-label="Minimize"></button>
            <button aria-label="Maximize"></button>
            <button aria-label="Close"></button>
          </div>
        </div>
        <div className="window-body">
          {/* Wallet Connection */}
          <div className="field-row" style={{ alignItems: 'center' }}>
            {ethAddress ? (
              <p>Connected: {ethAddress}</p>
            ) : (
              <button onClick={connectWallet} className="button">
                Connect Wallet
              </button>
            )}
          </div>

          {/* NFT Name Input */}
          <div className="field-row" style={{ alignItems: 'center' }}>
            <label htmlFor="nft-name">puppet name:</label>
            <input
              id="nft-name"
              type="text"
              placeholder="Enter NFT Name"
              value={nftName}
              onChange={(e) => setNftName(e.target.value)}
              className="input-field"
            />
          </div>

          {/* **Solana Address Input** */}
          <div className="field-row" style={{ alignItems: 'center' }}>
            <label htmlFor="solana-address">Solana Address:</label>
            <input
              id="solana-address"
              type="text"
              placeholder="Enter your Solana Address"
              value={solanaAddress}
              onChange={(e) => setSolanaAddress(e.target.value)}
              className="input-field"
            />
          </div>

          {/* NFT Builder */}
          <Canvas
            selectedAssets={selectedAssets}
            categories={categories}
            nftName={nftName}
            ethAddress={ethAddress}
            solanaAddress={solanaAddress} // Pass solanaAddress to Canvas
            provider={provider}
          />

          {/* Asset Selector */}
          <AssetSelector
            category={currentCategory}
            options={assets[currentCategory]}
            onSelect={handleSelect}
            onClear={handleClear}
            onPreviousCategory={handlePreviousCategory}
            onNextCategory={handleNextCategory}
          />
        </div>
      </div>
    </div>
  );
}

export default App;