import React, { useState, useEffect } from 'react';
import { AppView, QuizRound, TeamScore, QuizQuestion } from './types/quiz';
import { DEFAULT_QUIZ_ROUNDS, getRandomQuizRounds, generateRandomQuizRounds } from './data/defaultRounds';
import { Navbar } from './components/Navbar';
import { HomeView } from './components/HomeView';
import { HostMode } from './components/HostMode';
import { PlayerGameMode } from './components/PlayerGameMode';
import { RoundViewer } from './components/RoundViewer';
import { AiRoundGenerator } from './components/AiRoundGenerator';
import { MultiplayerMode } from './components/MultiplayerMode';
import { pubAudio } from './utils/audio';

export default function App() {
  const [initialJoinCode] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('join') || params.get('room') || params.get('code');
      return code ? code.trim().toUpperCase() : null;
    }
    return null;
  });

  const [currentView, setCurrentView] = useState<AppView>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('join') || params.get('room') || params.get('code')) {
        return 'multiplayer';
      }
    }
    return 'home';
  });
  const [rounds, setRounds] = useState<QuizRound[]>(() => {
    const saved = localStorage.getItem('hospodsky_kviz_rounds');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {
        // use default
      }
    }
    return getRandomQuizRounds();
  });

  const [teams, setTeams] = useState<TeamScore[]>(() => {
    const saved = localStorage.getItem('hospodsky_kviz_teams');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {
        // use default
      }
    }
    return [
      { id: 'team-1', name: 'Štamgasti od výčepu', tableNumber: 1, totalScore: 8, roundScores: { 'round-1-cesko': 4, 'round-2-film': 4 }, members: ['Pavel', 'Jana', 'Tomáš'] },
      { id: 'team-2', name: 'Chytráci z rohu', tableNumber: 2, totalScore: 9, roundScores: { 'round-1-cesko': 5, 'round-2-film': 4 }, members: ['Mirek', 'Eva'] },
      { id: 'team-3', name: 'Pivní profesoři', tableNumber: 3, totalScore: 7, roundScores: { 'round-1-cesko': 3, 'round-2-film': 4 }, members: ['Petr', 'Karel', 'Lucie', 'Ondra'] },
    ];
  });

  const [isMuted, setIsMuted] = useState<boolean>(() => pubAudio.getMuted());

  // Ukládání do localStorage pro ochranu před nechtěným obnovením stránky
  useEffect(() => {
    localStorage.setItem('hospodsky_kviz_rounds', JSON.stringify(rounds));
  }, [rounds]);

  useEffect(() => {
    localStorage.setItem('hospodsky_kviz_teams', JSON.stringify(teams));
  }, [teams]);

  const handleNewRandomQuiz = () => {
    const freshRounds = generateRandomQuizRounds({ roundsCount: 5, questionsPerRound: 5, shuffleOptions: true });
    setRounds(freshRounds);
    localStorage.setItem('hospodsky_kviz_rounds', JSON.stringify(freshRounds));
    pubAudio.playTavernBell();
  };

  const handleToggleMute = () => {
    const nextMuted = pubAudio.toggleMute();
    setIsMuted(nextMuted);
  };

  const handleAddRound = (newRound: QuizRound) => {
    setRounds((prev) => {
      const updated = [...prev, { ...newRound, roundNumber: prev.length + 1 }];
      return updated;
    });
    setCurrentView('rounds');
  };

  const handleAddCustomQuestion = (roundId: string, question: QuizQuestion) => {
    setRounds((prev) =>
      prev.map((round) => {
        if (round.id === roundId) {
          return {
            ...round,
            questions: [...round.questions, question],
          };
        }
        return round;
      })
    );
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#140e09] text-stone-100 selection:bg-amber-600 selection:text-white">
      <Navbar
        currentView={currentView}
        onSelectView={setCurrentView}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onNewQuiz={handleNewRandomQuiz}
      />

      <main className="flex-1 pb-20 md:pb-8">
        {currentView === 'home' && (
          <HomeView rounds={rounds} onSelectView={setCurrentView} onNewRandomQuiz={handleNewRandomQuiz} />
        )}

        {currentView === 'multiplayer' && (
          <MultiplayerMode rounds={rounds} initialJoinCode={initialJoinCode} />
        )}

        {currentView === 'host' && (
          <HostMode
            rounds={rounds}
            teams={teams}
            onUpdateTeams={setTeams}
            onReshuffleRounds={handleNewRandomQuiz}
          />
        )}

        {currentView === 'player' && (
          <PlayerGameMode rounds={rounds} onNewRandomQuiz={handleNewRandomQuiz} />
        )}

        {currentView === 'rounds' && (
          <RoundViewer
            rounds={rounds}
            onAddCustomQuestion={handleAddCustomQuestion}
            onReshuffleRounds={handleNewRandomQuiz}
          />
        )}

        {currentView === 'generator' && (
          <AiRoundGenerator onAddRound={handleAddRound} />
        )}
      </main>

      {/* Zápatí podle Anti-slop pravidel */}
      <footer className="border-t border-amber-950/60 py-6 px-6 text-center text-xs text-stone-300 bg-[#0e0804]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-amber-200">Hospodský kvíz</span>
            <span aria-hidden="true">·</span>
            <span>Tradiční česká pivní vědomostní hra pro 2 až 10 týmů</span>
          </div>

          <div className="flex items-center gap-4 text-stone-300">
            <button
              onClick={handleNewRandomQuiz}
              className="hover:text-amber-200 transition-colors underline cursor-pointer"
            >
              🎲 Namíchat nový náhodný kvíz
            </button>
            <span aria-hidden="true">·</span>
            <span>Všechny otázky v češtině</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
