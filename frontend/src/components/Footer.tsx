import React from 'react';
import { Trophy, Mail, Phone } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 border-t border-slate-800 text-slate-400 py-10 px-4 sm:px-6 lg:px-8 mt-20">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-8">
        {/* Brand Info */}
        <div className="space-y-3 max-w-md">
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

        {/* Contact Support Column */}
        <div className="space-y-2">
          <h4 className="font-heading font-bold text-white text-xs uppercase tracking-wider mb-2">Contact Support</h4>
          <ul className="space-y-2 text-xs">
            <li className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-emerald-400" />
              <a href="mailto:riyazahmadganaie610@gmail.com" className="hover:text-white transition-colors">
                riyazahmadganaie610@gmail.com
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-emerald-400" />
              <a href="tel:7780807508" className="hover:text-white transition-colors">
                7780807508
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Copyright Line */}
      <div className="max-w-7xl mx-auto border-t border-slate-900 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
        <div>
          © {new Date().getFullYear()} CricValley Tournament System. All rights reserved. Made by Riyaz
        </div>
      </div>
    </footer>
  );
};
