import React from 'react';
import { AppView, QuizRound } from '../types/quiz';
import { 
  Beer, Monitor, Users, Sparkles, 
  CheckCircle2, ArrowRight, Radio, Megaphone, Volume2, RefreshCw
} from 'lucide-react';
import { pubAudio } from '../utils/audio';

interface HomeViewProps {
  rounds: QuizRound[];
  onSelectView: (view: AppView) => void;
  onNewRandomQuiz?: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ rounds, onSelectView, onNewRandomQuiz }) => {
  const totalQuestions = rounds.reduce((acc, r) => acc + r.questions.length, 0);

  return (
    <div className="space-y-16 pb-16">
      {/* Hero sekce s hospodskou fotografií */}
      <section className="relative overflow-hidden border-b border-amber-950/80 bg-[#120a05]">
        <div className="absolute inset-0 z-0 opacity-25">
          <img
            src="/src/assets/images/pub_quiz_hero_1793011397048.jpg"
            alt="Tradiční česká hospoda s dřevěnými stoly a křídovou tabulí"
            className="w-full h-full object-cover filter brightness-75 contrast-125"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#120a05] via-[#120a05]/70 to-transparent" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 py-8 sm:px-6 sm:py-16 md:py-20 text-center space-y-4 sm:space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-700/50 text-amber-300 text-[11px] sm:text-xs font-semibold tracking-wider uppercase">
            <Beer className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
            <span>Pravá česká hospodská atmosféra</span>
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-6xl font-serif font-bold text-amber-100 tracking-tight leading-tight max-w-4xl mx-auto chalk-text">
            Hospodský kvíz pro 2 až 10 týmů
          </h1>

          <p className="text-stone-300 text-xs sm:text-base md:text-lg max-w-2xl mx-auto font-normal leading-relaxed">
            Každý tým hraje na vlastním mobilu (1–10 členů u stolu). Společný start, předčítání otázek nahlas, 20 sekund na odpověď a vítězná siréna pro šampiony!
          </p>

          {/* Hlavní akce */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={() => {
                pubAudio.playTavernBell();
                onSelectView('multiplayer');
              }}
              className="w-full sm:w-auto px-8 py-4 bg-amber-500 hover:bg-amber-400 text-stone-950 font-serif font-bold text-base rounded-xl shadow-lg transition-transform active:scale-98 flex items-center justify-center gap-3"
            >
              <Radio className="w-5 h-5 text-stone-950 animate-pulse" />
              <span>Spustit hru pro týmy na mobilech</span>
            </button>

            <button
              onClick={() => {
                pubAudio.playTavernBell();
                onSelectView('host');
              }}
              className="w-full sm:w-auto px-8 py-4 bg-stone-900/90 hover:bg-stone-800 border border-amber-600/50 text-amber-200 font-serif font-bold text-base rounded-xl transition-transform active:scale-98 flex items-center justify-center gap-3"
            >
              <Monitor className="w-5 h-5 text-amber-400" />
              <span>Mód Kvízmistra & Promítání</span>
            </button>
            {onNewRandomQuiz && (
              <button
                onClick={onNewRandomQuiz}
                className="w-full sm:w-auto px-6 py-4 bg-stone-900/90 hover:bg-stone-800 border border-amber-600/60 text-amber-300 font-serif font-bold text-base rounded-xl transition-transform active:scale-98 flex items-center justify-center gap-2.5 cursor-pointer shadow-md"
              >
                <RefreshCw className="w-5 h-5 text-amber-400" />
                <span>🎲 Namíchat nový náhodný kvíz</span>
              </button>
            )}
          </div>

          {/* Drobné body důvěry */}
          <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-stone-400">
            <span className="flex items-center gap-1.5 text-amber-300 font-semibold">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Při každém novém kvízu nové náhodné otázky
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-amber-500" />
              2 až 10 týmů po 1 až 10 členech
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-amber-500" />
              Společný start a 20s odpočet
            </span>
            <span className="flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-amber-500" />
              Hlasové předčítání otázek v češtině
            </span>
            <span className="flex items-center gap-1.5">
              <Megaphone className="w-4 h-4 text-amber-500" />
              Vítězné houkání pro 1. místo
            </span>
          </div>
        </div>
      </section>

      {/* Tři herní možnosti */}
      <section className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-10 space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-500">
            Formáty hry
          </span>
          <h2 className="text-3xl font-serif font-bold text-amber-100">
            Jak chcete dnešní večer hrát?
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Karta 1: Týmová hra na mobilech */}
          <div className="bg-[#18110b] border border-amber-600/80 rounded-2xl p-6 shadow-xl flex flex-col justify-between hover:border-amber-400 transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-amber-500 text-stone-950 text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
              Doporučeno
            </div>

            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-amber-950/80 border border-amber-600/50 flex items-center justify-center text-amber-400">
                <Radio className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-serif font-bold text-amber-100 group-hover:text-amber-400 transition-colors">
                Společná hra na zařízeních (Multiplayer)
              </h3>
              <p className="text-stone-300 text-xs leading-relaxed">
                2 až 10 týmů (každý 1–10 lidí). Každý stůl hraje na svém mobilu, společný start, otázky čtené nahlas, 20s limit a vítězné houkání!
              </p>
            </div>

            <div className="pt-6">
              <button
                onClick={() => {
                  pubAudio.playTavernBell();
                  onSelectView('multiplayer');
                }}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <span>Hrát společně na mobilech</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Karta 2: Kvízmistr */}
          <div className="bg-[#18110b] border border-amber-900/50 rounded-2xl p-6 shadow-xl flex flex-col justify-between hover:border-amber-700/60 transition-all group">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-amber-950/80 border border-amber-700/50 flex items-center justify-center text-amber-400">
                <Monitor className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-serif font-bold text-amber-100 group-hover:text-amber-400 transition-colors">
                Kvízmistr & Promítání na TV
              </h3>
              <p className="text-stone-300 text-xs leading-relaxed">
                Moderátorský pult s promítáním na plátno, časomírou a ručním zapisováním bodů na hospodskou účtenku.
              </p>
            </div>

            <div className="pt-6">
              <button
                onClick={() => {
                  pubAudio.playTavernBell();
                  onSelectView('host');
                }}
                className="w-full py-3 bg-stone-900 hover:bg-stone-800 text-amber-300 border border-amber-800/60 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all"
              >
                <span>Pult Kvízmistra</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Karta 3: Sólo u stolu */}
          <div className="bg-[#18110b] border border-amber-900/50 rounded-2xl p-6 shadow-xl flex flex-col justify-between hover:border-amber-700/60 transition-all group">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-amber-950/80 border border-amber-700/50 flex items-center justify-center text-amber-400">
                <Beer className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-serif font-bold text-amber-100 group-hover:text-amber-400 transition-colors">
                Sólo nebo jeden stůl
              </h3>
              <p className="text-stone-300 text-xs leading-relaxed">
                Tréninková hra na jednom zařízení bez nutnosti internetového připojení či více telefonů s hospodským diplomem.
              </p>
            </div>

            <div className="pt-6">
              <button
                onClick={() => {
                  pubAudio.playBeerClink();
                  onSelectView('player');
                }}
                className="w-full py-3 bg-stone-900 hover:bg-stone-800 text-amber-300 border border-amber-800/60 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all"
              >
                <span>Rychlá hra u stolu</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Přehled připravených kol */}
      <section className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-500">
              Knihovna témat
            </span>
            <h2 className="text-3xl font-serif font-bold text-amber-100">
              Připravená kola v základní nabídce
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onSelectView('rounds')}
              className="text-sm font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1.5"
            >
              <span>Zobrazit všechny otázky ({totalQuestions})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rounds.map((round) => (
            <div
              key={round.id}
              className="bg-[#18110b] border border-amber-950/80 rounded-xl p-5 space-y-3 hover:border-amber-800/60 transition-all shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-amber-500">
                  Kolo {round.roundNumber}
                </span>
                <span className="text-xs text-stone-400">
                  {round.questions.length} otázek
                </span>
              </div>
              <h3 className="font-serif font-bold text-lg text-amber-100 leading-snug">
                {round.title}
              </h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                {round.description}
              </p>
            </div>
          ))}

          {/* Karta pro AI generátor */}
          <div
            onClick={() => onSelectView('generator')}
            className="bg-amber-950/30 border border-dashed border-amber-700/60 rounded-xl p-5 space-y-3 hover:bg-amber-950/50 cursor-pointer transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-amber-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Nové téma na přání</span>
              </div>
              <h3 className="font-serif font-bold text-lg text-amber-200 mt-2">
                Generátor kol s AI
              </h3>
              <p className="text-xs text-stone-300 mt-1">
                Zadejte vlastní téma a vytvořte okamžitě nové kolo pro váš hospodský večer.
              </p>
            </div>

            <span className="text-xs font-semibold text-amber-400 flex items-center gap-1 pt-2">
              Vygenerovat kolo <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </section>
    </div>
  );
};
