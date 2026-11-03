import React, { useState, useMemo } from 'react';
import { QuizRound, TeamScore } from '../types/quiz';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { TrendingUp, BarChart2, Users, Award, Zap, HelpCircle } from 'lucide-react';

// Pečlivě zvolená paleta 10 barev s vysokým kontrastem na tmavém podkladu
export const TEAM_COLORS = [
  '#f59e0b', // Jantarově zlatá (Štamgasti)
  '#10b981', // Smaragdově zelená
  '#38bdf8', // Jasně azurová
  '#f43f5e', // Malinová / rubínová
  '#a855f7', // Fialová
  '#fb923c', // Pomerančová
  '#2dd4bf', // Tyrkysová
  '#ec4899', // Růžová
  '#eab308', // Citrónově žlutá
  '#a3e635', // Limetková
];

interface ScoreProgressionChartProps {
  rounds: QuizRound[];
  teams: TeamScore[];
  currentRoundId?: string;
  isProjector?: boolean;
}

type ChartViewType = 'cumulative' | 'roundByRound';

export const ScoreProgressionChart: React.FC<ScoreProgressionChartProps> = ({
  rounds,
  teams,
  currentRoundId,
  isProjector = false,
}) => {
  const [viewType, setViewType] = useState<ChartViewType>('cumulative');
  const [highlightedTeamId, setHighlightedTeamId] = useState<string | null>(null);

  // Příprava dat pro graf
  const { chartData, stats } = useMemo(() => {
    if (!teams || teams.length === 0 || !rounds || rounds.length === 0) {
      return { chartData: [], stats: null };
    }

    // Pro kumulativní graf začínáme na Startu (Kolo 0) se všemi 0 body
    const cumulativeRunningScores: Record<string, number> = {};
    teams.forEach((t) => {
      cumulativeRunningScores[t.id] = 0;
    });

    const data: Array<Record<string, any>> = [];

    // Počáteční stav
    if (viewType === 'cumulative') {
      const startEntry: Record<string, any> = {
        name: 'Start',
        roundLabel: 'Začátek kvízu',
        shortName: 'Start',
      };
      teams.forEach((t) => {
        startEntry[t.name] = 0;
      });
      data.push(startEntry);
    }

    let maxSingleRoundScore = 0;
    let bestRoundTeam = '';
    let bestRoundTitle = '';

    // Procházíme jednotlivá kola
    rounds.forEach((round, index) => {
      const entry: Record<string, any> = {
        name: `${index + 1}. kolo`,
        shortName: `K${index + 1}`,
        roundLabel: round.title,
        roundNumber: index + 1,
        isCurrent: round.id === currentRoundId,
      };

      teams.forEach((t) => {
        const roundScore = t.roundScores?.[round.id] || 0;
        cumulativeRunningScores[t.id] += roundScore;

        if (roundScore > maxSingleRoundScore) {
          maxSingleRoundScore = roundScore;
          bestRoundTeam = t.name;
          bestRoundTitle = `${index + 1}. kolo (${round.title})`;
        }

        entry[t.name] = viewType === 'cumulative'
          ? cumulativeRunningScores[t.id]
          : roundScore;
      });

      data.push(entry);
    });

    // Výpočet vedoucího týmu
    const leader = [...teams].sort((a, b) => b.totalScore - a.totalScore)[0];

    return {
      chartData: data,
      stats: {
        leader,
        maxSingleRoundScore,
        bestRoundTeam,
        bestRoundTitle,
      },
    };
  }, [rounds, teams, viewType, currentRoundId]);

  if (!teams || teams.length === 0) {
    return (
      <div className="bg-[#18110b] border border-amber-900/50 rounded-2xl p-6 text-center text-stone-400">
        <Users className="w-8 h-8 text-amber-500/60 mx-auto mb-2" />
        <p className="text-sm font-medium">Zatím nebyly přidány žádné týmy pro zobrazení grafu.</p>
        <p className="text-xs text-stone-500 mt-1">Přidejte týmy v moderátorském pultu pro sledování vývoje skóre.</p>
      </div>
    );
  }

  // Vlastní tooltip pro Recharts v hospodském stylu
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const roundData = chartData.find((d) => d.name === label);
    const roundTitle = roundData?.roundLabel || label;

    // Seřadíme data podle hodnoty sestupně pro tooltip
    const sortedPayload = [...payload].sort((a, b) => (b.value || 0) - (a.value || 0));

    return (
      <div className="bg-[#120d09] border border-amber-800/80 rounded-xl p-3.5 shadow-2xl backdrop-blur-md text-stone-100 min-w-[200px] z-50">
        <div className="border-b border-amber-900/60 pb-2 mb-2">
          <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider font-mono">
            {label}
          </div>
          <div className="text-sm font-serif font-bold text-stone-200 truncate">
            {roundTitle}
          </div>
        </div>

        <div className="space-y-1.5">
          {sortedPayload.map((item: any, i: number) => {
            const isHighlighted = highlightedTeamId ? item.name === highlightedTeamId : true;
            return (
              <div
                key={i}
                className={`flex items-center justify-between gap-4 text-xs ${
                  isHighlighted ? 'opacity-100' : 'opacity-40'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="font-medium text-stone-300 truncate">
                    {item.name}
                  </span>
                </div>
                <span className="font-mono font-bold text-amber-200 tabular-nums shrink-0">
                  {item.value} b.
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className={`bg-[#18110b] border border-amber-900/50 rounded-2xl shadow-xl flex flex-col ${
      isProjector ? 'p-6 bg-[#121915] border-stone-700/60' : 'p-6'
    }`}>
      {/* Hlavička grafu s přepínačem pohledů */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-amber-950/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-950/80 border border-amber-700/50 flex items-center justify-center text-amber-400 shrink-0">
            {viewType === 'cumulative' ? (
              <TrendingUp className="w-5 h-5 text-amber-400" />
            ) : (
              <BarChart2 className="w-5 h-5 text-amber-400" />
            )}
          </div>
          <div>
            <h3 className="font-serif font-bold text-lg md:text-xl text-amber-100 flex items-center gap-2">
              <span>Vývoj skóre týmů</span>
              <span className="text-xs font-sans font-normal text-stone-400 hidden sm:inline">
                ({viewType === 'cumulative' ? 'celkový součet po kolech' : 'bodový zisk v jednotlivých kolech'})
              </span>
            </h3>
            <p className="text-xs text-stone-400">
              Přehledný graf posunu týmů v tabulce v průběhu hospodského kvízu
            </p>
          </div>
        </div>

        {/* Tlačítka pro přepnutí typu grafu */}
        <div className="flex items-center gap-1.5 p-1 bg-stone-900/90 border border-stone-800 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setViewType('cumulative')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              viewType === 'cumulative'
                ? 'bg-amber-600 text-stone-950 font-semibold shadow-sm'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Kumulativní</span>
          </button>
          <button
            onClick={() => setViewType('roundByRound')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              viewType === 'roundByRound'
                ? 'bg-amber-600 text-stone-950 font-semibold shadow-sm'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Za jednotlivá kola</span>
          </button>
        </div>
      </div>

      {/* Rychlé filtry týmů pro zvýraznění linky */}
      <div className="flex items-center gap-2 flex-wrap py-3 border-b border-amber-950/40 text-xs">
        <span className="text-stone-400 shrink-0 flex items-center gap-1">
          <Users className="w-3.5 h-3.5" />
          <span>Týmy:</span>
        </span>
        {teams.map((team, idx) => {
          const color = TEAM_COLORS[idx % TEAM_COLORS.length];
          const isSelected = highlightedTeamId === team.name;
          return (
            <button
              key={team.id}
              onClick={() => setHighlightedTeamId(isSelected ? null : team.name)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all text-xs ${
                isSelected
                  ? 'bg-stone-800 text-white font-bold ring-2 shadow-sm'
                  : highlightedTeamId
                  ? 'bg-stone-900/50 border-stone-800 text-stone-300 opacity-60'
                  : 'bg-stone-900/80 border-stone-800/80 text-stone-300 hover:text-white'
              }`}
              style={{
                borderColor: isSelected ? color : undefined,
                boxShadow: isSelected ? `0 0 10px ${color}33` : undefined,
              }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="truncate max-w-[120px]">{team.name}</span>
              <span className="font-mono tabular-nums text-stone-400 font-semibold">
                {team.totalScore}b
              </span>
            </button>
          );
        })}
        {highlightedTeamId && (
          <button
            onClick={() => setHighlightedTeamId(null)}
            className="text-amber-400 hover:text-amber-300 underline text-xs ml-auto"
          >
            Zobrazit všechny
          </button>
        )}
      </div>

      {/* Samotný graf Recharts */}
      <div className="w-full h-72 md:h-80 pt-4">
        <ResponsiveContainer width="100%" height="100%">
          {viewType === 'cumulative' ? (
            <LineChart
              data={chartData}
              margin={{ top: 12, right: 16, left: -16, bottom: 4 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(217, 119, 6, 0.12)"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                stroke="#a8a29e"
                tick={{ fill: '#d6d3d1', fontSize: 12 }}
                tickLine={false}
              />
              <YAxis
                stroke="#a8a29e"
                tick={{ fill: '#d6d3d1', fontSize: 12 }}
                tickLine={false}
                allowDecimals={false}
                className="font-mono tabular-nums"
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: 12 }}
                formatter={(value) => (
                  <span className="text-xs text-stone-300 font-medium">
                    {value}
                  </span>
                )}
              />

              {teams.map((team, idx) => {
                const color = TEAM_COLORS[idx % TEAM_COLORS.length];
                const isFaded = highlightedTeamId && highlightedTeamId !== team.name;
                const isSelected = highlightedTeamId === team.name;

                return (
                  <Line
                    key={team.id}
                    type="monotone"
                    dataKey={team.name}
                    stroke={color}
                    strokeWidth={isSelected ? 3.5 : isFaded ? 1 : 2.5}
                    strokeOpacity={isFaded ? 0.25 : 1}
                    dot={{
                      r: isSelected ? 5 : 3.5,
                      fill: color,
                      stroke: '#18110b',
                      strokeWidth: 1.5,
                    }}
                    activeDot={{
                      r: 7,
                      fill: color,
                      stroke: '#fff',
                      strokeWidth: 2,
                    }}
                    isAnimationActive={true}
                  />
                );
              })}
            </LineChart>
          ) : (
            <BarChart
              data={chartData}
              margin={{ top: 12, right: 16, left: -16, bottom: 4 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(217, 119, 6, 0.12)"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                stroke="#a8a29e"
                tick={{ fill: '#d6d3d1', fontSize: 12 }}
                tickLine={false}
              />
              <YAxis
                stroke="#a8a29e"
                tick={{ fill: '#d6d3d1', fontSize: 12 }}
                tickLine={false}
                allowDecimals={false}
                className="font-mono tabular-nums"
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: 12 }}
                formatter={(value) => (
                  <span className="text-xs text-stone-300 font-medium">
                    {value}
                  </span>
                )}
              />

              {teams.map((team, idx) => {
                const color = TEAM_COLORS[idx % TEAM_COLORS.length];
                const isFaded = highlightedTeamId && highlightedTeamId !== team.name;

                return (
                  <Bar
                    key={team.id}
                    dataKey={team.name}
                    fill={color}
                    fillOpacity={isFaded ? 0.25 : 0.9}
                    radius={[4, 4, 0, 0]}
                    isAnimationActive={true}
                  />
                );
              })}
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Rychlý pruh statistik podle Anti-slop pravidel (reálná data) */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-4 mt-2 border-t border-amber-950/60 text-xs">
          {stats.leader && (
            <div className="flex items-center gap-2.5 p-2.5 bg-stone-900/60 border border-stone-800/80 rounded-xl">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <Award className="w-4 h-4" />
              </div>
              <div className="truncate">
                <span className="text-stone-400 block text-[11px]">Aktuální lídr:</span>
                <span className="font-semibold text-amber-200 truncate block">
                  {stats.leader.name} ({stats.leader.totalScore} b.)
                </span>
              </div>
            </div>
          )}

          {stats.bestRoundTeam && stats.maxSingleRoundScore > 0 && (
            <div className="flex items-center gap-2.5 p-2.5 bg-stone-900/60 border border-stone-800/80 rounded-xl">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <div className="truncate">
                <span className="text-stone-400 block text-[11px]">Rekord jednoho kola:</span>
                <span className="font-semibold text-emerald-300 truncate block">
                  {stats.bestRoundTeam} ({stats.maxSingleRoundScore} b. v {stats.bestRoundTitle})
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2.5 p-2.5 bg-stone-900/60 border border-stone-800/80 rounded-xl sm:col-span-2 lg:col-span-1">
            <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div className="truncate">
              <span className="text-stone-400 block text-[11px]">Kola do konce:</span>
              <span className="font-semibold text-stone-200 truncate block">
                {rounds.length} {rounds.length === 1 ? 'kolo celkem' : 'kol celkem'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
