/**
 * Simple debugger for events
 */
export default class EventDebugger {
  /**
   * Monitor events published on an event bus
   * @param {Object} eventBus - Event bus instance
   * @param {Array} eventNames - Array of event names to monitor
   */
  static monitor(eventBus, eventNames = []) {
    if (!eventBus || typeof eventBus.subscribe !== 'function') {
      console.error('Invalid event bus provided');
      return;
    }
    
    // If no specific events provided, monitor common events
    if (eventNames.length === 0) {
      eventNames = [
        'cellColorLocked',
        'cellColorUnlocked',
        'cellColorChanged',
        'meshColorsAvailable'
      ];
    }
    
    console.log(`EventDebugger: Monitoring ${eventNames.length} events`);
    
    eventNames.forEach(eventName => {
      eventBus.subscribe(eventName, (data) => {
        console.log(`%c${eventName}`, 'color: blue; font-weight: bold', data);
      });
    });
  }
}
