/**
 * Entry point for the modular UI system for MeshGradient
 */
import { uiManager } from './ui/UIManager.js';

document.addEventListener('DOMContentLoaded', () => {
  // Wait for mesh gradient to initialize
  setTimeout(() => {
    // Initialize the UI
    uiManager.initialize();
    console.log('Modular UI system initialized');
  }, 100);
});

// Export for global access if needed
window.meshGradientUI = uiManager;
