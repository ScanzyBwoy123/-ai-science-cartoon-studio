(function(global){"use strict";
  const DEFAULTS={fps:30,transition:.65,maxDimension:1920};
  const $=id=>document.getElementById(id);
  function project(){if(!global.ScienceStudio||typeof global.ScienceStudio.getCurrentProject!=="function")throw new Error("The website project bridge is not connected. Follow integration-guide.md.");return global.ScienceStudio.getCurrentProject();}
  function dims(ratio){if(ratio==="9:16")return {width:720,height:1280};if(ratio==="1:1")return {width:1080,height:1080};return {width:1280,height:720};}
  function supportedMime(){
    if(!global.MediaRecorder)return null;
    const types=["video/mp4;codecs=h264,aac","video/mp4","video/webm;codecs=vp9,opus","video/webm;codecs=vp8,opus","video/webm"];
    return types.find(t=>MediaRecorder.isTypeSupported&&MediaRecorder.isTypeSupported(t))||"";
  }
  function ext(mime){return mime&&mime.toLowerCase().includes("mp4")?".mp4":".webm";}
  function loadImage(scene,index){
    return new Promise((resolve,reject)=>{
      const src=scene.imageData||scene.imageUrl||scene.image||scene.generatedImage;
      if(!src)return reject(new Error('Scene '+(index+1)+' (“'+(scene.title||"Untitled")+'”) has no generated image. Generate or upload an image before rendering.'));
      const img=new Image();img.crossOrigin="anonymous";
      img.onload=()=>img.naturalWidth?resolve(img):reject(new Error("Scene "+(index+1)+" image is empty."));
      img.onerror=()=>reject(new Error("Could not load image for scene "+(index+1)+". Check the image data/URL and browser access permissions."));
      img.src=src;
    });
  }
  function sceneTitle(ctx,title,w,h,ratio){
    if(!title)return;const fs=Math.max(20,Math.round(w*(ratio==="9:16"?.05:.038)));
    ctx.save();ctx.font="700 "+fs+"px system-ui,Arial";ctx.textAlign="center";ctx.textBaseline="top";
    const maxW=w*.88, words=String(title).split(/\s+/), lines=[];let line="";
    words.forEach(word=>{const test=(line+" "+word).trim();if(ctx.measureText(test).width>maxW&&line){lines.push(line);line=word;}else line=test;});if(line)lines.push(line);
    const shown=lines.slice(0,2), pad=fs*.45, lh=fs*1.2, bh=shown.length*lh+pad*2, bw=Math.min(maxW,Math.max(...shown.map(s=>ctx.measureText(s).width))+pad*2), x=(w-bw)/2;
    ctx.fillStyle="rgba(4,14,27,.75)";ctx.fillRect(x,h*.045,bw,bh);ctx.fillStyle="#fff";shown.forEach((s,i)=>ctx.fillText(s,w/2,h*.045+pad+i*lh,w*.86));ctx.restore();
  }
  async function render(options={}){
    const ui=options.ui||{}, update=(p,s)=>{if(ui.progress)ui.progress.value=p;if(ui.progressFill)ui.progressFill.style.width=p+"%";if(ui.status)ui.status.textContent=s;if(ui.percent)ui.percent.textContent=Math.round(p)+"%";};
    let recorder,stream,raf=0,videoUrl=null;
    try{
      if(!global.MediaRecorder)throw new Error("This browser does not support MediaRecorder video recording. Try a recent desktop Chrome or Edge browser.");
      const p=project();if(!p)throw new Error("Create or open a project first.");
      const scenes=Array.isArray(p.scenes)?p.scenes:[];
      if(!scenes.length)throw new Error("This project has no scenes.");
      const ratio=options.ratio||p.format||p.aspectRatio||"16:9";if(!["9:16","16:9","1:1"].includes(ratio))throw new Error("Unsupported aspect ratio: "+ratio);
      update(2,"Checking browser recording support…");
      const mime=supportedMime();if(!mime)throw new Error("This browser does not report support for MP4 or WebM MediaRecorder output. No video was created.");
      const loaded=[];
      for(let i=0;i<scenes.length;i++){update(4+16*i/scenes.length,"Loading scene "+(i+1)+" of "+scenes.length+"…");loaded.push(await loadImage(scenes[i],i));}
      const {width,height}=dims(ratio),canvas=document.createElement("canvas");canvas.width=width;canvas.height=height;
      const ctx=canvas.getContext("2d",{alpha:false});if(!ctx)throw new Error("Canvas 2D is unavailable.");
      stream=canvas.captureStream(DEFAULTS.fps);
      recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:5_000_000});
      const chunks=[];let recorderError=null;
      recorder.ondataavailable=e=>{if(e.data&&e.data.size)chunks.push(e.data);};
      recorder.onerror=e=>{recorderError=e.error||new Error("The browser recorder failed.");};
      const stopped=new Promise((resolve,reject)=>{recorder.onstop=()=>recorderError?reject(recorderError):resolve();});
      recorder.start(1000);update(20,"Rendering scenes…");
      const durations=scenes.map(s=>Math.max(1,Math.min(60,Number(s.duration)||5)));
      const total=durations.reduce((a,b)=>a+b,0), transition=Math.min(DEFAULTS.transition,Math.min(...durations)/3);
      let elapsed=0,last=0;
      for(let i=0;i<scenes.length;i++){
        const scene=scenes[i],img=loaded[i],duration=durations[i],start=performance.now();
        const motion=String(scene.camera||"").toLowerCase().includes("left")?"panLeft":String(scene.camera||"").toLowerCase().includes("right")?"panRight":String(scene.camera||"").toLowerCase().includes("up")?"panUp":String(scene.camera||"").toLowerCase().includes("down")?"panDown":String(scene.camera||"").toLowerCase().includes("out")?"zoomOut":"cinematic";
        await new Promise(resolve=>{
          const frame=now=>{
            const t=Math.min(1,(now-start)/(duration*1000));ctx.fillStyle="#07111f";ctx.fillRect(0,0,width,height);
            const fadeIn=i===0?1:Math.min(1,(now-start)/(transition*1000));
            const fadeOut=i===scenes.length-1?1:Math.min(1,(duration*1000-(now-start))/(transition*1000));
            const alpha=Math.max(0,Math.min(fadeIn,fadeOut));
            global.ScienceStudioAnimation.draw(ctx,img,width,height,motion,t,alpha);
            sceneTitle(ctx,scene.title,width,height,ratio);
            const narr=global.ScienceStudioNarration.getNarration(scene),subs=global.ScienceStudioSubtitles.segments(narr,duration);
            const local=(now-start)/1000,seg=subs.find(x=>local>=x.start&&local<x.end)||subs[subs.length-1];
            if(seg&&seg.text)global.ScienceStudioSubtitles.draw(ctx,seg.text,width,height,ratio);
            elapsed=durations.slice(0,i).reduce((a,b)=>a+b,0)+t*duration;
            const progress=20+78*(elapsed/total);if(progress-last>=.35||t===1){last=progress;update(progress,"Rendering scene "+(i+1)+" of "+scenes.length+"…");}
            if(t<1)raf=requestAnimationFrame(frame);else resolve();
          };raf=requestAnimationFrame(frame);
        });
      }
      cancelAnimationFrame(raf);recorder.stop();await stopped;
      const blob=new Blob(chunks,{type:recorder.mimeType||mime});if(!blob.size)throw new Error("The browser recorder returned an empty file. Try a different browser or shorter video.");
      videoUrl=URL.createObjectURL(blob);
      const filename=(String(p.title||p.name||"science-video").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")||"science-video")+ext(blob.type||mime);
      if(ui.preview){ui.preview.src=videoUrl;ui.preview.load();}
      if(ui.download){ui.download.href=videoUrl;ui.download.download=filename;ui.download.hidden=false;}
      update(100,"Video ready: "+filename+". Format: "+(ext(blob.type||mime)===".mp4"?"MP4":"WebM")+". Browser speech preview is not embedded as audio.");
      return {blob,url:videoUrl,filename,mime:blob.type||mime,hasNarrationAudio:false};
    }catch(error){cancelAnimationFrame(raf);if(recorder&&recorder.state!=="inactive"){try{recorder.stop();}catch{}}if(videoUrl)URL.revokeObjectURL(videoUrl);update(0,"Rendering failed: "+(error.message||String(error)));throw error;
    }finally{if(stream)stream.getTracks().forEach(t=>t.stop());}
  }
  function connect(options={}){
    const ui={progress:$("rendererProgress"),progressFill:$("rendererProgressFill"),status:$("rendererStatus"),percent:$("rendererPercent"),preview:$("rendererPreview"),download:$("rendererDownload"),...(options.ui||{})};
    const button=$(options.buttonId||"renderVideoButton");if(!button)return false;
    if(button.dataset.rendererBound==="1")return true;button.dataset.rendererBound="1";
    button.addEventListener("click",async()=>{button.disabled=true;ui.download&&(ui.download.hidden=true);try{await render({ratio:$(options.ratioId||"rendererFormat")?.value,ui});}catch(e){/* status already displays the message */}finally{button.disabled=false;}});
    return true;
  }
  global.ScienceStudioVideoRenderer={render,connect,supportedMime,dimensions:dims};
})(window);
