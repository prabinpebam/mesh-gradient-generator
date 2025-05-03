/**
 * Core patches for MeshGradient internals
 * This file applies patches to fix various behaviors in the MeshGradient core
 */
document.addEventListener('DOMContentLoaded', () => {
    // Wait for meshGradient to be available
    let attempts = 0;
    const maxAttempts = 10;
    
    function applyCoreFixes() {
        if (attempts >= maxAttempts) {
            console.warn('Failed to apply core MeshGradient fixes - too many attempts');
            return;
        }
        
        if (!window.meshGradient) {
            attempts++;
            setTimeout(applyCoreFixes, 100);
            return;
        }
        
        console.log('Applying MeshGradient core fixes...');

        // Patch setEditMode to preserve colors consistently
        if (typeof meshGradient.setEditMode === 'function') {
            const original = meshGradient.setEditMode;
            meshGradient.setEditMode = function(enabled, preserveState) {
                // Always pass preserveState=true to prevent color regeneration
                const result = original.call(this, enabled, true);
                console.log(`Successfully set edit mode to ${enabled} with color preservation`);
                return result;
            };
            console.log("Successfully patched MeshGradientCore.setEditMode");
        }
        
        // Patch render to default to preserveColors=true
        if (typeof meshGradient.render === 'function') {
            const originalRender = meshGradient.render;
            meshGradient.render = function(colors, preserveColors) {
                // Default to preserveColors=true if undefined
                if (preserveColors === undefined) preserveColors = true;
                return originalRender.call(this, colors, preserveColors);
            };
            console.log("Successfully patched MeshGradient.render with preserveColors default");
        }

        // Add animation support methods to MeshGradient core
        patchForAnimation();
    }
    
    // Add animation support to MeshGradient core
    function patchForAnimation() {
        if (!window.meshGradient) return;
        
        // Ensure animation object exists
        if (!meshGradient.animation) {
            console.log("Creating animation object");
            meshGradient.animation = {
                active: false,
                frameId: null,
                params: {
                    forceStrength: 0.12,
                    damping: 0.92,
                    maxSpeed: 3,
                    wanderJitter: 0.3,
                    wanderWeight: 0.25,
                    arrivalThres: 30,
                    minTurnAngle: 45 * Math.PI/180
                }
            };
        }
        
        // Add bridging method to connect animation toggle UI to core animation methods
        if (typeof meshGradient.toggleCellAnimation !== 'function') {
            console.log("[PATCH] Adding toggleCellAnimation bridge method");
            
            meshGradient.toggleCellAnimation = function(enabled) {
                console.log(`[ANIMATION] Toggle cell animation: ${enabled}`);
                
                if (enabled) {
                    if (typeof this.startCellAnimation === 'function') {
                        console.log("[ANIMATION] Calling startCellAnimation()");
                        return this.startCellAnimation();
                    } else {
                        console.error("[ANIMATION] startCellAnimation() method not found!");
                    }
                } else {
                    if (typeof this.stopCellAnimation === 'function') {
                        console.log("[ANIMATION] Calling stopCellAnimation()");
                        return this.stopCellAnimation();
                    } else {
                        console.error("[ANIMATION] stopCellAnimation() method not found!");
                    }
                }
                
                return false;
            };
        }
        
        // Add debug tracing to startCellAnimation
        if (typeof meshGradient.startCellAnimation === 'function') {
            const origStartAnimation = meshGradient.startCellAnimation;
            meshGradient.startCellAnimation = function() {
                console.log("[ANIMATION] startCellAnimation called");
                console.log(`[ANIMATION] Current state: active=${this.animation?.active}, frameId=${this.animation?.frameId}`);
                
                // Fix: Ensure animation is properly initialized
                if (!this.animation.sites) {
                    console.log("[ANIMATION] Initializing animation sites");
                    this.initAnimationProperties();
                }
                
                const result = origStartAnimation.apply(this, arguments);
                console.log(`[ANIMATION] startCellAnimation result: ${result}`);
                
                // Check if animation is running
                setTimeout(() => {
                    console.log(`[ANIMATION] After 500ms: active=${this.animation?.active}, frameId=${this.animation?.frameId}`);
                }, 500);
                
                return result;
            };
        }
        
        // Add debug tracing to updateAnimationStep - FIX THE REFERENCE ERROR
        if (typeof meshGradient.updateAnimationStep === 'function') {
            const origUpdateStep = meshGradient.updateAnimationStep;
            meshGradient.updateAnimationStep = function(deltaTime) {
                // Log every ~2 seconds to avoid console spam
                const shouldLog = Math.random() < 0.02;
                
                if (shouldLog) {
                    console.log(`[ANIMATION] updateAnimationStep(${deltaTime})`);
                    
                    // Fix: Check for sites before trying to access them
                    const sites = this.data?.voronoi?.sites;
                    if (sites && sites.length > 0) {
                        console.log(`[POSITION] Before: Cell 0 at [${sites[0][0].toFixed(2)}, ${sites[0][1].toFixed(2)}]`);
                    } else {
                        console.warn("[ANIMATION] No sites available");
                    }
                }
                
                // Fix: Add proper error handling
                try {
                    const updated = origUpdateStep.apply(this, arguments);
                    
                    if (shouldLog) {
                        // Fix: Re-fetch sites to avoid scope issues
                        const sitesAfter = this.data?.voronoi?.sites;
                        if (sitesAfter && sitesAfter.length > 0) {
                            console.log(`[POSITION] After: Cell 0 at [${sitesAfter[0][0].toFixed(2)}, ${sitesAfter[0][1].toFixed(2)}]`);
                        }
                        console.log(`[ANIMATION] updateAnimationStep result: ${updated}`);
                    }
                    
                    return updated;
                } catch (err) {
                    console.error("[ANIMATION] Error in updateAnimationStep:", err);
                    return false;
                }
            };
        }
        
        // Add debug tracing to render method to check cell positions during rendering
        const origRender = meshGradient.render;
        if (origRender) {
            meshGradient.render = function(colors, preserveColors) {
                // Log occasionally to avoid console spam
                const shouldLog = Math.random() < 0.05;
                
                if (shouldLog && this.animation && this.animation.active) {
                    console.log(`[RENDER] render(colors=${colors ? 'provided' : 'null'}, preserveColors=${preserveColors})`);
                    
                    // Check if position updates are visible during rendering
                    const sites = this.data?.voronoi?.sites;
                    if (sites && sites.length > 0) {
                        console.log(`[RENDER] Cell 0 position: [${sites[0][0].toFixed(2)}, ${sites[0][1].toFixed(2)}]`);
                    }
                }
                
                return origRender.apply(this, arguments);
            };
        }
        
        // Fix: Add missing initAnimationProperties if needed
        if (!meshGradient.initAnimationProperties) {
            console.log("[PATCH] Adding missing initAnimationProperties method");
            
            meshGradient.initAnimationProperties = function() {
                if (!this.animation) {
                    console.warn("[ANIMATION] No animation object to initialize properties for");
                    return;
                }
                
                console.log("[ANIMATION] Initializing animation properties");
                
                if (this.data && this.data.voronoi && this.data.voronoi.sites) {
                    const sites = this.data.voronoi.sites;
                    console.log(`[ANIMATION] Creating animation data for ${sites.length} sites`);
                    
                    this.animation.sites = sites.map((site, index) => {
                        return {
                            vx: 0,
                            vy: 0,
                            wanderAngle: Math.random() * 2 * Math.PI,
                            targetIndex: Math.floor(Math.random() * 1000) + 1,
                            lastTargetAngle: null
                        };
                    });
                    
                    // Fix: Properly mark animation as ready
                    this.animation.initialized = true;
                    console.log("[ANIMATION] Site properties initialized");
                } else {
                    console.error("[ANIMATION] No sites found to initialize");
                }
            };
        }
        
        // Fix: Ensure animation properties are initialized on reload
        setTimeout(() => {
            if (window.meshGradient && meshGradient.animation) {
                if (typeof meshGradient.initAnimationProperties === 'function' && !meshGradient.animation.initialized) {
                    console.log("[ANIMATION] Auto-initializing animation properties");
                    meshGradient.initAnimationProperties();
                }
                
                // Check for required animation methods
                const requiredMethods = [
                    'startCellAnimation', 
                    'stopCellAnimation',
                    'updateAnimationStep', 
                    'setAnimationParam',
                    'toggleCellAnimation',
                    'initAnimationProperties'
                ];
                
                const missingMethods = requiredMethods.filter(
                    method => typeof meshGradient[method] !== 'function'
                );
                
                if (missingMethods.length > 0) {
                    console.error(`[ANIMATION] Missing required methods: ${missingMethods.join(', ')}`);
                } else {
                    console.log("[ANIMATION] All required animation methods present");
                }
            }
        }, 1000);
        
        console.log("[PATCH] Animation debugging hooks installed");

        // Fix Voronoi recalculation during animation
        const originalDrawCellsToCanvas = meshGradient.renderer.drawCellsToCanvas;
        if (originalDrawCellsToCanvas) {
            meshGradient.renderer.drawCellsToCanvas = function(ctx, cells, data) {
                // Ensure cells are recalculated from latest site positions during animation
                if (meshGradient.animation && meshGradient.animation.active) {
                    try {
                        // Force Voronoi recalculation with updated site positions
                        if (data && data.voronoi) {
                            if (typeof data.voronoi.getCells === 'function') {
                                console.log("[RENDERER] Forcing Voronoi recalculation before draw");
                                cells = data.voronoi.getCells(true); // true = force recalculation
                            }
                            
                            // Also update Delaunay if possible
                            if (data.voronoi.delaunay && typeof data.voronoi.delaunay.update === 'function') {
                                data.voronoi.delaunay.update();
                            }
                        }
                    } catch (err) {
                        console.error("[RENDERER] Error recalculating Voronoi:", err);
                    }
                }
                
                return originalDrawCellsToCanvas.call(this, ctx, cells, data);
            };
            console.log("[PATCH] Enhanced drawCellsToCanvas with Voronoi recalculation");
        }
        
        // Force data.voronoi.getCells to always recalculate during animation
        if (meshGradient.data && meshGradient.data.voronoi) {
            const originalGetCells = meshGradient.data.voronoi.getCells;
            if (typeof originalGetCells === 'function') {
                meshGradient.data.voronoi.getCells = function(forceRecalculate) {
                    // Force recalculation during animation
                    if (meshGradient.animation && meshGradient.animation.active) {
                        forceRecalculate = true;
                    }
                    return originalGetCells.call(this, forceRecalculate);
                };
                console.log("[PATCH] Enhanced voronoi.getCells to force recalculation during animation");
            }
        }
        
        // Fix render loop to ensure full redraw during animation
        const originalRender = meshGradient.render;
        if (originalRender) {
            meshGradient.render = function(colors, preserveColors) {
                // During animation, ensure we're using the latest Voronoi cells
                if (this.animation && this.animation.active) {
                    if (Math.random() < 0.1) {
                        console.log("[RENDER] Animation render with preserveColors:", preserveColors);
                    }
                    
                    // Force cell recalculation when animating
                    if (this.data && this.data.voronoi) {
                        try {
                            // Get fresh cells with latest positions
                            const freshCells = this.data.voronoi.getCells(true);
                            
                            // Force render with full refresh but preserved colors
                            return originalRender.call(this, colors, true);
                        } catch (err) {
                            console.error("[RENDER] Animation render error:", err);
                        }
                    }
                }
                
                return originalRender.apply(this, arguments);
            };
            console.log("[PATCH] Enhanced render method for animation updates");
        }

        // Fix animation by using the drag mechanism
        // Override updateAnimationStep to use the same pathway as cell dragging
        if (typeof meshGradient.updateAnimationStep === 'function') {
            const originalUpdateStep = meshGradient.updateAnimationStep;
            
            meshGradient.updateAnimationStep = function(deltaTime) {
                if (!this.animation || !this.animation.active || !this.animation.sites) {
                    return false;
                }
                
                console.log("[ANIMATION] Running animation step with proper cell redraw");
                
                // Calculate physics as in the original method
                const timeStep = Math.min(deltaTime / (1000/60), 2);
                const params = this.animation.params;
                const sites = this.data.voronoi.sites;
                const W = this.width;
                const H = this.height;
                
                let updated = false;
                
                // Update each site using the proper moveSite method
                for (let i = 0; i < sites.length; i++) {
                    const site = sites[i];
                    const animProps = this.animation.sites[i];
                    
                    if (!animProps) continue;
                    
                    // Store original position
                    const origX = site[0];
                    const origY = site[1];
                    
                    // Calculate forces and new velocity (simplified for brevity)
                    // ...existing physics calculations...
                    
                    // Critical fix: Use moveSite instead of direct position update
                    // This is what happens during drag operations
                    let tx = this.halton(animProps.targetIndex, 2) * W;
                    let ty = this.halton(animProps.targetIndex, 3) * H;
                    let dx = tx - site[0];
                    let dy = ty - site[1];
                    let dist = Math.hypot(dx, dy);
                    
                    // Target selection
                    if (dist < params.arrivalThres) {
                        // Pick new target (similar to original code)
                        const oldAngle = animProps.lastTargetAngle || Math.atan2(dy, dx);
                        animProps.targetIndex = (animProps.targetIndex + 1) % 1000 + 1;
                        animProps.lastTargetAngle = Math.atan2(
                            this.halton(animProps.targetIndex, 3) * H - site[1],
                            this.halton(animProps.targetIndex, 2) * W - site[0]
                        );
                        
                        // Recalculate vector
                        tx = this.halton(animProps.targetIndex, 2) * W;
                        ty = this.halton(animProps.targetIndex, 3) * H;
                        dx = tx - site[0];
                        dy = ty - site[1];
                        dist = Math.hypot(dx, dy);
                    }
                    
                    // Calculate forces (simplified)
                    animProps.wanderAngle += (Math.random() * 2 - 1) * params.wanderJitter;
                    const wx = Math.cos(animProps.wanderAngle);
                    const wy = Math.sin(animProps.wanderAngle);
                    
                    const ax = dx / (dist || 1);
                    const ay = dy / (dist || 1);
                    
                    let sx = ax * (1 - params.wanderWeight) + wx * params.wanderWeight;
                    let sy = ay * (1 - params.wanderWeight) + wy * params.wanderWeight;
                    const sl = Math.hypot(sx, sy) || 1;
                    sx /= sl;
                    sy /= sl;
                    
                    // Apply forces to velocity
                    animProps.vx += sx * params.forceStrength * timeStep;
                    animProps.vy += sy * params.forceStrength * timeStep;
                    
                    // Damping
                    animProps.vx *= params.damping;
                    animProps.vy *= params.damping;
                    
                    // Cap speed
                    const sp = Math.hypot(animProps.vx, animProps.vy);
                    if (sp > params.maxSpeed) {
                        animProps.vx = (animProps.vx / sp) * params.maxSpeed;
                        animProps.vy = (animProps.vy / sp) * params.maxSpeed;
                    }
                    
                    // Calculate new position
                    const padding = 20;
                    const newX = Math.min(Math.max(site[0] + animProps.vx * timeStep, padding), W - padding);
                    const newY = Math.min(Math.max(site[1] + animProps.vy * timeStep, padding), H - padding);
                    
                    // Only move if there's significant change
                    const moveDistance = Math.hypot(newX - site[0], newY - site[1]);
                    if (moveDistance > 0.1) {
                        // CRITICAL FIX: Use the same method that dragging uses
                        try {
                            if (typeof this.data.voronoi.moveSite === 'function') {
                                // This properly updates the Voronoi diagram for the moved site
                                this.data.voronoi.moveSite(i, newX, newY);
                                updated = true;
                                
                                if (i === 0 && Math.random() < 0.05) {
                                    console.log(`[ANIMATION] Moved site 0 from [${origX.toFixed(2)},${origY.toFixed(2)}] to [${newX.toFixed(2)},${newY.toFixed(2)}]`);
                                }
                            } else {
                                // Direct update as fallback
                                site[0] = newX;
                                site[1] = newY;
                                updated = true;
                            }
                        } catch (err) {
                            console.error(`[ANIMATION] Error moving site ${i}:`, err);
                        }
                    }
                }
                
                // CRITICAL FIX: Trigger a forced Voronoi recalculation
                if (updated) {
                    if (typeof this.data.voronoi.getCells === 'function') {
                        // Force recalculation of cells
                        this.data.voronoi.getCells(true);
                    }
                    
                    // CRITICAL FIX: Use the proper update mechanism that updates the visual
                    // This is the key difference - we must call render after each animation frame
                    if (this.animation.originalColors) {
                        this.render(this.animation.originalColors, true);
                    } else {
                        this.render(null, true);
                    }
                }
                
                return updated;
            };
            
            console.log("[PATCH] Enhanced updateAnimationStep with proper Voronoi site movement");
        }
        
        // Fix: Ensure the animation uses properly initialized colors
        // This ensures that colors are preserved during animation
        if (typeof meshGradient.startCellAnimation === 'function') {
            const originalStart = meshGradient.startCellAnimation;
            
            meshGradient.startCellAnimation = function() {
                console.log("[ANIMATION] Starting cell animation with proper color preservation");
                
                // Always store initial colors before starting
                if (typeof this.getAllColors === 'function') {
                    this.animation.originalColors = this.getAllColors();
                    console.log(`[ANIMATION] Stored ${this.animation.originalColors.length} original colors`);
                }
                
                // Call the original method
                const result = originalStart.apply(this, arguments);
                
                return result;
            };
        }

        // Cell count change monitoring
        let lastCellCount = 0;
        
        // Monitor cell count changes
        const cellCountSlider = document.getElementById('cellCount');
        if (cellCountSlider) {
            console.log("[ANIMATION] Setting up cell count change listener");
            
            cellCountSlider.addEventListener('change', () => {
                // Wait for new cells to be generated
                setTimeout(() => {
                    const currentCellCount = meshGradient.data.voronoi.sites.length;
                    console.log(`[ANIMATION] Cell count changed from ${lastCellCount} to ${currentCellCount}`);
                    
                    // If animation is active and cell count changed, reinitialize animation properties
                    if (meshGradient.animation && meshGradient.animation.active) {
                        console.log("[ANIMATION] Reinitializing animation properties for new cell count");
                        meshGradient.initAnimationProperties();
                    }
                    
                    lastCellCount = currentCellCount;
                }, 500);
            });
        }
        
        // Patch the drag method to ensure it works with animation
        if (typeof meshGradient.drag === 'function') {
            const originalDrag = meshGradient.drag;
            meshGradient.drag = function(x, y) {
                // Call the original drag method
                const result = originalDrag.apply(this, arguments);
                
                // If we're dragging during animation, update animation properties
                if (this.animation && this.animation.active && this.dragSiteIndex !== -1) {
                    // Update animation properties for the dragged site
                    if (this.animation.sites && this.animation.sites[this.dragSiteIndex]) {
                        // Reset velocity when manually dragged
                        this.animation.sites[this.dragSiteIndex].vx = 0;
                        this.animation.sites[this.dragSiteIndex].vy = 0;
                    }
                }
                
                return result;
            };
            
            console.log("[ANIMATION] Patched drag method to work with animation");
        }
        
        // Patch updateAnimationStep to ensure it works with any number of cells
        if (typeof meshGradient.updateAnimationStep === 'function') {
            const originalUpdateStep = meshGradient.updateAnimationStep;
            meshGradient.updateAnimationStep = function(deltaTime) {
                if (!this.animation || !this.animation.sites) {
                    console.log("[ANIMATION] No animation sites, initializing...");
                    this.initAnimationProperties();
                }
                
                // Check if sites count matches animation sites count
                const sites = this.data?.voronoi?.sites;
                if (sites && this.animation?.sites && sites.length !== this.animation.sites.length) {
                    console.log(`[ANIMATION] Site count mismatch: ${sites.length} vs ${this.animation.sites.length}, reinitializing`);
                    this.initAnimationProperties();
                }
                
                return originalUpdateStep.apply(this, arguments);
            };
            console.log("[ANIMATION] Enhanced updateAnimationStep to handle dynamic cell count");
        }
        
        // Replace initAnimationProperties to be more robust
        meshGradient.initAnimationProperties = function() {
            if (!this.animation) {
                console.log("[ANIMATION] Creating animation object");
                this.animation = {
                    active: false,
                    frameId: null,
                    params: {
                        forceStrength: 0.12,
                        damping: 0.92,
                        maxSpeed: 3,
                        wanderJitter: 0.3,
                        wanderWeight: 0.25,
                        arrivalThres: 30,
                        minTurnAngle: 45 * Math.PI/180
                    }
                };
            }
            
            if (this.data && this.data.voronoi && this.data.voronoi.sites) {
                const sites = this.data.voronoi.sites;
                console.log(`[ANIMATION] Initializing animation for ${sites.length} cells`);
                
                // Store original colors
                if (typeof this.getAllColors === 'function' && !this.animation.originalColors) {
                    this.animation.originalColors = this.getAllColors();
                }
                
                // (Re)create animation properties array for all current sites
                this.animation.sites = sites.map((site, index) => {
                    // Preserve existing properties if possible to avoid jumps
                    const existing = this.animation.sites && this.animation.sites[index];
                    return {
                        vx: existing ? existing.vx : 0,
                        vy: existing ? existing.vy : 0,
                        wanderAngle: existing ? existing.wanderAngle : Math.random() * 2 * Math.PI,
                        targetIndex: existing ? existing.targetIndex : Math.floor(Math.random() * 1000) + 1,
                        lastTargetAngle: existing ? existing.lastTargetAngle : null
                    };
                });
                
                console.log(`[ANIMATION] Initialized ${this.animation.sites.length} animation properties`);
                this.animation.initialized = true;
            } else {
                console.error("[ANIMATION] No sites available for animation initialization");
            }
            
            return this.animation;
        };
        console.log("[ANIMATION] Replaced initAnimationProperties with more robust version");
        
        // Patch the setCellCount method to update animation properties
        const originalSetCellCount = meshGradient.setCellCount;
        if (originalSetCellCount) {
            meshGradient.setCellCount = function(count, callback) {
                // Record if animation was active
                const wasAnimating = this.animation && this.animation.active;
                
                // If animating, stop temporarily
                if (wasAnimating) {
                    console.log("[ANIMATION] Pausing animation for cell count change");
                    this.stopCellAnimation();
                }
                
                // Call the original method
                const result = originalSetCellCount.apply(this, arguments);
                
                // After cell count changes, reinitialize animation properties
                setTimeout(() => {
                    console.log("[ANIMATION] Reinitializing after cell count change");
                    this.initAnimationProperties();
                    
                    // Resume animation if it was active
                    if (wasAnimating) {
                        console.log("[ANIMATION] Resuming animation after cell count change");
                        this.startCellAnimation();
                    }
                }, 100);
                
                return result;
            };
            console.log("[ANIMATION] Patched setCellCount to maintain animation state");
        }
        
        // Override startCellAnimation to ensure proper initialization
        const originalStartAnimation = meshGradient.startCellAnimation;
        if (originalStartAnimation) {
            meshGradient.startCellAnimation = function() {
                console.log("[ANIMATION] Starting cell animation with init checks");
                
                // Always initialize properties before starting
                this.initAnimationProperties();
                
                return originalStartAnimation.apply(this, arguments);
            };
            console.log("[ANIMATION] Enhanced startCellAnimation with initialization checks");
        }
        
        // Add a method to fix animation during drag operations
        meshGradient.updateAnimationSites = function() {
            if (!this.animation || !this.animation.active) return;
            
            const sites = this.data?.voronoi?.sites;
            if (!sites || !this.animation.sites) return;
            
            if (sites.length !== this.animation.sites.length) {
                console.log(`[ANIMATION] Updating animation sites array from ${this.animation.sites.length} to ${sites.length} items`);
                this.initAnimationProperties();
            }
            
            return true;
        };
        
        // Call this function periodically to ensure animation stays in sync
        setInterval(() => {
            if (meshGradient && meshGradient.animation && meshGradient.animation.active) {
                meshGradient.updateAnimationSites();
            }
        }, 2000);
        
        console.log("[ANIMATION] Cell count handling patches installed");
    }
    
    // Start applying fixes
    setTimeout(applyCoreFixes, 300);
});
