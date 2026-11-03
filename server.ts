import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { DEFAULT_QUIZ_ROUNDS } from './src/data/defaultRounds.ts';
import { generateRandomQuizRounds } from './src/data/questionPool.ts';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Inicializace server-side Gemini klienta podle směrnic
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Server-side endpoint pro generování tematických kol hospodského kvízu
app.post('/api/generate-round', async (req, res) => {
  try {
    const { topic, count = 5 } = req.body;

    if (!topic || typeof topic !== 'string') {
      return res.status(400).json({ error: 'Chybí téma pro generování.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Server nemá nakonfigurovaný GEMINI_API_KEY.' });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Jsi zkušený český kvízmistr a připravuješ 1 soutěžní kolo pro český hospodský kvíz.
Téma kola: "${topic}".
Počet otázek: ${count}.
Otázky musí být zábavné, srozumitelné a fakticky přesné.
Pro každou otázku vytvoř právě 4 možnosti (A, B, C, D), index správné možnosti (0, 1, 2 nebo 3) a poutavou perličku/vysvětlení (explanation), kterou moderátor přečte hostům u piva po odhalení správné odpovědi. Vše v bezchybné češtině.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: 'Výstižný název kola v češtině' },
            description: { type: Type.STRING, description: 'Jednovětý popis atmosféry a obsahu kola' },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING, description: 'Znění otázky v češtině' },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'Přesně 4 možnosti odpovědi'
                  },
                  correctIndex: { type: Type.INTEGER, description: 'Číslo správné možnosti 0 až 3' },
                  correctAnswer: { type: Type.STRING, description: 'Znění správné odpovědi' },
                  explanation: { type: Type.STRING, description: 'Zajímavost a perlička pro moderátora' }
                },
                required: ['question', 'options', 'correctIndex', 'correctAnswer', 'explanation']
              }
            }
          },
          required: ['title', 'description', 'questions']
        }
      }
    });

    const parsedText = response.text?.trim() || '{}';
    const parsed = JSON.parse(parsedText);
    const roundId = `ai-round-${Date.now()}`;

    const round = {
      id: roundId,
      roundNumber: 6,
      title: parsed.title || topic,
      description: parsed.description || `Soutěžní otázky na téma: ${topic}`,
      category: 'vlastni',
      questions: (parsed.questions || []).map((q: any, i: number) => ({
        id: `ai-q-${i}-${Date.now()}`,
        category: 'vlastni',
        categoryLabel: parsed.title || 'Vlastní téma',
        question: q.question,
        options: q.options || [],
        correctIndex: q.correctIndex ?? 0,
        correctAnswer: q.correctAnswer || (q.options ? q.options[q.correctIndex ?? 0] : ''),
        explanation: q.explanation || 'Zajímavost k otázce.',
        difficulty: 'stredni',
        points: 1
      }))
    };

    res.json({ round });
  } catch (error: any) {
    console.error('Chyba při generování kola kvízu:', error);
    res.status(500).json({ error: error?.message || 'Chyba při generování' });
  }
});

// ==========================================
// SERVER-SIDE ČESKÝ HLASATEL (TTS ENDPOINT)
// Poskytuje 100% spolehlivou českou výslovnost pro zařízení bez lokální české syntézy
// ==========================================
app.get('/api/tts/health', (_req, res) => {
  res.json({ status: 'ok', language: 'cs-CZ', service: 'hospodsky-hlasatel' });
});

