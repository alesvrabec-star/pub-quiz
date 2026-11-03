// Robustní předčítání otázek hospodského kvízu v češtině
// Podporuje duální režim:
// 1. Studio Hospodský hlasatel (vysoce kvalitní česká výslovnost přes /api/tts)
// 2. Nativní systémový syntetizér (Web Speech API s ošetřením všech chyb Chromium / iOS)
// Včetně automatického fallbacku, odemykání zvuku a diagnostiky pro uživatele.

export type TTSEngineMode = 'auto' | 'studio' | 'system';

export interface SpeechStatus {
  isSpeaking: boolean;
  currentText: string | null;
  isEnabled: boolean;
  engine: TTSEngineMode;
  activeEngine: 'studio' | 'system' | null;
  isAutoplayBlocked: boolean;
  hasNativeVoices: boolean;
  hasCzechVoice: boolean;
  czechVoiceName: string | null;
  rate: number;
  lastError: string | null;
}

export type SpeechListener = (status: SpeechStatus) => void;

class PubSpeechManager {
  private isEnabled: boolean = true;
  private engineMode: TTSEngineMode = 'auto';
  private rate: number = 1.0;
  private selectedVoiceURI: string | null = null;

  private isCurrentlySpeaking: boolean = false;
  private currentText: string | null = null;
  private activeEngine: 'studio' | 'system' | null = null;
  private isAutoplayBlocked: boolean = false;
  private lastError: string | null = null;

  private voices: SpeechSynthesisVoice[] = [];
  private listeners: Set<SpeechListener> = new Set();

  // Reference pro prevenci Garbage Collection v Chromiu
  private activeUtterance: SpeechSynthesisUtterance | null = null;
  private chromeHeartbeatInterval: number | null = null;

  // HTML5 audio element pro Studio Hlasatele (/api/tts)
  private studioAudio: HTMLAudioElement | null = null;
  private isAudioUnlocked: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      // Načtení preferencí z localStorage
      try {
        const savedEnabled = localStorage.getItem('hospodsky_kviz_speech');
        if (savedEnabled !== null) {
          this.isEnabled = savedEnabled === 'true';
        }

        const savedEngine = localStorage.getItem('hospodsky_kviz_tts_engine');
        if (savedEngine === 'studio' || savedEngine === 'system' || savedEngine === 'auto') {
          this.engineMode = savedEngine;
        }

        const savedRate = localStorage.getItem('hospodsky_kviz_tts_rate');
        if (savedRate) {
          const parsedRate = parseFloat(savedRate);
          if (!isNaN(parsedRate) && parsedRate >= 0.7 && parsedRate <= 1.5) {
            this.rate = parsedRate;
          }
        }

        this.selectedVoiceURI = localStorage.getItem('hospodsky_kviz_voice_uri');
      } catch {
        // Ignorovat chyby localStorage
      }

      // Příprava globální mapy pro udržení Utterance naživu (Chromium bug 339445)
      const win = window as unknown as { __pubActiveUtterances?: Set<SpeechSynthesisUtterance> };
      if (!win.__pubActiveUtterances) {
        win.__pubActiveUtterances = new Set();
      }

      // Načtení nativních systémových hlasů
      if ('speechSynthesis' in window) {
        this.loadNativeVoices();
        try {
          window.speechSynthesis.onvoiceschanged = () => this.loadNativeVoices();
        } catch {
          // Ignorovat
        }
      }

