import React, { useState } from 'react';
import { QuizRound, QuizQuestion, CategoryType } from '../types/quiz';
import { Search, Printer, Plus, ChevronDown, ChevronUp, Check, HelpCircle, RefreshCw } from 'lucide-react';
import { pubAudio } from '../utils/audio';
import { SpeakQuestionButton } from './SpeakQuestionButton';

interface RoundViewerProps {
  rounds: QuizRound[];
  onAddCustomQuestion: (roundId: string, question: QuizQuestion) => void;
  onReshuffleRounds?: () => void;
}

export const RoundViewer: React.FC<RoundViewerProps> = ({ rounds, onAddCustomQuestion, onReshuffleRounds }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);

  // Formulář pro přidání vlastní otázky
  const [isAddingOpen, setIsAddingOpen] = useState(false);
  const [targetRoundId, setTargetRoundId] = useState(rounds[0]?.id || '');
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newOptA, setNewOptA] = useState('');
  const [newOptB, setNewOptB] = useState('');
  const [newOptC, setNewOptC] = useState('');
  const [newOptD, setNewOptD] = useState('');
  const [newCorrectIdx, setNewCorrectIdx] = useState(0);
  const [newExplanation, setNewExplanation] = useState('');

  const toggleExpand = (id: string) => {
    setExpandedQuestionId(expandedQuestionId === id ? null : id);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCreateQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionText.trim() || !newOptA.trim() || !newOptB.trim()) return;

    const options = [newOptA.trim(), newOptB.trim(), newOptC.trim() || 'Žádná z uvedených', newOptD.trim() || 'Všechny uvedené'];
    const created: QuizQuestion = {
      id: `custom-q-${Date.now()}`,
      category: 'vlastni',
      categoryLabel: 'Vlastní hospodská otázka',
      question: newQuestionText.trim(),
      options: options,
      correctIndex: newCorrectIdx,
      correctAnswer: options[newCorrectIdx],
      explanation: newExplanation.trim() || 'Vlastnoručně přidaná otázka štamgasta.',
      difficulty: 'stredni',
      points: 1,
    };

    onAddCustomQuestion(targetRoundId, created);
    pubAudio.playBeerClink();

    // Reset formuláře
    setNewQuestionText('');
    setNewOptA('');
    setNewOptB('');
    setNewOptC('');
    setNewOptD('');
    setNewExplanation('');
    setIsAddingOpen(false);
  };

  // Filtrování
  const allQuestionsWithRound = rounds.flatMap((r) =>
    r.questions.map((q) => ({ ...q, roundTitle: r.title, roundId: r.id, roundNum: r.roundNumber }))
  );

  const filteredQuestions = allQuestionsWithRound.filter((item) => {
    const matchesSearch =
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.correctAnswer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.explanation.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'all' || item.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Horní hlavička */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-amber-950">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-500">
            Knihovna & Tiskové archy
          </span>
          <h1 className="text-3xl font-serif font-bold text-amber-100">
            Katalog všech otázek ({allQuestionsWithRound.length})
          </h1>
          <p className="text-sm text-stone-400 mt-1">
            Procházejte otázky, připravte si podklady pro moderování nebo vytiskněte archy na stoly.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {onReshuffleRounds && (
            <button
              onClick={onReshuffleRounds}
              className="flex items-center gap-2 px-3 py-2 bg-stone-900/90 hover:bg-stone-800 text-amber-300 border border-amber-600/60 rounded-lg text-sm font-medium transition-colors cursor-pointer"
              title="Vylosovat z databáze úplně nový balíček náhodných otázek"
            >
              <RefreshCw className="w-4 h-4 text-amber-400" />
              <span>🎲 Nový náhodný kvíz</span>
            </button>
          )}

          <button
            onClick={() => setIsAddingOpen(!isAddingOpen)}
            className="flex items-center gap-2 px-4 py-2 bg-stone-800 hover:bg-stone-700 text-amber-300 border border-amber-800/50 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Přidat otázku</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-stone-950 font-semibold rounded-lg text-sm transition-colors shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Tisk archů</span>
          </button>
        </div>
      </div>

      {/* Formulář pro přidání vlastní otázky */}
      {isAddingOpen && (
        <form
          onSubmit={handleCreateQuestion}
          className="bg-[#18110b] border border-amber-900/60 rounded-2xl p-6 shadow-xl space-y-4 animate-fadeIn"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-lg text-amber-200">
              Přidat novou otázku do kvízu
            </h3>
            <button
              type="button"
              onClick={() => setIsAddingOpen(false)}
              className="text-stone-400 hover:text-stone-200 text-xs"
            >
              Zrušit
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1">
                Kolo, do kterého otázku zařadit
              </label>
              <select
                value={targetRoundId}
                onChange={(e) => setTargetRoundId(e.target.value)}
                className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-lg text-sm text-stone-200"
              >
                {rounds.map((r) => (
                  <option key={r.id} value={r.id}>
                    Kolo {r.roundNumber}: {r.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1">
                Znění otázky
              </label>
              <input
                type="text"
                placeholder="Např. Který český král založil Nové Město pražské?"
                value={newQuestionText}
                onChange={(e) => setNewQuestionText(e.target.value)}
                className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-lg text-sm text-stone-200"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { val: newOptA, set: setNewOptA, label: 'Možnost A' },
              { val: newOptB, set: setNewOptB, label: 'Možnost B' },
              { val: newOptC, set: setNewOptC, label: 'Možnost C' },
              { val: newOptD, set: setNewOptD, label: 'Možnost D' },
            ].map((opt, i) => (
              <div key={i}>
                <label className="block text-xs font-semibold text-stone-400 mb-1">
                  {opt.label} {newCorrectIdx === i ? '(Správná)' : ''}
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={opt.val}
                    onChange={(e) => opt.set(e.target.value)}
                    placeholder={`Odpověď ${['A', 'B', 'C', 'D'][i]}...`}
                    className="flex-1 px-3 py-1.5 bg-stone-900 border border-stone-700 rounded-lg text-sm text-stone-200"
                    required={i < 2}
                  />
                  <button
                    type="button"
                    onClick={() => setNewCorrectIdx(i)}
                    className={`px-2 py-1 rounded text-xs font-bold ${
                      newCorrectIdx === i
                        ? 'bg-emerald-600 text-white'
                        : 'bg-stone-800 text-stone-400 hover:bg-stone-700'
                    }`}
                    title="Označit jako správnou možnost"
                  >
                    ✓
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1">
              Vysvětlení / perlička k přečtení moderátorem
            </label>
            <input
              type="text"
              placeholder="Doplňující zajímavost nebo příběh..."
              value={newExplanation}
              onChange={(e) => setNewExplanation(e.target.value)}
              className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-lg text-sm text-stone-200"
            />
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-lg text-sm transition-colors"
          >
            Uložit otázku do kvízu
          </button>
        </form>
      )}

      {/* Vyhledávací a filtrační lišta */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Hledat v otázkách, odpovědích nebo perličkách..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#18110b] border border-stone-800 rounded-xl text-stone-200 placeholder-stone-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
          />
        </div>

        {/* Filtr kategorií */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: 'all', label: 'Vše' },
            { id: 'cesko', label: 'Česko & Historie' },
            { id: 'film', label: 'Film & Hlášky' },
            { id: 'prehled', label: 'Rozhled & Věda' },
            { id: 'sport', label: 'Sport' },
            { id: 'pivo', label: 'Pivo & Hospoda' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-amber-600 text-stone-950 font-semibold'
                  : 'bg-stone-900/80 text-stone-400 hover:bg-stone-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Výpis otázek */}
      <div className="space-y-3">
        {filteredQuestions.length === 0 ? (
          <div className="text-center py-12 text-stone-500 text-sm">
            Nenalezeny žádné otázky odpovídající zadanému filtru.
          </div>
        ) : (
          filteredQuestions.map((item, index) => {
            const isExpanded = expandedQuestionId === item.id;

            return (
              <div
                key={item.id}
                className="bg-[#18110b] border border-amber-950/70 hover:border-amber-900/60 rounded-xl p-4 transition-all shadow-sm"
              >
                <div
                  onClick={() => toggleExpand(item.id)}
                  className="flex items-start justify-between gap-4 cursor-pointer"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="w-6 h-6 rounded bg-stone-800 text-amber-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2 text-xs text-amber-500 font-medium mb-1">
                        <span>Kolo {item.roundNum}: {item.roundTitle}</span>
                        <span>·</span>
                        <span className="text-stone-400">{item.categoryLabel}</span>
                      </div>
                      <h4 className="text-base font-semibold text-stone-100">
                        {item.question}
                      </h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-mono text-stone-400 hidden sm:inline">
                      {item.points} {item.points === 1 ? 'bod' : 'body'}
                    </span>
                    <button className="text-stone-400 hover:text-stone-200">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Rozbalené detaily s odpověďmi */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-stone-800/80 space-y-3 animate-fadeIn">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {item.options.map((opt, optIdx) => {
                        const isCorrect = optIdx === item.correctIndex;
                        const letter = ['A', 'B', 'C', 'D'][optIdx];
                        return (
                          <div
                            key={optIdx}
                            className={`p-2.5 rounded-lg border flex items-center gap-2 ${
                              isCorrect
                                ? 'bg-emerald-950/60 border-emerald-500/80 text-emerald-200 font-semibold'
                                : 'bg-stone-900/60 border-stone-800 text-stone-400'
                            }`}
                          >
                            <span className="w-5 h-5 rounded bg-stone-800 text-stone-300 flex items-center justify-center text-[11px] shrink-0">
                              {letter}
                            </span>
                            <span>{opt}</span>
                            {isCorrect && <Check className="w-3.5 h-3.5 text-emerald-400 ml-auto shrink-0" />}
                          </div>
                        );
                      })}
                    </div>

                    <div className="p-3 bg-amber-950/30 border border-amber-900/40 rounded-lg text-xs text-stone-300 leading-relaxed">
                      <span className="font-semibold text-amber-400 block mb-0.5">Zajímavost pro moderátora:</span>
                      {item.explanation}
                    </div>

                    <div className="pt-1 flex items-center justify-end">
                      <SpeakQuestionButton
                        questionText={item.question}
                        options={item.options}
                        variant="compact"
                        label="Přečíst otázku nahlas"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
