// Game State
let gameState = {
  resources: 0,
  resourcesPerSecond: 0,
  totalCollected: 0,
  playTime: 0,
  upgrades: {
    autoDrone: {
      level: 0,
      baseCost: 10,
      multiplier: 1
    }
  }
};

// DOM Elements
const elements = {
  resourceCount: document.getElementById('resource-count'),
  resourcePerSec: document.getElementById('resource-per-second'),
  clickButton: document.getElementById('click-button'),
  totalCollected: document.getElementById('total-collected'),
  playTime: document.getElementById('play-time'),
  saveStatus: document.getElementById('save-status'),
  upgradeLevel: document.querySelector('.upgrade .level'),
  upgradeCost: document.querySelector('.upgrade .cost')
};

// Initialize Game
function initGame() {
  loadGame();
  startGameLoop();
  setupEventListeners();
}

// Load Game Data
async function loadGame() {
  try {
    const response = await fetch('/api/load');
    if (!response.ok) throw new Error('Network response was not ok');
    
    const data = await response.json();
    
    // Safely merge loaded data with defaults
    gameState = {
      resources: data.resources || 0,
      resourcesPerSecond: data.resourcesPerSecond || 0,
      totalCollected: data.totalCollected || 0,
      playTime: data.playTime || 0,
      upgrades: {
        autoDrone: {
          level: data.upgrades?.autoDrone?.level || 0,
          baseCost: data.upgrades?.autoDrone?.baseCost || 10,
          multiplier: data.upgrades?.autoDrone?.multiplier || 1
        }
      }
    };
    
    updateUI();
    showNotification('Game loaded successfully', 'success');
  } catch (error) {
    console.error('Failed to load game:', error);
    showNotification('Failed to load game', 'error');
    resetGameState();
  }
}

// Save Game Data
async function saveGame() {
  try {
    showNotification('Saving progress...', 'saving');
    
    const response = await fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(gameState)
    });
    
    if (!response.ok) throw new Error('Save failed');
    
    showNotification('Progress saved', 'success');
  } catch (error) {
    console.error('Save error:', error);
    showNotification('Save failed', 'error');
  }
}

// Game Logic
function calculateUpgradeCost() {
  return Math.floor(
    gameState.upgrades.autoDrone.baseCost * 
    Math.pow(1.5, gameState.upgrades.autoDrone.level)
  );
}

function updateUI() {
  elements.resourceCount.textContent = Math.floor(gameState.resources);
  elements.resourcePerSec.textContent = `(${Math.floor(gameState.resourcesPerSecond)}/sec)`;
  elements.totalCollected.textContent = Math.floor(gameState.totalCollected);
  elements.upgradeLevel.textContent = gameState.upgrades.autoDrone.level;
  elements.upgradeCost.textContent = calculateUpgradeCost();
}

function updatePlayTime() {
  const hours = Math.floor(gameState.playTime / 3600).toString().padStart(2, '0');
  const minutes = Math.floor((gameState.playTime % 3600) / 60).toString().padStart(2, '0');
  const seconds = (gameState.playTime % 60).toString().padStart(2, '0');
  elements.playTime.textContent = `${hours}:${minutes}:${seconds}`;
}

// Event Handlers
function setupEventListeners() {
  elements.clickButton.addEventListener('click', () => {
    gameState.resources += 1;
    gameState.totalCollected += 1;
    updateUI();
    saveGame();
  });

  document.querySelector('.buy-button').addEventListener('click', () => {
    const cost = calculateUpgradeCost();
    if (gameState.resources >= cost) {
      gameState.resources -= cost;
      gameState.upgrades.autoDrone.level += 1;
      gameState.resourcesPerSecond = 
        gameState.upgrades.autoDrone.level * 
        gameState.upgrades.autoDrone.multiplier;
      updateUI();
      saveGame();
    }
  });
}

// Game Loop
function startGameLoop() {
  // Resource generation loop
  setInterval(() => {
    gameState.resources += gameState.resourcesPerSecond / 10;
    gameState.totalCollected += gameState.resourcesPerSecond / 10;
    updateUI();
  }, 100);

  // Time counter
  setInterval(() => {
    gameState.playTime += 1;
    updatePlayTime();
  }, 1000);

  // Auto-save
  setInterval(saveGame, 30000);
}

// UI Helpers
function showNotification(message, type) {
  elements.saveStatus.textContent = message;
  elements.saveStatus.className = `save-status visible ${type}`;
  setTimeout(() => {
    elements.saveStatus.classList.remove('visible');
  }, 2000);
}

function resetGameState() {
  gameState = {
    resources: 0,
    resourcesPerSecond: 0,
    totalCollected: 0,
    playTime: 0,
    upgrades: {
      autoDrone: {
        level: 0,
        baseCost: 10,
        multiplier: 1
      }
    }
  };
  updateUI();
}

// Initialize
window.addEventListener('load', initGame);
window.addEventListener('beforeunload', saveGame);