/**
 * VOID WHISPERS: Procedural Audio System for slowhell.xyz
 * 
 * An ambient sound generator that creates ethereal, haunting soundscapes
 * with angelic overtones and subtle dissonance.
 */

class VoidWhispers {
  constructor() {
    // Initialize Web Audio API context
    this.audioContext = null;
    this.masterGain = null;
    this.reverbNode = null;
    
    // Sound generation parameters
    this.activeVoices = [];
    this.maxVoices = 8;
    this.baseVolume = 0.3;
    this.isPlaying = false;
    
    // Characteristic sound parameters
    this.chordProgression = [
      [220.0, 293.66, 349.23, 440.0], // A minor
      [196.0, 293.66, 349.23, 392.0], // G major
      [174.61, 233.08, 293.66, 349.23], // F major
      [164.81, 220.0, 277.18, 329.63]  // E minor
    ];
    
    // Halo-inspired choir progressions (Dorian and Phrygian modes for ethereal quality)
    this.choirProgressions = [
      // D Dorian (mystical, ethereal)
      [293.66, 329.63, 349.23, 440.0, 493.88, 554.37, 587.33],
      // E Phrygian (haunting, mysterious)
      [329.63, 349.23, 440.0, 493.88, 554.37, 587.33, 659.25],
      // A minor with raised 6th (angelic, yearning)
      [440.0, 493.88, 554.37, 659.25, 739.99, 880.0, 987.77]
    ];
    
    // Siren song patterns (glissando patterns)
    this.sirenPatterns = [
      // Rising fifth with upper neighbor tone
      {start: 1.0, peak: 1.5, end: 1.0, steps: 12},
      // Falling octave with return
      {start: 2.0, peak: 1.0, end: 1.5, steps: 16},
      // Wavering third (dissonant)
      {start: 1.0, peak: 1.189, end: 1.0, steps: 8},
      // Large ascending leap (haunting call)
      {start: 1.0, peak: 2.378, end: 1.682, steps: 20}
    ];
    
    // Interaction state
    this.lastInteraction = Date.now();
    this.interactionIntensity = 0;
    
    // Spectral characteristics
    this.spectralShift = 0;
    
    // Timing for special effects
    this.lastAngelicTime = 0;
    this.lastSirenTime = 0;
    
    // Initialize system
    this.init();
  }
  
  /**
   * Initialize the audio system
   */
  init() {
    // Create audio context when user interacts with the page
    const initAudio = () => {
      if (this.audioContext) return;
      
      // Create audio context
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Create master gain node
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = 0;
      
      // Create reverb
      this.createReverb();
      
      // Connect nodes
      this.masterGain.connect(this.audioContext.destination);
      
      // Remove event listeners once initialized
      document.removeEventListener('click', initAudio);
      document.removeEventListener('keydown', initAudio);
      
      // Show audio control
      this.createAudioControl();
    };
    
    // Set up event listeners for initialization
    document.addEventListener('click', initAudio);
    document.addEventListener('keydown', initAudio);
  }
  
  /**
   * Create a convolver node for reverb effect
   */
  async createReverb() {
    // Create convolver node
    this.reverbNode = this.audioContext.createConvolver();
    
    // Generate synthetic impulse response
    const impulseLength = 3 * this.audioContext.sampleRate;
    const impulse = this.audioContext.createBuffer(2, impulseLength, this.audioContext.sampleRate);
    
    // Fill buffer with decaying noise
    for (let channel = 0; channel < impulse.numberOfChannels; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < impulseLength; i++) {
        // Decay curve with some randomness
        const decay = Math.exp(-i / (this.audioContext.sampleRate * 1.5));
        channelData[i] = (Math.random() * 2 - 1) * decay;
      }
    }
    
    // Set the buffer to the convolver node
    this.reverbNode.buffer = impulse;
    
