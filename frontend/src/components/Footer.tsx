import React from 'react';
import { Link } from 'react-router-dom';
import { Trophy, ShieldCheck, Heart, Mail, Phone, MapPin } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 border-t border-slate-800 text-slate-400 py-12 px-4 sm:px-6 lg:px-8 mt-20">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        {/* Col 1 */}
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-slate-950 fill-current" />
            </div>
            <span className="font-heading font-black text-xl text-white">CricValley</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            The premier Cricket Tournament Management System. Organizers manage tournaments, teams, players, and match winners, while fans follow ongoing matches and points tables.
          </p>
        </div>

        {/* Col 2 */}
        <div>
          <h4 className="font-heading font-bold text-white text-xs uppercase tracking-wider mb-3">Quick Navigation</h4>
          <ul className="space-y-2 text-xs">
            <li><Link to="/tournaments" className="hover:text-emerald-400 transition-colors">Tournaments</Link></li>
            <li><Link to="/teams" className="hover:text-emerald-400 transition-colors">Participating Teams</Link></li>
            <li><Link to="/players" className="hover:text-emerald-400 transition-colors">Player Profiles</Link></li>
            <li><Link to="/matches" className="hover:text-emerald-400 transition-colors">Fixtures & Scores</Link></li>
          </ul>
        </div>

        {/* Col 3 */}
        <div>
          <h4 className="font-heading font-bold text-white text-xs uppercase tracking-wider mb-3">Key Features</h4>
          <ul className="space-y-2 text-xs">
            <li className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Ongoing Matches View</li>
            <li className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Automated NRR Points Table</li>
            <li className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Direct Winner Declaration</li>
            <li className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Data Grid Bulk Add Imports</li>
          </ul>
        </div>

        {/* Col 4 */}
        <div>
          <h4 className="font-heading font-bold text-white text-xs uppercase tracking-wider mb-3">Contact Support</h4>
          <ul className="space-y-2 text-xs">
            <li className="flex items-center gap-2"><MapPin className="w-4 h-4 text-emerald-400" /> Cricket Stadium Complex, Valley</li>
            <li className="flex items-center gap-2"><Mail className="w-4 h-4 text-emerald-400" /> support@cricvalley.com</li>
            <li className="flex items-center gap-2"><Phone className="w-4 h-4 text-emerald-400" /> +1 (555) 019-2834</li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto border-t border-slate-900 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
        <div>
          © {new Date().getFullYear()} CricValley Tournament System. All rights reserved.
        </div>
        <div className="flex items-center gap-1">
          Crafted with <Heart className="w-3.5 h-3.5 text-red-500 fill-current" /> for Cricket Community
        </div>
      </div>
    </footer>
  );
};
