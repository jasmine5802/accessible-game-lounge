'use strict';

let sharedAudioContext = null;

function audioContext() {
  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtor) return null;
  sharedAudioContext ||= new AudioCtor();
  if (sharedAudioContext.state === 'suspended') sharedAudioContext.resume().catch(() => {});
  return sharedAudioContext;
}

function clampPan(value) {
  return Math.max(-1, Math.min(1, Number(value) || 0));
}

function makeNoiseBuffer(context, duration) {
  const length = Math.ceil(context.sampleRate * duration);
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const samples = buffer.getChannelData(0);
  for (let index = 0; index < length; index += 1) samples[index] = Math.random() * 2 - 1;
  return buffer;
}

function playSuccessChime() {
  const context = audioContext();
  if (!context) return;
  const now = context.currentTime;
  const master = context.createGain();
  master.gain.value = 0.32;
  master.connect(context.destination);
  [523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => {
    const start = now + index * 0.105;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.7, start + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.34);
    oscillator.connect(gain).connect(master);
    oscillator.start(start); oscillator.stop(start + 0.36);
  });
}

function playWinnerFanfare() {
  const context = audioContext();
  if (!context) return;
  const now = context.currentTime;
  const notes = [392, 523.25, 659.25, 783.99, 1046.5];
  notes.forEach((frequency, index) => {
    const start = now + index * 0.13;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = index < 3 ? 'triangle' : 'sine';
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.24, start + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.55);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(start); oscillator.stop(start + 0.57);
  });
  setTimeout(() => playToneSequence([1046.5, 1318.5, 1568], 'sine', 0.1, 0.65, 0.17), 650);
}

function playErrorBuzzer() {
  const context = audioContext();
  if (!context) return;
  const now = context.currentTime;
  const distortion = context.createWaveShaper();
  const curve = new Float32Array(512);
  for (let index = 0; index < curve.length; index += 1) {
    const x = (index * 2) / (curve.length - 1) - 1;
    curve[index] = Math.tanh(4.5 * x);
  }
  distortion.curve = curve;
  distortion.oversample = '2x';
  const gain = context.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.19, now + 0.015);
  gain.gain.setValueAtTime(0.19, now + 0.28);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.52);
  distortion.connect(gain).connect(context.destination);
  [92, 117].forEach(frequency => {
    const oscillator = context.createOscillator();
    oscillator.type = 'sawtooth'; oscillator.frequency.value = frequency;
    oscillator.connect(distortion); oscillator.start(now); oscillator.stop(now + 0.54);
  });
}

function playDiceRoll() {
  const context = audioContext();
  if (!context) return;
  const now = context.currentTime;
  const count = 6 + Math.floor(Math.random() * 3);
  for (let index = 0; index < count; index += 1) {
    const progress = index / count;
    const start = now + index * (0.045 + progress * 0.018);
    const duration = 0.025 + Math.random() * 0.025;
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    const panner = context.createStereoPanner();
    source.buffer = makeNoiseBuffer(context, duration);
    filter.type = 'bandpass';
    filter.frequency.value = 900 + Math.random() * 1900;
    filter.Q.value = 2.5 + Math.random() * 4;
    panner.pan.value = Math.random() * 0.7 - 0.35;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.34 * (1 - progress * 0.55), start + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    source.connect(filter).connect(gain).connect(panner).connect(context.destination);
    source.start(start); source.stop(start + duration);
  }
}

function playCardSlide(panValue = 0) {
  const context = audioContext();
  if (!context) return;
  const now = context.currentTime;
  const duration = 0.48;
  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  const panner = context.createStereoPanner();
  source.buffer = makeNoiseBuffer(context, duration);
  filter.type = 'bandpass'; filter.Q.value = 1.1;
  filter.frequency.setValueAtTime(2600, now);
  filter.frequency.exponentialRampToValueAtTime(320, now + duration);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.24, now + 0.035);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  panner.pan.setValueAtTime(clampPan(panValue), now);
  source.connect(filter).connect(gain).connect(panner).connect(context.destination);
  source.start(now); source.stop(now + duration);
}

function playCashShuffle() {
  const context = audioContext(); if (!context) return;
  const now = context.currentTime;
  [0, .08, .16].forEach((offset, index) => {
    const source=context.createBufferSource(), filter=context.createBiquadFilter(), gain=context.createGain(), pan=context.createStereoPanner();
    source.buffer=makeNoiseBuffer(context,.16); filter.type='bandpass'; filter.frequency.value=1500+index*350; filter.Q.value=.8; pan.pan.value=-.35+index*.35;
    gain.gain.setValueAtTime(.0001,now+offset); gain.gain.exponentialRampToValueAtTime(.16,now+offset+.015); gain.gain.exponentialRampToValueAtTime(.0001,now+offset+.16);
    source.connect(filter).connect(gain).connect(pan).connect(context.destination); source.start(now+offset); source.stop(now+offset+.17);
  });
}

