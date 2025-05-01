// Debug script to verify swatch rendering

// Add some static swatches to verify DOM manipulation works
document.addEventListener('DOMContentLoaded', function() {
  console.log('Debug swatches script loaded');
  
  // Get the swatches container
  const swatchContainer = document.getElementById('colorSwatches');
  if (!swatchContainer) {
    console.error('Swatch container not found!');
    return;
  }
  
  // Sample colors
  const sampleColors = ['#FF5733', '#33FF57', '#3357FF', '#FFFF33', '#FF33FF'];
  
  // Add static swatches 
  sampleColors.forEach(color => {
    const swatch = document.createElement('div');
    swatch.className = 'color-swatch';
    swatch.style.width = '40px';
    swatch.style.height = '40px';
    swatch.style.backgroundColor = color;
    swatch.style.border = '1px solid #ccc';
    swatch.style.borderRadius = '4px';
    swatchContainer.appendChild(swatch);
    
    console.log(`Added swatch with color ${color}`);
  });
  
  console.log('Finished adding static swatches');
});
