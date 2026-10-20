import React from 'react';
import { DEMO_DATASET_METADATA } from '../data/hpData';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 text-xs py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 border-b border-slate-800">
          <div>
            <h4 className="text-sm font-semibold text-white mb-2">DrugWatch HP System</h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              Himachal Pradesh Drug Trafficking Prevention and Analysis System. Built to support
              responsible anonymous incident reporting, verified case pattern analysis, and ethical
              district-level hotspot monitoring.
            </p>
            <div className="mt-3 text-[11px] text-amber-400/90 font-medium">
              Academic & Demonstration Project · Student Team
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-2">Data Governance & Legal Guardrails</h4>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li>· Citizen reports are strictly segregated from official police records.</li>
              <li>· Statistical hotspots are not proof of local community culpability.</li>
              <li>· No facial recognition, biometric indexing, or suspect listing is practiced.</li>
              <li>· Under NDPS Act 1985, quantities are categorized by statutory thresholds.</li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-2">Source Attribution & Limitations</h4>
            <p className="text-xs text-slate-400 mb-2">
              {DEMO_DATASET_METADATA.source}. Reporting period: {DEMO_DATASET_METADATA.reportingPeriod}.
            </p>
            <div className="text-[11px] text-slate-400 space-y-1">
              <div>Version 1.0.0 · GitHub Pages Compatible</div>
              <div className="text-slate-400">Emergency Dispatch: HP Police 112 · Nasha Mukt Helpline 1908</div>
            </div>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
          <div>
            © 2026 DrugWatch HP Project. Released under MIT License for academic and public-interest research.
          </div>
          <div className="flex items-center gap-4">
            <span>Anti-Narcotics Policy Research</span>
            <span>·</span>
            <span>Himachal Pradesh, India</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