function playCardSwipe() {
  const context=audioContext(); if(!context)return; const now=context.currentTime;
  [880,1320].forEach((frequency,index)=>{const oscillator=context.createOscillator(), gain=context.createGain(); oscillator.type='square'; oscillator.frequency.value=frequency; gain.gain.setValueAtTime(.0001,now+index*.11); gain.gain.exponentialRampToValueAtTime(.13,now+index*.11+.008); gain.gain.exponentialRampToValueAtTime(.0001,now+index*.11+.1); oscillator.connect(gain).connect(context.destination); oscillator.start(now+index*.11); oscillator.stop(now+index*.11+.11);});
}

function playJailSlam() {
  const context=audioContext(); if(!context)return; const now=context.currentTime;
  const source=context.createBufferSource(), filter=context.createBiquadFilter(), gain=context.createGain(); source.buffer=makeNoiseBuffer(context,.7); filter.type='lowpass'; filter.frequency.setValueAtTime(1300,now); filter.frequency.exponentialRampToValueAtTime(90,now+.65); gain.gain.setValueAtTime(.48,now); gain.gain.exponentialRampToValueAtTime(.0001,now+.7); source.connect(filter).connect(gain).connect(context.destination); source.start(now); source.stop(now+.72);
  [72,111].forEach(frequency=>{const oscillator=context.createOscillator(), toneGain=context.createGain(); oscillator.type='sawtooth'; oscillator.frequency.value=frequency; toneGain.gain.setValueAtTime(.22,now); toneGain.gain.exponentialRampToValueAtTime(.0001,now+.55); oscillator.connect(toneGain).connect(context.destination); oscillator.start(now); oscillator.stop(now+.57);});
}

function playLuxuryChime(completeGroup=false) {
  const context=audioContext(); if(!context)return; const now=context.currentTime; const notes=completeGroup?[1046.5,1318.5,1568,2093]:[1046.5,1568,2093];
  notes.forEach((frequency,index)=>{const oscillator=context.createOscillator(), gain=context.createGain(); const start=now+index*.09; oscillator.type='sine'; oscillator.frequency.value=frequency; gain.gain.setValueAtTime(.0001,start); gain.gain.exponentialRampToValueAtTime(.19,start+.012); gain.gain.exponentialRampToValueAtTime(.0001,start+.48); oscillator.connect(gain).connect(context.destination); oscillator.start(start); oscillator.stop(start+.5);});
}

function playToneSequence(notes, wave = 'sine', spacing = 0.09, duration = 0.3, volume = 0.14) {
  const context=audioContext(); if(!context)return; const now=context.currentTime;
  notes.forEach((frequency,index)=>{const oscillator=context.createOscillator(),gain=context.createGain();const start=now+index*spacing;oscillator.type=wave;oscillator.frequency.setValueAtTime(frequency,start);gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(volume,start+.008);gain.gain.exponentialRampToValueAtTime(.0001,start+duration);oscillator.connect(gain).connect(context.destination);oscillator.start(start);oscillator.stop(start+duration+.02);});
}

function playPercussionTaps(frequencies, spacing = 0.1) {
  const context=audioContext(); if(!context)return; const now=context.currentTime;
  frequencies.forEach((frequency,index)=>{const oscillator=context.createOscillator(),gain=context.createGain();const start=now+index*spacing;oscillator.type='triangle';oscillator.frequency.setValueAtTime(frequency,start);oscillator.frequency.exponentialRampToValueAtTime(Math.max(45,frequency*.45),start+.09);gain.gain.setValueAtTime(.18,start);gain.gain.exponentialRampToValueAtTime(.0001,start+.11);oscillator.connect(gain).connect(context.destination);oscillator.start(start);oscillator.stop(start+.12);});
}

function playCountryCue(action) {
  if(action==='transaction') return playToneSequence([392,523.25,440], 'triangle', .12, .42, .13);
  playToneSequence([329.63,392,493.88,659.25], 'triangle', .075, .5, .16);
}

function playLatinCue(action) {
  if(action==='transaction') return playPercussionTaps([190,260,180,310,210],.075);
  playPercussionTaps([210,300,230],.07); playToneSequence([523.25,659.25,783.99,698.46], 'sawtooth', .095, .25, .08);
}

function playRetroCue(action) {
  if(action==='transaction') { playPercussionTaps([820,1180],.14); return; }
  playToneSequence([110,138.59,164.81,220,277.18], 'square', .09, .28, .1); setTimeout(()=>playPercussionTaps([950,1250],.11),180);
}

