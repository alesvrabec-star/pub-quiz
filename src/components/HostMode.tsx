import React, { useState, useEffect } from 'react';
import { QuizRound, TeamScore } from '../types/quiz';
import { 
  Play, Pause, RotateCcw, Eye, EyeOff, Monitor, ChevronLeft, ChevronRight, 
  Plus, Minus, Trophy, Users, Bell, Sparkles, X, Check, TrendingUp, BarChart3, RefreshCw
} from 'lucide-react';
import { pubAudio } from '../utils/audio';
import { pubSpeech } from '../utils/speech';
import { ScoreProgressionChart } from './ScoreProgressionChart';
import { SpeakQuestionButton } from './SpeakQuestionButton';

interface HostModeProps {
  rounds: QuizRound[];
  teams: TeamScore[];
  onUpdateTeams: (teams: TeamScore[]) => void;
  onReshuffleRounds?: () => void;
}

export const HostMode: React.FC<HostModeProps> = ({
  rounds,
  teams,
  onUpdateTeams,
  onReshuffleRounds,
}) => {
  const [selectedRoundIndex, setSelectedRoundIndex] = useState(0);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isProjectorMode, setIsProjectorMode] = useState(false);
  const [projectorView, setProjectorView] = useState<'question' | 'chart'>('question');
  const [newTeamName, setNewTeamName] = useState('');
  const [tableNumber, setTableNumber] = useState(1);

  // Časomíra
  const [timerSeconds, setTimerSeconds] = useState(30);
  const [initialSeconds, setInitialSeconds] = useState(30);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const currentRound = rounds[selectedRoundIndex] || rounds[0];
  const currentQuestion = currentRound?.questions[selectedQuestionIndex] || currentRound?.questions[0];

  const handleToggleOptionSelection = (optionIndex: number) => {
    if (selectedOptionIndex === optionIndex) {
      // Pokud je již označena a klikneme znovu, přepneme zobrazení řešení
      setShowAnswer(!showAnswer);
    } else {
      setSelectedOptionIndex(optionIndex);
      pubAudio.playBeerClink();
    }
  };

  // Automatický reset označené možnosti a skrytí řešení při přechodu na jinou otázku nebo kolo
  useEffect(() => {
    setSelectedOptionIndex(null);
    setShowAnswer(false);
  }, [selectedRoundIndex, selectedQuestionIndex]);

  // Časovač efekt
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 6 && prev > 1) {
            pubAudio.playTick();
          } else if (prev === 1) {
            pubAudio.playGong();
            setIsTimerRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timerSeconds]);

  const startTimer = (seconds?: number) => {
    const s = seconds !== undefined ? seconds : timerSeconds > 0 ? timerSeconds : initialSeconds;
    setTimerSeconds(s);
    setInitialSeconds(s);
    setIsTimerRunning(true);
    pubAudio.playTavernBell();
  };

  const pauseTimer = () => {
    setIsTimerRunning(false);
  };

  const resetTimer = (seconds = initialSeconds) => {
    setIsTimerRunning(false);
    setTimerSeconds(seconds);
  };

  // Navigace v otázkách
  const goToNextQuestion = () => {
    pubSpeech.stop();
    setShowAnswer(false);
    setSelectedOptionIndex(null);
    resetTimer(initialSeconds);
    if (selectedQuestionIndex < currentRound.questions.length - 1) {
      setSelectedQuestionIndex(selectedQuestionIndex + 1);
    } else if (selectedRoundIndex < rounds.length - 1) {
      setSelectedRoundIndex(selectedRoundIndex + 1);
      setSelectedQuestionIndex(0);
      pubAudio.playTavernBell();
    }
  };

  const goToPrevQuestion = () => {
    pubSpeech.stop();
    setShowAnswer(false);
    setSelectedOptionIndex(null);
    resetTimer(initialSeconds);
    if (selectedQuestionIndex > 0) {
      setSelectedQuestionIndex(selectedQuestionIndex - 1);
    } else if (selectedRoundIndex > 0) {
      setSelectedRoundIndex(selectedRoundIndex - 1);
      setSelectedQuestionIndex(rounds[selectedRoundIndex - 1].questions.length - 1);
    }
  };

  // Správa týmů
  const handleAddTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    const newTeam: TeamScore = {
      id: `team-${Date.now()}`,
      name: newTeamName.trim(),
      tableNumber: tableNumber,
      totalScore: 0,
      roundScores: {},
    };
    onUpdateTeams([...teams, newTeam]);
    setNewTeamName('');
    setTableNumber(tableNumber + 1);
    pubAudio.playBeerClink();
  };

  const updateTeamScore = (teamId: string, delta: number) => {
    const updated = teams.map((team) => {
      if (team.id === teamId) {
        const newTotal = Math.max(0, team.totalScore + delta);
        const currentRoundScore = (team.roundScores[currentRound.id] || 0) + delta;
        return {
          ...team,
          totalScore: newTotal,
          roundScores: {
            ...team.roundScores,
            [currentRound.id]: Math.max(0, currentRoundScore),
          },
        };
      }
      return team;
    });
    onUpdateTeams(updated);
    if (delta > 0) pubAudio.playBeerClink();
  };

  const toggleJoker = (teamId: string) => {
    const updated = teams.map((team) => {
      if (team.id === teamId) {
        const isCurrentlyUsed = team.jokerRoundId === currentRound.id;
        return {
          ...team,
          jokerRoundId: isCurrentlyUsed ? undefined : currentRound.id,
        };
      }
      return team;
    });
    onUpdateTeams(updated);
    pubAudio.playBeerClink();
  };

  const sortedTeams = [...teams].sort((a, b) => b.totalScore - a.totalScore);

  // --- REŽIM PROJEKTORU / PLÁTNA PRO HOSTY ---
  if (isProjectorMode) {
    return (
      <div className="fixed inset-0 z-50 bg-[#121915] text-stone-100 flex flex-col p-8 chalk-board">
        {/* Horní lišta projektoru */}
        <div className="flex items-center justify-between pb-6 border-b border-stone-700/60">
          <div>
            <div className="text-amber-400 font-semibold text-lg tracking-wider uppercase font-serif">
              {currentRound.title} · Kolo {currentRound.roundNumber} z {rounds.length}
            </div>
            <div className="text-stone-400 text-sm">
              Otázka {selectedQuestionIndex + 1} z {currentRound.questions.length} · {currentQuestion.categoryLabel}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Přepínač Otázka vs. Graf skóre na plátně */}
            <div className="flex items-center p-1 bg-stone-900/90 rounded-xl border border-stone-700">
              <button
                onClick={() => setProjectorView('question')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  projectorView === 'question' ? 'bg-amber-600 text-stone-950 shadow-sm' : 'text-stone-300 hover:text-white'
                }`}
              >
                Otázka
              </button>
              <button
                onClick={() => setProjectorView('chart')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  projectorView === 'chart' ? 'bg-amber-600 text-stone-950 shadow-sm' : 'text-stone-300 hover:text-white'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Graf skóre</span>
              </button>
            </div>

            <div className={`px-6 py-2 rounded-xl border text-3xl font-mono tabular-nums font-bold ${
              timerSeconds <= 5 && timerSeconds > 0 
                ? 'border-red-500 bg-red-950/80 text-red-400 animate-pulse' 
                : timerSeconds === 0 
                ? 'border-amber-500 bg-amber-950/60 text-amber-300' 
                : 'border-stone-700 bg-stone-900/80 text-amber-400'
            }`}>
              00:{timerSeconds < 10 ? `0${timerSeconds}` : timerSeconds}
            </div>

            <button
              onClick={() => setIsProjectorMode(false)}
              className="p-3 text-stone-400 hover:text-white bg-stone-800/80 hover:bg-stone-700 rounded-xl transition-colors"
              title="Zavřít režim projektoru"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Obsah projektoru: buď otázka nebo graf skóre */}
        {projectorView === 'chart' ? (
          <div className="flex-1 flex flex-col justify-center max-w-5xl mx-auto w-full px-4 py-4 overflow-y-auto">
            <ScoreProgressionChart
              rounds={rounds}
              teams={teams}
              currentRoundId={currentRound.id}
              isProjector={true}
            />
          </div>
        ) : (
          /* Hlavní velkoformátová otázka */
          <div className="flex-1 flex flex-col items-center justify-center max-w-5xl mx-auto text-center px-4">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="text-sm font-semibold tracking-widest uppercase text-amber-500">
                Hodnota: {currentQuestion.points} {currentQuestion.points === 1 ? 'bod' : 'body'}
              </div>
              <SpeakQuestionButton
                questionText={currentQuestion.question}
                options={currentQuestion.options}
                variant="compact"
                label="Přečíst otázku"
              />
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-amber-100 leading-tight mb-12 chalk-text">
              {currentQuestion.question}
            </h1>

            {/* Možnosti odpovědí (pokud jsou zobrazeny) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl">
              {currentQuestion.options.map((opt, i) => {
                const letter = ['A', 'B', 'C', 'D'][i];
                const isCorrect = i === currentQuestion.correctIndex;
                const isSelected = selectedOptionIndex === i;

                let pStyle = 'bg-stone-900/70 border-stone-700 text-stone-200 hover:border-amber-500 hover:bg-stone-900';

                if (showAnswer) {
                  if (isCorrect) {
                    pStyle = 'bg-emerald-950/90 border-emerald-500 text-emerald-200 ring-2 ring-emerald-500 shadow-lg';
                  } else if (isSelected) {
                    pStyle = 'bg-red-950/90 border-red-500 text-red-200 ring-1 ring-red-500';
                  } else {
                    pStyle = 'bg-stone-900/40 border-stone-800 text-stone-500 opacity-60';
                  }
                } else if (isSelected) {
                  pStyle = 'bg-amber-950/90 border-amber-400 text-amber-100 ring-2 ring-amber-400 shadow-xl scale-[1.01]';
                }

                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleToggleOptionSelection(i)}
                    className={`p-5 rounded-xl border text-left flex items-start gap-4 transition-all cursor-pointer active:scale-98 ${pStyle}`}
                  >
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 ${
                      showAnswer && isCorrect
                        ? 'bg-emerald-500 text-stone-950'
                        : showAnswer && isSelected
                        ? 'bg-red-500 text-white'
                        : isSelected
                        ? 'bg-amber-400 text-stone-950 ring-2 ring-amber-300 font-extrabold'
                        : 'bg-stone-800 text-amber-400'
                    }`}>
                      {letter}
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="text-xl font-medium pt-0.5 block">{opt}</span>
                      {isSelected && !showAnswer && (
                        <span className="text-xs text-amber-400 font-semibold mt-1 inline-flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Označeno na plátně (klikněte znovu pro odhalení)
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Odhalená odpověď & zajímavost */}
            {showAnswer && (
              <div className="mt-8 p-6 bg-amber-950/40 border border-amber-800/60 rounded-xl text-amber-100 max-w-3xl animate-fadeIn">
                <div className="font-semibold text-amber-400 mb-1">Správné řešení: {currentQuestion.correctAnswer}</div>
                <div className="text-stone-300 text-sm leading-relaxed">{currentQuestion.explanation}</div>
              </div>
            )}
          </div>
        )}

        {/* Spodní ovládací lišta pro moderátora u projektoru */}
        <div className="flex items-center justify-between pt-6 border-t border-stone-700/60">
          <div className="flex items-center gap-3">
            <button
              onClick={goToPrevQuestion}
              className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-sm font-medium flex items-center gap-2 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" /> Předchozí
            </button>
            <button
              onClick={goToNextQuestion}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-stone-950 rounded-lg text-sm font-semibold flex items-center gap-2 cursor-pointer"
            >
              Další otázka <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <SpeakQuestionButton
              questionText={currentQuestion.question}
              options={currentQuestion.options}
              variant="projector"
            />
            <button
              onClick={() => (isTimerRunning ? pauseTimer() : startTimer())}
              className="px-5 py-2 bg-stone-800 hover:bg-stone-700 text-amber-400 border border-amber-500/40 rounded-lg text-sm font-medium flex items-center gap-2 cursor-pointer"
            >
              {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isTimerRunning ? 'Pozastavit' : 'Spustit časomíru (30s)'}
            </button>
            <button
              onClick={() => setShowAnswer(!showAnswer)}
              className="px-5 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-sm font-medium flex items-center gap-2 cursor-pointer"
            >
              {showAnswer ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showAnswer ? 'Skrýt odpověď' : 'Ukázat odpověď'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- STANDARDNÍ MODERÁTORSKÝ PULT (HOST CONTROL) ---
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Horní hlavička s výběrem kol a přepínačem na projektor */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-amber-950">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-500 mb-1">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Pult Kvízmistra · Moderátorské řízení</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-amber-100">
            {currentRound.title}
          </h1>
          <p className="text-sm text-stone-400 mt-1">
            Kolo {currentRound.roundNumber} z {rounds.length} · {currentRound.description}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              pubAudio.playTavernBell();
              setIsProjectorMode(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-semibold rounded-lg shadow-sm transition-colors text-sm"
          >
            <Monitor className="w-4 h-4" />
            <span>Promítat na TV / Plátno</span>
          </button>

          <button
            onClick={() => {
              const el = document.getElementById('score-progression-chart-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex items-center gap-2 px-3 py-2 bg-stone-800 hover:bg-stone-700 text-amber-300 rounded-lg text-sm border border-amber-800/50 transition-colors"
            title="Přejít na graf vývoje skóre"
          >
            <TrendingUp className="w-4 h-4 text-amber-400" />
            <span>Graf vývoje</span>
          </button>

          {onReshuffleRounds && (
            <button
              onClick={() => {
                onReshuffleRounds();
                setSelectedRoundIndex(0);
                setSelectedQuestionIndex(0);
                setSelectedOptionIndex(null);
                setShowAnswer(false);
                resetTimer(initialSeconds);
              }}
              className="flex items-center gap-2 px-3 py-2 bg-stone-900/90 hover:bg-stone-800 text-amber-300 rounded-lg text-sm border border-amber-600/60 transition-colors cursor-pointer"
              title="Vylosovat z databáze úplně nové náhodné otázky a promíchat možnosti"
            >
              <RefreshCw className="w-4 h-4 text-amber-400" />
              <span>🎲 Nové náhodné otázky</span>
            </button>
          )}

          <button
            onClick={() => pubAudio.playTavernBell()}
            className="flex items-center gap-2 px-3 py-2 bg-stone-800 hover:bg-stone-700 text-amber-300 rounded-lg text-sm border border-amber-800/50"
            title="Cinknout hospodským zvoncem na pozornost"
          >
            <Bell className="w-4 h-4 text-amber-400" />
            <span>Zvonit</span>
          </button>
        </div>
      </div>

      {/* Volba aktivního kola */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {rounds.map((round, idx) => (
          <button
            key={round.id}
            onClick={() => {
              pubSpeech.stop();
              setSelectedRoundIndex(idx);
              setSelectedQuestionIndex(0);
              setShowAnswer(false);
              resetTimer();
              pubAudio.playTavernBell();
            }}
            className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
              selectedRoundIndex === idx
                ? 'bg-amber-600 text-stone-950 font-semibold shadow'
                : 'bg-stone-900/80 text-stone-300 hover:bg-stone-800 border border-stone-800'
            }`}
          >
            {idx + 1}. {round.title}
          </button>
        ))}
      </div>

      {/* Hlavní layout: vlevo otázka & časovač, vpravo bodovací účtenka */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Levý sloupec (7/12): Aktivní otázka a ovládací prvky */}
        <div className="lg:col-span-7 space-y-6">
          {/* Karta otázky */}
          <div className="bg-[#18110b] border border-amber-900/50 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            {/* Navigace otázek a tlačítko předčítání */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-4 border-b border-amber-950/80">
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                  Otázka {selectedQuestionIndex + 1} z {currentRound.questions.length} · {currentQuestion.categoryLabel}
                </span>
                <SpeakQuestionButton
                  questionText={currentQuestion.question}
                  options={currentQuestion.options}
                  variant="compact"
                  label="Přečíst"
                />
              </div>
              <div className="flex items-center gap-1">
                {currentRound.questions.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      pubSpeech.stop();
                      setSelectedQuestionIndex(i);
                      setShowAnswer(false);
                      resetTimer();
                    }}
                    className={`w-7 h-7 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                      selectedQuestionIndex === i
                        ? 'bg-amber-500 text-stone-950 font-bold'
                        : 'bg-stone-800/80 text-stone-400 hover:bg-stone-700'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* Znění otázky */}
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-amber-100 leading-snug mb-6">
              {currentQuestion.question}
            </h2>

            {/* Možnosti odpovědí (kliknutím lze označit odpověď a zkontrolovat) */}
            <div className="space-y-2.5 mb-6">
              {currentQuestion.options.map((opt, i) => {
                const letter = ['A', 'B', 'C', 'D'][i];
                const isCorrect = i === currentQuestion.correctIndex;
                const isSelected = selectedOptionIndex === i;

                let optionStyle = 'bg-stone-900/60 border-stone-800 text-stone-300 hover:border-amber-600/80 hover:bg-stone-900';

                if (showAnswer) {
                  if (isCorrect) {
                    optionStyle = 'bg-emerald-950/80 border-emerald-500 text-emerald-200 ring-2 ring-emerald-500/70 shadow-md';
                  } else if (isSelected) {
                    optionStyle = 'bg-red-950/80 border-red-500 text-red-200 ring-1 ring-red-500';
                  } else {
                    optionStyle = 'bg-stone-950/40 border-stone-800 text-stone-500 opacity-60';
                  }
                } else if (isSelected) {
                  optionStyle = 'bg-amber-950/90 border-amber-400 text-amber-100 ring-2 ring-amber-400/80 shadow-md scale-[1.005]';
                }

                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleToggleOptionSelection(i)}
                    className={`w-full p-3.5 rounded-xl border flex items-center justify-between text-sm transition-all text-left cursor-pointer active:scale-[0.99] ${optionStyle}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                        showAnswer && isCorrect
                          ? 'bg-emerald-500 text-stone-950'
                          : showAnswer && isSelected
                          ? 'bg-red-500 text-white'
                          : isSelected
                          ? 'bg-amber-400 text-stone-950 ring-2 ring-amber-300 font-extrabold'
                          : 'bg-stone-800 text-amber-400'
                      }`}>
                        {letter}
                      </span>
                      <span className="font-medium text-sm sm:text-base">{opt}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isSelected && !showAnswer && (
                        <span className="flex items-center gap-1 text-[11px] bg-amber-500 text-stone-950 font-bold px-2 py-0.5 rounded-md">
                          <Check className="w-3 h-3 text-stone-950" /> Označeno
                        </span>
                      )}
                      {showAnswer && isCorrect && (
                        <span className="flex items-center gap-1 text-xs text-emerald-400 font-semibold uppercase tracking-wide">
                          <Check className="w-4 h-4" /> Správná odpověď
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Tlačítka pro přečtení otázky nahlas a odhalení odpovědi Kvízmistrovi */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-amber-950">
              <div className="flex flex-wrap items-center gap-2">
                <SpeakQuestionButton
                  questionText={currentQuestion.question}
                  options={currentQuestion.options}
                  variant="standard"
                  label="Přečíst otázku nahlas"
                />
                <button
                  onClick={() => setShowAnswer(!showAnswer)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-stone-800 hover:bg-stone-700 text-amber-300 rounded-xl text-sm font-medium transition-colors border border-amber-800/40 cursor-pointer"
                >
                  {showAnswer ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {showAnswer ? 'Skrýt řešení' : 'Odhalit správnou odpověď'}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={selectedQuestionIndex === 0 && selectedRoundIndex === 0}
                  onClick={goToPrevQuestion}
                  className="p-2 bg-stone-800 hover:bg-stone-700 disabled:opacity-30 text-stone-300 rounded-lg transition-colors"
                  title="Předchozí otázka"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  disabled={
                    selectedQuestionIndex === currentRound.questions.length - 1 &&
                    selectedRoundIndex === rounds.length - 1
                  }
                  onClick={goToNextQuestion}
                  className="p-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-30 text-stone-950 font-bold rounded-lg transition-colors"
                  title="Další otázka"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Poznámka a zajímavost pro moderátora */}
            {showAnswer && (
              <div className="mt-5 p-4 bg-amber-950/40 border border-amber-800/40 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                    Perlička pro moderátora k přečtení hostům:
                  </div>
                  <SpeakQuestionButton
                    questionText={currentQuestion.explanation}
                    variant="compact"
                    label="Přečíst perličku"
                    showSettingsButton={false}
                  />
                </div>
                <p className="text-sm text-stone-200 leading-relaxed">
                  {currentQuestion.explanation}
                </p>
              </div>
            )}
          </div>

          {/* Hospodská časomíra */}
          <div className="bg-[#18110b] border border-amber-900/50 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                Hospodská časomíra
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => resetTimer(30)}
                  className={`px-3 py-1 rounded text-xs font-medium ${
                    initialSeconds === 30 ? 'bg-amber-600 text-stone-950 font-bold' : 'bg-stone-800 text-stone-400'
                  }`}
                >
                  30 s
                </button>
                <button
                  onClick={() => resetTimer(60)}
                  className={`px-3 py-1 rounded text-xs font-medium ${
                    initialSeconds === 60 ? 'bg-amber-600 text-stone-950 font-bold' : 'bg-stone-800 text-stone-400'
                  }`}
                >
                  60 s
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-6">
              <div className={`text-4xl md:text-5xl font-mono font-bold tabular-nums ${
                timerSeconds <= 5 && timerSeconds > 0 
                  ? 'text-red-400 animate-pulse' 
                  : timerSeconds === 0 
                  ? 'text-amber-500' 
                  : 'text-amber-300'
              }`}>
                00:{timerSeconds < 10 ? `0${timerSeconds}` : timerSeconds}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => (isTimerRunning ? pauseTimer() : startTimer())}
                  className={`px-6 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all shadow ${
                    isTimerRunning
                      ? 'bg-amber-500 hover:bg-amber-400 text-stone-950'
                      : 'bg-amber-600 hover:bg-amber-500 text-stone-950'
                  }`}
                >
                  {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {isTimerRunning ? 'Zastavit' : 'Spustit odpočet'}
                </button>

                <button
                  onClick={() => resetTimer()}
                  className="p-2.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl"
                  title="Resetovat časomíru"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Vizuální progress bar */}
            <div className="w-full h-2 bg-stone-800 rounded-full mt-4 overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 ${
                  timerSeconds <= 5 ? 'bg-red-500' : 'bg-amber-500'
                }`}
                style={{ width: `${(timerSeconds / initialSeconds) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Pravý sloupec (5/12): Hospodská bodovací účtenka týmů */}
        <div className="lg:col-span-5 space-y-6">
          <div className="pub-receipt rounded-2xl p-6 shadow-2xl border border-amber-950">
            <div className="flex items-center justify-between pb-4 border-b border-stone-300">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-700" />
                <h3 className="font-serif font-bold text-xl text-stone-900">
                  Hospodská účtenka & Body
                </h3>
              </div>
              <span className="text-xs font-mono font-medium text-stone-600">
                Kolo {currentRound.roundNumber}
              </span>
            </div>

            {/* Přidání nového týmu */}
            <form onSubmit={handleAddTeam} className="mt-4 flex gap-2">
              <input
                type="text"
                placeholder="Název týmu (např. Štamgasti)..."
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                className="flex-1 px-3 py-2 bg-stone-100 border border-stone-300 rounded-lg text-sm text-stone-900 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-600"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-amber-300 rounded-lg text-xs font-semibold uppercase tracking-wider shrink-0 transition-colors"
              >
                + Přidat tým
              </button>
            </form>

            {/* Seznam týmů a bodování */}
            <div className="mt-5 space-y-3 max-h-[480px] overflow-y-auto pr-1">
              {teams.length === 0 ? (
                <div className="text-center py-8 text-stone-500 text-sm italic">
                  Zatím žádné týmy. Přidejte soutěžící týmy výše a zapisujte jim body za správné odpovědi.
                </div>
              ) : (
                sortedTeams.map((team, index) => {
                  const hasJokerInThisRound = team.jokerRoundId === currentRound.id;
                  const roundScore = team.roundScores[currentRound.id] || 0;

                  return (
                    <div
                      key={team.id}
                      className="p-3.5 bg-white/70 border border-stone-200 rounded-xl flex items-center justify-between gap-3 shadow-sm hover:bg-white transition-all"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-6 h-6 rounded-full bg-stone-200 text-stone-700 text-xs font-bold flex items-center justify-center shrink-0">
                          {index + 1}
                        </span>
                        <div className="truncate">
                          <div className="font-semibold text-stone-900 text-sm truncate flex items-center gap-1.5">
                            <span>{team.name}</span>
                            {hasJokerInThisRound && (
                              <span className="text-[10px] bg-amber-600 text-white font-bold px-1.5 py-0.2 rounded">
                                Žolík 2×
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-stone-500">
                            Stůl {team.tableNumber} · V tomto kole: {roundScore} b.
                          </div>
                        </div>
                      </div>

                      {/* Tlačítka bodů */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => updateTeamScore(team.id, -1)}
                          className="w-7 h-7 rounded bg-stone-200 hover:bg-stone-300 text-stone-700 flex items-center justify-center text-xs font-bold transition-colors"
                          title="Odečíst bod"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => updateTeamScore(team.id, 1)}
                          className="w-8 h-8 rounded bg-amber-600 hover:bg-amber-700 text-white flex items-center justify-center text-xs font-bold transition-colors shadow-sm"
                          title="Přidat 1 bod"
                        >
                          +1
                        </button>
                        <button
                          onClick={() => updateTeamScore(team.id, 2)}
                          className="w-8 h-8 rounded bg-stone-900 hover:bg-stone-800 text-amber-300 flex items-center justify-center text-xs font-bold transition-colors"
                          title="Přidat 2 body"
                        >
                          +2
                        </button>

                        <button
                          onClick={() => toggleJoker(team.id)}
                          className={`px-2 py-1.5 rounded text-[11px] font-bold border transition-colors ${
                            hasJokerInThisRound
                              ? 'bg-amber-600 text-white border-amber-700'
                              : 'bg-stone-100 text-stone-600 border-stone-300 hover:bg-stone-200'
                          }`}
                          title="Aktivovat žolíka (dvojnásobné body v tomto kole)"
                        >
                          Žolík
                        </button>

                        <div className="ml-2 text-right min-w-[36px]">
                          <span className="text-lg font-bold font-mono text-stone-950">
                            {team.totalScore}
                          </span>
                          <span className="text-[10px] text-stone-500 block -mt-1">b.</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Spodní souhrn účtenky */}
            {teams.length > 0 && (
              <div className="mt-4 pt-3 border-t border-stone-300 flex items-center justify-between text-xs text-stone-600">
                <span>Celkem soutěží: {teams.length} týmů</span>
                <button
                  onClick={() => {
                    const reseted = teams.map((t) => ({ ...t, totalScore: 0, roundScores: {}, jokerRoundId: undefined }));
                    onUpdateTeams(reseted);
                  }}
                  className="text-stone-500 hover:text-red-700 underline text-[11px]"
                >
                  Vynulovat body
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Graf vývoje skóre týmů v čase s využitím Recharts */}
      <div id="score-progression-chart-section" className="pt-2">
        <ScoreProgressionChart
          rounds={rounds}
          teams={teams}
          currentRoundId={currentRound.id}
        />
      </div>
    </div>
  );
};
