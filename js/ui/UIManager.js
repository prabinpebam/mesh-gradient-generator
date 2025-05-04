/**
 * Main UI manager for the Mesh Gradient application
 * Coordinates all UI components and handles communication with MeshGradient
 */
import eventBus from '../core/Events.js';
import ColorControls from './ColorControls.js';
import DistortionControls from './DistortionControls.js';
import CanvasControls from './CanvasControls.js';
import EditModeControls from './EditModeControls.js';
import SwatchManager from './SwatchManager.js';

export default class UIManager {
  constructor(meshGradient = window.meshGradient) {
    this.meshGradient = meshGradient;
    this.eventBus = eventBus;
    this.components = {};
    this.initialized = false;
    
    this._bindDOMEvents();
  }
  
  /**
   * Initialize the UI manager and all components
   */
  initialize() {
    if (this.initialized) return;
    
    console.log('UIManager: Initializing UI components');
    
    if (!this.meshGradient) {
      console.error('UIManager: MeshGradient not available. Initialization aborted.');
      return;
    }
    
    this._initializeComponents();
    this._bindGlobalEvents();
    
    this.initialized = true;
    console.log('UIManager: Initialization complete');
    
    this.eventBus.publish('uiControlsReady', { initialized: true });
  }
  
  /**
   * Initialize all UI components
   */
  _initializeComponents() {
    // Canvas size and export controls
    this.components.canvasControls = new CanvasControls({
      eventBus: this.eventBus,
      meshGradient: this.meshGradient
    });
    
    // Edit mode toggle
    this.components.editModeControls = new EditModeControls({
      eventBus: this.eventBus,
      meshGradient: this.meshGradient
    });
    
    // Color controls - harmony, theme, adjustments, etc.
    this.components.colorControls = new ColorControls({
      eventBus: this.eventBus,
      meshGradient: this.meshGradient
    });
    
    // Distortion controls
    this.components.distortionControls = new DistortionControls({
      eventBus: this.eventBus,
      meshGradient: this.meshGradient
    });
    
    // Color swatches
    this.components.swatchManager = new SwatchManager({
      eventBus: this.eventBus,
      meshGradient: this.meshGradient
    });
    
    // Initialize all components
    Object.values(this.components).forEach(component => {
      try {
        component.initialize();
      } catch (err) {
        console.error(`UIManager: Error initializing ${component.constructor.name}:`, err);
      }
    });
  }
  
  /**
   * Bind global DOM events
   */
  _bindDOMEvents() {
    document.addEventListener('DOMContentLoaded', () => {
      // Delay initialization to ensure MeshGradient is loaded
      setTimeout(() => {
        // Check if meshGradient is available
        if (this.meshGradient || window.meshGradient) {
          // Use window.meshGradient if this.meshGradient is not available
          if (!this.meshGradient) {
            this.meshGradient = window.meshGradient;
          }
          
          this.initialize();
        } else {
          console.error('UIManager: MeshGradient not available after delay.');
        }
      }, 100);
    });
  }
  
  /**
   * Bind global events
   */
  _bindGlobalEvents() {
    // Listen for theme changes
    this.eventBus.subscribe('uiThemeChanged', (data) => {
      const isDarkMode = data && data.theme === 'dark';
      document.documentElement.setAttribute('data-bs-theme', isDarkMode ? 'dark' : 'light');
    });
  }
  
  /**
   * Get a component by name
   * @param {string} name - Component name
   * @returns {Object} Component instance
   */
  getComponent(name) {
    return this.components[name];
  }
  
  /**
   * Destroy all components and clean up
   */
  destroy() {
    Object.values(this.components).forEach(component => {
      if (component && typeof component.destroy === 'function') {
        component.destroy();
      }
    });
    
    this.components = {};
    this.initialized = false;
  }
}

// Create and export singleton instance
const uiManager = new UIManager();
export { uiManager };