function playMallCue(action) {
  const notes=action==='transaction'?[659.25,830.61,987.77]:[523.25,659.25,783.99,1046.5];
  playToneSequence(notes,'sine',.07,.45,.15);
  if(action!=='transaction') setTimeout(()=>playToneSequence([180,225,180,270],'square',.055,.16,.055),240);
}

function playMashupCue(action) {
  if(action==='transaction') { playCashShuffle(); return; }
  playPercussionTaps([720,510,840,590,930],.065); setTimeout(()=>playCardSlide(.2),110);
}

function playNoiseBurst(duration=.3, low=300, high=2400, volume=.12) {
  const context=audioContext(); if(!context)return; const now=context.currentTime;
  const source=context.createBufferSource(),filter=context.createBiquadFilter(),gain=context.createGain();source.buffer=makeNoiseBuffer(context,duration);filter.type='bandpass';filter.frequency.setValueAtTime(high,now);filter.frequency.exponentialRampToValueAtTime(low,now+duration);gain.gain.setValueAtTime(volume,now);gain.gain.exponentialRampToValueAtTime(.0001,now+duration);source.connect(filter).connect(gain).connect(context.destination);source.start(now);source.stop(now+duration);
}

function playSpongeBobCue(action) {
  playToneSequence(action==='transaction'?[880,1174,1568]:[523,784,1047,1568],'sine',.055,.2,.11);
  setTimeout(()=>playToneSequence([420,760,1120],'sine',.06,.16,.07),120); // rising bubbles and slide whistle
}

function playFutureCue(action) {
  playPercussionTaps(action==='transaction'?[1000,1000,1000,1000]:[950,950,950,1400],.11); // clock ticks
  if(action!=='transaction') setTimeout(()=>playNoiseBurst(.38,180,5200,.2),230); // lightning crackle
}

function playPacManCue(action) {
  playToneSequence(action==='transaction'?[262,330,392,523]:[523,659,784,1047,784,1047],'square',.055,.12,.09);
}

function playNflCue(action) {
  playNoiseBurst(action==='transaction'?.45:.8,120,900,action==='transaction'?.12:.2); // crowd roar
  setTimeout(()=>playToneSequence([2350,2850],'sine',.14,.28,.12),action==='transaction'?120:260); // referee whistle
}

function playCinematicSwell(action) {
  const context=audioContext(); if(!context)return; const now=context.currentTime; const duration=action==='transaction'?.55:1;
  [98,146.83,196].forEach((frequency,index)=>{const oscillator=context.createOscillator(),gain=context.createGain();oscillator.type='sawtooth';oscillator.frequency.setValueAtTime(frequency,now);oscillator.frequency.exponentialRampToValueAtTime(frequency*1.5,now+duration);gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.055,now+duration*.7);gain.gain.exponentialRampToValueAtTime(.0001,now+duration);oscillator.connect(gain).connect(context.destination);oscillator.start(now);oscillator.stop(now+duration+.02);});
}

function playSportsCue(profile, action) {
  if(profile==='baseball') { playNoiseBurst(.1,500,5200,.2); setTimeout(()=>playToneSequence([523,659,784,1047],'square',.11,.25,.07),100); return setTimeout(()=>playToneSequence([900,620,420],'sawtooth',.08,.18,.07),310); }
  playToneSequence([2100,2600,2250],'sine',.055,.13,.08); setTimeout(()=>playNoiseBurst(.34,700,4600,.1),120); if(action!=='transaction')setTimeout(()=>playToneSequence([784,1047],'sine',.09,.22,.08),260);
}

function playFoodCue(profile, action) {
  if(profile==='fast-food') { playNoiseBurst(.45,180,1800,.12); return setTimeout(()=>playNoiseBurst(.35,2400,7200,.08),120); }
  playToneSequence([1300,1760,1420,1980],'sine',.07,.18,.06); setTimeout(()=>playNoiseBurst(action==='transaction'?.3:.55,300,1600,.045),80);
}

function playNinetiesCue(action) {
  const context=audioContext(); if(!context)return; const now=context.currentTime;
  const modem=[1200,2200,1650,2400,980,1850];
  modem.forEach((frequency,index)=>{const oscillator=context.createOscillator(),gain=context.createGain();const start=now+index*.055;oscillator.type=index%2?'square':'sine';oscillator.frequency.setValueAtTime(frequency,start);gain.gain.setValueAtTime(.06,start);gain.gain.exponentialRampToValueAtTime(.0001,start+.065);oscillator.connect(gain).connect(context.destination);oscillator.start(start);oscillator.stop(start+.07);});
  setTimeout(()=>playPercussionTaps([980,620,1120,620],.09),250); // drum machine
  if(action!=='transaction')setTimeout(()=>playToneSequence([420,520,650,820,1040],'sine',.04,.16,.055),430); // CD spin-up
}

