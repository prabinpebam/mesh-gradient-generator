/**
 * UI Component for distortion controls
 */
import UIComponent from './UIComponent.js';
import { createElement } from '../utils/DOMUtils.js';

export default class DistortionControls extends UIComponent {
  constructor(config) {
    super(config);
    
    // Current distortion configuration
    this.currentDistortion = { type: 'none', opts: {} };
    
    // Distortion metadata
    this.distortionMeta = {
      ripple: {
        centerX: {lbl:'Center X', min:0, max:1, step:0.01, val:0.5},
        centerY: {lbl:'Center Y', min:0, max:1, step:0.01, val:0.5},
        amplitude: {lbl:'Amplitude', min:0, max:100, step:1, val:10},
        frequency: {lbl:'Frequency', min:1, max:30, step:1, val:12},
        speed: {lbl:'Speed', min:0, max:10, step:0.1, val:1}
      },
      polar: {
        centerX: {lbl:'Center X', min:0, max:1, step:0.01, val:0.5},
        centerY: {lbl:'Center Y', min:0, max:1, step:0.01, val:0.5},
        scale: {lbl:'Scale', min:0.1, max:3, step:0.1, val:1},
        angleOffset: {lbl:'Angle °', min:0, max:360, step:1, val:0},
        zoom: {lbl:'Zoom', min:0.5, max:4, step:0.1, val:1}
      },
      wave: {
        direction: {lbl:'Direction', type:'select', options:['horizontal','vertical'], val:'horizontal'},
        amplitude: {lbl:'Amplitude', min:0, max:100, step:1, val:20},
        frequency: {lbl:'Frequency', min:1, max:10, step:1, val:3},
        speed: {lbl:'Speed', min:0, max:10, step:0.1, val:1},
        time: {lbl:'Time', min:0, max:100, step:0.1, val:0}
      },
      twist: null, // Will be generated dynamically based on canvas size
      bulge: {
        centerX: {lbl:'Center X', min:0, max:1, step:0.01, val:0.5},
        centerY: {lbl:'Center Y', min:0, max:1, step:0.01, val:0.5},
        radius: {lbl:'Radius px', min:10, max:600, step:1, val:150},
        strength: {lbl:'Strength', min:-1, max:1, step:0.05, val:0.5}
      },
      barrel: {
        barrelPower: {lbl:'Power', min:0, max:2, step:0.05, val:0.6}
      }
    };
  }
  
  _findElements() {
    this.elements = {
      distortionTypeSelect: this.getElementById('distortionType'),
      distortionParams: this.getElementById('distortionParams')
    };
  }
  
  _bindEvents() {
    // Distortion type change
    if (this.elements.distortionTypeSelect) {
      this.elements.distortionTypeSelect.addEventListener('change', () => {
        const type = this.elements.distortionTypeSelect.value;
        this.rebuildDistortionParams(type);
      });
    }
    
    // Subscribe to events
    this.subscribe('canvasResized', () => {
      // If twist distortion is active, rebuild its parameters
      if (this.currentDistortion.type === 'twist') {
        this.rebuildDistortionParams('twist');
      }
    });
  }
  
  /**
   * Get distortion manager from MeshGradient
   * @returns {Object|null} Distortion manager or null
   */
  _getDistortions() {
    try {
      const meshGradient = this.getMeshGradient();
      
      // Handle both the old and new structure
      if (meshGradient.distortions) {
        return meshGradient.distortions;
      } else if (meshGradient.data && meshGradient.data.distortions) {
        return meshGradient.data.distortions;
      }
    } catch (error) {
      console.error('Error getting distortion manager:', error);
    }
    
    return null;
  }
  
  /**
   * Check if there's an active distortion
   * @returns {boolean} Whether there's an active distortion
   */
  _hasActiveDistortion() {
    const distortions = this._getDistortions();
    return distortions && typeof distortions.hasActive === 'function' 
      ? distortions.hasActive() 
      : false;
  }
  
  /**
   * Apply distortion without regenerating colors
   * @param {Object} distortionConfig - Distortion configuration
   */
  _applyDistortionNoColorChange(distortionConfig) {
    const distortions = this._getDistortions();
    if (!distortions) return;
    
    try {
      // Apply distortion stack
      if (typeof distortions.setStack === 'function') {
        distortions.setStack([distortionConfig]);
      }
      
      // Render with preserveColors=true to prevent color regeneration
      const meshGradient = this.getMeshGradient();
      if (typeof meshGradient.render === 'function') {
        meshGradient.render(null, true);
      }
      
      // Publish event
      this.eventBus.publish('distortionChanged', {
        type: distortionConfig.type,
        options: distortionConfig.opts,
        hasActiveDistortion: distortionConfig.type !== 'none'
      });
    } catch (error) {
      console.error('Error applying distortion:', error);
    }
  }
  