      // Globální odemykač audia pro mobilní prohlížeče při prvním dotyku/kliku
      this.setupGlobalUnlockListener();
    }
  }

  private setupGlobalUnlockListener() {
    if (typeof window === 'undefined') return;

    const unlockHandler = () => {
      this.unlock();
      window.removeEventListener('pointerdown', unlockHandler);
      window.removeEventListener('touchstart', unlockHandler);
      window.removeEventListener('keydown', unlockHandler);
    };

    window.addEventListener('pointerdown', unlockHandler, { once: true, passive: true });
    window.addEventListener('touchstart', unlockHandler, { once: true, passive: true });
    window.addEventListener('keydown', unlockHandler, { once: true, passive: true });
  }

  public unlock() {
    this.isAudioUnlocked = true;
    this.isAutoplayBlocked = false;

    // Odemčení Web Speech API v Chromiu
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      } catch {
        // Ignorovat
      }
    }

    this.notify();
  }

  private loadNativeVoices() {
    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const loaded = window.speechSynthesis.getVoices();
        if (loaded && loaded.length > 0) {
          this.voices = loaded;
          this.notify();
        }
      }
    } catch {
      // Ignorovat
    }
  }

  public getVoices(): SpeechSynthesisVoice[] {
    if (this.voices.length === 0) {
      this.loadNativeVoices();
    }
    return this.voices;
  }

  public getCzechVoice(): SpeechSynthesisVoice | null {
    const list = this.getVoices();
    if (list.length === 0) return null;

    // 1. Zkontroluj uživatelem uložený hlas
    if (this.selectedVoiceURI) {
      const selected = list.find((v) => v.voiceURI === this.selectedVoiceURI);
      if (selected) return selected;
    }

    // 2. Hledej nativní český hlas (cs-CZ, cs_CZ, cs)
    const czech = list.find((v) => v.lang.toLowerCase().startsWith('cs'));
    if (czech) return czech;

    // 3. Hledej hlas se slovem czech nebo čeština v názvu
    const czechByName = list.find((v) => {
      const n = v.name.toLowerCase();
      return n.includes('czech') || n.includes('češtin') || n.includes('cesk');
    });
    if (czechByName) return czechByName;

    // 4. Hledej slovenský hlas (100% srozumitelný pro slovanské slabiky)
    const slovak = list.find(
      (v) =>
        v.lang.toLowerCase().startsWith('sk') ||
        v.name.toLowerCase().includes('slovak') ||
        v.name.toLowerCase().includes('slovenč')
    );
    if (slovak) return slovak;

    return null;
  }

  public subscribe(listener: SpeechListener): () => void {
    this.listeners.add(listener);
    listener(this.getStatus());
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getStatus(): SpeechStatus {
    const czechVoice = this.getCzechVoice();
    return {
      isSpeaking: this.isCurrentlySpeaking,
      currentText: this.currentText,
      isEnabled: this.isEnabled,
      engine: this.engineMode,
      activeEngine: this.activeEngine,
      isAutoplayBlocked: this.isAutoplayBlocked,
      hasNativeVoices: this.voices.length > 0,
      hasCzechVoice: !!czechVoice,
      czechVoiceName: czechVoice ? `${czechVoice.name} (${czechVoice.lang})` : null,
      rate: this.rate,
      lastError: this.lastError,
    };
  }

  private notify() {
    const status = this.getStatus();
    this.listeners.forEach((l) => {
      try {
        l(status);
      } catch (e) {
        console.error('Chyba v listeneru speech statusu:', e);
      }
    });
  }

  public getEnabled(): boolean {
    return this.isEnabled;
  }

  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    try {
      localStorage.setItem('hospodsky_kviz_speech', String(enabled));
    } catch {
      // Ignorovat
    }
    if (!enabled) {
      this.stop();
    }
    this.notify();
  }

  public toggleEnabled(): boolean {
    this.setEnabled(!this.isEnabled);
    return this.isEnabled;
  }

  public getEngine(): TTSEngineMode {
    return this.engineMode;
  }

  public setEngine(mode: TTSEngineMode) {
    this.engineMode = mode;
    try {
      localStorage.setItem('hospodsky_kviz_tts_engine', mode);
    } catch {
      // Ignorovat
    }
    this.notify();
  }

  public getRate(): number {
    return this.rate;
  }

  public setRate(rate: number) {
    this.rate = Math.max(0.7, Math.min(1.4, rate));
    try {
      localStorage.setItem('hospodsky_kviz_tts_rate', String(this.rate));
    } catch {
      // Ignorovat
    }
    this.notify();
  }

  public setSelectedVoiceURI(uri: string | null) {
    this.selectedVoiceURI = uri;
    try {
      if (uri) {
        localStorage.setItem('hospodsky_kviz_voice_uri', uri);
      } else {
        localStorage.removeItem('hospodsky_kviz_voice_uri');
      }
    } catch {
      // Ignorovat
    }
    this.notify();
  }

  public isSpeaking(): boolean {
    return this.isCurrentlySpeaking;
  }

  public stop() {
    // 1. Zastavit Studio audio
    if (this.studioAudio) {
      try {
        this.studioAudio.pause();
        this.studioAudio.currentTime = 0;
        this.studioAudio.src = '';
      } catch {
        // Ignorovat
      }
      this.studioAudio = null;
    }

    // 2. Zastavit Web Speech API
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignorovat
      }
    }

    // Vyčistit Chromium heartbeat & reference
    if (this.chromeHeartbeatInterval) {
      window.clearInterval(this.chromeHeartbeatInterval);
      this.chromeHeartbeatInterval = null;
    }

    if (this.activeUtterance) {
      const win = window as unknown as { __pubActiveUtterances?: Set<SpeechSynthesisUtterance> };
      if (win.__pubActiveUtterances) {
        win.__pubActiveUtterances.delete(this.activeUtterance);
      }
      this.activeUtterance = null;
    }

    this.isCurrentlySpeaking = false;
    this.currentText = null;
    this.activeEngine = null;
    this.notify();
  }

  public cancel() {
    this.stop();
  }

  /**
   * Přečte otázku a možnosti nahlas.
   * Přirozeně sestaví český text a vybere nejvhodnější engine (Studio / Systém) s automatickým fallbackem.
   */
  public speakQuestion(
    questionText: string,
    options?: string[],
    force: boolean = false,
    onDone?: () => void
  ) {
    if (!this.isEnabled && !force) return;
    if (typeof window === 'undefined') return;

    // Pokud už mluvíme to samé, tlačítko slouží jako vypínač (toggle)
    if (this.isCurrentlySpeaking && this.currentText === questionText) {
      this.stop();
      return;
    }

    // Přirozená česká větná stavba pro moderátora kvízu
    let speechScript = questionText.trim();
    if (!/[.!?]$/.test(speechScript)) {
      speechScript += '.';
    }

    if (options && options.length > 0) {
      const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
      const optionsText = options
        .map((opt, i) => `${letters[i] || i + 1}: ${opt.trim()}`)
        .join('. ');
      speechScript += ' Možnosti jsou: ' + optionsText + '.';
    }

    this.speakText(speechScript, questionText, onDone);
  }

  /**
   * Přečte libovolný český text s volbou engine a fallbackem
   */
  public speakText(fullTextToSpeak: string, displayLabel?: string, onDone?: () => void) {
    // Nejprve zastavíme případnou předchozí řeč
    this.stop();

    this.isCurrentlySpeaking = true;
    this.currentText = displayLabel || fullTextToSpeak;
    this.lastError = null;
    this.notify();

    // Rozhodnutí o preferovaném engine
    // V režimu 'studio' nebo 'auto' preferujeme Studio hlasatel (/api/tts),
    // protože poskytuje přirozenou studiovou českou intonaci bez závislosti na OS.
    const preferStudio = this.engineMode === 'studio' || this.engineMode === 'auto';

    if (preferStudio) {
      this.speakViaStudioAudio(fullTextToSpeak, () => {
        // Pokud studio selže a jsme v auto módu, zkusíme systémový syntetizér
        if (this.engineMode === 'auto') {
          console.warn('Studio TTS selhalo, přecházím na nativní syntetizér.');
          this.speakViaWebSpeech(
            fullTextToSpeak,
            () => {
              this.handleSpeechEnded(onDone);
            },
            onDone
          );
        } else {
          this.handleSpeechEnded(onDone);
        }
      }, onDone);
    } else {
      // Režim 'system'
      this.speakViaWebSpeech(fullTextToSpeak, () => {
        // Fallback na studio, pokud systémový hlas selže
        console.warn('Systémový hlas selhal, přecházím na Studio hlasatele.');
        this.speakViaStudioAudio(fullTextToSpeak, () => {
          this.handleSpeechEnded(onDone);
        }, onDone);
      }, onDone);
    }
  }

  /**
   * Přehrání přes serverový endpoint /api/tts (Studio Hlasatel)
   */
  private speakViaStudioAudio(text: string, onFallback: () => void, onDone?: () => void) {
    try {
      this.activeEngine = 'studio';
      this.notify();

      const encodedText = encodeURIComponent(text);
      const audioUrl = `/api/tts?text=${encodedText}`;

      const audio = new Audio(audioUrl);
      this.studioAudio = audio;
      audio.playbackRate = this.rate;

      audio.onended = () => {
        this.studioAudio = null;
        this.handleSpeechEnded(onDone);
      };

      audio.onerror = (e) => {
        console.warn('Chyba načítání Studio TTS audia:', e);
        this.studioAudio = null;
        onFallback();
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('Autoplay audio bylo zablokováno prohlížečem:', err);
          if (err.name === 'NotAllowedError') {
            this.isAutoplayBlocked = true;
            this.lastError = 'Prohlížeč vyžaduje klepnutí pro spuštění zvuku.';
          }
          onFallback();
        });
      }
    } catch (err) {
      console.warn('Výjimka při inicializaci Studio audia:', err);
      onFallback();
    }
  }

  /**
   * Přehrání přes Web Speech API (SpeechSynthesis)
   */
  private speakViaWebSpeech(text: string, onFallback: () => void, onDone?: () => void) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      onFallback();
      return;
    }

    try {
      this.activeEngine = 'system';
      this.notify();

      // DŮLEŽITÉ: Ošetření Chromium pauzy a dead-locku
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      // V Chromiu je nutné po cancel počkat tick, aby cancel nezabil nový speak
      const doSpeak = () => {
        try {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = 'cs-CZ';
          utterance.rate = this.rate;
          utterance.pitch = 1.0;

          const czechVoice = this.getCzechVoice();
          if (czechVoice) {
            utterance.voice = czechVoice;
            utterance.lang = czechVoice.lang;
          }
          // Poznámka: Pokud není nalezen český ani slovenský hlas,
          // NIKDY nenastavujeme anglický defaultní hlas, protože by shodil prohlížeč!

          // Uložení utterance pro zabránění předčasného Garbage Collection
          this.activeUtterance = utterance;
          const win = window as unknown as { __pubActiveUtterances?: Set<SpeechSynthesisUtterance> };
          if (win.__pubActiveUtterances) {
            win.__pubActiveUtterances.add(utterance);
          }

          utterance.onstart = () => {
            this.isCurrentlySpeaking = true;
            this.isAutoplayBlocked = false;
            this.notify();

            // Chromium 15-sekundový watchdog bug:
            // Chrome po 15 sekundách utne utterance. Pravidelné pause/resume tomu zabrání.
            if (this.chromeHeartbeatInterval) {
              window.clearInterval(this.chromeHeartbeatInterval);
            }
            this.chromeHeartbeatInterval = window.setInterval(() => {
              if (window.speechSynthesis.speaking) {
                window.speechSynthesis.pause();
                window.speechSynthesis.resume();
              }
            }, 10000);
          };

          utterance.onend = () => {
            if (this.chromeHeartbeatInterval) {
              window.clearInterval(this.chromeHeartbeatInterval);
              this.chromeHeartbeatInterval = null;
            }
            if (win.__pubActiveUtterances) {
              win.__pubActiveUtterances.delete(utterance);
            }
            this.activeUtterance = null;
            this.handleSpeechEnded(onDone);
          };

          utterance.onerror = (event) => {
            console.warn('Web Speech API onerror:', event);
            if (this.chromeHeartbeatInterval) {
              window.clearInterval(this.chromeHeartbeatInterval);
              this.chromeHeartbeatInterval = null;
            }
            if (win.__pubActiveUtterances) {
              win.__pubActiveUtterances.delete(utterance);
            }
            this.activeUtterance = null;

            if (event.error === 'not-allowed') {
              this.isAutoplayBlocked = true;
              this.lastError = 'Zvuk byl zablokován zásadami prohlížeče. Klepněte pro povolení.';
            }

            onFallback();
          };

          window.speechSynthesis.speak(utterance);
        } catch (err) {
          console.warn('Chyba při volání speechSynthesis.speak:', err);
          onFallback();
        }
      };

      // Krátký timeout pro spolehlivé vyčištění fronty v Chromium
      window.setTimeout(doSpeak, 30);
    } catch (err) {
      console.warn('Chyba inicializace Web Speech API:', err);
      onFallback();
    }
  }

  private handleSpeechEnded(onDone?: () => void) {
    this.isCurrentlySpeaking = false;
    this.currentText = null;
    this.activeEngine = null;
    this.notify();
    if (onDone) {
      try {
        onDone();
      } catch {
        // Ignorovat
      }
    }
  }

  /**
   * Testovací hláška pro ověření zvuku a hlasitosti
   */
  public testVoice() {
    this.speakText(
      'Vítejte v hospodském kvízu! Režim čtení otázek funguje na jedničku. Přejeme skvělou zábavu u piva!',
      'Zkouška zvuku kvízmistra'
    );
  }
}

export const pubSpeech = new PubSpeechManager();
