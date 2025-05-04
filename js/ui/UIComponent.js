/**
 * Base class for UI components
 * Provides common functionality for all UI components
 */
import eventBus from '../core/Events.js';

export default class UIComponent {
  /**
   * Create a UI component
   * @param {Object} config - Component configuration
   */
  constructor(config = {}) {
    this.eventBus = config.eventBus || eventBus;
    this.meshGradient = config.meshGradient;
    this.elements = {};
    this.subscriptions = [];
    this.initialized = false;
  }
  
  /**
   * Initialize the component
   * Should be overridden by subclasses
   */
  initialize() {
    if (this.initialized) return;
    
    this._findElements();
    this._bindEvents();
    
    this.initialized = true;
  }
  
  /**
   * Find DOM elements
   * Should be overridden by subclasses
   */
  _findElements() {
    // Override in subclasses
  }
  
  /**
   * Bind event handlers
   * Should be overridden by subclasses
   */
  _bindEvents() {
    // Override in subclasses
  }
  
  /**
   * Subscribe to an event
   * @param {string} eventName - Event name
   * @param {Function} callback - Callback function
   */
  subscribe(eventName, callback) {
    const unsubscribe = this.eventBus.subscribe(eventName, callback);
    this.subscriptions.push(unsubscribe);
    return unsubscribe;
  }
  
  /**
   * Find element by ID
   * @param {string} id - Element ID
   * @returns {HTMLElement|null} Element or null
   */
  getElementById(id) {
    return document.getElementById(id);
  }
  
  /**
   * Get element from cache or find by ID
   * @param {string} id - Element ID
   * @returns {HTMLElement|null} Element or null
   */
  getElement(id) {
    if (!this.elements[id]) {
      this.elements[id] = this.getElementById(id);
    }
    return this.elements[id];
  }
  
  /**
   * Safe getter for meshGradient
   * @returns {Object} MeshGradient instance
   * @throws {Error} If meshGradient is not available
   */
  getMeshGradient() {
    if (!this.meshGradient) {
      throw new Error('MeshGradient not available');
    }
    return this.meshGradient;
  }
  
  /**
   * Destroy the component
   * Clean up event listeners and resources
   */
  destroy() {
    // Unsubscribe from events
    this.subscriptions.forEach(unsubscribe => unsubscribe());
    this.subscriptions = [];
    
    this.initialized = false;
  }
}
