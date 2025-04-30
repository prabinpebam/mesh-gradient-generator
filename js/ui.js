/**
 * UI Controller for the Mesh Gradient Generator
 */
document.addEventListener('DOMContentLoaded', function() {
    // Initialize mesh gradient
    const meshGradient = new MeshGradient();
    
    // UI Elements
    const generateBtn = document.getElementById('generateBtn');
    const cellCount = document.getElementById('cellCount');
    const cellCountValue = document.getElementById('cellCountValue');
    const blurAmount = document.getElementById('blurAmount');
    const blurAmountValue = document.getElementById('blurAmountValue');
    const colorHarmony = document.getElementById('colorHarmony');
    const editModeToggle = document.getElementById('editModeToggle');
    const exportPngBtn = document.getElementById('exportPngBtn');
    const canvasWidth = document.getElementById('canvasWidth');
    const canvasHeight = document.getElementById('canvasHeight');
    const resizeCanvas = document.getElementById('resizeCanvas');
    
    // Set initial blur slider max value based on 50% of larger canvas dimension
    blurAmount.max = meshGradient.maxBlurAmount;
    
    // Update the blur amount label to indicate maximum
    blurAmountValue.textContent = blurAmount.value;
    document.querySelector('.mb-3:nth-child(4) .d-flex small:last-child').textContent = meshGradient.maxBlurAmount;
    
    // Generate initial gradient
    meshGradient.generate();
    
    // Generate new gradient
    generateBtn.addEventListener('click', function() {
        meshGradient.generate({
            cellCount: parseInt(cellCount.value),
            blurAmount: parseInt(blurAmount.value),
            colorHarmony: colorHarmony.value
        });
    });
    
    // Update cell count display
    cellCount.addEventListener('input', function() {
        cellCountValue.textContent = cellCount.value;
    });
    
    // Update blur amount display and apply
    blurAmount.addEventListener('input', function() {
        blurAmountValue.textContent = blurAmount.value;
        meshGradient.setBlurAmount(parseInt(blurAmount.value));
    });
    
    // Change color harmony
    colorHarmony.addEventListener('change', function() {
        meshGradient.setColorHarmony(colorHarmony.value);
    });
    
    // Toggle edit mode
    editModeToggle.addEventListener('change', function() {
        meshGradient.setEditMode(editModeToggle.checked);
    });
    
    // Export as PNG
    exportPngBtn.addEventListener('click', function() {
        meshGradient.exportAsPNG();
    });
    
    // Resize canvas
    resizeCanvas.addEventListener('click', function() {
        const width = parseInt(canvasWidth.value);
        const height = parseInt(canvasHeight.value);
        if (width > 0 && height > 0) {
            // Resize canvas and get updated max blur amount
            const newMaxBlur = meshGradient.resizeCanvas(width, height);
            
            // Update blur slider max value
            blurAmount.max = newMaxBlur;
            
            // Update the maximum blur label
            document.querySelector('.mb-3:nth-child(4) .d-flex small:last-child').textContent = newMaxBlur;
            
            // If current blur value exceeds new max, update it
            if (parseInt(blurAmount.value) > newMaxBlur) {
                blurAmount.value = newMaxBlur;
                blurAmountValue.textContent = newMaxBlur;
            }
            
            meshGradient.generate({
                cellCount: parseInt(cellCount.value),
                blurAmount: parseInt(blurAmount.value),
                colorHarmony: colorHarmony.value
            });
        }
    });
    
    // Canvas and mouse events for edit mode
    const canvas = document.getElementById('gradientCanvas');
    let isDragging = false;
    
    // Mouse events for edit mode (drag Voronoi centers)
    canvas.addEventListener('mousedown', function(e) {
        if (!meshGradient.editMode) return;
        
        isDragging = true;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        meshGradient.startDrag(x, y);
    });
    
    canvas.addEventListener('mousemove', function(e) {
        if (!isDragging) return;
        
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        meshGradient.drag(x, y);
    });
    
    canvas.addEventListener('mouseup', function() {
        isDragging = false;
        meshGradient.endDrag();
    });
    
    canvas.addEventListener('mouseleave', function() {
        isDragging = false;
        meshGradient.endDrag();
    });
    
    // Touch events for mobile support
    canvas.addEventListener('touchstart', function(e) {
        if (!meshGradient.editMode) return;
        e.preventDefault();
        
        isDragging = true;
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        
        meshGradient.startDrag(x, y);
    });
    
    canvas.addEventListener('touchmove', function(e) {
        if (!isDragging) return;
        e.preventDefault();
        
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        
        meshGradient.drag(x, y);
    });
    
    canvas.addEventListener('touchend', function(e) {
        e.preventDefault();
        isDragging = false;
        meshGradient.endDrag();
    });
});
