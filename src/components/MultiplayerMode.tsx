import React, { useState, useEffect, useRef } from 'react';
import { QuizRound, MultiplayerRoomState, MultiplayerTeam } from '../types/quiz';
import { 
  Users, Play, Volume2, VolumeX, Trophy, AlertTriangle, 
  Crown, ArrowRight, UserPlus, X, Check, CheckCircle2, Megaphone, Radio,
  Clock, ShieldAlert, Sparkles, RefreshCw, Zap
} from 'lucide-react';
import { pubAudio } from '../utils/audio';
import { pubSpeech } from '../utils/speech';
import { SpeakQuestionButton } from './SpeakQuestionButton';
import { generateRandomQuizRounds } from '../data/questionPool';

interface MultiplayerModeProps {
  rounds: QuizRound[];
}

type ClientRole = 'SELECT_ROLE' | 'HOST_VIEW' | 'TEAM_VIEW';

export const MultiplayerMode: React.FC<MultiplayerModeProps> = ({ rounds }) => {
  const [role, setRole] = useState<ClientRole>('SELECT_ROLE');
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [roomState, setRoomState] = useState<MultiplayerRoomState | null>(null);
  const [myTeamId, setMyTeamId] = useState<string | null>(null);
  const [localSelectedOption, setLocalSelectedOption] = useState<number | null>(null);

  // Form pro připojení týmu
  const [inputRoomCode, setInputRoomCode] = useState('');
  const [inputTeamName, setInputTeamName] = useState('');
  const [inputMembers, setInputMembers] = useState<string[]>(['Pepa', 'Honza']);
  const [newMemberName, setNewMemberName] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Zvuk a předčítání
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(pubSpeech.getEnabled());
  const [isAutoplayBlocked, setIsAutoplayBlocked] = useState(false);
  const [isHonking, setIsHonking] = useState(false);
  const lastSpokenQuestionId = useRef<string | null>(null);
  const hasHonkedRef = useRef<boolean>(false);
  const hadBonusSoundRef = useRef<boolean>(false);
  const prevTeamsCountRef = useRef<number>(0);

  // Stabilní reference pro WebSocket callbacky bez re-mountování socketu
  const wsRef = useRef<WebSocket | null>(null);
  const myTeamIdRef = useRef<string | null>(myTeamId);
  const roleRef = useRef<ClientRole>(role);
  const roomStateRef = useRef<MultiplayerRoomState | null>(roomState);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
  const isUnmountedRef = useRef<boolean>(false);

  useEffect(() => {
    myTeamIdRef.current = myTeamId;
  }, [myTeamId]);

  useEffect(() => {
    roleRef.current = role;
  }, [role]);

  useEffect(() => {
    roomStateRef.current = roomState;
  }, [roomState]);

  // Synchronizace stavu předčítání
  useEffect(() => {
    const unsub = pubSpeech.subscribe((s) => {
      setIsSpeechEnabled(s.isEnabled);
      setIsAutoplayBlocked(s.isAutoplayBlocked);
    });
    return () => unsub();
  }, []);

  // Stabilní připojení WebSocketu pro celou herní seanci (neukončuje se při změně myTeamId)
  useEffect(() => {
    isUnmountedRef.current = false;

    function connectWebSocket() {
      if (isUnmountedRef.current) return;

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      const socket = new WebSocket(wsUrl);
      wsRef.current = socket;
      setWs(socket);

      socket.onopen = () => {
        if (isUnmountedRef.current) {
          socket.close();
          return;
        }
        setIsConnected(true);
        setErrorMessage(null);

        // Pokud už jsme byli v místnosti, okamžitě obnovíme spojení na serveru
        if (roomStateRef.current?.code) {
          socket.send(JSON.stringify({
            type: 'RECONNECT',
            code: roomStateRef.current.code,
            role: roleRef.current,
            myTeamId: myTeamIdRef.current,
          }));
        }
      };

      socket.onerror = (e) => {
        console.warn('Hospodský WebSocket stav:', e);
      };

      socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === 'ROOM_UPDATE') {
            const room = msg.room as MultiplayerRoomState;

            // Zvuková notifikace při příchodu nového týmu do lobby
            if (room.status === 'LOBBY') {
              if (prevTeamsCountRef.current > 0 && room.teams.length > prevTeamsCountRef.current) {
                pubAudio.playBeerClink();
              }
              prevTeamsCountRef.current = room.teams.length;
            }

            setRoomState(room);
            if (msg.room.myTeamId) {
              setMyTeamId(msg.room.myTeamId);
              myTeamIdRef.current = msg.room.myTeamId;
            }

            // Automatické předčítání otázky nahlas při přechodu na QUESTION
            if (room.status === 'QUESTION' && room.currentQuestion) {
              if (lastSpokenQuestionId.current !== room.currentQuestion.id) {
                lastSpokenQuestionId.current = room.currentQuestion.id;
                pubAudio.playTavernBell();
                if (pubSpeech.getEnabled()) {
                  pubSpeech.speakQuestion(room.currentQuestion.question, room.currentQuestion.options);
                }
              }
            }

            // Zvukový tikot vteřin
            if (room.status === 'QUESTION' && room.timerSeconds <= 5 && room.timerSeconds > 0) {
              pubAudio.playTick();
            }

            // Zvuk při získání bonusového bodu za nejrychlejší správnou odpověď
            const activeTeamId = myTeamIdRef.current || msg.room.myTeamId;
            const myTeamInRoom = room.teams.find((t: MultiplayerTeam) => t.id === activeTeamId);
            if (room.status === 'REVEAL' && myTeamInRoom?.earnedBonusPoint && !hadBonusSoundRef.current) {
              hadBonusSoundRef.current = true;
              pubAudio.playBeerClink();
            } else if (room.status === 'QUESTION') {
              hadBonusSoundRef.current = false;
            }

            // Gong při vypršení času
            if (room.status === 'REVEAL' && lastSpokenQuestionId.current) {
              pubSpeech.cancel();
            }

            // Vyhlášení vítězů - Zařízení výherního týmu začne houkat!
            if (room.status === 'FINAL_RESULTS') {
              const currentTeamId = myTeamIdRef.current || msg.room.myTeamId;
              const winningTeam = room.teams.find((t) => t.isWinner);
              const amIWinner = currentTeamId && winningTeam && winningTeam.id === currentTeamId;

              if (amIWinner && !hasHonkedRef.current) {
                hasHonkedRef.current = true;
                setIsHonking(true);
                pubAudio.playVictorySiren();
              } else if (!amIWinner && !hasHonkedRef.current) {
                hasHonkedRef.current = true;
                pubAudio.playFanfare();
              }
            } else {
              hasHonkedRef.current = false;
              setIsHonking(false);
            }
          } else if (msg.type === 'TEAM_JOINED') {
            setMyTeamId(msg.teamId);
            myTeamIdRef.current = msg.teamId;
            setRole('TEAM_VIEW');
            pubAudio.playBeerClink();
          } else if (msg.type === 'ROOM_CREATED') {
            setRole('HOST_VIEW');
            if (msg.hostTeamId) {
              setMyTeamId(msg.hostTeamId);
              myTeamIdRef.current = msg.hostTeamId;
            }
            pubAudio.playTavernBell();
          } else if (msg.type === 'ERROR') {
            setErrorMessage(msg.message);
            pubAudio.playWoodThud();
          }
        } catch (err) {
          console.error('WebSocket parse error:', err);
        }
      };

      socket.onclose = () => {
        setIsConnected(false);
        if (!isUnmountedRef.current) {
          // Automatické znovupřipojení při výpadku spojení
          if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket();
          }, 1500);
        }
      };
    }

    connectWebSocket();

    return () => {
      isUnmountedRef.current = true;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
      pubSpeech.cancel();
    };
  }, []);

  // Vytvoření místnosti (Kvízmistr) - při každém novém kvízu nová sada náhodných otázek
  const handleCreateRoom = () => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    const freshRounds = generateRandomQuizRounds({ roundsCount: 5, questionsPerRound: 5, shuffleOptions: true });
    ws.send(JSON.stringify({ type: 'CREATE_ROOM', rounds: freshRounds, forceRandom: true }));
  };

  // Vylosování jiné sady otázek pro aktuální místnost
  const handleReshuffleQuestions = () => {
    const socket = wsRef.current || ws;
    if (!socket || !roomState) return;
    socket.send(JSON.stringify({ type: 'RESHUFFLE_QUESTIONS', code: roomState.code }));
    pubAudio.playBeerClink();
  };

  // Ruční synchronizace stavu místnosti ze serveru
  const handleRefreshRoom = () => {
    const socket = wsRef.current || ws;
    if (!socket || socket.readyState !== WebSocket.OPEN || !roomStateRef.current) return;
    socket.send(JSON.stringify({
      type: 'RECONNECT',
      code: roomStateRef.current.code,
      role: roleRef.current,
      myTeamId: myTeamIdRef.current,
    }));
    pubAudio.playTick();
  };

  // Připojení týmu k místnosti
  const handleJoinTeam = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!inputRoomCode.trim()) {
      setErrorMessage('Zadejte kód místnosti.');
      return;
    }
    if (!inputTeamName.trim()) {
      setErrorMessage('Zadejte název vašeho týmu.');
      return;
    }
    if (inputMembers.length === 0) {
      setErrorMessage('Přidejte alespoň 1 člena týmu (1 až 10).');
      return;
    }

    if (!ws || ws.readyState !== WebSocket.OPEN) {
      setErrorMessage('Chyba spojení se serverem. Zkuste obnovit stránku.');
      return;
    }

    ws.send(JSON.stringify({
      type: 'JOIN_TEAM',
      code: inputRoomCode.trim().toUpperCase(),
      teamName: inputTeamName.trim(),
      members: inputMembers,
    }));
  };

  // Přidání člena týmu
  const handleAddMember = () => {
    if (!newMemberName.trim()) return;
    if (inputMembers.length >= 10) {
      setErrorMessage('Maximální počet členů týmu je 10.');
      return;
    }
    setInputMembers([...inputMembers, newMemberName.trim()]);
    setNewMemberName('');
  };

  const handleRemoveMember = (idx: number) => {
    setInputMembers(inputMembers.filter((_, i) => i !== idx));
  };

  // Odeslání odpovědi týmu (okamžitá lokální volba s možností změny před vypršením času)
  const handleSelectAnswer = (optionIdx: number, isFinal: boolean = false) => {
    if (!ws || ws.readyState !== WebSocket.OPEN || !roomState) return;
    if (roomState.status !== 'QUESTION') return;

    // Pokud uživatel nemá myTeamId (např. hostitel v roli moderátora), použije se první dostupný tým místnosti
    let effectiveTeamId = myTeamId;
    if (!effectiveTeamId && roomState.teams.length > 0) {
      effectiveTeamId = roomState.teams[0].id;
      setMyTeamId(effectiveTeamId);
    }

    // Okamžitá lokální vizuální zpětná vazba pro hráče ("označeno")
    setLocalSelectedOption(optionIdx);

    ws.send(JSON.stringify({
      type: 'SUBMIT_ANSWER',
      code: roomState.code,
      teamId: effectiveTeamId,
      optionIndex: optionIdx,
      isFinal,
    }));
    pubAudio.playBeerClink();
  };

  // Ovládání Kvízmistra
  const handleStartGame = () => {
    if (!ws || !roomState) return;
    ws.send(JSON.stringify({ type: 'START_GAME', code: roomState.code }));
    pubAudio.playTavernBell();
  };

  const handleNextQuestion = () => {
    if (!ws || !roomState) return;
    ws.send(JSON.stringify({ type: 'NEXT_QUESTION', code: roomState.code }));
  };

  const handleForceReveal = () => {
    if (!ws || !roomState) return;
    ws.send(JSON.stringify({ type: 'REVEAL_NOW', code: roomState.code }));
    pubAudio.playTavernBell();
  };

  const handleRestartRoom = () => {
    if (!ws || !roomState) return;
    ws.send(JSON.stringify({ type: 'RESTART_ROOM', code: roomState.code }));
    hasHonkedRef.current = false;
    setIsHonking(false);
  };

  // Přidání testovacího týmu pro rychlé vyzkoušení
  const handleAddBotTeam = (num: number) => {
    if (!ws || !roomState) return;
    const names = ['Pivní profesoři', 'Chytráci z rohu', 'Kozlíci', 'Zlatá pípa', 'Vědomostní elita', 'Štamgasti'];
    const chosenName = `${names[num % names.length]} (Stůl ${num})`;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const fakeWs = new WebSocket(wsUrl);
    fakeWs.onerror = () => {};
    fakeWs.onopen = () => {
      fakeWs.send(JSON.stringify({
        type: 'JOIN_TEAM',
        code: roomState.code,
        teamName: chosenName,
        members: ['Pavel', 'Jana', 'Tomáš'],
      }));
    };
  };

  const myTeam = roomState?.teams.find((t) => t.id === myTeamId);
  const isMyTeamWinner = myTeam?.isWinner;

  // --- 1. VÝBĚR ROLE (ROZCESTNÍK MULTIPLAYERU) ---
  if (role === 'SELECT_ROLE') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-500">
            <Radio className="w-4 h-4 text-amber-500 animate-pulse" />
            <span>Společný hospodský kvíz na více zařízeních</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-amber-100">
            2 až 10 týmů · Společný start & Výsledky
          </h1>
          <p className="text-stone-300 text-sm md:text-base max-w-xl mx-auto">
            Každý tým hraje na vlastním mobilu nebo tabletu. Společný start, 20 sekund na odpověď, předčítání otázek nahlas a vítězné houkání pro šampiony!
          </p>
        </div>

        {errorMessage && (
          <div className="p-4 bg-red-950/80 border border-red-500 text-red-200 rounded-xl text-sm max-w-lg mx-auto flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Volba 1: Založit hru jako Kvízmistr */}
          <div className="bg-[#18110b] border border-amber-900/60 rounded-2xl p-8 flex flex-col justify-between hover:border-amber-600 transition-all shadow-xl space-y-6">
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-xl bg-amber-950 border border-amber-700/50 flex items-center justify-center text-amber-400">
                <Crown className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-serif font-bold text-amber-100">
                Založit hru pro hospodu (Kvízmistr)
              </h2>
              <p className="text-stone-400 text-xs leading-relaxed">
                Vytvoříte kód místnosti. Promítáte otázky na velké obrazovce/TV v hospodě, řídíte společný start a sledujete přihlášené týmy.
              </p>
            </div>

            <button
              onClick={handleCreateRoom}
              disabled={!isConnected}
              className="w-full py-4 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-stone-950 font-serif font-bold text-base rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
            >
              <Crown className="w-5 h-5" />
              <span>Vytvořit novou místnost</span>
            </button>
          </div>

          {/* Volba 2: Připojit se jako tým */}
          <div className="bg-[#18110b] border border-amber-900/60 rounded-2xl p-8 flex flex-col justify-between hover:border-amber-600 transition-all shadow-xl space-y-6">
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-xl bg-stone-900 border border-stone-700 flex items-center justify-center text-amber-400">
                <Users className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-serif font-bold text-amber-100">
                Připojit se jako tým ze svého mobilu
              </h2>
              <p className="text-stone-400 text-xs leading-relaxed">
                Zadejte kód místnosti, název týmu a 1 až 10 členů. Budete odpovídat přímo na svém zařízení a v případě vítězství vám zařízení začne houkat!
              </p>
            </div>

            <button
              onClick={() => {
                setRole('TEAM_VIEW');
                pubAudio.playBeerClink();
              }}
              className="w-full py-4 bg-stone-900 hover:bg-stone-800 border border-amber-600/60 text-amber-300 font-serif font-bold text-base rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
            >
              <Users className="w-5 h-5" />
              <span>Připojit tým do hry</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- 2. REGISTRACE TÝMU (POKUD JEŠTĚ NENÍ V MÍSTNOSTI) ---
  if (role === 'TEAM_VIEW' && !myTeamId) {
    return (
      <div className="max-w-xl mx-auto px-4 py-8">
        <div className="bg-[#18110b] border border-amber-900/70 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-amber-950">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-500">
                Registrace týmu do kvízu
              </span>
              <h2 className="text-2xl font-serif font-bold text-amber-100">
                Připojení k hospodskému stolu
              </h2>
            </div>
            <button
              onClick={() => setRole('SELECT_ROLE')}
              className="text-stone-400 hover:text-stone-200 text-xs"
            >
              Zpět
            </button>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-950/80 border border-red-500 text-red-200 rounded-xl text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleJoinTeam} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-300 mb-1">
                Kód místnosti (např. PIVO-42)
              </label>
              <input
                type="text"
                placeholder="PIVO-12"
                value={inputRoomCode}
                onChange={(e) => setInputRoomCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 bg-stone-900 border border-stone-700 rounded-xl text-amber-300 font-mono font-bold text-lg uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-300 mb-1">
                Název týmu (2 až 10 týmů v místnosti)
              </label>
              <input
                type="text"
                placeholder="Např. Štamgasti od pípy"
                value={inputTeamName}
                onChange={(e) => setInputTeamName(e.target.value)}
                className="w-full px-4 py-3 bg-stone-900 border border-stone-700 rounded-xl text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-300 mb-1">
                Členové týmu (1 až 10 členů u stolu) · Aktuálně: {inputMembers.length}
              </label>
              
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  placeholder="Jméno člena (např. Lukáš)..."
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddMember();
                    }
                  }}
                  className="flex-1 px-3 py-2 bg-stone-900 border border-stone-700 rounded-lg text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <button
                  type="button"
                  onClick={handleAddMember}
                  className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-amber-300 rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Přidat</span>
                </button>
              </div>

              {/* Seznam členů týmu */}
              <div className="flex flex-wrap gap-2">
                {inputMembers.map((m, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-stone-800 border border-stone-700 rounded-lg text-xs text-stone-200"
                  >
                    <span>{m}</span>
                    {inputMembers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(i)}
                        className="text-stone-400 hover:text-red-400"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-stone-950 font-serif font-bold text-base rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 mt-4"
            >
              <span>Vstoupit do kvízové místnosti</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- SPOLEČNÉ ZOBRAZENÍ STAVU MÍSTNOSTI ---
  if (!roomState) {
    return (
      <div className="max-w-md mx-auto py-24 text-center space-y-4">
        <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
        <div className="text-stone-300 font-serif text-lg">Připojování k hospodskému serveru...</div>
      </div>
    );
  }

  // --- 3. LOBBY PŘED SPOLEČNÝM STARTEM ---
  if (roomState.status === 'LOBBY') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Kód místnosti a stav */}
        <div className="bg-[#18110b] border border-amber-900/70 rounded-3xl p-6 md:p-8 shadow-2xl text-center space-y-4">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-amber-500">
            <Radio className="w-4 h-4 animate-pulse text-emerald-400" />
            <span>Kvízová místnost připravena</span>
          </div>

          <h1 className="text-2xl md:text-3xl font-serif font-bold text-amber-100">
            Kód pro připojení týmů:
          </h1>

          <div className="inline-block px-8 py-4 bg-stone-900 border-2 border-dashed border-amber-500 rounded-2xl">
            <span className="text-4xl md:text-5xl font-mono font-bold text-amber-400 tracking-wider">
              {roomState.code}
            </span>
          </div>

          <p className="text-xs text-stone-400 max-w-md mx-auto">
            Hráči otevřou tuto aplikaci na svém zařízení, zvolí „Připojit se jako tým“ a zadají tento kód.
          </p>

          {/* Přehled připojených týmů (2 až 10) */}
          <div className="pt-6 border-t border-amber-950">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-300 flex items-center gap-2">
                <span>Připojené týmy ({roomState.teams.length} z 10)</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-normal text-emerald-400 font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Živě</span>
                </span>
              </span>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleRefreshRoom}
                  className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer bg-stone-900/80 px-2.5 py-1 rounded-lg border border-amber-800/40 hover:border-amber-600 transition-colors"
                  title="Obnovit stav připojených týmů ze serveru"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Obnovit</span>
                </button>

                {role === 'HOST_VIEW' && roomState.teams.length < 10 && (
                  <button
                    onClick={() => handleAddBotTeam(roomState.teams.length + 1)}
                    className="text-xs text-stone-400 hover:text-amber-300 underline cursor-pointer"
                    title="Přidat další tým pro vyzkoušení hry"
                  >
                    + Přidat testovací tým
                  </button>
                )}
              </div>
            </div>

            {roomState.teams.length === 0 ? (
              <div className="py-8 text-stone-500 italic text-sm">
                Zatím se nepřipojil žádný tým. Čeká se na příchod prvních štamgastů...
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {roomState.teams.map((team, idx) => (
                  <div
                    key={team.id}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      team.id === myTeamId
                        ? 'bg-amber-950/60 border-amber-500 ring-2 ring-amber-500/50'
                        : 'bg-stone-900/70 border-stone-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-serif font-bold text-base text-amber-100 truncate">
                        {team.name}
                      </span>
                      <span className="text-[11px] font-mono text-amber-500 font-semibold">
                        Stůl #{team.tableNumber}
                      </span>
                    </div>
                    <div className="text-xs text-stone-400 truncate">
                      Členové ({team.members.length}): {team.members.join(', ')}
                    </div>
                    {team.id === myTeamId && (
                      <span className="inline-block mt-2 text-[10px] bg-amber-600 text-stone-950 font-bold px-2 py-0.5 rounded">
                        Vaše zařízení
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tlačítko startu a možnost přelosování otázek */}
          <div className="pt-6">
            {role === 'HOST_VIEW' ? (
              <div className="max-w-md mx-auto space-y-3">
                <button
                  onClick={handleStartGame}
                  disabled={roomState.teams.length === 0}
                  className="w-full py-4 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-stone-950 font-serif font-bold text-lg rounded-xl shadow-lg transition-transform active:scale-98 flex items-center justify-center gap-3 cursor-pointer"
                >
                  <Play className="w-5 h-5 text-stone-950" />
                  <span>Společný start kvízu ({roomState.teams.length} týmů)</span>
                </button>

                <div className="flex items-center justify-between px-2 pt-1">
                  <span className="text-xs text-stone-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Otázky vylosovány náhodně</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleReshuffleQuestions}
                    className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1.5 underline cursor-pointer"
                    title="Vylosovat úplně jiné náhodné otázky a promíchat možnosti"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>🎲 Vylosovat jiné náhodné otázky</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-stone-900/60 border border-stone-800 rounded-xl text-sm text-amber-300 max-w-md mx-auto">
                <span className="font-semibold block mb-0.5">Váš tým je připraven!</span>
                Čeká se, až Kvízmistr zahájí společný start pro všechny stoly...
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- 4. ODPOČET SPOLEČNÉHO STARTU (3, 2, 1) ---
  if (roomState.status === 'STARTING') {
    return (
      <div className="fixed inset-0 z-50 bg-[#120a05] flex flex-col items-center justify-center p-6 text-center space-y-6">
        <div className="text-amber-500 text-sm font-semibold uppercase tracking-widest animate-pulse">
          Společný start kvízu
        </div>
        <div className="text-8xl md:text-9xl font-serif font-bold text-amber-400 animate-bounce">
          {roomState.startCountdown > 0 ? roomState.startCountdown : 'START!'}
        </div>
        <div className="text-stone-300 text-lg font-serif">
          Připravte se! Otázka přijde za okamžik a zařízení ji přečte nahlas...
        </div>
      </div>
    );
  }

  // --- 5. AKTIVNÍ OTÁZKA (PŘEDČÍTÁNÍ NAHLAS + ČEKÁNÍ NA VŠECHNY HRÁČE + BONUS ZA RYCHLOST) ---
  if (roomState.status === 'QUESTION' || roomState.status === 'REVEAL') {
    const q = roomState.currentQuestion;
    if (!q) return null;

    const activeSelectedIdx = localSelectedOption !== null ? localSelectedOption : (myTeam?.selectedOption ?? null);
    const hasMyTeamAnswered = myTeam?.hasAnswered ?? false;
    const isReveal = roomState.status === 'REVEAL';

    const answeredCount = roomState.teams.filter((t) => t.hasAnswered && t.selectedOption !== null).length;
    const totalTeams = roomState.teams.length;
    const isWaitingForAll = !isReveal && answeredCount < totalTeams;

    return (
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-3 sm:py-6 space-y-3 sm:space-y-6">
        {/* Horní synchronizační lišta */}
        <div className="flex items-center justify-between pb-3 border-b border-amber-950">
          <div>
            <div className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-amber-500">
              Kolo {roomState.currentRoundIndex + 1} · Otázka {roomState.currentQuestionIndex + 1}
            </div>
            <div className="text-xs sm:text-sm text-stone-400">
              {q.categoryLabel} · Za {q.points} {q.points === 1 ? 'bod' : 'body'}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Tlačítko pro okamžité přečtení otázky nahlas */}
            <SpeakQuestionButton
              questionText={q.question}
              options={q.options}
              variant="compact"
              label="Přečíst"
            />

            {/* Přepínač automatického předčítání */}
            <button
              onClick={() => {
                pubSpeech.unlock();
                const next = pubSpeech.toggleEnabled();
                setIsSpeechEnabled(next);
                if (next) {
                  pubSpeech.speakQuestion(q.question, q.options);
                }
              }}
              className={`p-2 sm:px-3 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors min-h-[44px] justify-center cursor-pointer ${
                isSpeechEnabled 
                  ? 'bg-amber-950/70 border-amber-500 text-amber-200 ring-1 ring-amber-500/40 shadow-sm' 
                  : 'bg-stone-900 border-stone-800 text-stone-500 hover:text-stone-300'
              }`}
              title={isSpeechEnabled ? 'Vypnout automatické předčítání otázek' : 'Zapnout automatické předčítání otázek nahlas'}
            >
              {isSpeechEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4" />}
              <span className="hidden sm:inline">{isSpeechEnabled ? 'Režim čtení: ZAP' : 'Režim čtení: VYP'}</span>
            </button>

            {/* Časovač / indikace čekání na stoly */}
            <div className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl border font-mono font-bold text-lg sm:text-2xl tabular-nums ${
              roomState.timerSeconds <= 0 && isWaitingForAll
                ? 'border-amber-500 bg-amber-950/90 text-amber-300 animate-pulse text-xs sm:text-sm font-sans'
                : roomState.timerSeconds <= 5 && !isReveal
                ? 'border-red-500 bg-red-950/80 text-red-400 animate-pulse'
                : isReveal
                ? 'border-stone-700 bg-stone-900 text-stone-400'
                : 'border-amber-600/70 bg-amber-950/40 text-amber-300'
            }`}>
              {roomState.timerSeconds <= 0 && isWaitingForAll ? (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Čeká se na stoly ({answeredCount}/{totalTeams})</span>
                </span>
              ) : (
                <>
                  <Clock className="w-4 h-4 inline mr-1 -mt-0.5" />
                  00:{roomState.timerSeconds < 10 ? `0${roomState.timerSeconds}` : roomState.timerSeconds}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Upozornění na zablokovaný zvuk v prohlížeči (vyžaduje klepnutí uživatele) */}
        {isAutoplayBlocked && (
          <button
            onClick={() => {
              pubSpeech.unlock();
              pubSpeech.speakQuestion(q.question, q.options, true);
            }}
            className="w-full p-2.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/60 rounded-xl text-amber-200 text-xs font-semibold flex items-center justify-center gap-2 animate-pulse cursor-pointer shadow-md"
          >
            <Volume2 className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Klepněte pro odemčení zvuku a přečtení otázky</span>
          </button>
        )}

        {/* 20s progress bar */}
        <div className="w-full h-1.5 bg-stone-900 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 ${
              roomState.timerSeconds <= 5 ? 'bg-red-500' : 'bg-amber-500'
            }`}
            style={{ width: `${(Math.max(0, roomState.timerSeconds) / 20) * 100}%` }}
          />
        </div>

        {/* Lišta sledování: Počkat až odpoví všichni hráči */}
        <div className="bg-[#18110b] border border-amber-900/60 rounded-xl px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2.5 shadow-md">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-xs text-stone-300 font-medium">
              Odpovědělo <strong className="text-amber-300">{answeredCount} z {totalTeams} stolů</strong>
              {isWaitingForAll ? ' (čeká se na všechny hráče)' : ' (všichni mají odhlasováno!)'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {roomState.teams.map((t) => {
              const hasSelected = t.hasAnswered && t.selectedOption !== null;
              return (
                <span
                  key={t.id}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-medium border flex items-center gap-1 transition-all ${
                    hasSelected
                      ? 'bg-emerald-950/80 border-emerald-500/70 text-emerald-300'
                      : 'bg-stone-900/90 border-stone-800 text-stone-500'
                  }`}
                  title={hasSelected ? `${t.name}: Odpovězeno` : `${t.name}: Stále přemýšlí...`}
                >
                  <span className="truncate max-w-[100px]">{t.name}</span>
                  {hasSelected ? (
                    <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping shrink-0" />
                  )}
                </span>
              );
            })}
          </div>

          {role === 'HOST_VIEW' && !isReveal && isWaitingForAll && (
            <button
              onClick={handleForceReveal}
              className="text-[11px] text-amber-400 hover:text-amber-300 underline font-medium cursor-pointer ml-auto"
              title="Pokud někdo u stolu odešel, můžete otázku vyhodnotit ihned"
            >
              Vyhodnotit ihned
            </button>
          )}
        </div>

        {/* Velká tabule s otázkou */}
        <div className="chalk-board p-4 sm:p-8 md:p-10 text-center space-y-3 sm:space-y-5">
          <div className="flex items-center justify-center">
            <SpeakQuestionButton
              questionText={q.question}
              options={q.options}
              variant="compact"
              label="Přečíst otázku nahlas"
            />
          </div>

          <h2 className="text-lg sm:text-2xl md:text-3xl font-serif font-bold text-amber-100 leading-snug chalk-text max-w-3xl mx-auto">
            {q.question}
          </h2>

          {/* Možnosti odpovědí A, B, C, D */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3.5 max-w-3xl mx-auto pt-2">
            {q.options.map((opt, idx) => {
              const letter = ['A', 'B', 'C', 'D'][idx];
              const isSelectedByMyTeam = activeSelectedIdx === idx;
              const isCorrectAnswer = idx === q.correctIndex;

              let style = 'bg-stone-900/80 border-stone-700 text-stone-200 hover:border-amber-500 hover:bg-stone-900 cursor-pointer';

              if (isReveal) {
                if (isCorrectAnswer) {
                  style = 'bg-emerald-950 border-emerald-500 text-emerald-200 ring-2 ring-emerald-500 shadow-lg';
                } else if (isSelectedByMyTeam) {
                  style = 'bg-red-950 border-red-500 text-red-200 ring-1 ring-red-500';
                } else {
                  style = 'bg-stone-950/40 border-stone-800 text-stone-500 opacity-60';
                }
              } else if (isSelectedByMyTeam) {
                style = 'bg-amber-950/95 border-amber-400 text-amber-100 ring-2 ring-amber-400 shadow-xl scale-[1.01]';
              }

              return (
                <button
                  key={idx}
                  disabled={isReveal}
                  onClick={() => handleSelectAnswer(idx, false)}
                  className={`p-3 sm:p-4 rounded-xl border text-left flex items-start gap-3 transition-all active:scale-98 min-h-[48px] ${style}`}
                >
                  <span className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                    isReveal && isCorrectAnswer
                      ? 'bg-emerald-500 text-stone-950'
                      : isReveal && isSelectedByMyTeam
                      ? 'bg-red-500 text-white'
                      : isSelectedByMyTeam
                      ? 'bg-amber-400 text-stone-950 ring-2 ring-amber-300 font-extrabold'
                      : 'bg-stone-800 text-amber-400'
                  }`}>
                    {letter}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm sm:text-base font-medium pt-0.5 leading-snug block">{opt}</span>
                    {isSelectedByMyTeam && !isReveal && (
                      <span className="text-[11px] text-amber-400 font-semibold flex items-center gap-1 mt-1">
                        <Check className="w-3 h-3 text-amber-400" /> Označená volba týmu
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Stav označené odpovědi pro tým */}
          {!isReveal && activeSelectedIdx !== null && (
            <div className="p-3.5 bg-amber-950/80 border border-amber-500/70 rounded-xl text-xs sm:text-sm text-amber-200 max-w-xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg animate-fadeIn">
              <div className="flex items-center gap-2.5 text-left">
                <span className="w-6 h-6 rounded-md bg-amber-500 text-stone-950 font-bold flex items-center justify-center text-xs shrink-0">
                  {['A', 'B', 'C', 'D'][activeSelectedIdx]}
                </span>
                <span>
                  Odpověď je <strong>označena</strong>! Klepnutím na jinou možnost ji můžete změnit.
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleSelectAnswer(activeSelectedIdx, true)}
                className="w-full sm:w-auto px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-lg transition-colors shadow shrink-0 cursor-pointer"
              >
                Potvrdit finálně
              </button>
            </div>
          )}

          {!isReveal && activeSelectedIdx === null && (
            <div className="text-xs sm:text-sm text-amber-300/80 text-center italic py-1">
              Klepněte na možnost A, B, C nebo D pro označení vaší odpovědi.
            </div>
          )}

          {/* Odhalení správné odpovědi a bonusového bodu za nejrychlejší správnou odpověď */}
          {isReveal && (
            <div className="mt-6 p-5 bg-amber-950/40 border border-amber-800/60 rounded-xl text-left max-w-2xl mx-auto space-y-4 animate-fadeIn">
              <div className="font-semibold text-amber-300 text-sm">
                Správné řešení: {q.correctAnswer}
              </div>
              <p className="text-xs text-stone-300 leading-relaxed">
                {q.explanation}
              </p>

              {/* Ocenění nejrychlejší správné odpovědi s bonusovým bodem */}
              {roomState.fastestCorrectTeam && (
                <div className="p-4 bg-gradient-to-r from-amber-950 via-amber-900/50 to-amber-950 border-2 border-amber-500 rounded-xl shadow-xl flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold shrink-0 shadow-md">
                    <Zap className="w-6 h-6 text-stone-950 fill-stone-950" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1.5">
                      <span>⚡ Nejrychlejší správná odpověď (+1 bonusový bod)</span>
                    </div>
                    <div className="text-base sm:text-lg font-serif font-bold text-amber-100 truncate">
                      {roomState.fastestCorrectTeam.name} (Stůl {roomState.fastestCorrectTeam.tableNumber})
                    </div>
                    <div className="text-xs text-amber-300/90">
                      Bleskový čas: {(roomState.fastestCorrectTeam.responseTimeMs / 1000).toFixed(1)} s! Získává +1 bonusový bod za rychlost!
                    </div>
                  </div>
                </div>
              )}

              {/* Oslavný banner pro stůl, který získal bonus */}
              {myTeam?.earnedBonusPoint && (
                <div className="p-3 bg-emerald-950/80 border border-emerald-500 rounded-xl text-emerald-200 text-xs sm:text-sm font-semibold flex items-center gap-2 animate-bounce">
                  <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
                  <span>Skvělá práce! Váš stůl byl nejrychlejší ze všech a získal +1 bonusový bod za rychlost!</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Spodní lišta Kvízmistra & průběžné body stolů */}
        <div className="bg-[#18110b] border border-amber-950 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            <span className="text-xs uppercase font-semibold text-stone-400 shrink-0">Stoly:</span>
            {roomState.teams.map((t) => (
              <div
                key={t.id}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 shrink-0 ${
                  t.earnedBonusPoint && isReveal
                    ? 'bg-amber-950/80 border-amber-400 text-amber-200 ring-1 ring-amber-400 shadow-md'
                    : t.hasAnswered
                    ? 'bg-emerald-950/40 border-emerald-600/60 text-emerald-300'
                    : 'bg-stone-900 border-stone-800 text-stone-400'
                }`}
              >
                <span>{t.name}</span>
                <span className="font-bold font-mono text-amber-400">({t.score} b.)</span>
                {t.earnedBonusPoint && isReveal && (
                  <span className="text-[10px] bg-amber-500 text-stone-950 font-extrabold px-1.5 py-0.5 rounded flex items-center gap-0.5" title="Získal bonusový bod za nejrychlejší správnou odpověď">
                    <Zap className="w-2.5 h-2.5 fill-stone-950" /> +1b rychlost
                  </span>
                )}
                {t.hasAnswered && (!t.earnedBonusPoint || !isReveal) && <Check className="w-3 h-3 text-emerald-400" />}
              </div>
            ))}
          </div>

          {role === 'HOST_VIEW' && isReveal && (
            <button
              onClick={handleNextQuestion}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-serif font-bold text-sm rounded-xl transition-colors shadow-md flex items-center gap-2 shrink-0 cursor-pointer"
            >
              <span>Další otázka</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // --- 6. VYHLÁŠENÍ VÝSLEDKŮ & HOUKÁNÍ VÍTĚZNÉHO TÝMU ---
  if (roomState.status === 'FINAL_RESULTS') {
    const sortedTeams = [...roomState.teams].sort((a, b) => b.score - a.score);
    const winningTeam = sortedTeams[0];

    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Banner houkání vítězného týmu */}
        {isMyTeamWinner && (
          <div className="p-6 bg-amber-500 text-stone-950 rounded-3xl shadow-2xl border-4 border-amber-300 text-center space-y-3 animate-pulse">
            <div className="inline-flex items-center gap-2 bg-stone-950 text-amber-400 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest">
              <Megaphone className="w-4 h-4 animate-bounce" />
              <span>ZAŘÍZENÍ VÝHERNÍHO TÝMU HOUKÁ!</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-serif font-bold">
              🏆 VÁŠ TÝM JE HOSPODSKÝM ŠAMPIONEM!
            </h2>
            <p className="text-stone-950 text-sm font-semibold max-w-md mx-auto">
              Gratulujeme všem členům stolu! Objednejte si zaslouženou rundu na oslavu vítězství!
            </p>
            <button
              onClick={() => pubAudio.playVictorySiren()}
              className="px-6 py-2.5 bg-stone-950 hover:bg-stone-900 text-amber-300 font-serif font-bold rounded-xl text-sm transition-colors shadow-lg inline-flex items-center gap-2"
            >
              <Megaphone className="w-4 h-4" />
              <span>Znovu zatroubit / houkat</span>
            </button>
          </div>
        )}

        {/* Hromadný žebříček výsledků všech týmů */}
        <div className="bg-[#18110b] border border-amber-900/60 rounded-3xl p-6 md:p-10 shadow-2xl space-y-6">
          <div className="text-center space-y-2 pb-6 border-b border-amber-950">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-500">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span>Oficiální konečné vyhlášení hospodského kvízu</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-serif font-bold text-amber-100">
              Hromadný přehled výsledků týmů
            </h1>
            <p className="text-stone-400 text-sm">
              Konečný součet bodů všech {roomState.teams.length} týmů za celý kvíz
            </p>
          </div>

          {/* Žebříček týmů */}
          <div className="space-y-3">
            {sortedTeams.map((team, idx) => {
              const isFirst = idx === 0;
              const isSecond = idx === 1;
              const isThird = idx === 2;

              let rankBadge = `${idx + 1}. místo`;
              let borderStyle = 'border-stone-800 bg-stone-900/60';

              if (isFirst) {
                rankBadge = '🥇 1. MÍSTO (VÍTĚZ)';
                borderStyle = 'border-amber-500 bg-amber-950/40 ring-2 ring-amber-500/60';
              } else if (isSecond) {
                rankBadge = '🥈 2. MÍSTO';
                borderStyle = 'border-stone-500 bg-stone-900/80';
              } else if (isThird) {
                rankBadge = '🥉 3. MÍSTO';
                borderStyle = 'border-amber-800/70 bg-stone-900/70';
              }

              return (
                <div
                  key={team.id}
                  className={`p-4 md:p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all shadow-sm ${borderStyle}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 font-mono ${
                      isFirst ? 'bg-amber-500 text-stone-950 text-base' : 'bg-stone-800 text-stone-300'
                    }`}>
                      {idx + 1}
                    </span>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-serif font-bold text-lg text-amber-100 truncate">
                          {team.name}
                        </h3>
                        {team.isWinner && (
                          <span className="text-[10px] bg-amber-500 text-stone-950 font-bold px-2 py-0.5 rounded-full uppercase">
                            Vítěz
                          </span>
                        )}
                        {team.id === myTeamId && (
                          <span className="text-[10px] bg-stone-700 text-stone-200 font-medium px-2 py-0.5 rounded">
                            Váš tým
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-stone-400 mt-0.5">
                        Členové ({team.members.length}): {team.members.join(', ')}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 sm:text-right">
                    <span className="text-xs text-amber-400 uppercase font-semibold block">
                      {rankBadge}
                    </span>
                    <div className="font-mono font-bold text-2xl text-amber-300">
                      {team.score} <span className="text-xs text-stone-400 font-sans">b.</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Možnost nové odvety */}
          <div className="pt-6 border-t border-amber-950 flex flex-col sm:flex-row items-center justify-center gap-4">
            {role === 'HOST_VIEW' && (
              <button
                onClick={handleRestartRoom}
                className="w-full sm:w-auto px-8 py-3.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-serif font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>🎲 Nový kvíz se stejnými týmy (nové náhodné otázky)</span>
              </button>
            )}
            <button
              onClick={() => {
                setRole('SELECT_ROLE');
                setRoomState(null);
                setMyTeamId(null);
              }}
              className="w-full sm:w-auto px-6 py-3.5 bg-stone-900 hover:bg-stone-800 text-stone-300 font-serif font-bold text-sm rounded-xl transition-colors"
            >
              Zpět do výběru kvízu
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
