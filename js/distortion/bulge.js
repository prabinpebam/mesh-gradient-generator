const DistortionBulge = {
	/**
	 * opts: {centerX, centerY, radius, strength}
	 * strength >0 = bulge, <0 = pinch
	 */
	apply(src, dstCtx, opts = {}) {
		const w=src.width, h=src.height;
		const cx=(opts.centerX??0.5)*w, cy=(opts.centerY??0.5)*h;
		const rad=opts.radius??Math.min(w,h)/3;
		const strength=opts.strength??0.5;          // -1..1

		const srcData=src.getContext('2d').getImageData(0,0,w,h).data;
		const out=dstCtx.createImageData(w,h);

		for(let y=0;y<h;y++){
			for(let x=0;x<w;x++){
				const dx=x-cx, dy=y-cy;
				const r=Math.sqrt(dx*dx+dy*dy);
				let nx=x, ny=y;
				if(r<rad){
					const factor = 1 + strength*(1 - (r/rad)**2);
					nx=cx+dx*factor;
					ny=cy+dy*factor;
				}
				const ix=Math.max(0,Math.min(w-1,nx|0));
				const iy=Math.max(0,Math.min(h-1,ny|0));
				const si=(iy*w+ix)*4, di=(y*w+x)*4;
				out.data.set(srcData.subarray(si,si+4), di);
			}
		}
		dstCtx.putImageData(out,0,0);
	}
};
