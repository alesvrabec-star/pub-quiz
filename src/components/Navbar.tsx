import React from 'react';
import { AppView } from '../types/quiz';
import { Volume2, VolumeX, Beer, Users, Monitor, BookOpen, Sparkles, Home } from 'lucide-react';
import { pubAudio } from '../utils/audio';

interface NavbarProps {
  currentView: AppView;
  onSelectView: (view: AppView) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onNewQuiz?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onSelectView,
  isMuted,
  onToggleMute,
  onNewQuiz,
}) => {
  return (
    <>
      {/* 1. HORNÍ LIŠTA (Kompaktní na mobilu 52px, na desktopu plná lišta) */}
      <header className="sticky top-0 z-40 bg-[#140e09]/95 backdrop-blur-md border-b border-amber-900/40 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between gap-4">
        {/* Brand Zone */}
        <button 
          onClick={() => {
            pubAudio.playBeerClink();
            onSelectView('home');
          }}
          className="flex items-center gap-2 text-lg md:text-xl font-bold tracking-tight text-amber-100 hover:text-amber-400 transition-colors whitespace-nowrap shrink-0 font-serif text-left active:scale-95"
        >
          <Beer className="w-5 h-5 md:w-6 md:h-6 text-amber-500 shrink-0" />
          <span>Hospodský kvíz</span>
        </button>

        {/* Desktop Navigace (skrytá na mobilu, na mobilu je v dolní liště) */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-stone-300">
          <button
            onClick={() => onSelectView('home')}
            className={`hover:text-amber-300 transition-colors whitespace-nowrap shrink-0 py-1 ${
              currentView === 'home' ? 'text-amber-400 border-b-2 border-amber-500 font-semibold' : 'text-stone-300'
            }`}
          >
            Přehled
          </button>
          <button
            onClick={() => {
              pubAudio.playTavernBell();
              onSelectView('multiplayer');
            }}
            className={`hover:text-amber-300 transition-colors whitespace-nowrap shrink-0 py-1 flex items-center gap-1.5 ${
              currentView === 'multiplayer' ? 'text-amber-400 border-b-2 border-amber-500 font-semibold' : 'text-stone-300'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-amber-500" />
            <span>Týmová hra (2–10 týmů)</span>
          </button>
          <button
            onClick={() => {
              pubAudio.playTavernBell();
              onSelectView('host');
            }}
            className={`hover:text-amber-300 transition-colors whitespace-nowrap shrink-0 py-1 ${
              currentView === 'host' ? 'text-amber-400 border-b-2 border-amber-500 font-semibold' : 'text-stone-300'
            }`}
          >
            Kvízmistr
          </button>
          <button
            onClick={() => {
              pubAudio.playBeerClink();
              onSelectView('player');
            }}
            className={`hover:text-amber-300 transition-colors whitespace-nowrap shrink-0 py-1 ${
              currentView === 'player' ? 'text-amber-400 border-b-2 border-amber-500 font-semibold' : 'text-stone-300'
            }`}
          >
            Sólo u stolu
          </button>
          <button
            onClick={() => onSelectView('rounds')}
            className={`hover:text-amber-300 transition-colors whitespace-nowrap shrink-0 py-1 ${
              currentView === 'rounds' ? 'text-amber-400 border-b-2 border-amber-500 font-semibold' : 'text-stone-300'
            }`}
          >
            Otázky & Tisk
          </button>
        </nav>

        {/* Pravá akční zóna: Zvuk + tlačítko */}
        <div className="flex items-center gap-2 shrink-0">
          {onNewQuiz && (
            <button
              onClick={onNewQuiz}
              title="Vylosovat nový hospodský kvíz s náhodnými otázkami"
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-amber-300 hover:text-stone-950 bg-stone-900/80 hover:bg-amber-400 border border-amber-600/50 rounded-lg transition-colors whitespace-nowrap active:scale-95 cursor-pointer"
            >
              <span>🎲 Nový náhodný kvíz</span>
            </button>
          )}

          <button
            onClick={onToggleMute}
            title={isMuted ? 'Zapnout hospodské zvuky' : 'Ztlumit zvuky'}
            aria-label={isMuted ? 'Zapnout zvuky' : 'Ztlumit zvuky'}
            className="w-10 h-10 flex items-center justify-center text-stone-300 hover:text-amber-300 transition-colors rounded-xl bg-stone-900/60 border border-stone-800 active:scale-95"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-stone-500" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
          </button>

          <button
            onClick={() => {
              pubAudio.playTavernBell();
              onSelectView('multiplayer');
            }}
            className="hidden sm:inline-flex px-3.5 py-2 text-xs font-semibold uppercase tracking-wider text-stone-950 bg-amber-500 hover:bg-amber-400 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0 active:scale-95"
          >
            Hra na mobilech
          </button>
        </div>
      </header>

      {/* 2. DEDIKOVANÁ SPODNÍ NAVIGAČNÍ LIŠTA PRO MOBILNÍ ZAŘÍZENÍ (THUMB ZONE) */}
      <nav 
        aria-label="Mobilní navigace"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#140e09]/95 backdrop-blur-lg border-t border-amber-900/40 pb-safe grid grid-cols-5 items-center h-16 shadow-2xl"
      >
        <button
          onClick={() => {
            pubAudio.playBeerClink();
            onSelectView('home');
          }}
          className={`h-full min-h-[44px] flex flex-col items-center justify-center gap-1 transition-colors active:scale-95 ${
            currentView === 'home' ? 'text-amber-400 font-bold' : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Přehled</span>
        </button>

        <button
          onClick={() => {
            pubAudio.playTavernBell();
            onSelectView('multiplayer');
          }}
          className={`h-full min-h-[44px] flex flex-col items-center justify-center gap-1 transition-colors relative active:scale-95 ${
            currentView === 'multiplayer' ? 'text-amber-400 font-bold' : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Týmy</span>
          <span className="absolute top-2 right-4 w-2 h-2 rounded-full bg-amber-500" />
        </button>

        <button
          onClick={() => {
            pubAudio.playTavernBell();
            onSelectView('host');
          }}
          className={`h-full min-h-[44px] flex flex-col items-center justify-center gap-1 transition-colors active:scale-95 ${
            currentView === 'host' ? 'text-amber-400 font-bold' : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <Monitor className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Kvízmistr</span>
        </button>

        <button
          onClick={() => {
            pubAudio.playBeerClink();
            onSelectView('player');
          }}
          className={`h-full min-h-[44px] flex flex-col items-center justify-center gap-1 transition-colors active:scale-95 ${
            currentView === 'player' ? 'text-amber-400 font-bold' : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <Beer className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Sólo stůl</span>
        </button>

        <button
          onClick={() => onSelectView('rounds')}
          className={`h-full min-h-[44px] flex flex-col items-center justify-center gap-1 transition-colors active:scale-95 ${
            currentView === 'rounds' ? 'text-amber-400 font-bold' : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <BookOpen className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Otázky</span>
        </button>
      </nav>
    </>
  );
};