function playAtariCue(action) {
  playToneSequence(action==='transaction'?[220,440,880,440]:[196,392,784,1568,523],'square',.045,.11,.1);
  if(action!=='transaction'){setTimeout(()=>playToneSequence([1800,1200,700,260],'square',.035,.09,.08),130);setTimeout(()=>playNoiseBurst(.28,90,4800,.16),240);}
}

function playBlockbusterCue(action) {
  const context=audioContext(); if(!context)return; const now=context.currentTime; const duration=action==='transaction'?.55:1.1;
  const bass=context.createOscillator(),bassGain=context.createGain();bass.type='sine';bass.frequency.setValueAtTime(92,now);bass.frequency.exponentialRampToValueAtTime(38,now+duration);bassGain.gain.setValueAtTime(.25,now);bassGain.gain.exponentialRampToValueAtTime(.0001,now+duration);bass.connect(bassGain).connect(context.destination);bass.start(now);bass.stop(now+duration+.02);
  [880,1174,1568].forEach((frequency,index)=>{const oscillator=context.createOscillator(),gain=context.createGain();oscillator.type='sawtooth';oscillator.frequency.setValueAtTime(frequency,now);oscillator.frequency.exponentialRampToValueAtTime(frequency*1.35,now+duration);gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.035,now+duration*.72);gain.gain.exponentialRampToValueAtTime(.0001,now+duration);oscillator.connect(gain).connect(context.destination);oscillator.start(now);oscillator.stop(now+duration+.02);});
}

function playClassicCartoonCue(action) {
  playToneSequence(action==='transaction'?[520,820,1180,760]:[420,680,1040,1540,920],'sine',.055,.2,.1); // slide whistle
  setTimeout(()=>playToneSequence([523,659,784,1047,784,659,523],'triangle',.045,.16,.075),150); // xylophone roll
  if(action!=='transaction')setTimeout(()=>{playToneSequence([900,520,240,110],'sine',.045,.2,.1);playNoiseBurst(.14,90,1800,.1);},380); // slip and fall
}

function playVintageTvCue(action) {
  playToneSequence([233,311,277,208],'sine',.14,.38,.09); // spooky four-note motif
  setTimeout(()=>{playToneSequence([196,247,294],'square',0,.45,.035);playToneSequence([247,311,370],'square',0,.45,.03);},180); // analog organ chord
  setTimeout(()=>playNoiseBurst(action==='transaction'?.25:.5,80,4200,.055),300); // television static
}

function playTvHitsCue(action) {
  playToneSequence(action==='transaction'?[82,123,98,147]:[82,110,147,98,165],'square',.075,.22,.11); // slap bass riff
  setTimeout(()=>playToneSequence([523,659,784,1047],'sawtooth',.045,.18,.065),180); // brass stabs
}

function playColaCue(action) {
  playToneSequence([180,980],'sine',.025,.12,.12); // bottle pop
  setTimeout(()=>playNoiseBurst(action==='transaction'?.28:.5,2200,7600,.07),70); // carbonation
  if(action!=='transaction')setTimeout(()=>playToneSequence([1550,2100,1720],'sine',.055,.2,.065),220); // ice clinks
}

function playChocolateCue(action) {
  playToneSequence(action==='transaction'?[784,1047,1319]:[659,831,1047,1319,1568],'sine',.075,.42,.12);
  setTimeout(()=>playNoiseBurst(action==='transaction'?.2:.38,1400,6400,.055),140); // foil unwrap
}

function playFishingCue(action) {
  playNoiseBurst(action==='transaction'?.25:.5,120,3200,.13); // water splash
  setTimeout(()=>playPercussionTaps(action==='transaction'?[720,820,760]:[640,760,880,760,920],.065),150); // reel clicks
}

function playIceCreamCue(action) {
  playToneSequence(action==='transaction'?[659,784,880]:[523,659,784,1047,880,659],'triangle',.12,.42,.105);
  if(action!=='transaction')setTimeout(()=>playNoiseBurst(.35,90,1100,.07),300); // wet scoop
}

function playBurgerCue(action) {
  playNoiseBurst(action==='transaction'?.35:.55,180,2600,.12); // sizzling patties
  setTimeout(()=>playNoiseBurst(.12,500,4200,.1),120); // spatula flip
  setTimeout(()=>playToneSequence([1760,2349],'sine',.07,.3,.1),action==='transaction'?210:330); // order bell
}

function playNfbCue(action) {
  playPercussionTaps(action==='transaction'?[1100,1500,1100]:[900,1300,1700,1300],.065); // tactile navigation clicks
  if(action!=='transaction')setTimeout(()=>playToneSequence([261.63,329.63,392,523.25],'triangle',.13,.65,.13),180); // warm piano win
}