  /**
   * Build twist distortion metadata based on canvas size
   * @returns {Object} Twist distortion metadata
   */
  _buildTwistMeta() {
    try {
      const meshGradient = this.getMeshGradient();
      const maxRad = Math.max(meshGradient.width, meshGradient.height);
      
      return {
        centerX: {lbl:'Center X', min:0, max:1, step:0.01, val:0.5},
        centerY: {lbl:'Center Y', min:0, max:1, step:0.01, val:0.5},
        maxAngle: {lbl:'Max Angle (turns)', min:0, max:5, step:0.1, val:1},
        radius: {lbl:'Radius px', min:10, max:maxRad, step:1, val:Math.round(maxRad/2)}
      };
    } catch (error) {
      console.error('Error building twist metadata:', error);
      
      // Return default metadata
      return {
        centerX: {lbl:'Center X', min:0, max:1, step:0.01, val:0.5},
        centerY: {lbl:'Center Y', min:0, max:1, step:0.01, val:0.5},
        maxAngle: {lbl:'Max Angle (turns)', min:0, max:5, step:0.1, val:1},
        radius: {lbl:'Radius px', min:10, max:600, step:1, val:300}
      };
    }
  }
  
  /**
   * Create a control element for a distortion parameter
   * @param {string} key - Parameter key
   * @param {Object} cfg - Parameter configuration
   * @param {Object} optsObj - Options object to update
   * @returns {HTMLElement} Control element
   */
  _createControl(key, cfg, optsObj) {
    const wrap = createElement('div', { className: 'mb-2' });
    
    const id = `d-${key}`;
    const label = createElement('label', {
      className: 'form-label small',
      htmlFor: id
    }, cfg.lbl);
    wrap.appendChild(label);
    
    if (cfg.type === 'select') {
      const sel = createElement('select', {
        id,
        className: 'form-select form-select-sm',
        onChange: () => {
          optsObj[key] = sel.value;
          this._applyDistortionNoColorChange(this.currentDistortion);
        }
      });
      
      cfg.options.forEach(v => {
        const o = createElement('option', {
          value: v,
          selected: v === cfg.val
        }, v);
        sel.appendChild(o);
      });
      
      wrap.appendChild(sel);
    } else {
      const input = createElement('input', {
        type: 'range',
        className: 'form-range',
        id,
        min: cfg.min,
        max: cfg.max,
        step: cfg.step,
        value: cfg.val,
        onChange: () => {
          span.textContent = input.value;
          optsObj[key] = Number(input.value);
          this._applyDistortionNoColorChange(this.currentDistortion);
        }
      });
      
      const span = createElement('small', {}, cfg.val);
      
      wrap.appendChild(input);
      wrap.appendChild(span);
    }
    
    return wrap;
  }
  
  /**
   * Rebuild distortion parameter controls
   * @param {string} type - Distortion type
   */
  rebuildDistortionParams(type) {
    if (!this.elements.distortionParams) return;
    
    // Clear existing controls
    this.elements.distortionParams.innerHTML = '';
    
    // Toggle visibility
    this.elements.distortionParams.classList.toggle('d-none', type === 'none');
    
    // Set current distortion
    this.currentDistortion = {type, opts: {}};
    
    if (type === 'none') {
      // Clear distortion stack
      const distortions = this._getDistortions();
      if (distortions && typeof distortions.setStack === 'function') {
        distortions.setStack([]);
      }
      
      // Publish event
      this.eventBus.publish('distortionChanged', {
        type: 'none',
        options: {},
        hasActiveDistortion: false
      });
      
      return;
    }
    
    // Get metadata for the distortion type
    let meta;
    if (type === 'twist') {
      // Generate twist metadata dynamically
      meta = this._buildTwistMeta();
    } else {
      // Use static metadata
      meta = this.distortionMeta[type];
    }
    
    if (!meta) {
      console.error(`No metadata for distortion type: ${type}`);
      return;
    }
    
    // Create controls for each parameter
    Object.keys(meta).forEach(k => {
      this.currentDistortion.opts[k] = meta[k].val;
      this.elements.distortionParams.appendChild(
        this._createControl(k, meta[k], this.currentDistortion.opts)
      );
    });
    
    // Apply the initial distortion without regenerating colors
    this._applyDistortionNoColorChange(this.currentDistortion);
  }
}
