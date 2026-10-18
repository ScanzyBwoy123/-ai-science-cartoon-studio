(function(global){"use strict";
  let selectedVoice=null;
  function supported(){return !!(global.speechSynthesis&&global.SpeechSynthesisUtterance);}
  function voices(){return supported()?global.speechSynthesis.getVoices():[];}
  function preview(text,voiceName,rate){
    if(!supported())throw new Error("Speech preview is not supported by this browser.");
    global.speechSynthesis.cancel();
    const utterance=new SpeechSynthesisUtterance(String(text||"").trim());
    if(!utterance.text)throw new Error("There is no narration text to preview.");
    const match=voices().find(v=>v.name===voiceName);if(match)utterance.voice=match;
    utterance.rate=Math.max(.7,Math.min(1.3,Number(rate)||1));selectedVoice=match||null;
    global.speechSynthesis.speak(utterance);return true;
  }
  function stop(){if(supported())global.speechSynthesis.cancel();}
  function getNarration(scene){return String(scene&&(scene.narration||scene.caption||scene.onScreen)||"").trim();}
  global.ScienceStudioNarration={supported,voices,preview,stop,getNarration,getSelectedVoice:()=>selectedVoice};
})(window);
