(function(global){"use strict";
  function split(text,maxChars){
    const words=String(text||"").trim().split(/\s+/).filter(Boolean), out=[];let line="";
    words.forEach(word=>{if((line+" "+word).trim().length>maxChars&&line){out.push(line);line=word;}else line=(line+" "+word).trim();});
    if(line)out.push(line);return out.length?out:[""];
  }
  function segments(text,duration){
    const lines=split(text,48), per=Math.max(.8,(Number(duration)||5)/lines.length);
    return lines.map((text,i)=>({text,start:i*per,end:Math.min(Number(duration)||5,(i+1)*per)}));
  }
  function draw(ctx,text,w,h,ratio){
    if(!text)return;
    const max=ratio==="9:16"?25:ratio==="1:1"?34:44, lines=split(text,max).slice(0,3);
    const font=Math.max(16,Math.round(w*(ratio==="9:16"?.043:.032)));
    ctx.save();ctx.font="600 "+font+"px system-ui, Arial, sans-serif";ctx.textAlign="center";ctx.textBaseline="middle";
    const lineH=font*1.28,pad=font*.65,boxH=lines.length*lineH+pad*2, y=h-Math.max(font*1.4,h*.075);
    const boxW=Math.min(w*.92,Math.max(...lines.map(l=>ctx.measureText(l).width))+pad*2);
    ctx.fillStyle="rgba(3,12,24,.78)";const x=(w-boxW)/2, top=y-boxH/2;
    const r=Math.min(14,pad/2);ctx.beginPath();ctx.moveTo(x+r,top);ctx.arcTo(x+boxW,top,x+boxW,top+boxH,r);ctx.arcTo(x+boxW,top+boxH,x,top+boxH,r);ctx.arcTo(x,top+boxH,x,top,r);ctx.arcTo(x,top,x+boxW,top,r);ctx.closePath();ctx.fill();
    ctx.fillStyle="#fff";lines.forEach((line,i)=>ctx.fillText(line,w/2,top+pad+lineH*(i+.5),boxW-pad));
    ctx.restore();
  }
  global.ScienceStudioSubtitles={split,segments,draw};
})(window);