app.get('/api/tts', async (req, res) => {
  try {
    const rawText = String(req.query.text || '').trim();
    if (!rawText) {
      return res.status(400).send('Chybí text k přečtení.');
    }

    // Omezení délky textu a normalizace
    const cleanText = rawText.replace(/\s+/g, ' ').slice(0, 800);

    // Rozdělení na menší sémantické bloky do max 160 znaků pro spolehlivé zpracování
    const chunks: string[] = [];
    const sentences = cleanText.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [cleanText];
    let currentChunk = '';

    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      if (!trimmed) continue;
      if ((currentChunk + ' ' + trimmed).trim().length <= 160) {
        currentChunk = (currentChunk + ' ' + trimmed).trim();
      } else {
        if (currentChunk) chunks.push(currentChunk);
        if (trimmed.length > 160) {
          const words = trimmed.split(' ');
          let sub = '';
          for (const word of words) {
            if ((sub + ' ' + word).trim().length <= 160) {
              sub = (sub + ' ' + word).trim();
            } else {
              if (sub) chunks.push(sub);
              sub = word;
            }
          }
          if (sub) chunks.push(sub);
          currentChunk = '';
        } else {
          currentChunk = trimmed;
        }
      }
    }
    if (currentChunk) chunks.push(currentChunk);

    if (chunks.length === 0) {
      chunks.push(cleanText.slice(0, 160));
    }

    const audioBuffers: Buffer[] = [];
    for (const chunk of chunks) {
      const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=cs&q=${encodeURIComponent(chunk)}`;
      const response = await fetch(ttsUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://translate.google.com/'
        }
      });

      if (!response.ok) {
        throw new Error(`TTS služba selhala se stavovým kódem ${response.status}`);
      }

      const arrBuf = await response.arrayBuffer();
      audioBuffers.push(Buffer.from(arrBuf));
    }

    const combinedMp3 = Buffer.concat(audioBuffers);
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('Content-Length', combinedMp3.length);
    res.send(combinedMp3);
  } catch (error: any) {
    console.error('Chyba TTS endpointu:', error);
    res.status(500).json({ error: error?.message || 'Chyba při syntéze řeči' });
  }
});


// ==========================================
// REAL-TIME MULTIPLAYER SYSTÉM PRO TÝMY
// ==========================================

interface TeamSession {
  id: string;
  name: string;
  members: string[]; // 1 až 10 členů
  tableNumber: number;
  score: number;
  selectedOption: number | null;
  hasAnswered: boolean;
  answeredAt: number | null;
  responseTimeMs: number | null;
  earnedBonusPoint: boolean;
  pointsEarnedThisQuestion: number;
  isWinner: boolean;
  ws?: WebSocket | null;
}

interface RoomData {
  code: string;
  status: 'LOBBY' | 'STARTING' | 'QUESTION' | 'REVEAL' | 'FINAL_RESULTS';
  teams: Map<string, TeamSession>;
  hostWs: WebSocket | null;
  rounds: any[];
  currentRoundIndex: number;
  currentQuestionIndex: number;
  timerSeconds: number; // 20s
  startCountdown: number; // 3, 2, 1
  timerInterval?: NodeJS.Timeout | null;
  questionStartTime: number;
  fastestCorrectTeam: {
    id: string;
    name: string;
    tableNumber: number;
    responseTimeMs: number;
  } | null;
}

const rooms = new Map<string, RoomData>();

function generateRoomCode(): string {
  const words = ['PIVO', 'KVÍZ', 'DUB', 'CHMEL', 'SLAD', 'ŠNYT'];
  const prefix = words[Math.floor(Math.random() * words.length)];
  const num = Math.floor(10 + Math.random() * 90);
  return `${prefix}-${num}`;
}

function broadcastRoomState(room: RoomData) {
  const questionsList = room.rounds[room.currentRoundIndex]?.questions || [];
  const currentQuestion = questionsList[room.currentQuestionIndex] || null;
  const totalQuestions = room.rounds.reduce((acc, r) => acc + (r.questions?.length || 0), 0);

  const teamsArray = Array.from(room.teams.values()).map((t) => ({
    id: t.id,
    name: t.name,
    members: t.members,
    tableNumber: t.tableNumber,
    score: t.score,
    hasAnswered: t.hasAnswered,
    // V průběhu otázky nesdílíme volbu s ostatními týmy, odhalíme až v REVEAL nebo pro vlastní tým
    selectedOption: room.status === 'REVEAL' || room.status === 'FINAL_RESULTS' ? t.selectedOption : null,
    responseTimeMs: room.status === 'REVEAL' || room.status === 'FINAL_RESULTS' ? t.responseTimeMs : null,
    earnedBonusPoint: room.status === 'REVEAL' || room.status === 'FINAL_RESULTS' ? t.earnedBonusPoint : false,
    pointsEarnedThisQuestion: room.status === 'REVEAL' || room.status === 'FINAL_RESULTS' ? t.pointsEarnedThisQuestion : 0,
    isWinner: t.isWinner,
    connected: !!t.ws && t.ws.readyState === WebSocket.OPEN,
  }));

  const waitingForTeamsCount = Array.from(room.teams.values()).filter((t) => !t.hasAnswered || t.selectedOption === null).length;
  const allAnswered = room.teams.size > 0 && waitingForTeamsCount === 0;

  const payloadForHost = JSON.stringify({
    type: 'ROOM_UPDATE',
    room: {
      code: room.code,
      status: room.status,
      teams: teamsArray,
      currentRoundIndex: room.currentRoundIndex,
      currentQuestionIndex: room.currentQuestionIndex,
      totalQuestions,
      currentQuestion: currentQuestion,
      timerSeconds: room.timerSeconds,
      startCountdown: room.startCountdown,
      fastestCorrectTeam: room.status === 'REVEAL' || room.status === 'FINAL_RESULTS' ? room.fastestCorrectTeam : null,
      waitingForTeamsCount,
      allAnswered,
    },
  });

  if (room.hostWs && room.hostWs.readyState === WebSocket.OPEN) {
    room.hostWs.send(payloadForHost);
  }

  // Odeslání každému týmu zvlášť, aby viděl svou vlastní vybranou možnost i během QUESTION
  room.teams.forEach((team) => {
    if (team.ws && team.ws.readyState === WebSocket.OPEN) {
      const teamTeamsArray = teamsArray.map((t) => ({
        ...t,
        selectedOption: t.id === team.id ? team.selectedOption : t.selectedOption,
      }));

      const payloadForTeam = JSON.stringify({
        type: 'ROOM_UPDATE',
        room: {
          code: room.code,
          status: room.status,
          teams: teamTeamsArray,
          currentRoundIndex: room.currentRoundIndex,
          currentQuestionIndex: room.currentQuestionIndex,
          totalQuestions,
          currentQuestion: currentQuestion,
          timerSeconds: room.timerSeconds,
          startCountdown: room.startCountdown,
          myTeamId: team.id,
          fastestCorrectTeam: room.status === 'REVEAL' || room.status === 'FINAL_RESULTS' ? room.fastestCorrectTeam : null,
          waitingForTeamsCount,
          allAnswered,
        },
      });

      team.ws.send(payloadForTeam);
    }
  });
}

function stopRoomTimer(room: RoomData) {
  if (room.timerInterval) {
    clearInterval(room.timerInterval);
    room.timerInterval = null;
  }
}

function start20sQuestionTimer(room: RoomData) {
  stopRoomTimer(room);
  room.status = 'QUESTION';
  room.timerSeconds = 20; // 20 sekund základní čas na otázku
  room.questionStartTime = Date.now();
  room.fastestCorrectTeam = null;
  
  // Vynulovat odpovědi a měření rychlosti pro novou otázku
  room.teams.forEach((team) => {
    team.selectedOption = null;
    team.hasAnswered = false;
    team.answeredAt = null;
    team.responseTimeMs = null;
    team.earnedBonusPoint = false;
    team.pointsEarnedThisQuestion = 0;
  });

  broadcastRoomState(room);

  room.timerInterval = setInterval(() => {
    // Kontrola: "U každé otázky počkat až odpoví všichni hráči"
    const teamsArr = Array.from(room.teams.values());
    const allAnswered = teamsArr.length > 0 && teamsArr.every(
      (t) => t.hasAnswered && t.selectedOption !== null && t.selectedOption !== undefined
    );

    if (allAnswered) {
      // Všichni hráči již odpověděli -> ihned ukončit a vyhodnotit
      stopRoomTimer(room);
      revealQuestionAnswer(room);
      return;
    }

    if (room.timerSeconds > 0) {
      room.timerSeconds -= 1;
      broadcastRoomState(room);
    } else {
      // Časomíra 20s dosáhla 0, ale čekáme, až odpoví všichni hráči
      room.timerSeconds = 0;
      broadcastRoomState(room);
    }
  }, 1000);
}

function revealQuestionAnswer(room: RoomData) {
  stopRoomTimer(room);
  room.status = 'REVEAL';

  const questionsList = room.rounds[room.currentRoundIndex]?.questions || [];
  const currentQuestion = questionsList[room.currentQuestionIndex];

  if (currentQuestion) {
    const correctIndex = currentQuestion.correctIndex;
    const basePoints = currentQuestion.points || 1;

    // 1. Vyhledáme týmy se správnou odpovědí
    const correctTeams: TeamSession[] = [];
    room.teams.forEach((team) => {
      team.earnedBonusPoint = false;
      team.pointsEarnedThisQuestion = 0;
      if (team.selectedOption === correctIndex) {
        correctTeams.push(team);
      }
    });

    // 2. Pravidlo: "pokud je více stejných správných odpovědí, tak ten tým s nejrychlejší správnou odpovědí dostane bonusový bod"
    if (correctTeams.length >= 2) {
      // Seřadíme správně odpovídající týmy podle naměřené reakční doby od začátku otázky
      correctTeams.sort((a, b) => (a.responseTimeMs ?? 999999) - (b.responseTimeMs ?? 999999));
      const fastest = correctTeams[0];
      fastest.earnedBonusPoint = true;
      room.fastestCorrectTeam = {
        id: fastest.id,
        name: fastest.name,
        tableNumber: fastest.tableNumber,
        responseTimeMs: fastest.responseTimeMs ?? 1000,
      };
    } else {
      room.fastestCorrectTeam = null;
    }

    // 3. Přičteme body: základní body pro všechny správné odpovědi + 1 bonusový bod za rychlost
    correctTeams.forEach((team) => {
      const awarded = basePoints + (team.earnedBonusPoint ? 1 : 0);
      team.score += awarded;
      team.pointsEarnedThisQuestion = awarded;
    });
  }

  broadcastRoomState(room);
}

function finishGameAndAnnounceWinners(room: RoomData) {
  stopRoomTimer(room);
  room.status = 'FINAL_RESULTS';

  // Najít nejvyšší skóre
  let maxScore = -1;
  room.teams.forEach((t) => {
    if (t.score > maxScore) maxScore = t.score;
  });

  room.teams.forEach((t) => {
    t.isWinner = maxScore > 0 && t.score === maxScore;
  });

  broadcastRoomState(room);
}

// REST API pro rychlou kontrolu existující místnosti
app.get('/api/room/:code', (req, res) => {
  const code = req.params.code.toUpperCase();
  const room = rooms.get(code);
  if (!room) {
    return res.status(404).json({ error: 'Místnost nebyla nalezena.' });
  }
  res.json({
    code: room.code,
    status: room.status,
    teamCount: room.teams.size,
  });
});

async function startServer() {
  const httpServer = http.createServer(app);
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on('upgrade', (request, socket, head) => {
    try {
      const url = new URL(request.url || '', `http://${request.headers.host || 'localhost'}`);
      if (url.pathname === '/ws') {
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit('connection', ws, request);
        });
      }
      // Ponecháváme ostatní upgrade požadavky pro interní Vite WebSocket spojení
    } catch {
      socket.destroy();
    }
  });

  wss.on('connection', (ws) => {
    let attachedRoomCode: string | null = null;
    let attachedTeamId: string | null = null;
    let isHost = false;

    ws.on('message', (messageRaw) => {
      try {
        const msg = JSON.parse(messageRaw.toString());

        switch (msg.type) {
          case 'CREATE_ROOM': {
            const code = generateRoomCode();
            // Při každém novém kvízu nové náhodné otázky a promíchané možnosti
            const selectedRounds = msg.rounds && msg.rounds.length > 0 && !msg.forceRandom
              ? msg.rounds 
              : generateRandomQuizRounds({ roundsCount: 5, questionsPerRound: 5, shuffleOptions: true });
            const newRoom: RoomData = {
              code,
              status: 'LOBBY',
              teams: new Map(),
              hostWs: ws,
              rounds: selectedRounds,
              currentRoundIndex: 0,
              currentQuestionIndex: 0,
              timerSeconds: 20,
              startCountdown: 3,
              questionStartTime: 0,
              fastestCorrectTeam: null,
            };

            // Vytvoříme také výchozí stůl pro hostitele (Stůl 1), aby mohl moderátor hrát a odpovídat přímo ze svého zařízení
            const hostTeamId = `team-host-${Date.now()}`;
            const hostTeam: TeamSession = {
              id: hostTeamId,
              name: msg.hostTeamName?.trim() || 'Stůl 1 (Kvízmistr)',
              members: ['Kvízmistr'],
              tableNumber: 1,
              score: 0,
              selectedOption: null,
              hasAnswered: false,
              answeredAt: null,
              responseTimeMs: null,
              earnedBonusPoint: false,
              pointsEarnedThisQuestion: 0,
              isWinner: false,
              ws: ws,
            };
            newRoom.teams.set(hostTeamId, hostTeam);
            attachedTeamId = hostTeamId;

            rooms.set(code, newRoom);
            attachedRoomCode = code;
            isHost = true;

            ws.send(JSON.stringify({ type: 'ROOM_CREATED', code, hostTeamId }));
            broadcastRoomState(newRoom);
            break;
          }

          case 'JOIN_HOST': {
            const code = (msg.code || '').toUpperCase();
            const room = rooms.get(code);
            if (!room) {
              ws.send(JSON.stringify({ type: 'ERROR', message: 'Místnost nenalezena.' }));
              return;
            }
            room.hostWs = ws;
            attachedRoomCode = code;
            isHost = true;
            broadcastRoomState(room);
            break;
          }

          case 'JOIN_TEAM': {
            const code = (msg.code || '').toUpperCase();
            const room = rooms.get(code);
            if (!room) {
              ws.send(JSON.stringify({ type: 'ERROR', message: 'Místnost s tímto kódem neexistuje.' }));
              return;
            }

            if (room.status !== 'LOBBY') {
              // Pokud je hra už rozehraná, zkontrolujeme, zda se tým jen znovu připojuje
              const existingTeam = Array.from(room.teams.values()).find(
                (t) => t.name.toLowerCase() === (msg.teamName || '').toLowerCase().trim()
              );
              if (existingTeam) {
                existingTeam.ws = ws;
                attachedRoomCode = code;
                attachedTeamId = existingTeam.id;
                broadcastRoomState(room);
                return;
              } else {
                ws.send(JSON.stringify({ type: 'ERROR', message: 'Hra již byla zahájena.' }));
                return;
              }
            }

            // Omezení 2 až 10 týmů
            if (room.teams.size >= 10) {
              ws.send(JSON.stringify({ type: 'ERROR', message: 'Místnost dosáhla maximální kapacity 10 týmů.' }));
              return;
            }

            const teamName = (msg.teamName || '').trim() || `Tým ${room.teams.size + 1}`;
            // 1 až 10 členů
            let members: string[] = Array.isArray(msg.members) ? msg.members : [];
            members = members.map((m) => String(m).trim()).filter(Boolean);
            if (members.length === 0) {
              members = ['Kapitán'];
            }
            if (members.length > 10) {
              members = members.slice(0, 10);
            }

            const teamId = `team-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            const tableNumber = room.teams.size + 1;

            const newTeam: TeamSession = {
              id: teamId,
              name: teamName,
              members,
              tableNumber,
              score: 0,
              selectedOption: null,
              hasAnswered: false,
              answeredAt: null,
              responseTimeMs: null,
              earnedBonusPoint: false,
              pointsEarnedThisQuestion: 0,
              isWinner: false,
              ws,
            };

            room.teams.set(teamId, newTeam);
            attachedRoomCode = code;
            attachedTeamId = teamId;

            ws.send(JSON.stringify({ type: 'TEAM_JOINED', teamId, tableNumber }));
            broadcastRoomState(room);
            break;
          }

          case 'UPDATE_TEAM': {
            if (!attachedRoomCode || !attachedTeamId) return;
            const room = rooms.get(attachedRoomCode);
            if (!room) return;
            const team = room.teams.get(attachedTeamId);
            if (!team) return;

            if (msg.teamName) team.name = String(msg.teamName).trim();
            if (Array.isArray(msg.members)) {
              team.members = msg.members.map((m: any) => String(m).trim()).filter(Boolean).slice(0, 10);
            }
            broadcastRoomState(room);
            break;
          }

          case 'START_GAME': {
            const code = attachedRoomCode || (msg.code || '').toUpperCase();
            const room = rooms.get(code);
            if (!room) return;

            if (room.teams.size < 1) {
              ws.send(JSON.stringify({ type: 'ERROR', message: 'Do hry se musí připojit alespoň 1 tým.' }));
              return;
            }

            // Společný start kvízu s odpočtem 3, 2, 1
            room.status = 'STARTING';
            room.startCountdown = 3;
            broadcastRoomState(room);

            const startInterval = setInterval(() => {
              room.startCountdown -= 1;
              if (room.startCountdown <= 0) {
                clearInterval(startInterval);
                start20sQuestionTimer(room);
              } else {
                broadcastRoomState(room);
              }
            }, 1000);
            break;
          }

          case 'SUBMIT_ANSWER': {
            const code = attachedRoomCode || (msg.code || '').toUpperCase();
            if (!code) return;
            const room = rooms.get(code);
            if (!room || room.status !== 'QUESTION') return;

            let teamId = attachedTeamId || msg.teamId;
            // Pokud hostitel odpovídá a nemá teamId, použijeme první tým
            if (!teamId && isHost && room.teams.size > 0) {
              teamId = room.teams.keys().next().value;
            }
            if (!teamId) return;

            const team = room.teams.get(teamId);
            if (!team) return;

            const now = Date.now();
            team.selectedOption = Number(msg.optionIndex);
            team.hasAnswered = true;
            if (!team.answeredAt) {
              team.answeredAt = now;
              team.responseTimeMs = Math.max(80, now - (room.questionStartTime || now));
            }

            // Zadání: "U každé otázky počkat až odpoví všichni hráči"
            const teamsArr = Array.from(room.teams.values());
            const allAnswered = teamsArr.length > 0 && teamsArr.every(
              (t) => t.hasAnswered && t.selectedOption !== null && t.selectedOption !== undefined
            );

            if (allAnswered) {
              // Všichni hráči již odpověděli -> okamžitě vyhodnotit a předat bonusový bod nejrychlejšímu
              revealQuestionAnswer(room);
            } else {
              broadcastRoomState(room);
            }
            break;
          }

          case 'NEXT_QUESTION': {
            const code = attachedRoomCode || (msg.code || '').toUpperCase();
            const room = rooms.get(code);
            if (!room) return;

            const questionsInCurrentRound = room.rounds[room.currentRoundIndex]?.questions || [];
            if (room.currentQuestionIndex < questionsInCurrentRound.length - 1) {
              room.currentQuestionIndex += 1;
              start20sQuestionTimer(room);
            } else if (room.currentRoundIndex < room.rounds.length - 1) {
              room.currentRoundIndex += 1;
              room.currentQuestionIndex = 0;
              start20sQuestionTimer(room);
            } else {
              // Konec všech kol -> Vyhlášení vítězů
              finishGameAndAnnounceWinners(room);
            }
            break;
          }

          case 'REVEAL_NOW': {
            const code = attachedRoomCode || (msg.code || '').toUpperCase();
            const room = rooms.get(code);
            if (!room) return;
            revealQuestionAnswer(room);
            break;
          }

          case 'RESTART_ROOM': {
            const code = attachedRoomCode || (msg.code || '').toUpperCase();
            const room = rooms.get(code);
            if (!room) return;

            stopRoomTimer(room);
            room.status = 'LOBBY';
            room.currentRoundIndex = 0;
            room.currentQuestionIndex = 0;
            room.timerSeconds = 20;
            room.fastestCorrectTeam = null;
            // Při každém novém kvízu nové náhodné otázky a promíchané možnosti
            room.rounds = generateRandomQuizRounds({ roundsCount: 5, questionsPerRound: 5, shuffleOptions: true });
            room.teams.forEach((t) => {
              t.score = 0;
              t.selectedOption = null;
              t.hasAnswered = false;
              t.answeredAt = null;
              t.responseTimeMs = null;
              t.earnedBonusPoint = false;
              t.pointsEarnedThisQuestion = 0;
              t.isWinner = false;
            });
            broadcastRoomState(room);
            break;
          }

          case 'RESHUFFLE_QUESTIONS': {
            const code = attachedRoomCode || (msg.code || '').toUpperCase();
            const room = rooms.get(code);
            if (!room || room.status !== 'LOBBY') return;
            // Kvízmistr si může přímo v lobby vylosovat novou sadu otázek
            room.rounds = generateRandomQuizRounds({ roundsCount: 5, questionsPerRound: 5, shuffleOptions: true });
            broadcastRoomState(room);
            break;
          }
        }
      } catch (err) {
        console.error('Chyba zpracování WebSocket zprávy:', err);
      }
    });

    ws.on('close', () => {
      if (attachedRoomCode) {
        const room = rooms.get(attachedRoomCode);
        if (room) {
          if (isHost && room.hostWs === ws) {
            room.hostWs = null;
          }
          if (attachedTeamId) {
            const team = room.teams.get(attachedTeamId);
            if (team && team.ws === ws) {
              team.ws = null;
            }
          }
          broadcastRoomState(room);
        }
      }
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: {
          server: httpServer,
        },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Hospodský kvíz server + WebSockets naslouchá na portu ${PORT}`);
  });
}

startServer();
