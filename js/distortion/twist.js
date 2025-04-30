const DistortionTwist = {
	/* opts: {centerX, centerY, maxAngle, radius}
	   maxAngle is expressed in turns (1 turn = 2π) */
	apply(src, dstCtx, opts = {}) {
		const w = src.width, h = src.height;
		const cx = (opts.centerX ?? 0.5) * w;
		const cy = (opts.centerY ?? 0.5) * h;

		const maxA = (opts.maxAngle ?? 1) * Math.PI * 2;   // turns→radians
		const rad  = opts.radius ?? Math.min(w,h)/2;

		const srcData = src.getContext('2d').getImageData(0,0,w,h).data;
		const outImg  = dstCtx.createImageData(w,h);

		for(let y=0;y<h;y++){
			for(let x=0;x<w;x++){
				const dx=x-cx, dy=y-cy;
				const r=Math.sqrt(dx*dx+dy*dy);
				let ang=Math.atan2(dy,dx);
				if(r<rad){
					ang += maxA*(1 - r/rad);
				}
				const nx=cx+Math.cos(ang)*r;
				const ny=cy+Math.sin(ang)*r;
				const ix=Math.max(0,Math.min(w-1,nx|0));
				const iy=Math.max(0,Math.min(h-1,ny|0));
				const si=(iy*w+ix)*4, di=(y*w+x)*4;
				outImg.data.set(srcData.subarray(si,si+4), di);
			}
		}
		dstCtx.putImageData(outImg,0,0);
	}
};
