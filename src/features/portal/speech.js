// Only explicitly requested, already-authorized activity text reaches this reader.
export function createActivityReader(env, notify) {
  let generation = 0, chunks = [], index = 0;
  const synth = env.speechSynthesis;
  const supported = !!synth && typeof env.SpeechSynthesisUtterance === 'function';
  function stop(silent = false) { generation++; chunks = []; index = 0; if (supported) { try { synth.cancel(); } catch { /* Remain usable without speech. */ } } if (!silent) notify({ mode: 'idle', message: 'Lectura detenida.' }); }
  function start(text, rate = 0.9) {
    stop(true);
    if (!supported) { notify({ mode: 'unavailable', message: 'Este navegador no permite leer en voz alta. Podés seguir leyendo las instrucciones en pantalla.' }); return; }
    let voice; try { voice = synth.getVoices().find(v => v.localService === true && /^es(?:-|$)/i.test(v.lang)); } catch { /* Fallback below. */ }
    if (!voice) { notify({ mode: 'unavailable', message: 'No hay una voz local en español disponible. Activá una voz de español en tu dispositivo y volvé a intentar. El texto sigue disponible.' }); return; }
    chunks = String(text).match(/[\s\S]{1,260}(?:\s|$)|[\s\S]{1,260}/g) || [];
    const current = generation;
    function speakNext() {
      if (current !== generation) return;
      if (index >= chunks.length) { notify({ mode: 'idle', message: 'Lectura finalizada.' }); return; }
      const utterance = new env.SpeechSynthesisUtterance(chunks[index++]); utterance.voice = voice; utterance.lang = voice.lang; utterance.rate = Number(rate);
      utterance.onend = speakNext;
      utterance.onerror = () => { if (current === generation) { stop(true); notify({ mode: 'unavailable', message: 'No se pudo completar la lectura. Las instrucciones siguen en pantalla.' }); } };
      try { synth.speak(utterance); notify({ mode: 'reading', message: 'Leyendo la actividad.' }); } catch { stop(true); notify({ mode: 'unavailable', message: 'No se pudo iniciar la lectura. El texto sigue disponible.' }); }
    }
    speakNext();
  }
  return { supported, start, stop, pause() { if (supported) { try { synth.pause(); notify({ mode: 'paused', message: 'Lectura en pausa.' }); } catch { stop(); } } }, resume() { if (supported) { try { synth.resume(); notify({ mode: 'reading', message: 'Lectura reanudada.' }); } catch { stop(); } } } };
}
