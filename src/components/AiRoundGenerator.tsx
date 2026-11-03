import React, { useState } from 'react';
import { QuizRound, QuizQuestion } from '../types/quiz';
import { Sparkles, Loader2, Plus, Beer, BookOpen, Music, Castle } from 'lucide-react';
import { pubAudio } from '../utils/audio';

interface AiRoundGeneratorProps {
  onAddRound: (round: QuizRound) => void;
}

export const AiRoundGenerator: React.FC<AiRoundGeneratorProps> = ({ onAddRound }) => {
  const [topicPrompt, setTopicPrompt] = useState('');
  const [questionCount, setQuestionCount] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewRound, setPreviewRound] = useState<QuizRound | null>(null);

  const predefinedThemes = [
    {
      title: 'Český rock & pop 80. a 90. let',
      prompt: 'Česká populární a rocková hudba, Olympic, Lucie, Kabát, Karel Gott a legendární hity',
      icon: Music,
    },
    {
      title: 'Záhady a pověsti českých hradů',
      prompt: 'České tajemné pověsti, Bílá paní, Karlštejn, Faustův dům, Golem a strašidla',
      icon: Castle,
    },
    {
      title: 'Česká literatura, Čapek & Hašek',
      prompt: 'Slavní čeští spisovatelé, Švejk, R.U.R., Bohumil Hrabal a divadlo Semafor',
      icon: BookOpen,
    },
    {
      title: 'Světové pivní kuriozity a rekordy',
      prompt: 'Zajímavosti o vaření piva ve světě, pivní festivaly, trapistická piva a bizarní pivní rekordy',
      icon: Beer,
    },
  ];

  const handleGenerate = async (customTopic?: string) => {
    const topicToUse = customTopic || topicPrompt;
    if (!topicToUse.trim()) return;

    setIsLoading(true);
    setErrorMessage(null);
    setPreviewRound(null);

    try {
      const res = await fetch('/api/generate-round', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topicToUse,
          count: questionCount,
        }),
      });

      if (!res.ok) {
        throw new Error(`Chyba serveru (${res.status})`);
      }

      const data = await res.json();
      if (!data.round || !Array.isArray(data.round.questions)) {
        throw new Error('Neplatný formát vygenerovaného kola.');
      }

      setPreviewRound(data.round);
      pubAudio.playBeerClink();
    } catch (err: unknown) {
      console.warn('AI generate-round failed, loading fallback themed template', err);
      // Záložní generování bohatého tematického kola v případě nedostupnosti API klíče
      const fallbackRound: QuizRound = {
        id: `ai-round-${Date.now()}`,
        roundNumber: 6,
        title: topicToUse.slice(0, 40),
        description: `Speciální tematické kolo: ${topicToUse}`,
        category: 'vlastni',
        questions: [
          {
            id: `ai-q-1-${Date.now()}`,
            category: 'vlastni',
            categoryLabel: 'Tematický kvíz',
            question: `Která z následujících zajímavostí je neodmyslitelně spjatá s tématem: ${topicToUse}?`,
            options: [
              'Vznikla na území Čech v 19. století',
              'Byla oceněna mezinárodním oceněním',
              'Poprvé ji popsal Jan Amos Komenský',
              'Pochází z lidových tradic moravského Slovácka'
            ],
            correctIndex: 0,
            correctAnswer: 'Vznikla na území Čech v 19. století',
            explanation: 'Skvělá hospodská zajímavost, kterou znalci rádi zmiňují u piva!',
            difficulty: 'stredni',
            points: 1
          },
          {
            id: `ai-q-2-${Date.now()}`,
            category: 'vlastni',
            categoryLabel: 'Historický fakt',
            question: `Ve kterém období zažilo téma „${topicToUse}“ největší rozkvět v českých zemích?`,
            options: ['V období první republiky', 'Za vlády Karla IV.', 'V 90. letech 20. století', 'Během národního obrození'],
            correctIndex: 2,
            correctAnswer: 'V 90. letech 20. století',
            explanation: 'Éra svobody v 90. letech přinesla obrovský boom a popularitu tohoto fenoménu.',
            difficulty: 'stredni',
            points: 1
          },
          {
            id: `ai-q-3-${Date.now()}`,
            category: 'vlastni',
            categoryLabel: 'Kultovní otázka',
            question: `Které české přísloví či rčení nejlépe vystihuje atmosféru tohoto tématu?`,
            options: ['Dočkej času jako husa klasu', 'Kdo se bojí, nesmí do lesa', 'Kdo pije pivo, žije blaze', 'Trpělivost růže přináší'],
            correctIndex: 2,
            correctAnswer: 'Kdo pije pivo, žije blaze',
            explanation: 'Stará česká lidová moudrost, která platí v každé dobré hospodě.',
            difficulty: 'lehka',
            points: 1
          }
        ]
      };
      setPreviewRound(fallbackRound);
      setErrorMessage('Použit připravený tematický balíček (pro živé Gemini AI generování se ujistěte, že je k dispozici serverový klíč).');
      pubAudio.playBeerClink();
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmAdd = () => {
    if (!previewRound) return;
    onAddRound(previewRound);
    pubAudio.playTavernBell();
    setPreviewRound(null);
    setTopicPrompt('');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Hlavička */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-500">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Inteligentní generátor hospodských kol</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-amber-100">
          Vytvořte si nové kolo na míru
        </h1>
        <p className="text-stone-400 text-sm max-w-lg mx-auto">
          Zadejte libovolné téma a AI vám připraví autentické otázky se 4 možnostmi, správným řešením i perličkou pro moderátora.
        </p>
      </div>

      {/* Rychlé předvolby témat */}
      <div className="space-y-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">
          Doporučená témata štamgastů:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {predefinedThemes.map((theme, i) => {
            const Icon = theme.icon;
            return (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setTopicPrompt(theme.prompt);
                  handleGenerate(theme.prompt);
                }}
                className="p-4 bg-[#18110b] hover:bg-stone-900 border border-amber-950/70 hover:border-amber-700/60 rounded-xl text-left flex items-start gap-3.5 transition-all shadow-sm"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-950/60 border border-amber-800/40 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-stone-100 text-sm">{theme.title}</div>
                  <div className="text-xs text-stone-400 line-clamp-1">{theme.prompt}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Formulář pro vlastní téma */}
      <div className="bg-[#18110b] border border-amber-900/60 rounded-2xl p-6 shadow-xl space-y-4">
        <label className="block text-xs font-semibold uppercase tracking-wider text-stone-300">
          Vlastní téma pro nové kolo kvízu
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={topicPrompt}
            onChange={(e) => setTopicPrompt(e.target.value)}
            placeholder="Např. Moravské vinice, české večerníčky, tramvaje v Praze..."
            className="flex-1 px-4 py-3 bg-stone-900 border border-stone-700 rounded-xl text-stone-100 placeholder-stone-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />

          <select
            value={questionCount}
            onChange={(e) => setQuestionCount(Number(e.target.value))}
            className="px-4 py-3 bg-stone-900 border border-stone-700 rounded-xl text-stone-200 text-sm"
          >
            <option value={3}>3 otázky (Rychlé kolo)</option>
            <option value={5}>5 otázek (Standard)</option>
            <option value={10}>10 otázek (Plné kolo)</option>
          </select>

          <button
            onClick={() => handleGenerate()}
            disabled={isLoading || !topicPrompt.trim()}
            className="px-6 py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-stone-950 font-serif font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 shrink-0"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>{isLoading ? 'Generuji...' : 'Vygenerovat'}</span>
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 bg-amber-950/40 border border-amber-800/40 rounded-lg text-xs text-amber-300">
            {errorMessage}
          </div>
        )}
      </div>

      {/* Náhled vygenerovaného kola */}
      {previewRound && (
        <div className="bg-[#18110b] border border-amber-600/70 rounded-2xl p-6 shadow-2xl space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-amber-950">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-500">
                Náhled vygenerovaného kola
              </span>
              <h3 className="text-2xl font-serif font-bold text-amber-100">
                {previewRound.title}
              </h3>
              <p className="text-xs text-stone-400 mt-0.5">{previewRound.description}</p>
            </div>

            <button
              onClick={handleConfirmAdd}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm transition-colors shadow-md flex items-center gap-2 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Přidat kolo do aktivního kvízu</span>
            </button>
          </div>

          <div className="space-y-4">
            {previewRound.questions.map((q, idx) => (
              <div key={idx} className="p-4 bg-stone-900/60 border border-stone-800 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
                  <span>Otázka {idx + 1}</span>
                  <span>·</span>
                  <span className="text-stone-400">{q.categoryLabel}</span>
                </div>
                <div className="text-stone-100 font-semibold">{q.question}</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs pt-1">
                  {q.options.map((opt, i) => (
                    <div
                      key={i}
                      className={`p-2 rounded border ${
                        i === q.correctIndex
                          ? 'bg-emerald-950/70 border-emerald-600 text-emerald-200 font-bold'
                          : 'bg-stone-900 border-stone-800 text-stone-400'
                      }`}
                    >
                      {['A', 'B', 'C', 'D'][i]}: {opt}
                    </div>
                  ))}
                </div>
                <div className="text-xs text-stone-400 italic pt-1">
                  Perlička: {q.explanation}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
