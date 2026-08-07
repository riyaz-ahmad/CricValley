import React from 'react';
import { Match } from '../types';
import { Trophy, Calendar } from 'lucide-react';

interface KnockoutBracketProps {
  matches: Match[];
}

export const KnockoutBracket: React.FC<KnockoutBracketProps> = ({ matches }) => {
  const qfMatches = matches.filter((m) => m.stage === 'QUARTER_FINAL');
  const sfMatches = matches.filter((m) => m.stage === 'SEMI_FINAL');
  const finalMatch = matches.find((m) => m.stage === 'FINAL');

  const renderMatchCard = (m?: Match, title?: string) => {
    if (!m) {
      return (
        <div className="bg-gray-900/40 border border-gray-800/60 rounded-xl p-3 w-56 text-center text-xs text-gray-500 italic">
          TBD ({title})
        </div>
      );
    }

    const isHomeWinner = m.winnerTeamId === m.homeTeamId;
    const isAwayWinner = m.winnerTeamId === m.awayTeamId;

    return (
      <div className="bg-gray-900 border border-gray-800 hover:border-cyan-500/50 rounded-xl p-3 w-60 shadow-lg transition-all space-y-2">
        <div className="flex items-center justify-between text-[10px] text-gray-400 border-b border-gray-800 pb-1.5 font-semibold">
          <span>Match #{m.matchNumber} • {m.stage.replace('_', ' ')}</span>
          <span className={`px-1.5 py-0.5 rounded ${m.status === 'LIVE' ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-gray-800 text-gray-300'}`}>
            {m.status}
          </span>
        </div>

        {/* Home Team */}
        <div className={`flex items-center justify-between p-1.5 rounded-lg ${isHomeWinner ? 'bg-cyan-950/60 font-bold border border-cyan-800/40' : 'bg-gray-800/40'}`}>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center font-bold text-xs text-cyan-400">
              {m.homeTeam.shortName}
            </span>
            <span className="text-xs text-white truncate max-w-[110px]">{m.homeTeam.name}</span>
          </div>
          {isHomeWinner && <Trophy className="w-3.5 h-3.5 text-amber-400" />}
        </div>

        {/* Away Team */}
        <div className={`flex items-center justify-between p-1.5 rounded-lg ${isAwayWinner ? 'bg-cyan-950/60 font-bold border border-cyan-800/40' : 'bg-gray-800/40'}`}>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center font-bold text-xs text-cyan-400">
              {m.awayTeam.shortName}
            </span>
            <span className="text-xs text-white truncate max-w-[110px]">{m.awayTeam.name}</span>
          </div>
          {isAwayWinner && <Trophy className="w-3.5 h-3.5 text-amber-400" />}
        </div>

        {m.resultSummary && (
          <div className="text-[10px] text-cyan-400 text-center font-medium pt-1 border-t border-gray-800/60">
            {m.resultSummary}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-gray-950/80 border border-gray-800 rounded-2xl p-6 overflow-x-auto">
      <h3 className="text-lg font-heading font-extrabold text-white mb-6 flex items-center gap-2">
        <Trophy className="w-5 h-5 text-amber-400" /> Tournament Visual Knockout Bracket
      </h3>

      <div className="min-w-[800px] flex items-center justify-between gap-8 py-4">
        {/* Semi Finals Column */}
        <div className="flex flex-col gap-12">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Semi Final 1</div>
          {renderMatchCard(sfMatches[0], 'Semi Final 1')}

          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Semi Final 2</div>
          {renderMatchCard(sfMatches[1], 'Semi Final 2')}
        </div>

        {/* Connector Lines */}
        <div className="flex flex-col justify-center gap-24 text-cyan-500/40 font-mono text-xl">
          ➔
        </div>

        {/* Final Column */}
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="text-xs font-bold text-amber-400 uppercase tracking-wider text-center flex items-center gap-1">
            <Trophy className="w-4 h-4" /> Championship Final
          </div>
          {renderMatchCard(finalMatch, 'Grand Final')}
        </div>
      </div>
    </div>
  );
};