function playLegoCue(action) {
  playPercussionTaps(action==='transaction'?[760,980,820]:[680,920,760,1100,860],.055);
  if(action!=='transaction')setTimeout(()=>playPercussionTaps([1200,940,1280],.045),190);
}

function playCoffeeCue(action) {
  playNoiseBurst(action==='transaction'?.35:.55,1800,7200,.07); // steaming milk
  setTimeout(()=>playToneSequence([1280,1760,1450],'sine',.055,.2,.065),140); // ceramic clinks
}

function playCookieCue(action) {
  playNoiseBurst(.12,180,3600,.16);setTimeout(()=>playNoiseBurst(.1,240,4800,.14),70);setTimeout(()=>playNoiseBurst(action==='transaction'?.1:.18,140,2600,.13),135);
}

function playCakeCue(action) {
  playNoiseBurst(.18,500,6200,.08); // slicing swish
  setTimeout(()=>playToneSequence(action==='transaction'?[420,620]:[330,520,760],'sawtooth',.09,.34,.09),140); // party horn
}

function playCandyCue(action) {
  playToneSequence(action==='transaction'?[520,760,980]:[420,680,920,1180,860],'sine',.055,.16,.12);
  setTimeout(()=>playNoiseBurst(.12,90,900,.07),130); // squishy pop
}

function playVehicleCue(action) {
  const context=audioContext();if(!context)return;const now=context.currentTime;const engine=context.createOscillator(),gain=context.createGain();engine.type='sawtooth';engine.frequency.setValueAtTime(58,now);engine.frequency.exponentialRampToValueAtTime(action==='transaction'?105:170,now+.55);gain.gain.setValueAtTime(.13,now);gain.gain.exponentialRampToValueAtTime(.0001,now+.62);engine.connect(gain).connect(context.destination);engine.start(now);engine.stop(now+.64);setTimeout(()=>playNoiseBurst(.26,1200,6200,.1),320); // tire screech
}

function playFullHouseCue(action) {
  playToneSequence(action==='transaction'?[196,247,294]:[196,247,294,392,330],'triangle',.085,.38,.11); // upbeat guitar
  if(action!=='transaction')[220,300,380].forEach(delay=>setTimeout(()=>playNoiseBurst(.12,280,1700,.045),delay)); // synthesized laugh-track bursts
}

function playHorseCue(action) {
  playPercussionTaps(action==='transaction'?[180,240,180,240]:[170,230,170,230,190,250],.105); // clopping hooves
  if(action!=='transaction')setTimeout(()=>playToneSequence([520,760,620,900,680],'sawtooth',.075,.24,.07),280); // whinny
}

function playLibraryThemeCue(profile, action) {
  if (profile === 'train') {
    playPercussionTaps(action === 'transaction' ? [150, 210, 150, 210] : [140, 205, 140, 205, 160, 225], .11); // rail clatter
    return setTimeout(() => playToneSequence([740, 622, 740], 'sine', .16, .5, .12), 260); // train whistle
  }
  if (profile === 'vegas' || profile === 'vegas-slots') {
    playPercussionTaps(action === 'transaction' ? [1450, 1100, 1580] : [1700, 1320, 1880, 1460, 2050], .065); // roulette and slot clicks
    return setTimeout(() => playToneSequence([523, 659, 784, 1047], 'square', .055, .16, .07), 150);
  }
  if (profile === 'austin' || profile === 'texas') {
    playToneSequence(action === 'transaction' ? [196, 247, 294] : [196, 247, 294, 392, 330], 'triangle', .075, .36, .12); // guitar strum
    return setTimeout(() => playPercussionTaps([170, 240, 190], .09), 150);
  }
  if (profile === 'mexican') {
    playPercussionTaps([220, 310, 240, 350], .07);
    return playToneSequence(action === 'transaction' ? [523, 659, 587] : [523, 659, 784, 698, 880], 'sawtooth', .08, .25, .075);
  }
  if (profile === 'magic' || profile === 'theme-park') {
    playToneSequence(action === 'transaction' ? [659, 784, 1047] : [523, 659, 784, 1047, 1319], 'sine', .065, .42, .12);
    if (profile === 'theme-park') setTimeout(() => playNoiseBurst(.32, 500, 3200, .045), 180); // distant ride rush
    return;
  }
  if (profile === 'cartoon' || profile === 'cartoon-mystery' || profile === 'stone-age' || profile === 'space-age') return playClassicCartoonCue(action);
  if (profile === 'harbor' || profile === 'city-coast') {
    playToneSequence([220, 196], 'sine', .18, .55, .1); // harbor horn
    return setTimeout(() => playNoiseBurst(action === 'transaction' ? .25 : .48, 350, 2500, .04), 120);
  }
  if (profile === 'mountain') return playToneSequence(action === 'transaction' ? [294, 440, 370] : [294, 370, 440, 587], 'triangle', .13, .5, .12);
  if (profile === 'neon') return playToneSequence(action === 'transaction' ? [440, 659, 880] : [110, 220, 440, 880], 'square', .075, .22, .08);
  // Regional city profiles share a short transit bell and street ambience.
  playToneSequence(action === 'transaction' ? [784, 1047] : [523, 659, 784], 'sine', .08, .28, .09);
  setTimeout(() => playNoiseBurst(.24, 500, 2400, .035), 100);
}

