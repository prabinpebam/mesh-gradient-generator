/**
 * Central event system for the Mesh Gradient application
 * Provides a publish-subscribe pattern for loose coupling between components
 */
class EventBus {
  constructor() {
    this.events = {};
    this.initialize();
  }
  
  /**
   * Initialize with predefined events
   */
  initialize() {
    // Register default events
    this.registerEvent('meshColorsChanged');
    this.registerEvent('meshColorsAvailable');
    this.registerEvent('distortionChanged');
    this.registerEvent('cellCountChanged');
    this.registerEvent('animationStateChanged');
    this.registerEvent('hueAnimationStateChanged');
    this.registerEvent('uiControlsReady');
    this.registerEvent('uiThemeChanged');
  }
  
  /**
   * Register a new event
   * @param {string} eventName - Name of the event
   */
  registerEvent(eventName) {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
  }
  
  /**
   * Subscribe to an event
   * @param {string} eventName - Name of the event
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  subscribe(eventName, callback) {
    if (!this.events[eventName]) {
      this.registerEvent(eventName);
    }
    
    this.events[eventName].push(callback);
    
    // Return unsubscribe function
    return () => {
      this.unsubscribe(eventName, callback);
    };
  }
  
  /**
   * Unsubscribe from an event
   * @param {string} eventName - Name of the event
   * @param {Function} callback - Callback function
   */
  unsubscribe(eventName, callback) {
    if (!this.events[eventName]) return;
    
    this.events[eventName] = this.events[eventName].filter(cb => cb !== callback);
  }
  
  /**
   * Publish an event
   * @param {string} eventName - Name of the event
   * @param {*} data - Event data
   */
  publish(eventName, data) {
    if (!this.events[eventName]) return;
    
    this.events[eventName].forEach(callback => {
      try {
        callback(data);
      } catch (err) {
        console.error(`Error in event handler for ${eventName}:`, err);
      }
    });
  }
  
  /**
   * Forward DOM events to EventBus
   * @param {string} domEventName - DOM event name
   * @param {string} busEventName - EventBus event name
   */
  forwardDOMEvent(domEventName, busEventName) {
    document.addEventListener(domEventName, (event) => {
      this.publish(busEventName, event.detail);
    });
  }
}

// Create singleton instance
const eventBus = new EventBus();

// Forward existing DOM events to EventBus
eventBus.forwardDOMEvent('meshColorsChanged', 'meshColorsChanged');
eventBus.forwardDOMEvent('meshColorsAvailable', 'meshColorsAvailable');

// Export singleton
export default eventBus;
