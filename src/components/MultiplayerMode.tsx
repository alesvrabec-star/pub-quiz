import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { QuizRound, MultiplayerRoomState, MultiplayerTeam } from '../types/quiz';
import { 
  Users, Play, Volume2, VolumeX, Trophy, AlertTriangle, 
  Crown, ArrowRight, UserPlus, X, Check, CheckCircle2, Megaphone, Radio,
  Clock, ShieldAlert, Sparkles, RefreshCw, Zap,
  QrCode, Maximize2, Minimize2, Copy, Smartphone, ExternalLink,
  Edit3
} from 'lucide-react';
import { pubAudio } from '../utils/audio';
import { pubSpeech } from '../utils/speech';
import { SpeakQuestionButton } from './SpeakQuestionButton';
import { generateRandomQuizRounds } from '../data/questionPool';

interface MultiplayerModeProps {
  rounds: QuizRound[];
  initialJoinCode?: string | null;
}

type ClientRole = 'SELECT_ROLE' | 'HOST_VIEW' | 'TEAM_VIEW';

export const MultiplayerMode: React.FC<MultiplayerModeProps> = ({ rounds, initialJoinCode }) => {
  const [role, setRole] = useState<ClientRole>(() => {
    return initialJoinCode ? 'TEAM_VIEW' : 'SELECT_ROLE';
  });
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [roomState, setRoomState] = useState<MultiplayerRoomState | null>(null);
  const [myTeamId, setMyTeamId] = useState<string | null>(null);
  const [localSelectedOption, setLocalSelectedOption] = useState<number | null>(null);

  // Form pro připojení týmu
  const [inputRoomCode, setInputRoomCode] = useState(initialJoinCode || '');
  const [inputTeamName, setInputTeamName] = useState('');
  const [inputMembers, setInputMembers] = useState<string[]>(['Pepa', 'Honza']);
  const [newMemberName, setNewMemberName] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Úprava stolu / týmu Kvízmistra i ostatních stolů
  const [isEditingTeamModalOpen, setIsEditingTeamModalOpen] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editTeamName, setEditTeamName] = useState('');
  const [editTeamMembers, setEditTeamMembers] = useState<string[]>([]);
  const [newEditMemberName, setNewEditMemberName] = useState('');
  const [editErrorMessage, setEditErrorMessage] = useState<string | null>(null);

  // Volitelné přednastavení stolu Kvízmistra před založením
  const [hostInitialTeamName, setHostInitialTeamName] = useState('Stůl 1 (Kvízmistr)');
  const [hostInitialMembers, setHostInitialMembers] = useState<string[]>(['Kvízmistr']);
  const [newHostMemberName, setNewHostMemberName] = useState('');
  const [showHostCustomization, setShowHostCustomization] = useState(false);

  // QR kód pro okamžité připojení mobilů
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [hasCopiedLink, setHasCopiedLink] = useState(false);
  const [hasCopiedCode, setHasCopiedCode] = useState(false);

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

  // Automatický reset označené odpovědi při přechodu na novou otázku, kolo nebo stav
  useEffect(() => {
    setLocalSelectedOption(null);
  }, [
    roomState?.currentRoundIndex,
    roomState?.currentQuestionIndex,
    roomState?.currentQuestion?.id,
    roomState?.status
  ]);

  // Synchronizace stavu předčítání
  useEffect(() => {
    const unsub = pubSpeech.subscribe((s) => {
      setIsSpeechEnabled(s.isEnabled);
      setIsAutoplayBlocked(s.isAutoplayBlocked);
    });
    return () => unsub();
  }, []);

  // Zpracování parametru z URL pro přímé připojení týmu přes QR kód
  useEffect(() => {
    if (initialJoinCode) {
      setInputRoomCode(initialJoinCode.toUpperCase());
      if (role === 'SELECT_ROLE') {
        setRole('TEAM_VIEW');
      }
    }
  }, [initialJoinCode, role]);

  // Generování QR kódu s odkazem pro okamžité připojení mobilních týmů
  useEffect(() => {
    if (roomState?.code) {
      const joinUrl = `${window.location.origin}/?join=${encodeURIComponent(roomState.code)}`;
      QRCode.toDataURL(joinUrl, {
        width: 380,
        margin: 2,
        color: {
          dark: '#140c06',
          light: '#fffef5',
        },
        errorCorrectionLevel: 'M',
      })
        .then((url) => {
          setQrCodeDataUrl(url);
        })
        .catch((err) => {
          console.error('Chyba při generování QR kódu:', err);
        });
    } else {
      setQrCodeDataUrl(null);
    }
  }, [roomState?.code]);

  const handleCopyLink = () => {
    if (!roomState?.code) return;
    const joinUrl = `${window.location.origin}/?join=${encodeURIComponent(roomState.code)}`;
    navigator.clipboard.writeText(joinUrl).then(() => {
      setHasCopiedLink(true);
      pubAudio.playBeerClink();
      setTimeout(() => setHasCopiedLink(false), 2500);
    }).catch(() => {});
  };

  const handleCopyCode = () => {
    if (!roomState?.code) return;
    navigator.clipboard.writeText(roomState.code).then(() => {
      setHasCopiedCode(true);
      pubAudio.playBeerClink();
      setTimeout(() => setHasCopiedCode(false), 2500);
    }).catch(() => {});
  };

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

            // Pokud přichází nová otázka nebo se stav mění na QUESTION, vyčistit starou označenou odpověď
            if (
              room.status === 'QUESTION' &&
              (room.currentQuestion?.id !== roomStateRef.current?.currentQuestion?.id ||
               room.currentQuestionIndex !== roomStateRef.current?.currentQuestionIndex ||
               room.currentRoundIndex !== roomStateRef.current?.currentRoundIndex ||
               roomStateRef.current?.status !== 'QUESTION')
            ) {
              setLocalSelectedOption(null);
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
    ws.send(JSON.stringify({
      type: 'CREATE_ROOM',
      rounds: freshRounds,
      forceRandom: true,
      hostTeamName: hostInitialTeamName.trim() || 'Stůl 1 (Kvízmistr)',
      hostMembers: hostInitialMembers.length > 0 ? hostInitialMembers : ['Kvízmistr'],
    }));
  };

  // Otevření okna pro úpravu stolu / týmu
  const handleOpenEditTeam = (team: MultiplayerTeam) => {
    setEditingTeamId(team.id);
    setEditTeamName(team.name);
    setEditTeamMembers([...team.members]);
    setNewEditMemberName('');
    setEditErrorMessage(null);
    setIsEditingTeamModalOpen(true);
  };

  // Uložení úpravy stolu / týmu (odeslání přes WebSocket)
  const handleSaveTeamEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTeamName.trim()) {
      setEditErrorMessage('Zadejte název stolu / týmu.');
      return;
    }
    if (editTeamMembers.length === 0) {
      setEditErrorMessage('Přidejte alespoň 1 člena týmu (1 až 10).');
      return;
    }
    const socket = wsRef.current || ws;
    if (!socket || !roomState || !editingTeamId) return;

    socket.send(JSON.stringify({
      type: 'UPDATE_TEAM',
      code: roomState.code,
      teamId: editingTeamId,
      name: editTeamName.trim(),
      members: editTeamMembers,
    }));

    pubAudio.playBeerClink();
    setIsEditingTeamModalOpen(false);
  };

  const handleAddEditMember = () => {
    if (!newEditMemberName.trim()) return;
    if (editTeamMembers.length >= 10) {
      setEditErrorMessage('Maximální počet členů týmu je 10.');
      return;
    }
    setEditTeamMembers([...editTeamMembers, newEditMemberName.trim()]);
    setNewEditMemberName('');
    setEditErrorMessage(null);
  };

  const handleRemoveEditMember = (idx: number) => {
    if (editTeamMembers.length <= 1) {
      setEditErrorMessage('Tým musí mít alespoň jednoho člena.');
      return;
    }
    setEditTeamMembers(editTeamMembers.filter((_, i) => i !== idx));
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
    setLocalSelectedOption(null);
    const socket = wsRef.current || ws;
    if (!socket || !roomState) return;
    socket.send(JSON.stringify({ type: 'START_GAME', code: roomState.code }));
    pubAudio.playTavernBell();
  };

  const handleNextQuestion = () => {
    setLocalSelectedOption(null);
    const socket = wsRef.current || ws;
    if (!socket || !roomState) return;
    socket.send(JSON.stringify({ type: 'NEXT_QUESTION', code: roomState.code }));
  };

  const handleForceReveal = () => {
    const socket = wsRef.current || ws;
    if (!socket || !roomState) return;
    socket.send(JSON.stringify({ type: 'REVEAL_NOW', code: roomState.code }));
    pubAudio.playTavernBell();
  };

  const handleRestartRoom = () => {
    setLocalSelectedOption(null);
    const socket = wsRef.current || ws;
    if (!socket || !roomState) return;
    socket.send(JSON.stringify({ type: 'RESTART_ROOM', code: roomState.code }));
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

            {/* Možnost předem nastavit název stolu a členy Kvízmistra */}
            <div className="space-y-3 pt-1">
              <button
                type="button"
                onClick={() => setShowHostCustomization(!showHostCustomization)}
                className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1.5 underline cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{showHostCustomization ? 'Skrýt nastavení stolu' : 'Nastavit jméno a členy stolu Kvízmistra'}</span>
              </button>

              {showHostCustomization && (
                <div className="space-y-3 p-3 bg-stone-900/90 border border-amber-900/70 rounded-xl text-left">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-300 mb-1">
                      Název vašeho stolu
                    </label>
                    <input
                      type="text"
                      value={hostInitialTeamName}
                      onChange={(e) => setHostInitialTeamName(e.target.value)}
                      placeholder="Stůl 1 (Kvízmistr)"
                      className="w-full px-3 py-1.5 bg-stone-950 border border-stone-700 rounded-lg text-xs text-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-300 mb-1">
                      Členové u stolu ({hostInitialMembers.length})
                    </label>
                    <div className="flex gap-1.5 mb-2">
                      <input
                        type="text"
                        value={newHostMemberName}
                        onChange={(e) => setNewHostMemberName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (newHostMemberName.trim() && hostInitialMembers.length < 10) {
                              setHostInitialMembers([...hostInitialMembers, newHostMemberName.trim()]);
                              setNewHostMemberName('');
                            }
                          }
                        }}
                        placeholder="Jméno člena..."
                        className="flex-1 px-2.5 py-1 bg-stone-950 border border-stone-700 rounded-lg text-xs text-stone-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newHostMemberName.trim() && hostInitialMembers.length < 10) {
                            setHostInitialMembers([...hostInitialMembers, newHostMemberName.trim()]);
                            setNewHostMemberName('');
                          }
                        }}
                        className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-stone-950 text-xs font-bold rounded-lg cursor-pointer"
                      >
                        +
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {hostInitialMembers.map((m, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-stone-800 border border-stone-700 rounded text-[11px] text-stone-200">
                          <span>{m}</span>
                          {hostInitialMembers.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setHostInitialMembers(hostInitialMembers.filter((_, idx) => idx !== i))}
                              className="text-stone-400 hover:text-red-400"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleCreateRoom}
              disabled={!isConnected}
              className="w-full py-4 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-stone-950 font-serif font-bold text-base rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
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

          {inputRoomCode && (
            <div className="p-3 bg-amber-950/60 border border-amber-600/70 rounded-xl text-amber-200 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Kód místnosti: <strong className="font-mono text-amber-300 font-bold tracking-wider">{inputRoomCode}</strong></span>
              </div>
              <span className="text-[10px] bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-2 py-0.5 rounded font-medium">Z QR kódu / pozvánky</span>
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
                autoFocus={Boolean(inputRoomCode)}
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
        {/* Kód místnosti a QR kód pro okamžité připojení mobilů */}
        <div className="bg-[#18110b] border border-amber-900/70 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-4 border-b border-amber-950/80">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-amber-500">
              <Radio className="w-4 h-4 animate-pulse text-emerald-400" />
              <span>Hospodská kvízová místnost připravena</span>
            </div>
            <div className="text-xs text-stone-400 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-amber-400" />
              <span>Hráči se připojí naskenováním QR kódu</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Levá část: Kód místnosti, instrukce a rychlé akce */}
            <div className="md:col-span-7 text-center md:text-left space-y-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                  Kód pro váš stůl a hospodu
                </span>
                <h1 className="text-2xl sm:text-3xl font-serif font-bold text-amber-100 mt-0.5">
                  Připojte svůj tým do hry
                </h1>
              </div>

              {/* Velký box kódu s tlačítky kopírování */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="px-6 py-3 bg-stone-900/90 border-2 border-dashed border-amber-500 rounded-2xl shadow-inner flex items-center justify-center">
                  <span className="text-3xl sm:text-4xl font-mono font-black text-amber-400 tracking-widest select-all">
                    {roomState.code}
                  </span>
                </div>

                <div className="flex flex-wrap sm:flex-col gap-2 justify-center">
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="px-3.5 py-2 bg-stone-900 hover:bg-stone-800 border border-stone-700 hover:border-amber-500 text-stone-200 text-xs font-medium rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                    title="Zkopírovat kód místnosti"
                  >
                    {hasCopiedCode ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-semibold">Kód zkopírován</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-amber-400" />
                        <span>Kopírovat kód</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="px-3.5 py-2 bg-stone-900 hover:bg-stone-800 border border-stone-700 hover:border-amber-500 text-stone-200 text-xs font-medium rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                    title="Zkopírovat přímý odkaz pro připojení"
                  >
                    {hasCopiedLink ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-semibold">Odkaz zkopírován</span>
                      </>
                    ) : (
                      <>
                        <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                        <span>Kopírovat odkaz</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Rychlý návod */}
              <div className="space-y-1.5 text-xs text-stone-300 bg-stone-900/50 p-3.5 rounded-xl border border-stone-800/80 text-left">
                <div className="font-semibold text-amber-300 flex items-center gap-1.5">
                  <QrCode className="w-3.5 h-3.5 text-amber-400" />
                  <span>Jak se připojit z mobilního telefonu:</span>
                </div>
                <p className="text-stone-400 leading-relaxed">
                  1. Otevřete fotoaparát na mobilu a namiřte na QR kód vpravo.
                </p>
                <p className="text-stone-400 leading-relaxed">
                  2. Kód stolu se načte automaticky — zadejte jen název týmu a hrajete!
                </p>
              </div>
            </div>

            {/* Pravá část: Interaktivní QR kód */}
            <div className="md:col-span-5 flex flex-col items-center justify-center">
              <div className="relative group bg-[#fffef5] p-3 rounded-2xl shadow-2xl border-4 border-amber-900/70 transition-transform hover:scale-[1.02]">
                {qrCodeDataUrl ? (
                  <img
                    src={qrCodeDataUrl}
                    alt={`QR kód pro připojení k místnosti ${roomState.code}`}
                    className="w-48 h-48 sm:w-52 sm:h-52 object-contain rounded-lg cursor-pointer"
                    onClick={() => setIsQrModalOpen(true)}
                    title="Kliknutím zvětšíte QR kód na celou obrazovku"
                  />
                ) : (
                  <div className="w-48 h-48 sm:w-52 sm:h-52 flex flex-col items-center justify-center bg-stone-100 rounded-lg text-stone-500">
                    <QrCode className="w-10 h-10 animate-pulse text-amber-600 mb-2" />
                    <span className="text-xs font-mono">Generování QR...</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setIsQrModalOpen(true)}
                  className="absolute bottom-2 right-2 bg-stone-950/90 hover:bg-stone-900 text-amber-300 px-2 py-1 rounded-lg border border-amber-500/60 shadow-md transition-all flex items-center gap-1 text-[11px] font-medium cursor-pointer"
                  title="Zvětšit QR kód pro promítačku nebo celou hospodu"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Zvětšit</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsQrModalOpen(true)}
                className="mt-2.5 text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1.5 font-medium underline underline-offset-4 cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Zvětšit QR kód na celou obrazovku</span>
              </button>
            </div>
          </div>

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

            {/* Zvýrazněná karta stolu Kvízmistra s možností okamžité úpravy názvu a členů */}
            {role === 'HOST_VIEW' && roomState.teams.some((t) => t.tableNumber === 1 || t.id === myTeamId) && (
              (() => {
                const hostTeam = roomState.teams.find((t) => t.id === myTeamId) || roomState.teams.find((t) => t.tableNumber === 1)!;
                return (
                  <div className="mb-4 p-4 bg-gradient-to-r from-amber-950/80 via-stone-900 to-amber-950/60 border border-amber-600/70 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 shrink-0">
                        <Crown className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-serif font-bold text-base text-amber-100">{hostTeam.name}</span>
                          <span className="text-[10px] bg-amber-500 text-stone-950 font-bold px-2 py-0.5 rounded">
                            Stůl #1 · Kvízmistr
                          </span>
                        </div>
                        <div className="text-xs text-stone-300 mt-0.5">
                          Členové týmu ({hostTeam.members.length}): <span className="text-amber-200/90 font-medium">{hostTeam.members.join(', ')}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenEditTeam(hostTeam)}
                      className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-serif font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-md shrink-0"
                      title="Změnit název vašeho stolu a přidat další členy týmu"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>Upravit stůl Kvízmistra</span>
                    </button>
                  </div>
                );
              })()
            )}

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
                      team.id === myTeamId || (role === 'HOST_VIEW' && team.tableNumber === 1)
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
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-amber-950/80">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {team.id === myTeamId && (
                          <span className="text-[10px] bg-amber-600 text-stone-950 font-bold px-2 py-0.5 rounded">
                            Vaše zařízení
                          </span>
                        )}
                        {team.tableNumber === 1 && (
                          <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-700/60 font-semibold px-2 py-0.5 rounded flex items-center gap-1">
                            <Crown className="w-3 h-3 text-amber-400" />
                            <span>Kvízmistr</span>
                          </span>
                        )}
                      </div>

                      {(team.id === myTeamId || role === 'HOST_VIEW') && (
                        <button
                          type="button"
                          onClick={() => handleOpenEditTeam(team)}
                          className="text-xs text-amber-300 hover:text-amber-100 bg-stone-800/90 hover:bg-stone-700 border border-amber-700/50 hover:border-amber-500 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1.5 font-medium cursor-pointer"
                          title="Upravit název stolu a členy týmu"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                          <span>Upravit stůl</span>
                        </button>
                      )}
                    </div>
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

        {/* Modální okno pro velké zobrazení QR kódu pro celou hospodu / promítačku */}
        {isQrModalOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setIsQrModalOpen(false)}
          >
            <div
              className="bg-[#18110b] border-2 border-amber-600 rounded-3xl p-6 sm:p-8 max-w-lg w-full text-center space-y-6 shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setIsQrModalOpen(false)}
                className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-100 bg-stone-900 rounded-full border border-stone-700 cursor-pointer"
                title="Zavřít"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-widest text-amber-400 flex items-center justify-center gap-2">
                  <QrCode className="w-4 h-4 text-amber-400" />
                  <span>Naskenujte telefonem a hrajte</span>
                </span>
                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-amber-100">
                  Připojení k hospodskému kvízu
                </h2>
                <p className="text-xs text-stone-300">
                  Namiřte fotoaparát na kód pro okamžité vytvoření vašeho týmu
                </p>
              </div>

              <div className="bg-[#fffef5] p-4 sm:p-6 rounded-2xl mx-auto inline-block shadow-2xl border-4 border-amber-700/60">
                {qrCodeDataUrl ? (
                  <img
                    src={qrCodeDataUrl}
                    alt={`QR kód ${roomState.code}`}
                    className="w-64 h-64 sm:w-80 sm:h-80 object-contain mx-auto"
                  />
                ) : null}
              </div>

              <div className="space-y-3">
                <div className="inline-block px-6 py-2.5 bg-stone-900 border border-amber-500/80 rounded-xl">
                  <span className="text-xs text-stone-400 mr-2 uppercase tracking-wider">Kód místnosti:</span>
                  <span className="text-2xl sm:text-3xl font-mono font-bold text-amber-400 tracking-wider">
                    {roomState.code}
                  </span>
                </div>

                <div className="flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-serif font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
                  >
                    {hasCopiedLink ? <Check className="w-4 h-4" /> : <ExternalLink className="w-4 h-4" />}
                    <span>{hasCopiedLink ? 'Odkaz zkopírován!' : 'Zkopírovat odkaz'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsQrModalOpen(false)}
                    className="px-4 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    Zavřít
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modální okno pro úpravu stolu / týmu (název a členové) */}
        {isEditingTeamModalOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setIsEditingTeamModalOpen(false)}
          >
            <div
              className="bg-[#18110b] border-2 border-amber-600 rounded-3xl p-6 sm:p-8 max-w-lg w-full text-left space-y-6 shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-amber-950">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400">
                    <Edit3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-serif font-bold text-amber-100">
                      Upravit stůl v kvízu
                    </h3>
                    <span className="text-xs text-amber-400">
                      Změna názvu a členů se ihned projeví všem stolům
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsEditingTeamModalOpen(false)}
                  className="p-1.5 text-stone-400 hover:text-stone-100 rounded-lg bg-stone-900 border border-stone-800 cursor-pointer"
                  title="Zavřít"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {editErrorMessage && (
                <div className="p-3 bg-red-950/80 border border-red-500 text-red-200 rounded-xl text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{editErrorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSaveTeamEdit} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-300 mb-1.5">
                    Název stolu / týmu
                  </label>
                  <input
                    type="text"
                    value={editTeamName}
                    onChange={(e) => setEditTeamName(e.target.value)}
                    placeholder="Např. Štamgasti od výčepu"
                    className="w-full px-4 py-3 bg-stone-900 border border-stone-700 rounded-xl text-amber-200 font-serif font-bold text-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-300 mb-1.5">
                    Členové u stolu ({editTeamMembers.length} z 10)
                  </label>

                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      placeholder="Jméno člena (např. Petr, Lucka)..."
                      value={newEditMemberName}
                      onChange={(e) => setNewEditMemberName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddEditMember();
                        }
                      }}
                      className="flex-1 px-3 py-2 bg-stone-900 border border-stone-700 rounded-lg text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddEditMember}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-stone-950 rounded-lg text-xs font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Přidat</span>
                    </button>
                  </div>

                  {/* Seznam členů týmu */}
                  <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-2 bg-stone-950/60 rounded-xl border border-stone-800">
                    {editTeamMembers.map((member, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 border border-amber-900/60 rounded-lg text-xs text-stone-200 shadow-sm"
                      >
                        <span className="font-medium">{member}</span>
                        {editTeamMembers.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveEditMember(i)}
                            className="text-stone-400 hover:text-red-400 transition-colors cursor-pointer"
                            title="Odebrat člena"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-amber-950">
                  <button
                    type="button"
                    onClick={() => setIsEditingTeamModalOpen(false)}
                    className="px-4 py-2.5 bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    Zrušit
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-serif font-bold text-sm rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Uložit změny stolu</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
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

    const isReveal = roomState.status === 'REVEAL';
    const hasMyTeamAnswered = myTeam?.hasAnswered ?? false;
    // Během nové otázky (QUESTION), pokud tým ještě neodpověděl a nemá nově označenou možnost, je výběr vždy null
    const activeSelectedIdx =
      !isReveal && !hasMyTeamAnswered && localSelectedOption === null
        ? null
        : localSelectedOption !== null
        ? localSelectedOption
        : (myTeam?.selectedOption ?? null);

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