    // Connect reverb to master
    this.reverbNode.connect(this.masterGain);
  }
  
  /**
   * Create audio control UI
   */
  createAudioControl() {
    // Create audio control element
    const controlContainer = document.createElement('div');
    controlContainer.className = 'void-whispers-control';
    controlContainer.innerHTML = `
      <div class="void-whispers-icon">♫</div>
      <div class="void-whispers-tooltip">Void Whispers: Inactive</div>
    `;
    
    // Style the control
    const style = document.createElement('style');
    style.textContent = `
      .void-whispers-control {
        position: fixed;
        bottom: 20px;
        left: 20px;
        width: 32px;
        height: 32px;
        background-color: rgba(40, 0, 40, 0.6);
        border: 1px solid rgba(255, 0, 255, 0.3);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 9999;
        transition: all 0.3s ease;
        opacity: 0.7;
      }
      
      .void-whispers-control:hover {
        opacity: 1;
        box-shadow: 0 0 10px rgba(255, 0, 255, 0.5);
      }
      
      .void-whispers-control.active {
        background-color: rgba(80, 0, 80, 0.8);
        box-shadow: 0 0 15px rgba(255, 0, 255, 0.6);
      }
      
      .void-whispers-icon {
        color: rgba(255, 0, 255, 0.8);
        font-size: 16px;
        transition: all 0.3s ease;
      }
      
      .void-whispers-control.active .void-whispers-icon {
        color: rgba(255, 255, 255, 0.9);
      }
      
      .void-whispers-tooltip {
        position: absolute;
        top: -30px;
        left: 50%;
        transform: translateX(-50%);
        background-color: rgba(40, 0, 40, 0.9);
        color: rgba(255, 255, 255, 0.8);
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.3s ease;
        white-space: nowrap;
      }
      
      .void-whispers-control:hover .void-whispers-tooltip {
        opacity: 1;
      }
      
      @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
      }
      
      .void-whispers-control.active .void-whispers-icon {
        animation: pulse 2s infinite;
      }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(controlContainer);
    
    // Toggle audio on click
    controlContainer.addEventListener('click', () => {
      if (this.isPlaying) {
        this.stop();
        controlContainer.classList.remove('active');
        controlContainer.querySelector('.void-whispers-tooltip').textContent = 'Void Whispers: Inactive';
      } else {
        this.start();
        controlContainer.classList.add('active');
        controlContainer.querySelector('.void-whispers-tooltip').textContent = 'Void Whispers: Active';
      }
    });
    
    // Store reference
    this.controlElement = controlContainer;
  }
  
  /**
   * Start generating audio
   */
  start() {
    if (this.isPlaying) return;
    
    // Resume audio context if suspended
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    
    // Fade in master volume
    const now = this.audioContext.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    this.masterGain.gain.linearRampToValueAtTime(this.baseVolume, now + 2);
    
    // Start sound generation
    this.isPlaying = true;
    this.generateAmbientChord();
    
    // Start the update loop
    this.update();
    
    // Add interaction listeners
    document.addEventListener('mousemove', this.handleInteraction.bind(this));
    document.addEventListener('keydown', this.handleInteraction.bind(this));
    document.addEventListener('click', this.handleInteraction.bind(this));
  }
  
  /**
   * Stop audio generation
   */
  stop() {
    if (!this.isPlaying) return;
    
    // Fade out master volume
    const now = this.audioContext.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    this.masterGain.gain.linearRampToValueAtTime(0, now + 1);
    
    // Set playing state
    this.isPlaying = false;
    
    // Stop all active voices after fade-out
    setTimeout(() => {
      this.activeVoices.forEach(voice => {
        if (voice.oscillator) {
          voice.oscillator.stop();
          voice.oscillator.disconnect();
        }
        if (voice.gain) {
          voice.gain.disconnect();
        }
      });
      this.activeVoices = [];
    }, 1100);
    
    // Remove interaction listeners
    document.removeEventListener('mousemove', this.handleInteraction.bind(this));
    document.removeEventListener('keydown', this.handleInteraction.bind(this));
    document.removeEventListener('click', this.handleInteraction.bind(this));
  }
  
  /**
   * Handle user interaction
   */
  handleInteraction(event) {
    // Update last interaction time
    this.lastInteraction = Date.now();
    
    // Increase interaction intensity
    this.interactionIntensity = Math.min(1, this.interactionIntensity + 0.2);
    
    // Add some spectral shift based on mouse position or key pressed
    if (event.type === 'mousemove') {
      // Map mouse position to spectral shift
      const mouseXPercent = event.clientX / window.innerWidth;
      const mouseYPercent = event.clientY / window.innerHeight;
      
      // Combine into spectral shift value (-1 to 1)
      this.spectralShift = (mouseXPercent - 0.5) * 2;
    } else if (event.type === 'keydown') {
      // Random spectral shift on key press
      this.spectralShift = Math.random() * 2 - 1;
    } else if (event.type === 'click') {
      // Generate brief "shock" sound
      this.generateShockSound();
    }
  }
  
  /**
   * Generate a brief "shock" sound for click events
   */
  generateShockSound() {
    if (!this.audioContext || !this.isPlaying) return;
    
    // Create nodes
    const oscillator = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    // Connect
    oscillator.connect(gain);
    gain.connect(this.reverbNode);
    
    // Set parameters
    oscillator.type = 'sine';
    oscillator.frequency.value = 800 + Math.random() * 1200;
    
    // Envelope
    const now = this.audioContext.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    
    // Play briefly
    oscillator.start(now);
    oscillator.stop(now + 0.3);
    
    // Clean up
    setTimeout(() => {
      oscillator.disconnect();
      gain.disconnect();
    }, 500);
  }
  
  /**
   * Main update loop
   */
  update() {
    if (!this.isPlaying) return;
    
    // Calculate time since last interaction
    const timeSinceInteraction = (Date.now() - this.lastInteraction) / 1000;
    
    // Decay interaction intensity
    this.interactionIntensity *= 0.995;
    
    // Schedule next update
    requestAnimationFrame(() => this.update());
    
    // Generate new sounds periodically based on intensity
    if (Math.random() < 0.01 + (this.interactionIntensity * 0.03)) {
      this.generateAmbientChord();
    }
    
    // Generate random whispers based on interaction intensity
    if (Math.random() < 0.005 + (this.interactionIntensity * 0.02)) {
      this.generateWhisper();
    }
    
    // Generate angelic choir sounds at random intervals
    const now = Date.now();
    if (now - this.lastAngelicTime > 15000 && Math.random() < 0.002) {
      this.generateAngelicChoir();
      this.lastAngelicTime = now;
    }
    
    // Generate siren song effects at random intervals
    if (now - this.lastSirenTime > 25000 && Math.random() < 0.001) {
      this.generateSirenSong();
      this.lastSirenTime = now;
    }
  }
  
  /**
   * Generate ambient chord
   */
  generateAmbientChord() {
    if (!this.audioContext || !this.isPlaying) return;
    
    // Select a random chord from progression
    const chordIndex = Math.floor(Math.random() * this.chordProgression.length);
    const chord = this.chordProgression[chordIndex];
    
    // Generate voices for each note in the chord
    chord.forEach(baseFreq => {
      // Only create a new voice if we have space
      if (this.activeVoices.length >= this.maxVoices) {
        // Find oldest voice to replace
        let oldestVoice = this.activeVoices[0];
        let oldestTime = Infinity;
        
        for (let i = 0; i < this.activeVoices.length; i++) {
          if (this.activeVoices[i].startTime < oldestTime) {
            oldestVoice = this.activeVoices[i];
            oldestTime = this.activeVoices[i].startTime;
          }
        }
        
        // Fade out the oldest voice
        const now = this.audioContext.currentTime;
        oldestVoice.gain.gain.cancelScheduledValues(now);
        oldestVoice.gain.gain.setValueAtTime(oldestVoice.gain.gain.value, now);
        oldestVoice.gain.gain.linearRampToValueAtTime(0, now + 1);
        
        // Remove from active voices after fade out
        setTimeout(() => {
          oldestVoice.oscillator.stop();
          oldestVoice.oscillator.disconnect();
          oldestVoice.gain.disconnect();
          this.activeVoices = this.activeVoices.filter(v => v !== oldestVoice);
        }, 1100);
      }
      
      // Create the new voice
      this.createVoice(baseFreq);
    });
  }
  
  /**
   * Create a single voice
   */
  createVoice(baseFrequency) {
    if (!this.audioContext || !this.isPlaying) return;
    
    // Create oscillator and gain nodes
    const oscillator = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    // Apply spectral shift to frequency
    const shiftedFreq = baseFrequency * (1 + this.spectralShift * 0.05);
    
    // Add slight random detuning for chorus effect
    const detunedFreq = shiftedFreq * (1 + (Math.random() * 0.01 - 0.005));
    
    // Set oscillator parameters
    oscillator.type = Math.random() < 0.7 ? 'sine' : 'triangle';
    oscillator.frequency.value = detunedFreq;
    
    // Create filter
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 2000 + Math.random() * 3000;
    filter.Q.value = 1 + Math.random() * 3;
    
    // Connect nodes
    oscillator.connect(filter);
    filter.connect(gain);
    
    // Randomly connect to reverb or directly to master
    if (Math.random() < 0.7) {
      gain.connect(this.reverbNode);
    } else {
      gain.connect(this.masterGain);
    }
    
    // Set voice envelope
    const now = this.audioContext.currentTime;
    const attackTime = 1 + Math.random() * 2;
    const sustainTime = 5 + Math.random() * 10;
    const releaseTime = 3 + Math.random() * 5;
    
    // Initial gain
    gain.gain.setValueAtTime(0, now);
    
    // Attack
    gain.gain.linearRampToValueAtTime(0.1 + Math.random() * 0.1, now + attackTime);
    
    // Sustain with slight variation
    for (let i = 0; i < 3; i++) {
      const sustainPoint = now + attackTime + (sustainTime * i / 3);
      const sustainValue = 0.08 + Math.random() * 0.04;
      gain.gain.linearRampToValueAtTime(sustainValue, sustainPoint);
    }
    
    // Release
    gain.gain.linearRampToValueAtTime(0, now + attackTime + sustainTime + releaseTime);
    
    // Start oscillator
    oscillator.start(now);
    oscillator.stop(now + attackTime + sustainTime + releaseTime + 0.1);
    
    // Add to active voices
    this.activeVoices.push({
      oscillator,
      gain,
      filter,
      startTime: now,
      endTime: now + attackTime + sustainTime + releaseTime
    });
    
    // Clean up after voice ends
    setTimeout(() => {
      oscillator.disconnect();
      gain.disconnect();
      filter.disconnect();
      this.activeVoices = this.activeVoices.filter(v => v.startTime !== now);
    }, (attackTime + sustainTime + releaseTime + 0.2) * 1000);
  }
  
  /**
   * Generate whisper effects (high, ethereal sounds)
   */
  generateWhisper() {
    if (!this.audioContext || !this.isPlaying) return;
    
    // Create nodes
    const oscillator = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();
    
    // Connect nodes
    oscillator.connect(filter);
    filter.connect(gain);
    gain.connect(this.reverbNode);
    
    // Set oscillator parameters
    oscillator.type = Math.random() < 0.5 ? 'sine' : 'sawtooth';
    
    // Higher frequencies for whispers
    const baseFreq = 1000 + Math.random() * 4000;
    oscillator.frequency.value = baseFreq;
    
    // Filter settings
    filter.type = 'bandpass';
    filter.frequency.value = baseFreq * 0.8;
    filter.Q.value = 2 + Math.random() * 8;
    
    // Envelope parameters
    const now = this.audioContext.currentTime;
    const attackTime = 0.1 + Math.random() * 0.3;
    const sustainTime = 0.2 + Math.random() * 0.8;
    const releaseTime = 0.5 + Math.random() * 1.5;
    
    // Volume based on interaction intensity
    const maxVolume = 0.015 + (this.interactionIntensity * 0.02);
    
    // Set envelope
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(maxVolume, now + attackTime);
    gain.gain.setValueAtTime(maxVolume, now + attackTime + sustainTime);
    gain.gain.exponentialRampToValueAtTime(0.001, now + attackTime + sustainTime + releaseTime);
    
    // Random pitch modulation
    const modDepth = 100 + Math.random() * 200;
    const modSpeed = 2 + Math.random() * 8;
    
    for (let i = 0; i < 10; i++) {
      const modTime = now + (i * (attackTime + sustainTime + releaseTime) / 10);
      const modValue = baseFreq + (Math.sin(i * modSpeed) * modDepth);
      oscillator.frequency.linearRampToValueAtTime(modValue, modTime);
    }
    
    // Start and stop
    oscillator.start(now);
    oscillator.stop(now + attackTime + sustainTime + releaseTime + 0.1);
    
    // Clean up
    setTimeout(() => {
      oscillator.disconnect();
      gain.disconnect();
      filter.disconnect();
    }, (attackTime + sustainTime + releaseTime + 0.2) * 1000);
  }
  
  /**
   * Generate angelic choir inspired by Halo soundtrack
   */
  generateAngelicChoir() {
    if (!this.audioContext || !this.isPlaying) return;
    
    // Select a random progression
    const progressionIndex = Math.floor(Math.random() * this.choirProgressions.length);
    const progression = this.choirProgressions[progressionIndex];
    
    // Select a subset of notes for the choir
    const numberOfNotes = 3 + Math.floor(Math.random() * 3); // 3-5 notes
    const selectedIndices = [];
    
    // Select random indices but ensure they're somewhat close together
    const startIndex = Math.floor(Math.random() * (progression.length - numberOfNotes));
    for (let i = 0; i < numberOfNotes; i++) {
      selectedIndices.push(startIndex + i);
    }
    
    // Random octave shift
    const octaveShift = Math.random() < 0.5 ? 1 : (Math.random() < 0.7 ? 2 : 0.5);
    
    // Create voices for each note
    selectedIndices.forEach(index => {
      const baseFreq = progression[index] * octaveShift;
      this.createChoirVoice(baseFreq);
    });
  }
  
  /**
   * Create an angelic choir voice with distinctive character
   */
  createChoirVoice(baseFrequency) {
    if (!this.audioContext || !this.isPlaying) return;
    
    // Create oscillator, gain, and filter nodes
    const oscillator = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();
    
    // Create a second oscillator for the formant effect (vowel sound)
    const formantOsc = this.audioContext.createOscillator();
    const formantGain = this.audioContext.createGain();
    
    // Apply spectral shift to frequency
    const shiftedFreq = baseFrequency * (1 + this.spectralShift * 0.03);
    
    // Add slight random detuning for chorus effect
    const detunedFreq = shiftedFreq * (1 + (Math.random() * 0.01 - 0.005));
    
    // Set oscillator parameters for main tone
    oscillator.type = 'sine';
    oscillator.frequency.value = detunedFreq;
    
    // Set parameters for formant oscillator
    formantOsc.type = 'sine';
    // Create vowel-like formant (approximating choir "ahh" sound)
    formantOsc.frequency.value = detunedFreq * (Math.random() < 0.5 ? 2.7 : 1.5); // Formant frequency
    formantGain.gain.value = 0.15; // Subtle formant
    
    // Filter settings
    filter.type = 'bandpass';
    filter.frequency.value = detunedFreq * 0.9 + (Math.random() * detunedFreq * 0.2);
    filter.Q.value = 1 + Math.random() * 3;
    
    // Connect nodes
    oscillator.connect(filter);
    filter.connect(gain);
    
    formantOsc.connect(formantGain);
    formantGain.connect(gain);
    
    // Always connect choir to reverb for spaciousness
    gain.connect(this.reverbNode);
    
    // Set voice envelope - slow attack and release for choir-like sound
    const now = this.audioContext.currentTime;
    const attackTime = 2 + Math.random() * 3; // Slow attack (2-5s)
    const sustainTime = 8 + Math.random() * 15; // Long sustain (8-23s)
    const releaseTime = 4 + Math.random() * 5; // Slow release (4-9s)
    
    // Initial gain
    gain.gain.setValueAtTime(0, now);
    
    // Attack - slow rise
    gain.gain.linearRampToValueAtTime(0.1 + Math.random() * 0.05, now + attackTime);
    
    // Sustain with vibrato-like variations
    const vibratoRate = 0.15 + Math.random() * 0.25; // 0.15-0.4 Hz
    const vibratoDepth = 0.03 + Math.random() * 0.02; // 3-5% amplitude
    
    // Create slight variations during sustain (vibrato)
    const numSteps = Math.floor(sustainTime / vibratoRate);
    for (let i = 0; i < numSteps; i++) {
      const timePoint = now + attackTime + (i * vibratoRate);
      const phasePosition = i / numSteps; // 0 to 1
      const vibratoValue = 0.08 + Math.sin(phasePosition * Math.PI * 2) * vibratoDepth;
      gain.gain.linearRampToValueAtTime(vibratoValue, timePoint);
      
      // Also modulate the formant slightly for more life-like quality
      formantOsc.frequency.linearRampToValueAtTime(
        formantOsc.frequency.value * (1 + Math.sin(phasePosition * Math.PI * 3) * 0.02),
        timePoint
      );
    }
    
    // Release - gradual fade
    gain.gain.linearRampToValueAtTime(0, now + attackTime + sustainTime + releaseTime);
    
    // Add pitch fluctuation (slight bend)
    const bendPoints = 4 + Math.floor(Math.random() * 4); // 4-7 points
    for (let i = 0; i < bendPoints; i++) {
      const timePoint = now + (i * (attackTime + sustainTime) / bendPoints);
      const bendAmount = 1 + (Math.random() * 0.01 - 0.005); // +/- 0.5% 
      oscillator.frequency.linearRampToValueAtTime(detunedFreq * bendAmount, timePoint);
    }
    
    // Start oscillators
    oscillator.start(now);
    formantOsc.start(now);
    
    // Stop oscillators
    const stopTime = now + attackTime + sustainTime + releaseTime + 0.1;
    oscillator.stop(stopTime);
    formantOsc.stop(stopTime);
    
    // Add to active voices
    this.activeVoices.push({
      oscillator,
      formantOsc,
      gain,
      formantGain,
      filter,
      startTime: now,
      endTime: stopTime
    });
    
    // Clean up after voice ends
    setTimeout(() => {
      oscillator.disconnect();
      formantOsc.disconnect();
      gain.disconnect();
      formantGain.disconnect();
      filter.disconnect();
      this.activeVoices = this.activeVoices.filter(v => v.startTime !== now);
    }, (attackTime + sustainTime + releaseTime + 0.2) * 1000);
  }
  
  /**
   * Generate siren song effect with glissando and undulating character
   */
  generateSirenSong() {
    if (!this.audioContext || !this.isPlaying) return;
    
    // Select a random siren pattern
    const pattern = this.sirenPatterns[Math.floor(Math.random() * this.sirenPatterns.length)];
    
    // Select a base frequency from the middle-high range
    const baseFreq = 350 + Math.random() * 250;
    
    // Create nodes
    const oscillator = this.audioContext.createOscillator();
    const modulatorOsc = this.audioContext.createOscillator(); // For modulation
    const modulatorGain = this.audioContext.createGain(); // Control modulation depth
    const mainGain = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();
    
    // Choose oscillator types
    oscillator.type = Math.random() < 0.7 ? 'sine' : 'triangle';
    modulatorOsc.type = 'sine';
    
    // Set up filter (for vowel-like quality)
    filter.type = 'bandpass';
    filter.Q.value = 4 + Math.random() * 5; // Sharp resonance
    
    // Connect modulator to oscillator frequency
    modulatorOsc.connect(modulatorGain);
    modulatorGain.connect(oscillator.frequency);
    
    // Connect main signal path
    oscillator.connect(filter);
    filter.connect(mainGain);
    mainGain.connect(this.reverbNode);
    
    // Set up timing
    const now = this.audioContext.currentTime;
    const totalDuration = 8 + Math.random() * 15; // 8-23 seconds
    const attackTime = 1.5 + Math.random() * 2;
    const releaseTime = 2 + Math.random() * 3;
    const sustainTime = totalDuration - (attackTime + releaseTime);
    
    // Siren frequency moves according to pattern
    oscillator.frequency.setValueAtTime(baseFreq * pattern.start, now);
    
    // Set modulator parameters (creates the wavering effect)
    modulatorOsc.frequency.value = 2 + Math.random() * 5; // 2-7 Hz modulation rate
    modulatorGain.gain.value = baseFreq * 0.03; // 3% depth
    
    // Initial amplitude
    mainGain.gain.setValueAtTime(0, now);
    mainGain.gain.linearRampToValueAtTime(0.12, now + attackTime); // Crescendo
    
    // Perform the glissando pattern
    const stepTime = totalDuration / pattern.steps;
    const halfwayPoint = now + (totalDuration / 2);
    
    // First half - rise to peak
    for (let i = 0; i <= pattern.steps / 2; i++) {
      const timePoint = now + (i * stepTime);
      const progress = i / (pattern.steps / 2); // 0 to 1
      const freqMultiplier = pattern.start + (progress * (pattern.peak - pattern.start));
      oscillator.frequency.linearRampToValueAtTime(baseFreq * freqMultiplier, timePoint);
      
      // Also sweep the filter for vowel-like changes
      filter.frequency.linearRampToValueAtTime(
        baseFreq * freqMultiplier * (1.5 + Math.sin(progress * Math.PI) * 0.5),
        timePoint
      );
      
      // Vary the modulation depth
      modulatorGain.gain.linearRampToValueAtTime(
        baseFreq * 0.03 * (1 + Math.sin(progress * Math.PI * 2) * 0.5),
        timePoint
      );
    }
    
    // Second half - fall to end
    for (let i = pattern.steps / 2 + 1; i <= pattern.steps; i++) {
      const timePoint = now + (i * stepTime);
      const progress = (i - pattern.steps / 2) / (pattern.steps / 2); // 0 to 1
      const freqMultiplier = pattern.peak + (progress * (pattern.end - pattern.peak));
      oscillator.frequency.linearRampToValueAtTime(baseFreq * freqMultiplier, timePoint);
      
      // Continue filter sweep in second half
      filter.frequency.linearRampToValueAtTime(
        baseFreq * freqMultiplier * (1.5 + Math.sin(progress * Math.PI + Math.PI) * 0.5),
        timePoint
      );
    }
    
    // Amplitude envelope for the end
    mainGain.gain.setValueAtTime(0.12, now + attackTime + sustainTime);
    mainGain.gain.linearRampToValueAtTime(0, now + totalDuration);
    
    // Start and stop
    oscillator.start(now);
    modulatorOsc.start(now);
    
    oscillator.stop(now + totalDuration + 0.1);
    modulatorOsc.stop(now + totalDuration + 0.1);
    
    // Add occasional "screech" effect
    if (Math.random() < 0.4) {
      // Schedule screeches
      const numScreeches = 1 + Math.floor(Math.random() * 2);
      
      for (let i = 0; i < numScreeches; i++) {
        const screechTime = now + attackTime + (Math.random() * sustainTime);
        this.generateSirenScreech(baseFreq * 2, screechTime);
      }
    }
    
    // Clean up
    setTimeout(() => {
      oscillator.disconnect();
      modulatorOsc.disconnect();
      modulatorGain.disconnect();
      mainGain.disconnect();
      filter.disconnect();
    }, (totalDuration + 0.2) * 1000);
  }
  
  /**
   * Generate a short screech effect for the siren song
   */
  generateSirenScreech(baseFreq, startTime) {
    if (!this.audioContext || !this.isPlaying) return;
    
    // Create nodes
    const oscillator = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    const distortion = this.audioContext.createWaveShaper();
    const filter = this.audioContext.createBiquadFilter();
    
    // Connect nodes with distortion for the harsh edge
    oscillator.connect(distortion);
    distortion.connect(filter);
    filter.connect(gain);
    gain.connect(this.reverbNode);
    
    // Set parameters
    oscillator.type = 'sawtooth'; // Harsh timbre
    oscillator.frequency.value = baseFreq + (Math.random() * 300);
    
    // Create distortion curve for the "screech" quality
    const distortionAmount = 50;
    const curve = new Float32Array(this.audioContext.sampleRate);
    for (let i = 0; i < this.audioContext.sampleRate; i++) {
      const x = i * 2 / this.audioContext.sampleRate - 1;
      curve[i] = (Math.PI + distortionAmount) * x / (Math.PI + distortionAmount * Math.abs(x));
    }
    distortion.curve = curve;
    
    // Filter settings
    filter.type = 'bandpass';
    filter.frequency.value = baseFreq * 1.5;
    filter.Q.value = 12; // Very resonant
    
    // Envelope settings - very short and sharp
    const duration = 0.3 + Math.random() * 0.4; // 0.3-0.7 seconds
    const attackTime = 0.01;
    const releaseTime = duration - attackTime;
    
    // Set envelope
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.08, startTime + attackTime); // Sharp attack
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration); // Quick decay
    
    // Quick pitch slide down
    oscillator.frequency.setValueAtTime(oscillator.frequency.value, startTime);
    oscillator.frequency.exponentialRampToValueAtTime(
      oscillator.frequency.value * 0.7, 
      startTime + duration
    );
    
    // Start and stop
    oscillator.start(startTime);
    oscillator.stop(startTime + duration + 0.1);
    
    // Clean up
    setTimeout(() => {
      oscillator.disconnect();
      distortion.disconnect();
      filter.disconnect();
      gain.disconnect();
    }, (duration + 0.2) * 1000);
  }
  
  /**
   * Enable audio system
   */
  enable() {
    if (!this.audioContext) {
      // Create audio context
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Create master gain node
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = this.baseVolume;
      
      // Create reverb
      this.createReverb();
      
      // Connect nodes
      this.masterGain.connect(this.audioContext.destination);
    }
    
    // Start audio processing
    this.start();
    
    return this;
  }
  
  /**
   * Disable audio system
   */
  disable() {
    // Stop audio processing
    this.stop();
    
    return this;
  }
  
  /**
   * Set volume level
   */
  setVolume(level) {
    if (!this.audioContext || !this.masterGain) return this;
    
    // Ensure level is between 0 and 1
    level = Math.max(0, Math.min(1, level));
    
    // Set base volume for future references
    this.baseVolume = level;
    
    // Set master gain
    const now = this.audioContext.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    this.masterGain.gain.linearRampToValueAtTime(level, now + 0.2);
    
    return this;
  }
  
  /**
   * Register user interaction with intensity
   */
  registerInteraction(intensity = 0.2) {
    // Update last interaction time
    this.lastInteraction = Date.now();
    
    // Increase interaction intensity
    this.interactionIntensity = Math.min(1, this.interactionIntensity + intensity);
    
    return this;
  }
  
  /**
   * Set spectral shift value
   */
  setSpectralShift(value) {
    // Ensure value is between -1 and 1
    this.spectralShift = Math.max(-1, Math.min(1, value));
    
    return this;
  }
}

// Initialize Void Whispers when document is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.voidWhispers = new VoidWhispers();
}); 