const libraryThemeProfiles = ['city-west','city-bay','city-coast','harbor','vegas','vegas-slots','austin','texas','mountain','theme-park','neon','city-south','city-east','mexican','magic','cartoon-mystery','stone-age','space-age','cartoon','train'];

function playThemedCue(profile, action) {
  if(profile==='disney') return playToneSequence(action==='transaction'?[784,1047,1319]:[523,659,784,1047,1568],'sine',.06,.42,.13);
  if(profile==='spongebob') return playSpongeBobCue(action);
  if(profile==='future') return playFutureCue(action);
  if(profile==='godfather') return playToneSequence(action==='transaction'?[196,185,164]:[146,196,220,185],'sawtooth',.16,.55,.06);
  if(profile==='animal') return playToneSequence(action==='transaction'?[659,784,880]:[523,659,784,1047],'triangle',.09,.32,.12);
  if(profile==='pacman') return playPacManCue(action);
  if(profile==='parks') { playToneSequence(action==='transaction'?[880,1174]:[784,988,1319,1174],'sine',.16,.48,.09); return setTimeout(()=>playNoiseBurst(.3,700,2200,.035),130); }
  if(profile==='nfl') return playNflCue(action);
  if(profile==='harley') { playToneSequence(action==='transaction'?[62,72,68]:[55,65,82,73],'sawtooth',.07,.45,.1); return setTimeout(()=>playNoiseBurst(.35,70,420,.1),80); }
  if(profile==='classic-tv') return playToneSequence(action==='transaction'?[392,523,659]:[262,330,392,523,659],'triangle',.11,.35,.1);
  if(profile==='eighties') { playToneSequence([82,110,138,165,220],'square',.08,.26,.09); return setTimeout(()=>playPercussionTaps([980,1280],.13),170); }
  if(profile==='cinema') return playCinematicSwell(action);
  if(profile==='baseball'||profile==='basketball') return playSportsCue(profile,action);
  if(profile==='fast-food'||profile==='restaurant') return playFoodCue(profile,action);
  if(profile==='california') return playNoiseBurst(action==='transaction'?.6:1.1,110,2600,.12);
  if(profile==='north-carolina') return playToneSequence(action==='transaction'?[294,440,370]:[294,370,440,587],'triangle',.13,.5,.12);
  if(profile==='nineties') return playNinetiesCue(action);
  if(profile==='atari') return playAtariCue(action);
  if(profile==='cinematic-blockbusters') return playBlockbusterCue(action);
  if(profile==='classic-cartoons') return playClassicCartoonCue(action);
  if(profile==='vintage-tv') return playVintageTvCue(action);
  if(profile==='tv-hits') return playTvHitsCue(action);
  if(profile==='state') { playToneSequence(action==='transaction'?[392,523,659]:[262,392,523,784],'triangle',.1,.35,.09); return setTimeout(()=>playNoiseBurst(.32,180,1800,.04),150); }
  if(profile==='cola') return playColaCue(action);
  if(profile==='chocolate') return playChocolateCue(action);
  if(profile==='fishing') return playFishingCue(action);
  if(profile==='ice-cream') return playIceCreamCue(action);
  if(profile==='burger') return playBurgerCue(action);
  if(profile==='nfb') return playNfbCue(action);
  if(profile==='lego') return playLegoCue(action);
  if(profile==='coffee') return playCoffeeCue(action);
  if(profile==='cookie') return playCookieCue(action);
  if(profile==='cake') return playCakeCue(action);
  if(profile==='candy') return playCandyCue(action);
  if(profile==='vehicles') return playVehicleCue(action);
  if(profile==='full-house') return playFullHouseCue(action);
  if(profile==='horse') return playHorseCue(action);
  if(libraryThemeProfiles.includes(profile)) return playLibraryThemeCue(profile, action);
  return false;
}

