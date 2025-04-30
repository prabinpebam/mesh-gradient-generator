/**
 * Distortion Manager - handles applying visual effects to the gradient
 */
class DistortionManager {
    constructor() {
        this.stack = [];  // [{type:'polar', opts:{scale,…}}]
    }

    setStack(list) {
        this.stack = Array.isArray(list) ? list : [];
    }

    hasActive() {
        return this.stack.length > 0 && this.stack[0].type !== 'none';
    }

    /**
     * Apply the current stack onto targetCtx.
     * @param {HTMLCanvasElement} srcCanvas – pristine gradient
     * @param {CanvasRenderingContext2D} targetCtx – on‑screen ctx
     */
    apply(srcCanvas, targetCtx) {
        console.log("DistortionManager.apply", {
            active: this.hasActive(),
            stack: this.stack,
            srcCanvas: {width: srcCanvas.width, height: srcCanvas.height},
            targetCtx: targetCtx
        });

        if (!this.hasActive()) {
            console.log("No active distortions, direct copy");
            targetCtx.drawImage(srcCanvas, 0, 0);
            return;
        }

        const first = this.stack[0];
        console.log("Applying distortion:", first.type);
        
        // Handler map -------------
        const map = {
            polar : this.applyPolar.bind(this),
            ripple: DistortionRipple.apply,
            wave  : DistortionWave.apply,
            twist : DistortionTwist.apply,
            bulge : DistortionBulge.apply,
            barrel: DistortionBarrel.apply
        };

        (map[first.type] || ((s,d)=>d.drawImage(s,0,0)))
            (srcCanvas, targetCtx, first.opts || {});
    }

    /* ----- helpers ------------------------------------------------------- */

    applyPolar(src, dst, opts) {
        console.log("applyPolar called with options:", opts);
        console.log("Source canvas:", {width: src.width, height: src.height});
        
        const w = src.width;
        const h = src.height;
        
        // 1. build mirrored wide bitmap
        const wide = document.createElement('canvas');
        wide.width = w * 2;
        wide.height = h;
        const wctx = wide.getContext('2d');
        wctx.drawImage(src, 0, 0);                // left
        wctx.save();
        wctx.translate(w * 2, 0);
        wctx.scale(-1, 1);
        wctx.drawImage(src, 0, 0);                // right (mirrored)
        wctx.restore();

        console.log("Created mirrored canvas:", {width: wide.width, height: wide.height});

        // 2. polar mapping with bilinear filtering
        const dstImg = dst.createImageData(w, h);
        const srcImg = wctx.getImageData(0, 0, wide.width, h);
        const srcData = srcImg.data;

        console.log("Processing source pixels:", {
            sourceWidth: wide.width,
            sourceHeight: h,
            dataLength: srcData.length
        });

        // Helper function for bilinear sampling
        const bilinearSample = (imgData, x, y, w, h) => {
            // Clamp coordinates to valid range
            x = Math.max(0, Math.min(w - 1.001, x));
            y = Math.max(0, Math.min(h - 1.001, y));
            
            const x1 = Math.floor(x);
            const y1 = Math.floor(y);
            const x2 = Math.min(x1 + 1, w - 1);
            const y2 = Math.min(y1 + 1, h - 1);
            
            const dx = x - x1;
            const dy = y - y1;
            
            // Get pixel indices
            const i1 = (y1 * w + x1) * 4;
            const i2 = (y1 * w + x2) * 4;
            const i3 = (y2 * w + x1) * 4;
            const i4 = (y2 * w + x2) * 4;
            
            // Bilinear interpolation
            const r = (1-dx)*(1-dy)*imgData[i1]   + dx*(1-dy)*imgData[i2]   + (1-dx)*dy*imgData[i3]   + dx*dy*imgData[i4];
            const g = (1-dx)*(1-dy)*imgData[i1+1] + dx*(1-dy)*imgData[i2+1] + (1-dx)*dy*imgData[i3+1] + dx*dy*imgData[i4+1];
            const b = (1-dx)*(1-dy)*imgData[i1+2] + dx*(1-dy)*imgData[i2+2] + (1-dx)*dy*imgData[i3+2] + dx*dy*imgData[i4+2];
            const a = (1-dx)*(1-dy)*imgData[i1+3] + dx*(1-dy)*imgData[i2+3] + (1-dx)*dy*imgData[i3+3] + dx*dy*imgData[i4+3];
            
            return [r, g, b, a];
        };

        // Parameters with defaults
        const centerX = opts.centerX !== undefined ? opts.centerX : 0.5;
        const centerY = opts.centerY !== undefined ? opts.centerY : 0.5;
        const angleOffset = opts.angleOffset !== undefined ? opts.angleOffset : 0;
        const zoom = opts.zoom !== undefined ? opts.zoom : 1.0;

        // Apply polar transformation
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const u = (x + 0.5) / w;
                const v = (y + 0.5) / h;
                
                // Calculate position relative to center
                const dx = (u - centerX) * 2;
                const dy = (v - centerY) * 2;
                
                // Convert to polar
                let angle = Math.atan2(dy, dx) / (2 * Math.PI) + 0.5; // 0-1
                angle = (angle + angleOffset) % 1.0;
                
                const radius = Math.min(1.0, Math.sqrt(dx*dx + dy*dy) / zoom);
                
                // Convert back to uv on wide texture
                const su = angle * 2.0; // 0-2 (doubled width)
                const sv = radius;
                
                // Bilinear sample for smooth result
                const sx = su * wide.width;
                const sy = sv * h;
                
                const [r, g, b, a] = bilinearSample(srcData, sx, sy, wide.width, h);
                
                // Set pixel in destination
                const di = (y * w + x) * 4;
                dstImg.data[di] = r;
                dstImg.data[di + 1] = g;
                dstImg.data[di + 2] = b;
                dstImg.data[di + 3] = a;
            }
        }
        
        console.log("Finished polar mapping, putting image data");
        dst.putImageData(dstImg, 0, 0);
    }
}
