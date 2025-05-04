/**
 * DOM utility functions for the Mesh Gradient application
 */

/**
 * Get element by ID with type checking
 * @param {string} id - Element ID
 * @returns {HTMLElement|null} Element or null
 */
export function getElementById(id) {
  return document.getElementById(id);
}

/**
 * Create an element with properties
 * @param {string} tagName - Element tag name
 * @param {Object} props - Element properties
 * @param {Array|Node} children - Child elements
 * @returns {HTMLElement} Created element
 */
export function createElement(tagName, props = {}, children = []) {
  const element = document.createElement(tagName);
  
  // Set properties
  Object.entries(props).forEach(([key, value]) => {
    if (key === 'className') {
      element.className = value;
    } else if (key === 'style' && typeof value === 'object') {
      Object.entries(value).forEach(([styleKey, styleValue]) => {
        element.style[styleKey] = styleValue;
      });
    } else if (key.startsWith('on') && typeof value === 'function') {
      // Event listeners
      const eventName = key.substring(2).toLowerCase();
      element.addEventListener(eventName, value);
    } else {
      element[key] = value;
    }
  });
  
  // Append children
  if (Array.isArray(children)) {
    children.forEach(child => {
      if (child) {
        element.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
      }
    });
  } else if (children) {
    element.appendChild(typeof children === 'string' ? document.createTextNode(children) : children);
  }
  
  return element;
}

/**
 * Create a range input with label and value display
 * @param {Object} config - Input configuration
 * @returns {HTMLElement} Container with input and label
 */
export function createRangeInput(config) {
  const { 
    id, 
    label, 
    min, 
    max, 
    value, 
    step = 1, 
    onChange,
    showMinMax = true,
    showValue = true
  } = config;
  
  // Create container
  const container = createElement('div', { className: 'mb-3' });
  
  // Create label if provided
  if (label) {
    const labelElement = createElement('label', {
      className: 'form-label',
      htmlFor: id
    }, label);
    container.appendChild(labelElement);
  }
  
  // Create range input
  const inputElement = createElement('input', {
    type: 'range',
    className: 'form-range',
    id,
    min,
    max,
    value,
    step
  });
  
  // Create value display container
  const displayContainer = createElement('div', {
    className: 'd-flex justify-content-between'
  });
  
  // Create min value display
  if (showMinMax) {
    displayContainer.appendChild(createElement('small', {}, min));
  } else {
    displayContainer.appendChild(createElement('div', {}));
  }
  
  // Create current value display
  const valueElement = createElement('small', { id: `${id}Value` }, value);
  if (showValue) {
    displayContainer.appendChild(valueElement);
  }
  
  // Create max value display
  if (showMinMax) {
    displayContainer.appendChild(createElement('small', {}, max));
  } else {
    displayContainer.appendChild(createElement('div', {}));
  }
  
  // Add event listener
  if (onChange) {
    inputElement.addEventListener('input', (e) => {
      const newValue = e.target.value;
      valueElement.textContent = newValue;
      onChange(newValue);
    });
  }
  
  // Add components to container
  container.appendChild(inputElement);
  container.appendChild(displayContainer);
  
  return container;
}

/**
 * Create a select input with options
 * @param {Object} config - Select configuration
 * @returns {HTMLElement} Container with select and label
 */
export function createSelectInput(config) {
  const { 
    id, 
    label, 
    options = [], 
    selectedValue = '', 
    onChange
  } = config;
  
  // Create container
  const container = createElement('div', { className: 'mb-3' });
  
  // Create label if provided
  if (label) {
    const labelElement = createElement('label', {
      className: 'form-label',
      htmlFor: id
    }, label);
    container.appendChild(labelElement);
  }
  
  // Create select element
  const selectElement = createElement('select', {
    className: 'form-select',
    id
  });
  
  // Add options
  options.forEach(option => {
    const { value, text, selected } = typeof option === 'object' 
      ? option 
      : { value: option, text: option, selected: option === selectedValue };
      
    const optionElement = createElement('option', {
      value,
      selected: selected || value === selectedValue
    }, text || value);
    
    selectElement.appendChild(optionElement);
  });
  
  // Add event listener
  if (onChange) {
    selectElement.addEventListener('change', (e) => {
      onChange(e.target.value);
    });
  }
  
  // Add select to container
  container.appendChild(selectElement);
  
  return container;
}

/**
 * Create a button
 * @param {Object} config - Button configuration
 * @returns {HTMLElement} Button
 */
export function createButton(config) {
  const { 
    id, 
    text, 
    onClick, 
    className = 'btn btn-primary', 
    icon = null 
  } = config;
  
  const buttonContent = [];
  
  // Add icon if provided
  if (icon) {
    buttonContent.push(createElement('i', { className: `bi bi-${icon}` }));
    buttonContent.push(document.createTextNode(' '));
  }
  
  // Add text
  buttonContent.push(text);
  
  // Create button
  const button = createElement('button', {
    id,
    className,
    onClick
  }, buttonContent);
  
  return button;
}
