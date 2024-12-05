import React from 'react';
import './AssetSelector.css';
// AssetSelector.js

function AssetSelector({
  category,
  options,
  onSelect,
  onClear,
  onPreviousCategory,
  onNextCategory,
}) {
  return (
    <div className="window asset-selector">
      <div className="title-bar">
        <div className="title-bar-text">{category}</div>
        <div className="title-bar-controls">
          <button aria-label="Minimize"></button>
          <button aria-label="Maximize"></button>
          <button aria-label="Close" onClick={() => onClear(category)}></button>
        </div>
      </div>
      <div className="window-body">
        <div className="toolbar">
          <button className="button" onClick={onPreviousCategory}>
            &lt; Previous
          </button>
          <button className="button" onClick={onNextCategory}>
            Next &gt;
          </button>
        </div>
        <div className="options-container">
          {options && options.length > 0 ? (
            options.map((option, index) => (
              <img
                key={index}
                src={`${process.env.PUBLIC_URL}${option}`}
                alt={`${category} option`}
                onClick={() => onSelect(category, option)}
                className="option-image"
              />
            ))
          ) : (
            <p>No assets available for this category.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default AssetSelector;
