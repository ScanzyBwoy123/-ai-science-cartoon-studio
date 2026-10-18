(function (global) {
  "use strict";
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const ease=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
  function sample(type,t,w,h){
    const e=ease(t), z=0.06;
    let x=0,y=0,scale=1;
    switch(type){
      case "zoomOut": scale=1+z*(1-e); break;
      case "panLeft": x=(.04-.08*e)*w; scale=1.08; break;
      case "panRight": x=(-.04+.08*e)*w; scale=1.08; break;
      case "panUp": y=(.04-.08*e)*h; scale=1.08; break;
      case "panDown": y=(-.04+.08*e)*h; scale=1.08; break;
      case "cinematic": scale=1+.035*e; x=-.018*w*e; y=.008*h*e; break;
      default: scale=1+z*e;
    }
    return {x,y,scale};
  }
  function draw(ctx,img,w,h,type,t,alpha){
    const p=sample(type,t,w,h), iw=img.naturalWidth||img.width, ih=img.naturalHeight||img.height;
    const fit=Math.max(w/iw,h/ih)*p.scale, dw=iw*fit, dh=ih*fit;
    ctx.save();ctx.globalAlpha=alpha==null?1:alpha;
    ctx.drawImage(img,(w-dw)/2+p.x,(h-dh)/2+p.y,dw,dh);ctx.restore();
  }
  global.ScienceStudioAnimation={sample,draw,ease};
})(window);
