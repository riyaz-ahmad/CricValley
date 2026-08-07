import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Calendar, Shield, Users, ArrowRight, Activity, CheckCircle2, Zap, Sparkles, Award, Star } from 'lucide-react';
import { Tournament, Match, Player } from '../types';
import { apiRequest } from '../services/api';

export const HomePage: React.FC = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tRes, mRes, pRes] = await Promise.all([
          apiRequest<Tournament[]>('/tournaments'),
          apiRequest<Match[]>('/matches'),
          apiRequest<Player[]>('/players'),
        ]);
        setTournaments(tRes);
        setMatches(mRes);
        setPlayers(pRes);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const ongoingMatches = matches.filter((m) => m.status === 'LIVE');
  const finishedMatches = matches.filter((m) => m.status === 'COMPLETED');
  const upcomingMatches = matches.filter((m) => m.status === 'UPCOMING');

  const getStageTag = (stage: string) => {
    switch (stage) {
      case 'FINAL':
        return { label: '🔥 FINAL', bg: 'bg-gradient-to-r from-amber-600 to-orange-600 text-white font-black' };
      case 'SEMI_FINAL':
        return { label: '⚡ SEMI-FINAL', bg: 'bg-purple-950 text-purple-300 border border-purple-700 font-extrabold' };
      case 'QUARTER_FINAL':
        return { label: '🎯 QUARTER-FINAL', bg: 'bg-cyan-950 text-cyan-300 border border-cyan-700 font-bold' };
      default:
        return { label: 'GROUP STAGE', bg: 'bg-slate-800 text-slate-300 font-semibold' };
    }
  };

  return (
    <div className="space-y-12 max-w-7xl mx-auto">
      {/* Hero Section - CricValley */}
      <section className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-slate-950 via-emerald-950 to-slate-950 border border-emerald-800/40 p-8 sm:p-12 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -z-0"></div>
        
        <div className="max-w-3xl space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-xs font-extrabold uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-emerald-400" /> Welcome to CricValley Portal
          </div>

          <h1 className="text-4xl sm:text-6xl font-heading font-black text-white leading-tight">
            Cricket Championship <br />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              Scores, Fixtures & Stars
            </span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Follow ongoing cricket matches, knockout tags (Semi-Finals & Finals), Man of the Match awards, and public player statistics.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              to="/matches"
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs shadow-xl shadow-emerald-500/25 flex items-center gap-2 transition-all transform hover:-translate-y-0.5"
            >
              <Calendar className="w-4 h-4" /> View All Matches & Scores
            </Link>
            <Link
              to="/players"
              className="px-6 py-3.5 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-200 hover:text-white font-bold text-xs flex items-center gap-2 transition-all"
            >
              <Users className="w-4 h-4 text-cyan-400" /> Browse Players Directory <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* MAN OF THE TOURNAMENT / MVP SPOTLIGHT */}
      <section className="bg-gradient-to-r from-amber-950/60 via-slate-900 to-slate-900 border border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-500/20 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-amber-400 text-xs font-black uppercase tracking-widest">
              <Award className="w-4 h-4" /> Season Honor Spotlight
            </div>
            <h2 className="text-2xl font-heading font-black text-white">Man of the Tournament (MVP)</h2>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-300 bg-amber-950/80 border border-amber-500/40 px-3 py-1.5 rounded-xl">
            <Star className="w-4 h-4 fill-current text-amber-400" /> Leading Performer Award
          </div>
        </div>

        {players.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* MVP Card */}
            <div className="bg-slate-950/80 border border-amber-500/50 p-5 rounded-2xl flex items-center gap-4 shadow-xl">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-slate-950 font-black text-2xl shadow-lg shadow-amber-500/20">
                #18
              </div>
              <div>
                <div className="text-xs text-amber-400 font-extrabold uppercase tracking-wider">Tournament MVP</div>
                <div className="text-lg font-heading font-black text-white">{players[0]?.name || 'Virat Kohli'}</div>
                <div className="text-xs text-slate-400 font-medium">{players[0]?.team?.name || 'Mumbai Strikers'}</div>
                <div className="mt-2 text-[11px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded inline-block">
                  340 Runs • 8 Wickets
                </div>
              </div>
            </div>

            {/* MVP Card 2 */}
            {players[1] && (
              <div className="bg-slate-950/80 border border-slate-800 p-5 rounded-2xl flex items-center gap-4 shadow-xl">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-500 flex items-center justify-center text-slate-950 font-black text-2xl shadow-lg">
                  #{players[1].jerseyNumber || 45}
                </div>
                <div>
                  <div className="text-xs text-cyan-400 font-extrabold uppercase tracking-wider">Top Batsman</div>
                  <div className="text-lg font-heading font-black text-white">{players[1].name}</div>
                  <div className="text-xs text-slate-400 font-medium">{players[1].team?.name || 'Bangalore Express'}</div>
                  <div className="mt-2 text-[11px] font-bold text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded inline-block">
                    295 Runs • Avg 59.0
                  </div>
                </div>
              </div>
            )}

            {/* MVP Card 3 */}
            {players[2] && (
              <div className="bg-slate-950/80 border border-slate-800 p-5 rounded-2xl flex items-center gap-4 shadow-xl">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-slate-950 font-black text-2xl shadow-lg">
                  #{players[2].jerseyNumber || 93}
                </div>
                <div>
                  <div className="text-xs text-emerald-400 font-extrabold uppercase tracking-wider">Top Bowler</div>
                  <div className="text-lg font-heading font-black text-white">{players[2].name}</div>
                  <div className="text-xs text-slate-400 font-medium">{players[2].team?.name || 'Chennai Super Kings'}</div>
                  <div className="mt-2 text-[11px] font-bold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded inline-block">
                    12 Wickets • Econ 6.2
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Ongoing Matches */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-heading font-extrabold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-amber-400 animate-pulse" /> Ongoing Matches
          </h2>
          <Link to="/matches" className="text-xs text-emerald-400 hover:underline font-bold flex items-center gap-1">
            See All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {ongoingMatches.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-xs text-slate-400">
            No matches currently ongoing. Check finished match results below!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {ongoingMatches.map((m) => {
              const inn1 = m.innings?.find((i) => i.inningNumber === 1);
              const inn2 = m.innings?.find((i) => i.inningNumber === 2);
              const tag = getStageTag(m.stage);
              return (
                <div key={m.id} className="bg-slate-900 border border-amber-500/40 rounded-2xl p-6 space-y-4 shadow-xl hover:border-amber-400 transition-all">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] uppercase ${tag.bg}`}>
                        {tag.label}
                      </span>
                      <span className="text-slate-400 font-semibold">{m.tournament?.title}</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500 text-slate-950 animate-pulse">
                      ONGOING
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="font-bold text-white text-sm">{m.homeTeam.name}</span>
                      <span className="font-mono font-bold text-emerald-400 text-sm">
                        {inn1 ? `${inn1.totalRuns}/${inn1.wickets} (${inn1.overs} ov)` : '-'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="font-bold text-white text-sm">{m.awayTeam.name}</span>
                      <span className="font-mono font-bold text-emerald-400 text-sm">
                        {inn2 ? `${inn2.totalRuns}/${inn2.wickets} (${inn2.overs} ov)` : '-'}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-400 flex items-center justify-between pt-1">
                    <span>Venue: {m.venue || 'Stadium'}</span>
                    <Link to={`/matches/${m.id}`} className="text-emerald-400 font-bold hover:underline">
                      Match Details →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Finished Match Results with Man of the Match Badges */}
      <section className="space-y-4">
        <h2 className="text-xl font-heading font-extrabold text-white flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Recent Results & Man of the Match Winners
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {finishedMatches.slice(0, 4).map((m) => {
            const inn1 = m.innings?.find((i) => i.inningNumber === 1);
            const inn2 = m.innings?.find((i) => i.inningNumber === 2);
            const tag = getStageTag(m.stage);
            return (
              <div key={m.id} className="bg-slate-900 border border-slate-800 hover:border-emerald-500/40 rounded-2xl p-6 space-y-4 shadow-xl transition-all">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded text-[10px] uppercase ${tag.bg}`}>
                      {tag.label}
                    </span>
                    <span className="text-slate-400 font-semibold">{m.tournament?.title}</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-950 text-emerald-400 border border-emerald-800">
                    FINISHED
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="font-bold text-white text-sm">{m.homeTeam.name}</span>
                    <span className="font-mono font-bold text-slate-200 text-sm">
                      {inn1 ? `${inn1.totalRuns}/${inn1.wickets} (${inn1.overs} ov)` : '-'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="font-bold text-white text-sm">{m.awayTeam.name}</span>
                    <span className="font-mono font-bold text-slate-200 text-sm">
                      {inn2 ? `${inn2.totalRuns}/${inn2.wickets} (${inn2.overs} ov)` : '-'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  {m.resultSummary && (
                    <div className="p-2.5 bg-amber-950/60 border border-amber-800/40 rounded-xl text-center text-xs font-bold text-amber-300">
                      🏆 {m.resultSummary}
                    </div>
                  )}

                  {m.playerOfTheMatch && (
                    <div className="p-2 bg-emerald-950/80 border border-emerald-800/50 rounded-xl text-center text-xs font-bold text-emerald-400 flex items-center justify-center gap-1.5">
                      <Award className="w-4 h-4 text-emerald-400" /> Man of the Match: {m.playerOfTheMatch.name}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
