// Speech stays on this device. Remote voices never receive activity text.
export function spanishVoices(synth) {
  try { return synth.getVoices().filter(v=>v.localService===true && /^es(?:-|$)/i.test(v.lang)); } catch { return []; }
}
export function voiceKey(voice) { return voice.voiceURI || `${voice.name || 'Español'}|${voice.lang}`; }
export function selectVoice(voices, preferred='auto') {
  const local=voices.filter(v=>v.localService===true && /^es(?:-|$)/i.test(v.lang));
  const chosen=local.find(v=>voiceKey(v)===preferred);if(chosen)return chosen;
  const score=v=>(/natural|neural|enhanced|premium/i.test(v.name||'')?50:0)+({'es-ni':35,'es-mx':30,'es-us':25,'es-cr':24,'es-es':20}[v.lang.toLowerCase()]||15)+(v.default?3:0);
  return [...local].sort((a,b)=>score(b)-score(a))[0];
}
export function speechChunks(text,max=260) {
  const chunks=[];let rest=String(text);
  while(rest.length>max){const part=rest.slice(0,max);let cut=0;for(const m of part.matchAll(/[.!?;:\n](?:\s+|$)/g))cut=m.index+m[0].length;if(cut<max*.35)cut=part.lastIndexOf(' ')+1;if(cut<max*.35)cut=max;chunks.push(rest.slice(0,cut));rest=rest.slice(cut);}
  if(rest)chunks.push(rest);return chunks;
}
export function createActivityReader(env, notify) {
  let generation=0,chunks=[],index=0;
  const synth=env.speechSynthesis,supported=!!synth&&typeof env.SpeechSynthesisUtterance==='function';
  function stop(silent=false){generation++;chunks=[];index=0;if(supported)try{synth.cancel();}catch{}if(!silent)notify({mode:'idle',message:'Lectura detenida.'});}
  function start(text,rate=1,preferred='auto'){
    stop(true);
    if(!supported){notify({mode:'unavailable',message:'Este navegador no permite leer en voz alta. Podés seguir leyendo las instrucciones en pantalla.'});return;}
    const voice=selectVoice(spanishVoices(synth),preferred);
    if(!voice){notify({mode:'unavailable',message:'No hay una voz local en español disponible. Activá una voz de español en tu dispositivo y volvé a intentar. El texto sigue disponible.'});return;}
    chunks=speechChunks(text);const current=generation,speed=Number(rate);
    function speakNext(){
      if(current!==generation)return;
      if(index>=chunks.length){notify({mode:'idle',message:'Lectura finalizada.'});return;}
      const utterance=new env.SpeechSynthesisUtterance(chunks[index++]);utterance.voice=voice;utterance.lang=voice.lang;utterance.rate=Number.isFinite(speed)?Math.min(1.1,Math.max(.7,speed)):1;utterance.pitch=1;utterance.volume=1;
      utterance.onend=speakNext;
      utterance.onerror=()=>{if(current===generation){stop(true);notify({mode:'unavailable',message:'No se pudo completar la lectura. Las instrucciones siguen en pantalla.'});}};
      try{synth.speak(utterance);notify({mode:'reading',message:'Leyendo en voz alta.'});}catch{stop(true);notify({mode:'unavailable',message:'No se pudo iniciar la lectura. El texto sigue disponible.'});}
    }
    speakNext();
  }
  return{supported,start,stop,pause(){if(supported)try{synth.pause();notify({mode:'paused',message:'Lectura en pausa.'});}catch{stop();}},resume(){if(supported)try{synth.resume();notify({mode:'reading',message:'Lectura reanudada.'});}catch{stop();}}};
}