function playMonopolyEditionCue(edition, action) {
  const profile = window.MonopolyBoards?.audioProfiles?.[edition] || 'standard';
  if(profile==='country') return playCountryCue(action);
  if(profile==='latin') return playLatinCue(action);
  if(profile==='retro') return playRetroCue(action);
  if(profile==='mall') return playMallCue(action);
  if(profile==='mashup') return playMashupCue(action);
  if(['disney','spongebob','future','godfather','animal','pacman','parks','nfl','harley','classic-tv','eighties','cinema','baseball','basketball','fast-food','restaurant','california','north-carolina','nineties','atari','cinematic-blockbusters','classic-cartoons','vintage-tv','tv-hits','state','cola','chocolate','fishing','ice-cream','burger','nfb','lego','coffee','cookie','cake','candy','vehicles','full-house','horse',...libraryThemeProfiles].includes(profile)) return playThemedCue(profile,action);
  if(action==='transaction') return profile==='electronic' ? playCardSwipe() : playCashShuffle();
  return playLuxuryChime(action==='group');
}

function playUnoCardSlide(panValue=.7){const context=audioContext();if(!context)return;const now=context.currentTime,source=context.createBufferSource(),filter=context.createBiquadFilter(),gain=context.createGain(),panner=context.createStereoPanner();source.buffer=makeNoiseBuffer(context,.32);filter.type='bandpass';filter.frequency.value=1500;gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.14,now+.025);gain.gain.exponentialRampToValueAtTime(.0001,now+.32);panner.pan.setValueAtTime(-.85,now);panner.pan.linearRampToValueAtTime(clampPan(panValue),now+.3);source.connect(filter).connect(gain).connect(panner).connect(context.destination);source.start(now);source.stop(now+.33)}
function playUnoFlip(){const context=audioContext();if(!context)return;const now=context.currentTime,source=context.createBufferSource(),filter=context.createBiquadFilter(),gain=context.createGain(),panner=context.createStereoPanner();source.buffer=makeNoiseBuffer(context,.65);filter.type='bandpass';filter.frequency.setValueAtTime(300,now);filter.frequency.exponentialRampToValueAtTime(3800,now+.32);filter.frequency.exponentialRampToValueAtTime(420,now+.64);gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.2,now+.12);gain.gain.exponentialRampToValueAtTime(.0001,now+.65);panner.pan.setValueAtTime(-1,now);panner.pan.linearRampToValueAtTime(1,now+.65);source.connect(filter).connect(gain).connect(panner).connect(context.destination);source.start(now);source.stop(now+.66)}
function playUnoWarning(){playToneSequence([880,660,880,440],'square',.1,.22,.09)}
function playUnoLauncher(amount=0){const context=audioContext();if(!context)return;const now=context.currentTime,osc=context.createOscillator(),gain=context.createGain(),pan=context.createStereoPanner();osc.type='sawtooth';osc.frequency.setValueAtTime(75,now);osc.frequency.exponentialRampToValueAtTime(160,now+.65);gain.gain.setValueAtTime(.12,now);gain.gain.exponentialRampToValueAtTime(.0001,now+.72);pan.pan.setValueAtTime(-.5,now);pan.pan.linearRampToValueAtTime(.5,now+.7);osc.connect(gain).connect(pan).connect(context.destination);osc.start(now);osc.stop(now+.74);for(let i=0;i<Number(amount);i+=1)setTimeout(()=>playPercussionTaps([700+i*35],.05),180+i*65)}

function playDuckQuack(panValue = 0) {
  const context = audioContext();
  if (!context) return;
  const now = context.currentTime;
  const duration = 0.42;
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  const panner = context.createStereoPanner();
  filter.type = 'bandpass'; filter.frequency.value = 920; filter.Q.value = 6.5;
  panner.pan.value = clampPan(panValue);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.24, now + 0.018);
  gain.gain.exponentialRampToValueAtTime(0.055, now + 0.15);
  gain.gain.exponentialRampToValueAtTime(0.19, now + 0.21);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  filter.connect(gain).connect(panner).connect(context.destination);
  [236, 244].forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(frequency + index * 2, now);
    oscillator.frequency.exponentialRampToValueAtTime(155 + index * 3, now + duration);
    oscillator.connect(filter); oscillator.start(now); oscillator.stop(now + duration);
  });
}

function playDuckSplash(panValue = 0) {
  const context = audioContext(); if (!context) return;
  const now = context.currentTime, source = context.createBufferSource(), filter = context.createBiquadFilter(), gain = context.createGain(), panner = context.createStereoPanner();
  source.buffer = makeNoiseBuffer(context, .48); filter.type = 'lowpass'; filter.frequency.setValueAtTime(2600, now); filter.frequency.exponentialRampToValueAtTime(320, now + .46); gain.gain.setValueAtTime(.0001, now); gain.gain.exponentialRampToValueAtTime(.2, now + .025); gain.gain.exponentialRampToValueAtTime(.0001, now + .48); panner.pan.value = clampPan(panValue); source.connect(filter).connect(gain).connect(panner).connect(context.destination); source.start(now); source.stop(now + .5);
}

