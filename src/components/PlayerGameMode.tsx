import React, { useState, useEffect, useRef } from 'react';
import { QuizRound, QuizQuestion } from '../types/quiz';
import { 
  Trophy, CheckCircle2, XCircle, RotateCcw, 
  ArrowRight, Award, Beer, Clock, Sparkles, Volume2, VolumeX, Check, RefreshCw
} from 'lucide-react';
import { pubAudio } from '../utils/audio';
import { pubSpeech } from '../utils/speech';
import { SpeakQuestionButton } from './SpeakQuestionButton';
import { generateRandomQuizRounds } from '../data/questionPool';

interface PlayerGameModeProps {
  rounds: QuizRound[];
  onFinishGame?: (score: number) => void;
  onNewRandomQuiz?: () => void;
}

type GameStage = 'SETUP' | 'QUESTION' | 'REVEAL' | 'ROUND_SUMMARY' | 'VICTORY';

export const PlayerGameMode: React.FC<PlayerGameModeProps> = ({ rounds }) => {
  const [stage, setStage] = useState<GameStage>('SETUP');
  const [teamName, setTeamName] = useState('Pivní štamgasti');
  const [activeRounds, setActiveRounds] = useState<QuizRound[]>(() =>
    generateRandomQuizRounds({ roundsCount: 5, questionsPerRound: 5, shuffleOptions: true })
  );
  const [currentRoundIdx, setCurrentRoundIdx] = useState(0);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);

  // Herní stav
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [roundScores, setRoundScores] = useState<number[]>([]);
  const [timerSeconds, setTimerSeconds] = useState(30);
  const [isTimerActive, setIsTimerActive] = useState(true);
  const [useTimer, setUseTimer] = useState(true);
  const [isAutoSpeech, setIsAutoSpeech] = useState(pubSpeech.getEnabled());
  const lastSpokenQId = useRef<string | null>(null);

  const currentRound = activeRounds[currentRoundIdx] || activeRounds[0];
  const currentQuestion: QuizQuestion = currentRound?.questions[currentQuestionIdx];

  // Synchronizace stavu předčítání
  useEffect(() => {
    const unsub = pubSpeech.subscribe((s) => {
      setIsAutoSpeech(s.isEnabled);
    });
    return () => unsub();
  }, []);

  // Automatické předčítání otázky při přechodu do fáze QUESTION
  useEffect(() => {
    if (stage === 'QUESTION' && currentQuestion) {
      if (pubSpeech.getEnabled() && lastSpokenQId.current !== currentQuestion.id) {
        lastSpokenQId.current = currentQuestion.id;
        const timer = setTimeout(() => {
          pubSpeech.speakQuestion(currentQuestion.question, currentQuestion.options);
        }, 350);
        return () => clearTimeout(timer);
      }
    } else if (stage !== 'QUESTION') {
      pubSpeech.stop();
    }
  }, [stage, currentQuestion?.id]);

  // Odpočet času pro otázku
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (stage === 'QUESTION' && useTimer && isTimerActive && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 6 && prev > 1) {
            pubAudio.playTick();
          } else if (prev === 1) {
            pubAudio.playGong();
            handleTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [stage, useTimer, isTimerActive, timerSeconds]);

  const handleTimeout = () => {
    pubSpeech.stop();
    setIsTimerActive(false);
    if (selectedOption !== null && selectedOption >= 0) {
      handleConfirmAnswer(selectedOption);
    } else {
      setSelectedOption(-1); // Čas vypršel bez volby
      setStage('REVEAL');
      pubAudio.playWoodThud();
    }
  };

  const handleStartGame = (forceNewQuestions: boolean = true) => {
    pubSpeech.stop();
    // Při každém novém kvízu nová sada náhodných otázek z databáze a promíchané možnosti
    let currentRoundsToUse = activeRounds;
    if (forceNewQuestions) {
      currentRoundsToUse = generateRandomQuizRounds({ roundsCount: 5, questionsPerRound: 5, shuffleOptions: true });
      setActiveRounds(currentRoundsToUse);
    }
    setScore(0);
    setCurrentRoundIdx(0);
    setCurrentQuestionIdx(0);
    setRoundScores(new Array(currentRoundsToUse.length).fill(0));
    setTimerSeconds(30);
    setIsTimerActive(true);
    setSelectedOption(null);
    setStage('QUESTION');
    pubAudio.playTavernBell();
  };

  // Označení odpovědi u stolu (klepnutím)
  const handleSelectOption = (index: number) => {
    if (stage !== 'QUESTION') return;
    if (selectedOption === index) {
      // Opakované klepnutí na již označenou možnost ji potvrdí
      handleConfirmAnswer(index);
    } else {
      setSelectedOption(index);
      pubAudio.playTick();
    }
  };

  // Finální potvrzení odpovědi
  const handleConfirmAnswer = (index: number) => {
    if (stage !== 'QUESTION') return;
    pubSpeech.stop();
    setIsTimerActive(false);
    setSelectedOption(index);
    setStage('REVEAL');

    const isCorrect = index === currentQuestion.correctIndex;
    if (isCorrect) {
      const addedPoints = currentQuestion.points;
      setScore((prev) => prev + addedPoints);
      setRoundScores((prev) => {
        const copy = [...prev];
        copy[currentRoundIdx] = (copy[currentRoundIdx] || 0) + addedPoints;
        return copy;
      });
      pubAudio.playBeerClink();
    } else {
      pubAudio.playWoodThud();
    }
  };

  const handleNextStep = () => {
    pubSpeech.stop();
    setSelectedOption(null);
    setTimerSeconds(30);
    setIsTimerActive(true);

    if (currentQuestionIdx < currentRound.questions.length - 1) {
      setCurrentQuestionIdx(currentQuestionIdx + 1);
      setStage('QUESTION');
    } else {
      // Konec kola
      if (currentRoundIdx < activeRounds.length - 1) {
        setStage('ROUND_SUMMARY');
        pubAudio.playTavernBell();
      } else {
        // Konec celého kvízu
        setStage('VICTORY');
        pubAudio.playFanfare();
      }
    }
  };

  const startNextRound = () => {
    setCurrentRoundIdx(currentRoundIdx + 1);
    setCurrentQuestionIdx(0);
    setSelectedOption(null);
    setTimerSeconds(30);
    setIsTimerActive(true);
    setStage('QUESTION');
    pubAudio.playTavernBell();
  };

  const renderBeerTallies = (count: number) => {
    const groupsOfFive = Math.floor(count / 5);
    const remainder = count % 5;

    return (
      <div className="flex items-center gap-3 font-mono text-xl text-amber-500 font-bold">
        {Array.from({ length: groupsOfFive }).map((_, i) => (
          <span key={i} className="relative inline-block px-1 tracking-tighter border-b-2 border-amber-600">
            ||||
            <span className="absolute inset-0 flex items-center justify-center text-amber-400 rotate-12 scale-125">
              /
            </span>
          </span>
        ))}
        {remainder > 0 && (
          <span className="tracking-tighter">
            {'|'.repeat(remainder)}
          </span>
        )}
        <span className="text-sm font-sans text-stone-400 ml-1">({count} b.)</span>
      </div>
    );
  };

  // --- 1. SETUP STAGE ---
  if (stage === 'SETUP') {
    const totalQuestionsCount = activeRounds.reduce((acc, r) => acc + r.questions.length, 0);

    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-[#18110b] border border-amber-900/60 rounded-3xl p-8 shadow-2xl space-y-8">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-500">
              <Beer className="w-4 h-4 text-amber-500" />
              <span>Interaktivní hospodská soutěž u stolu</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-amber-100">
              Připravte si pivo a tužku!
            </h1>
            <p className="text-stone-400 text-sm max-w-lg mx-auto">
              Zahrajte si pravý hospodský kvíz s okamžitým vyhodnocením, hospodskou časomírou a pivním diplomem pro šampiony.
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-300 mb-2">
                Název vašeho týmu nebo hráče
              </label>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Zadejte název týmu..."
                className="w-full px-4 py-3 bg-stone-900/90 border border-amber-900/40 rounded-xl text-amber-100 placeholder-stone-600 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-stone-300">
                  Vybraná témata pro tuto hru
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const fresh = generateRandomQuizRounds({ roundsCount: 5, questionsPerRound: 5, shuffleOptions: true });
                    setActiveRounds(fresh);
                    pubAudio.playBeerClink();
                  }}
                  className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1.5 py-1 px-2.5 rounded-lg bg-stone-900 border border-amber-600/40 hover:border-amber-500 transition-colors cursor-pointer"
                  title="Vylosovat úplně jiná témata a náhodné otázky"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>🎲 Vylosovat jiné otázky</span>
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {activeRounds.map((round) => (
                  <div
                    key={round.id}
                    className="p-3.5 rounded-xl border text-left flex items-start gap-3 transition-colors bg-amber-950/40 border-amber-600/80 text-amber-200"
                  >
                    <div className="w-5 h-5 rounded flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 bg-amber-500 text-stone-950">
                      {round.roundNumber}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate">{round.title}</div>
                      <div className="text-xs text-stone-400">{round.questions.length} náhodných otázek</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-stone-900/60 border border-stone-800 rounded-xl flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-stone-200">Časový limit na otázku (30 s)</div>
                <div className="text-xs text-stone-400">Přidá do hry hospodské napětí s odpočtem a gongem</div>
              </div>
              <input
                type="checkbox"
                checked={useTimer}
                onChange={(e) => setUseTimer(e.target.checked)}
                className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
              />
            </div>

            <div className="p-4 bg-stone-900/60 border border-stone-800 rounded-xl flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-stone-200 flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-amber-400" />
                  <span>Režim čtení otázek nahlas</span>
                </div>
                <div className="text-xs text-stone-400">Při zobrazení každé otázky ji kvízmistr automaticky přečte</div>
              </div>
              <input
                type="checkbox"
                checked={isAutoSpeech}
                onChange={(e) => {
                  pubSpeech.unlock();
                  pubSpeech.setEnabled(e.target.checked);
                  setIsAutoSpeech(e.target.checked);
                }}
                className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
              />
            </div>
          </div>

          <button
            onClick={() => handleStartGame(false)}
            className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-stone-950 font-serif font-bold text-lg rounded-xl shadow-lg transition-transform active:scale-98 flex items-center justify-center gap-3 cursor-pointer"
          >
            <Beer className="w-5 h-5 text-stone-950" />
            <span>Zahájit hospodský kvíz</span>
          </button>
        </div>
      </div>
    );
  }

  // --- 2. QUESTION & REVEAL STAGE ---
  if (stage === 'QUESTION' || stage === 'REVEAL') {
    const isCorrect = selectedOption === currentQuestion.correctIndex;
    const progressPercent = ((currentQuestionIdx + 1) / currentRound.questions.length) * 100;

    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Horní lišta stavu */}
        <div className="flex items-center justify-between pb-4 border-b border-amber-950">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-amber-500">
              {currentRound.title} · Kolo {currentRoundIdx + 1} z {activeRounds.length}
            </div>
            <div className="text-sm text-stone-400">
              Otázka {currentQuestionIdx + 1} z {currentRound.questions.length} · {currentQuestion.categoryLabel}
            </div>
          </div>

          <div className="flex items-center gap-6">
            {useTimer && (
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono font-bold text-sm tabular-nums ${
                timerSeconds <= 5 
                  ? 'border-red-500 text-red-400 bg-red-950/40 animate-pulse' 
                  : 'border-stone-800 text-amber-300 bg-stone-900/60'
              }`}>
                <Clock className="w-4 h-4" />
                <span>00:{timerSeconds < 10 ? `0${timerSeconds}` : timerSeconds}</span>
              </div>
            )}

            <div className="text-right">
              <span className="text-xs text-stone-400 block">Celkové skóre</span>
              <span className="text-xl font-bold font-mono text-amber-400">{score} b.</span>
            </div>
          </div>
        </div>

        {/* Progress bar kola */}
        <div className="w-full h-1.5 bg-stone-900 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Tabule s otázkou */}
        <div className="chalk-board p-4 sm:p-8 md:p-10 text-center space-y-4 sm:space-y-6">
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <div className="inline-block px-3 py-1 rounded-full bg-amber-950/80 border border-amber-800/60 text-[11px] sm:text-xs font-semibold text-amber-400 uppercase tracking-widest">
              Za {currentQuestion.points} {currentQuestion.points === 1 ? 'bod' : 'body'}
            </div>
            <SpeakQuestionButton
              questionText={currentQuestion.question}
              options={currentQuestion.options}
              variant="compact"
              label="Přečíst otázku nahlas"
            />
            <button
              type="button"
              onClick={() => {
                pubSpeech.unlock();
                const next = pubSpeech.toggleEnabled();
                setIsAutoSpeech(next);
                if (next) {
                  pubSpeech.speakQuestion(currentQuestion.question, currentQuestion.options);
                }
              }}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer min-h-[36px] ${
                isAutoSpeech 
                  ? 'bg-amber-950/70 border-amber-500 text-amber-200 ring-1 ring-amber-500/40 shadow-sm' 
                  : 'bg-stone-900/80 border-stone-700/80 text-stone-400 hover:text-stone-200'
              }`}
              title={isAutoSpeech ? 'Vypnout automatické předčítání' : 'Zapnout automatické předčítání'}
            >
              {isAutoSpeech ? <Volume2 className="w-3.5 h-3.5 text-amber-400" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span>{isAutoSpeech ? 'Auto čtení ZAP' : 'Auto čtení VYP'}</span>
            </button>
          </div>

          <h2 className="text-lg sm:text-2xl md:text-3xl font-serif font-bold text-amber-100 leading-snug chalk-text max-w-3xl mx-auto">
            {currentQuestion.question}
          </h2>

          {/* Možnosti odpovědí */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3.5 max-w-3xl mx-auto pt-2">
            {currentQuestion.options.map((option, idx) => {
              const letter = ['A', 'B', 'C', 'D'][idx];
              const isSelected = selectedOption === idx;
              const isTargetCorrect = idx === currentQuestion.correctIndex;

              let buttonStyle = 'bg-stone-900/70 border-stone-700 text-stone-200 hover:border-amber-500 hover:bg-stone-900 cursor-pointer';

              if (stage === 'REVEAL') {
                if (isTargetCorrect) {
                  buttonStyle = 'bg-emerald-950/90 border-emerald-500 text-emerald-200 ring-2 ring-emerald-500 shadow-lg';
                } else if (isSelected) {
                  buttonStyle = 'bg-red-950/90 border-red-500 text-red-200 ring-1 ring-red-500';
                } else {
                  buttonStyle = 'bg-stone-950/40 border-stone-800 text-stone-500 opacity-60';
                }
              } else if (isSelected) {
                buttonStyle = 'bg-amber-950/95 border-amber-400 text-amber-100 ring-2 ring-amber-400 shadow-xl scale-[1.01]';
              }

              return (
                <button
                  key={idx}
                  disabled={stage === 'REVEAL'}
                  onClick={() => handleSelectOption(idx)}
                  className={`p-4 rounded-xl border text-left flex items-start gap-3.5 transition-all active:scale-98 ${buttonStyle}`}
                >
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                    stage === 'REVEAL' && isTargetCorrect
                      ? 'bg-emerald-500 text-stone-950'
                      : stage === 'REVEAL' && isSelected
                      ? 'bg-red-500 text-white'
                      : isSelected
                      ? 'bg-amber-400 text-stone-950 ring-2 ring-amber-300 font-extrabold'
                      : 'bg-stone-800 text-amber-400'
                  }`}>
                    {letter}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="text-base font-medium pt-0.5 block">{option}</span>
                    {isSelected && stage === 'QUESTION' && (
                      <span className="text-[11px] text-amber-400 font-semibold flex items-center gap-1 mt-1">
                        <Check className="w-3 h-3 text-amber-400" /> Označeno (klikněte znovu pro potvrzení)
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Lišta potvrzení označené odpovědi u stolu */}
          {stage === 'QUESTION' && selectedOption !== null && (
            <div className="p-3.5 bg-amber-950/80 border border-amber-500/70 rounded-xl text-xs sm:text-sm text-amber-200 max-w-xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg animate-fadeIn">
              <div className="flex items-center gap-2.5 text-left">
                <span className="w-6 h-6 rounded-md bg-amber-500 text-stone-950 font-bold flex items-center justify-center text-xs shrink-0">
                  {['A', 'B', 'C', 'D'][selectedOption]}
                </span>
                <span>
                  Odpověď <strong>označena</strong>! Můžete ji změnit klepnutím na jinou možnost.
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleConfirmAnswer(selectedOption)}
                className="w-full sm:w-auto px-5 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-serif font-bold text-xs rounded-lg transition-all shadow-md shrink-0 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4 text-stone-950" />
                <span>Potvrdit odpověď</span>
              </button>
            </div>
          )}

          {stage === 'QUESTION' && selectedOption === null && (
            <div className="text-xs sm:text-sm text-amber-300/80 text-center italic py-1">
              Klepněte na možnost A, B, C nebo D pro označení vaší odpovědi.
            </div>
          )}

          {/* Vyhodnocení & Perlička */}
          {stage === 'REVEAL' && (
            <div className="mt-6 pt-6 border-t border-stone-700/60 max-w-2xl mx-auto text-left space-y-3 animate-fadeIn">
              <div className="flex items-center gap-2">
                {isCorrect ? (
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-lg font-serif">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                    <span>Zásah! Připijte si na správnou odpověď (+{currentQuestion.points} b.)</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-400 font-bold text-lg font-serif">
                    <XCircle className="w-6 h-6 text-red-400" />
                    <span>Bohužel vedle! Správně bylo: {currentQuestion.correctAnswer}</span>
                  </div>
                )}
              </div>

              <div className="p-4 bg-amber-950/40 border border-amber-900/60 rounded-xl text-stone-200 text-sm leading-relaxed space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-amber-400">Víte, že...</span>
                  <SpeakQuestionButton
                    questionText={currentQuestion.explanation}
                    variant="compact"
                    label="Přečíst perličku"
                    showSettingsButton={false}
                  />
                </div>
                <p>{currentQuestion.explanation}</p>
              </div>

              <div className="pt-3 text-right">
                <button
                  onClick={handleNextStep}
                  className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-serif font-bold rounded-xl transition-colors shadow-md inline-flex items-center gap-2"
                >
                  <span>Pokračovat na další otázku</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- 3. ROUND SUMMARY STAGE ---
  if (stage === 'ROUND_SUMMARY') {
    const roundScore = roundScores[currentRoundIdx] || 0;
    const maxRoundScore = currentRound.questions.reduce((a, b) => a + b.points, 0);

    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-[#18110b] border border-amber-900/60 rounded-3xl p-8 shadow-2xl space-y-6 text-center">
          <div className="w-16 h-16 rounded-full bg-amber-950 border border-amber-600/50 flex items-center justify-center mx-auto text-amber-400">
            <Beer className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-500">
              Kolo {currentRoundIdx + 1} dokončeno
            </span>
            <h2 className="text-3xl font-serif font-bold text-amber-100">
              {currentRound.title}
            </h2>
          </div>

          <div className="p-6 bg-stone-900/70 border border-stone-800 rounded-2xl max-w-md mx-auto space-y-3">
            <div className="text-stone-400 text-sm">Pivní čárky za toto kolo:</div>
            <div className="flex justify-center">
              {renderBeerTallies(roundScore)}
            </div>
            <div className="text-xs text-stone-500">
              Získáno {roundScore} z možných {maxRoundScore} bodů v tomto kole
            </div>
          </div>

          <div className="text-sm text-stone-300 italic max-w-md mx-auto">
            {roundScore >= maxRoundScore * 0.7 
              ? '„Excelentní výkon! U stolu sedí praví znalci české vědy i kultury!“' 
              : '„Slušný rozjezd! Na další kolo objednejte ještě jedno a hlavy dají víc!“'}
          </div>

          <button
            onClick={startNextRound}
            className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-serif font-bold text-base rounded-xl shadow-lg transition-transform active:scale-98 flex items-center justify-center gap-2"
          >
            <span>Přejít na Kolo {currentRoundIdx + 2}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // --- 4. VICTORY STAGE (HOSPODSKÝ DIPLOM) ---
  const totalMaxScore = activeRounds.reduce(
    (acc, r) => acc + r.questions.reduce((a, q) => a + q.points, 0),
    0
  );
  const percentage = Math.round((score / totalMaxScore) * 100);

  let titleBadge = 'Hospodský učeň';
  if (percentage >= 85) titleBadge = 'Rytíř české pípy & Kvízový mistr';
  else if (percentage >= 70) titleBadge = 'Ctihodný štamgast & Znalec';
  else if (percentage >= 50) titleBadge = 'Zkušený pivař s přehledem';

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
      {/* Hospodský diplom ve stylu pergamenu */}
      <div className="pub-receipt rounded-3xl p-8 md:p-12 shadow-2xl border-4 border-[#3c2415] space-y-8 text-center relative overflow-hidden">
        <div className="absolute top-4 right-4 text-stone-400 opacity-20">
          <Award className="w-32 h-32" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-amber-900">
            <Sparkles className="w-4 h-4 text-amber-700" />
            <span>Oficiální hospodský certifikát</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-serif font-bold text-stone-900">
            Hospodský diplom za vědomosti
          </h1>
          <p className="text-stone-600 text-sm italic">
            Udělují štamgasti a Kvízmistr za hrdinské vědomostní nasazení
          </p>
        </div>

        <div className="p-6 bg-white/70 border-2 border-dashed border-stone-300 rounded-2xl max-w-lg mx-auto space-y-3">
          <div className="text-xs uppercase tracking-wider text-stone-500 font-semibold">Tento diplom hrdě náleží týmu:</div>
          <div className="text-2xl md:text-3xl font-serif font-bold text-stone-950">
            {teamName}
          </div>
          <div className="inline-block px-4 py-1.5 bg-amber-600 text-white font-bold text-sm rounded-full shadow-sm">
            Titul: {titleBadge}
          </div>
        </div>

        {/* Bodový souhrn */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-lg mx-auto text-left">
          <div className="p-3 bg-stone-100 rounded-xl">
            <span className="text-[11px] text-stone-500 uppercase font-semibold block">Celkem bodů</span>
            <span className="text-2xl font-bold font-mono text-stone-900">{score} b.</span>
          </div>
          <div className="p-3 bg-stone-100 rounded-xl">
            <span className="text-[11px] text-stone-500 uppercase font-semibold block">Úspěšnost</span>
            <span className="text-2xl font-bold font-mono text-amber-800">{percentage} %</span>
          </div>
          <div className="p-3 bg-stone-100 rounded-xl col-span-2 md:col-span-1">
            <span className="text-[11px] text-stone-500 uppercase font-semibold block">Odehráno kol</span>
            <span className="text-2xl font-bold font-mono text-stone-900">{activeRounds.length}</span>
          </div>
        </div>

        {/* Tabulka kol */}
        <div className="space-y-2 max-w-lg mx-auto text-left text-xs border-t border-stone-300 pt-4">
          <div className="font-semibold text-stone-700 uppercase tracking-wider mb-2">Výsledky podle témat:</div>
          {activeRounds.map((round, i) => (
            <div key={round.id} className="flex items-center justify-between py-1 border-b border-stone-200">
              <span className="text-stone-700">{i + 1}. {round.title}</span>
              <span className="font-mono font-bold text-stone-900">{roundScores[i] || 0} b.</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button
            onClick={() => handleStartGame(true)}
            className="w-full sm:w-auto px-6 py-3.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-serif font-bold text-sm rounded-xl transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>🎲 Spustit nový kvíz (nové náhodné otázky)</span>
          </button>

          <button
            onClick={() => {
              const fresh = generateRandomQuizRounds({ roundsCount: 5, questionsPerRound: 5, shuffleOptions: true });
              setActiveRounds(fresh);
              setStage('SETUP');
              pubAudio.playBeerClink();
            }}
            className="w-full sm:w-auto px-6 py-3.5 bg-stone-900 hover:bg-stone-800 text-amber-200 font-serif font-semibold text-sm rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Zpět do nastavení stolu</span>
          </button>
        </div>
      </div>
    </div>
  );
};
