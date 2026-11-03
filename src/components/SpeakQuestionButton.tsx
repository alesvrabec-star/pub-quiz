import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Square, Settings2, Play, Check, Sparkles, AlertCircle } from 'lucide-react';
import { pubSpeech, SpeechStatus, TTSEngineMode } from '../utils/speech';

interface SpeakQuestionButtonProps {
  questionText: string;
  options?: string[];
  className?: string;
  variant?: 'standard' | 'compact' | 'projector' | 'icon-only';
  label?: string;
  showSettingsButton?: boolean;
}

export const SpeakQuestionButton: React.FC<SpeakQuestionButtonProps> = ({
  questionText,
  options,
  className = '',
  variant = 'standard',
  label = 'Přečíst otázku nahlas',
  showSettingsButton = true,
}) => {
  const [status, setStatus] = useState<SpeechStatus>(pubSpeech.getStatus());
  const [showSettings, setShowSettings] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = pubSpeech.subscribe((s) => {
      setStatus(s);
    });
    return () => unsubscribe();
  }, []);

  // Zavření nastavení při kliknutí mimo
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setShowSettings(false);
      }
    };
    if (showSettings) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSettings]);

  const isThisSpeaking = status.isSpeaking && status.currentText === questionText;

  const handleToggleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    pubSpeech.unlock(); // Explicitní odemčení audia z gesta uživatele

    if (isThisSpeaking) {
      pubSpeech.stop();
    } else {
      // Force speak umožní přečtení i při vypnutém automatickém módu
      pubSpeech.speakQuestion(questionText, options, true);
    }
  };

  const handleOpenSettings = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowSettings((prev) => !prev);
  };

  // Zvukový ekvalizér efekt (tři animované sloupce)
  const renderSoundWave = () => (
    <div className="flex items-center gap-0.5 h-3.5 px-0.5" aria-hidden="true">
      <span className="w-1 bg-amber-400 rounded-full animate-bounce h-2.5 [animation-delay:-0.3s]" />
      <span className="w-1 bg-amber-300 rounded-full animate-bounce h-3.5 [animation-delay:-0.15s]" />
      <span className="w-1 bg-amber-400 rounded-full animate-bounce h-2 [animation-delay:0s]" />
    </div>
  );

  // Modální okno / vyskakovací menu nastavení předčítání
  const renderSettingsDropdown = () => {
    if (!showSettings) return null;

    return (
      <div
        ref={settingsRef}
        onClick={(e) => e.stopPropagation()}
        className="absolute right-0 top-full mt-2 z-50 w-72 sm:w-80 p-4 bg-stone-900/98 border border-amber-800/80 rounded-2xl shadow-2xl backdrop-blur-md text-stone-200 text-xs animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-amber-950/80">
          <div className="flex items-center gap-2 font-serif font-bold text-amber-300 text-sm">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Hlas kvízmistra (Čtení)</span>
          </div>
          <button
            onClick={() => setShowSettings(false)}
            className="text-stone-400 hover:text-white p-1 rounded hover:bg-stone-800"
          >
            ✕
          </button>
        </div>

        {/* Informace o blokování prohlížečem */}
        {status.isAutoplayBlocked && (
          <div className="mb-3 p-2 bg-amber-950/60 border border-amber-700/60 rounded-xl text-amber-200 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p>Prohlížeč vyžaduje kliknutí na obrazovku k aktivaci zvuku.</p>
          </div>
        )}

        {/* Volba režimu hlasatele */}
        <div className="space-y-2 mb-4">
          <label className="block text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
            Režim syntézy řeči:
          </label>
          <div className="grid grid-cols-1 gap-1.5">
            {[
              {
                id: 'auto' as TTSEngineMode,
                title: 'Chytrý režim (Doporučeno)',
                desc: 'Studio hlasatel s automatickou zálohou',
              },
              {
                id: 'studio' as TTSEngineMode,
                title: 'Studio hlasatel',
                desc: 'Čistá česká studiová výslovnost (online)',
              },
              {
                id: 'system' as TTSEngineMode,
                title: 'Systémový hlas zařízení',
                desc: status.hasCzechVoice
                  ? `Čeština: ${status.czechVoiceName || 'nalezen'}`
                  : 'Nativní Web Speech API',
              },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => pubSpeech.setEngine(item.id)}
                className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                  status.engine === item.id
                    ? 'bg-amber-950/70 border-amber-500 text-amber-100 ring-1 ring-amber-500/40'
                    : 'bg-stone-850/60 border-stone-800 hover:border-amber-900/60 text-stone-300'
                }`}
              >
                <div>
                  <div className="font-semibold text-xs text-amber-200">{item.title}</div>
                  <div className="text-[10px] text-stone-400">{item.desc}</div>
                </div>
                {status.engine === item.id && <Check className="w-4 h-4 text-amber-400 shrink-0 ml-2" />}
              </button>
            ))}
          </div>
        </div>

        {/* Rychlost čtení */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1 text-[11px] text-stone-400">
            <span className="font-semibold uppercase tracking-wider">Rychlost řeči:</span>
            <span className="text-amber-300 font-mono font-bold">{status.rate.toFixed(1)}x</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { label: '0.9x Rozvážná', val: 0.9 },
              { label: '1.0x Normální', val: 1.0 },
              { label: '1.15x Svižná', val: 1.15 },
            ].map((spd) => (
              <button
                key={spd.val}
                onClick={() => pubSpeech.setRate(spd.val)}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-medium border text-center transition-colors cursor-pointer ${
                  Math.abs(status.rate - spd.val) < 0.05
                    ? 'bg-amber-600 text-stone-950 border-amber-500 font-bold'
                    : 'bg-stone-850 border-stone-800 text-stone-300 hover:text-white'
                }`}
              >
                {spd.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tlačítko pro test zvuku */}
        <button
          onClick={() => {
            pubSpeech.unlock();
            pubSpeech.testVoice();
          }}
          className="w-full py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-stone-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all active:scale-[0.98]"
        >
          <Play className="w-3.5 h-3.5 fill-stone-950" />
          <span>Vyzkoušet zvuk kvízmistra</span>
        </button>
      </div>
    );
  };

  if (variant === 'icon-only') {
    return (
      <div className="relative inline-flex items-center">
        <button
          type="button"
          onClick={handleToggleSpeak}
          title={isThisSpeaking ? 'Zastavit předčítání' : 'Přečíst otázku nahlas'}
          aria-label={isThisSpeaking ? 'Zastavit předčítání otázky' : 'Přečíst otázku nahlas'}
          className={`p-2.5 rounded-xl border transition-all min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer ${
            isThisSpeaking
              ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.25)] ring-1 ring-amber-500'
              : 'bg-stone-900/80 hover:bg-stone-800 border-amber-900/60 text-stone-300 hover:text-amber-200'
          } ${className}`}
        >
          {isThisSpeaking ? (
            renderSoundWave()
          ) : (
            <Volume2 className="w-4 h-4 text-amber-400" />
          )}
        </button>
        {renderSettingsDropdown()}
      </div>
    );
  }

  if (variant === 'projector') {
    return (
      <div className="relative inline-flex items-center gap-1.5">
        <button
          type="button"
          onClick={handleToggleSpeak}
          title={isThisSpeaking ? 'Zastavit předčítání otázky' : 'Přečíst otázku nahlas celému sálu'}
          aria-label={isThisSpeaking ? 'Zastavit předčítání otázky' : 'Přečíst otázku nahlas'}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer border shadow-sm ${
            isThisSpeaking
              ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-md ring-2 ring-amber-400/50'
              : 'bg-stone-800/90 hover:bg-stone-700 text-amber-300 hover:text-amber-200 border-amber-800/60'
          } ${className}`}
        >
          {isThisSpeaking ? (
            <>
              <Square className="w-4 h-4 fill-stone-950 text-stone-950" />
              <span>Zastavit čtení</span>
              {renderSoundWave()}
            </>
          ) : (
            <>
              <Volume2 className="w-4 h-4 text-amber-400" />
              <span>Přečíst otázku nahlas</span>
            </>
          )}
        </button>

        {showSettingsButton && (
          <button
            type="button"
            onClick={handleOpenSettings}
            title="Nastavení hlasu kvízmistra"
            className="p-2 bg-stone-800/90 hover:bg-stone-700 text-stone-400 hover:text-amber-300 rounded-xl border border-amber-900/50 min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer transition-colors"
          >
            <Settings2 className="w-4 h-4" />
          </button>
        )}
        {renderSettingsDropdown()}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="relative inline-flex items-center gap-1">
        <button
          type="button"
          onClick={handleToggleSpeak}
          title={isThisSpeaking ? 'Zastavit čtení' : 'Přečíst otázku nahlas'}
          aria-label={isThisSpeaking ? 'Zastavit předčítání' : 'Přečíst otázku nahlas'}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer border ${
            isThisSpeaking
              ? 'bg-amber-950/80 border-amber-500 text-amber-300 ring-1 ring-amber-500 shadow-sm'
              : 'bg-stone-900/80 hover:bg-stone-800 border-stone-700/80 text-stone-300 hover:text-amber-300'
          } ${className}`}
        >
          {isThisSpeaking ? (
            <>
              <Square className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>Zastavit</span>
              {renderSoundWave()}
            </>
          ) : (
            <>
              <Volume2 className="w-3.5 h-3.5 text-amber-400" />
              <span>{label || 'Přečíst'}</span>
            </>
          )}
        </button>

        {showSettingsButton && (
          <button
            type="button"
            onClick={handleOpenSettings}
            title="Nastavení čtení a hlasu"
            className="p-1.5 bg-stone-900/80 hover:bg-stone-800 text-stone-400 hover:text-amber-300 rounded-lg border border-stone-700/80 flex items-center justify-center cursor-pointer transition-colors"
          >
            <Settings2 className="w-3 h-3" />
          </button>
        )}
        {renderSettingsDropdown()}
      </div>
    );
  }

  // Standardní varianta
  return (
    <div className="relative inline-flex items-center gap-1.5">
      <button
        type="button"
        onClick={handleToggleSpeak}
        title={isThisSpeaking ? 'Zastavit čtení' : 'Přečíst otázku nahlas'}
        aria-label={isThisSpeaking ? 'Zastavit předčítání' : 'Přečíst otázku nahlas'}
        className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer border shadow-sm ${
          isThisSpeaking
            ? 'bg-amber-950/90 border-amber-500 text-amber-200 ring-2 ring-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
            : 'bg-stone-900/80 hover:bg-stone-850 hover:border-amber-600/70 text-amber-300 border-amber-900/60'
        } ${className}`}
      >
        {isThisSpeaking ? (
          <>
            <Square className="w-4 h-4 fill-amber-400 text-amber-400 shrink-0" />
            <span>Čtu nahlas... (Zastavit)</span>
            {renderSoundWave()}
          </>
        ) : (
          <>
            <Volume2 className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{label}</span>
          </>
        )}
      </button>

      {showSettingsButton && (
        <button
          type="button"
          onClick={handleOpenSettings}
          title="Možnosti hlasu a rychlosti čtení"
          className="p-2.5 bg-stone-900/80 hover:bg-stone-800 text-stone-400 hover:text-amber-300 rounded-xl border border-amber-900/60 flex items-center justify-center cursor-pointer transition-colors"
        >
          <Settings2 className="w-4 h-4" />
        </button>
      )}
      {renderSettingsDropdown()}
    </div>
  );
};