function playFeatherRustle(panValue = 0) {
  const context = audioContext(); if (!context) return;
  const now = context.currentTime, source = context.createBufferSource(), filter = context.createBiquadFilter(), gain = context.createGain(), panner = context.createStereoPanner();
  source.buffer = makeNoiseBuffer(context, .55); filter.type = 'highpass'; filter.frequency.value = 2800; gain.gain.setValueAtTime(.0001, now); gain.gain.exponentialRampToValueAtTime(.07, now + .06); gain.gain.exponentialRampToValueAtTime(.0001, now + .55); panner.pan.setValueAtTime(clampPan(panValue) - .15, now); panner.pan.linearRampToValueAtTime(clampPan(panValue) + .15, now + .5); source.connect(filter).connect(gain).connect(panner).connect(context.destination); source.start(now); source.stop(now + .56);
}

function playMudSquelch(panValue = 0) {
  const context = audioContext(); if (!context) return;
  const now = context.currentTime, oscillator = context.createOscillator(), gain = context.createGain(), panner = context.createStereoPanner();
  oscillator.type = 'sawtooth'; oscillator.frequency.setValueAtTime(115, now); oscillator.frequency.exponentialRampToValueAtTime(48, now + .38); gain.gain.setValueAtTime(.16, now); gain.gain.exponentialRampToValueAtTime(.0001, now + .42); panner.pan.value = clampPan(panValue); oscillator.connect(gain).connect(panner).connect(context.destination); oscillator.start(now); oscillator.stop(now + .43);
}

function playHorseHoofbeats(panValue = 0) {
  const context = audioContext(); if (!context) return;
  const now = context.currentTime;
  [0, .1, .23, .33].forEach((offset, index) => { const oscillator = context.createOscillator(), gain = context.createGain(), panner = context.createStereoPanner(); oscillator.type = 'triangle'; oscillator.frequency.value = index % 2 ? 92 : 118; gain.gain.setValueAtTime(.16, now + offset); gain.gain.exponentialRampToValueAtTime(.0001, now + offset + .075); panner.pan.value = clampPan(panValue); oscillator.connect(gain).connect(panner).connect(context.destination); oscillator.start(now + offset); oscillator.stop(now + offset + .08); });
}

function playHorseNeigh(panValue = 0) {
  const context = audioContext(); if (!context) return;
  const now = context.currentTime, oscillator = context.createOscillator(), filter = context.createBiquadFilter(), gain = context.createGain(), panner = context.createStereoPanner();
  oscillator.type = 'sawtooth'; oscillator.frequency.setValueAtTime(310, now); oscillator.frequency.exponentialRampToValueAtTime(520, now + .18); oscillator.frequency.exponentialRampToValueAtTime(190, now + .72); filter.type = 'bandpass'; filter.frequency.value = 900; filter.Q.value = 3; gain.gain.setValueAtTime(.0001, now); gain.gain.exponentialRampToValueAtTime(.12, now + .04); gain.gain.exponentialRampToValueAtTime(.0001, now + .76); panner.pan.value = clampPan(panValue); oscillator.connect(filter).connect(gain).connect(panner).connect(context.destination); oscillator.start(now); oscillator.stop(now + .78);
}

function playRaceChallenge() { playToneSequence([523, 659, 784], 'triangle', .09, .24, .1); }

window.playSuccessChime = playSuccessChime;
window.playWinnerFanfare = playWinnerFanfare;
window.playErrorBuzzer = playErrorBuzzer;
window.playDiceRoll = playDiceRoll;
window.playCardSlide = playCardSlide;
window.playCashShuffle = playCashShuffle;
window.playCardSwipe = playCardSwipe;
window.playJailSlam = playJailSlam;
window.playLuxuryChime = playLuxuryChime;
window.playMonopolyEditionCue = playMonopolyEditionCue;
window.playUnoCardSlide = playUnoCardSlide;
window.playUnoFlip = playUnoFlip;
window.playUnoWarning = playUnoWarning;
window.playUnoLauncher = playUnoLauncher;
window.playDuckQuack = playDuckQuack;
window.playDuckSplash = playDuckSplash;
window.playFeatherRustle = playFeatherRustle;
window.playMudSquelch = playMudSquelch;
window.playHorseHoofbeats = playHorseHoofbeats;
window.playHorseNeigh = playHorseNeigh;
window.playRaceChallenge = playRaceChallenge;

// Prime audio after the first user gesture so later synchronized remote cues can play.
function unlockAudio() { audioContext(); }
window.addEventListener('pointerdown', unlockAudio, { once: true });
window.addEventListener('keydown', unlockAudio, { once: true });
