import React from 'react';
import {
  Shield,
  BookOpen,
  Scale,
  Server,
  Lock,
  AlertTriangle,
  Github,
  CheckCircle2,
  Terminal,
} from 'lucide-react';
import { DEMO_DATASET_METADATA } from '../data/hpData';

export const AboutView: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Hero Header */}
      <div className="bg-slate-900 text-white rounded-lg p-6 sm:p-8 shadow-xs border border-slate-800 space-y-3">
        <div className="w-10 h-10 rounded bg-blue-600 flex items-center justify-center text-white font-bold text-base shadow-inner">
          HP
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
          Himachal Pradesh Drug Trafficking Prevention and Analysis System
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
          DrugWatch HP is an open academic and public-interest engineering project built to demonstrate
          data-driven monitoring, privacy-preserving incident reporting, and responsible case pattern
          analysis for Himachal Pradesh, India.
        </p>
        <div className="pt-2 text-xs text-amber-300 font-mono">
          Student Demonstration Project · Antigravity Architecture · MIT License
        </div>
      </div>

      {/* Statutory NDPS Act Thresholds */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Scale className="w-5 h-5 text-blue-600" />
          <h2 className="text-sm font-bold text-slate-900">
            Statutory NDPS Act (1985) Seizure Thresholds
          </h2>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Under the Narcotic Drugs and Psychotropic Substances Act, 1985 (NDPS), legal penalties and bail
          provisions depend strictly on the quantified statutory tier (Small Quantity vs Commercial
          Quantity). DrugWatch HP classifies all seizure records using these official statutory bounds:
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-slate-200 rounded">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-2.5">Substance / Formulation</th>
                <th className="p-2.5">Small Quantity</th>
                <th className="p-2.5">Commercial Quantity</th>
                <th className="p-2.5">HP Context & Primary Corridors</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="p-2.5 font-medium text-slate-900">Charas (Cannabis Resin)</td>
                <td className="p-2.5 font-mono text-slate-700">&lt; 100 grams</td>
                <td className="p-2.5 font-mono font-semibold text-red-700">&gt; 1,000 grams (1 kg)</td>
                <td className="p-2.5 text-slate-600">Parvati Valley (Kullu), Chamba, Mandi</td>
              </tr>
              <tr>
                <td className="p-2.5 font-medium text-slate-900">Heroin / Chitta</td>
                <td className="p-2.5 font-mono text-slate-700">&lt; 5 grams</td>
                <td className="p-2.5 font-mono font-semibold text-red-700">&gt; 250 grams</td>
                <td className="p-2.5 text-slate-600">Nurpur (Kangra), Mehatpur (Una), Shimla bypass</td>
              </tr>
              <tr>
                <td className="p-2.5 font-medium text-slate-900">Opium / Poppy Straw</td>
                <td className="p-2.5 font-mono text-slate-700">&lt; 25 grams / 1 kg</td>
                <td className="p-2.5 font-mono font-semibold text-red-700">&gt; 2.5 kg / 50 kg</td>
                <td className="p-2.5 text-slate-600">Paonta Sahib (Sirmaur), Rohru (Shimla)</td>
              </tr>
              <tr>
                <td className="p-2.5 font-medium text-slate-900">Tramadol (Synthetic Opioid)</td>
                <td className="p-2.5 font-mono text-slate-700">&lt; 5 grams</td>
                <td className="p-2.5 font-mono font-semibold text-red-700">&gt; 250 grams</td>
                <td className="p-2.5 text-slate-600">Baddi-Barotiwala-Nalagarh (Solan Pharma Hub)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Ethical Constitution & Hard Bans */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Shield className="w-5 h-5 text-emerald-600" />
          <h2 className="text-sm font-bold text-slate-900">
            Ethical Constitution & Safety Guardrails
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-1">
            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Strict Non-Conversion of Citizen Reports
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              A citizen tip is an unverified allegation. It is never automatically converted into
              official police crime statistics or treated as proven fact.
            </p>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-1">
            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Anti-Biometric & Facial Identification Ban
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              DrugWatch HP strictly forbids facial recognition, biometric profiling, social media
              doxxing, or automated suspect generation.
            </p>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-1">
            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Aggregate District-Level Hotspots
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Predictions and anomalies are evaluated at the district jurisdiction level. Precise
              private residential coordinates are never predicted or exposed.
            </p>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-1">
            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Deterministic Anomaly Modeling
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Forecasts use deterministic exponential smoothing and time-split validation with Mean
              Absolute Error (MAE) reporting, rather than opaque black-box AI.
            </p>
          </div>
        </div>
      </div>

      {/* Technology & Deployment Architecture */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Server className="w-5 h-5 text-blue-600" />
          <h2 className="text-sm font-bold text-slate-900">
            Technology Architecture & Deployment Guide
          </h2>
        </div>

        <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
          <p>
            DrugWatch HP is engineered as a clean dual-runtime architecture. It can run in{' '}
            <strong>Demo Mode</strong> on <strong>GitHub Pages</strong> with zero backend required, or
            connect to a separately hosted <strong>Python FastAPI</strong> or full-stack Express
            service.
          </p>

          <div className="bg-slate-900 text-slate-200 p-4 rounded-lg font-mono text-xs space-y-2">
            <div className="text-slate-400 font-sans text-[11px] font-semibold">
              Windows Terminal / Linux Command Reference:
            </div>
            <div className="text-emerald-400"># 1. Run Frontend Dev Server (Port 3000):</div>
            <div>npm install</div>
            <div>npm run dev</div>
            <div className="pt-2 text-emerald-400"># 2. Run Standalone Python FastAPI Backend:</div>
            <div>cd backend</div>
            <div>pip install -r requirements.txt</div>
            <div>uvicorn main:app --reload --port 8000</div>
            <div className="pt-2 text-emerald-400"># 3. Run Backend Automated Test Suite:</div>
            <div>pytest tests/</div>
            <div className="pt-2 text-emerald-400"># 4. Build for GitHub Pages Deployment:</div>
            <div>npm run build</div>
          </div>
        </div>
      </div>
    </div>
  );
};
