import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  AlertOctagon,
  ShieldAlert,
  BarChart2,
  Info,
  Calendar,
  Layers,
  HelpCircle,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { DISTRICT_HOTSPOT_METRICS } from '../data/hpData';
import { DistrictHotspotAnalysis, DistrictName, HP_DISTRICTS } from '../types';
import { AppMode } from '../services/api';

interface HotspotAnalysisViewProps {
  appMode: AppMode;
}

export const HotspotAnalysisView: React.FC<HotspotAnalysisViewProps> = () => {
  const [rollingWindow, setRollingWindow] = useState<'3' | '6'>('3');
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictName | 'All'>('All');
  const [showOnlyElevated, setShowOnlyElevated] = useState<boolean>(false);

  // Filter metrics
  const displayedMetrics = useMemo(() => {
    return DISTRICT_HOTSPOT_METRICS.filter(item => {
      if (selectedDistrict !== 'All' && item.district !== selectedDistrict) return false;
      if (showOnlyElevated && item.activityLevel === 'Baseline') return false;
      return true;
    });
  }, [selectedDistrict, showOnlyElevated]);

  return (
    <div className="space-y-6">
      {/* Ethical Governance Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-5 shadow-xs space-y-2">
        <div className="flex items-center gap-2">
          <Info className="w-5 h-5 text-amber-700" />
          <h2 className="text-sm font-bold text-amber-950">
            District Hotspot Monitoring & Baseline Anomaly Modeling
          </h2>
        </div>
        <p className="text-xs text-amber-900 leading-relaxed">
          Hotspot scores represent statistically elevated case volumes relative to each district's
          own historical baseline. They reflect inter-state transit density, commercial checkpoints, and
          proactive police enforcement sweeps.
        </p>
        <div className="pt-2 border-t border-amber-200/60 text-[11px] text-amber-900/90 font-medium">
          CRITICAL SAFEGUARD: A statistical hotspot is NOT evidence of community-wide criminality and
          must never be used to target or rank individual citizens or neighborhoods. All results are
          district-level aggregates.
        </div>
      </div>

      {/* Model Specifications Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <span className="text-[11px] text-slate-500 font-medium">Observation Period</span>
          <div className="mt-1 font-mono text-sm font-bold text-slate-900">2021 – 2025</div>
          <div className="text-[10px] text-slate-500 mt-0.5">60 Monthly Observations / District</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <span className="text-[11px] text-slate-500 font-medium">Baseline Modeling</span>
          <div className="mt-1 font-mono text-sm font-bold text-slate-900">Z-Score & Exp Smoothing</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Alpha = 0.30 · Deterministic</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <span className="text-[11px] text-slate-500 font-medium">Time-Split Cross Validation</span>
          <div className="mt-1 font-mono text-sm font-bold text-slate-900">MAE: 1.4 Cases / Mo</div>
          <div className="text-[10px] text-slate-500 mt-0.5">2021-2024 Train · 2025 Test Split</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <span className="text-[11px] text-slate-500 font-medium">Evaluation Status</span>
          <div className="mt-1 font-mono text-sm font-bold text-amber-700">DEMO ONLY (Synthetic)</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Last Pipeline Run: 2025-12-31</div>
        </div>
      </div>

      {/* Control Toolbar */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-xs font-semibold text-slate-700">Filter District:</div>
          <select
            value={selectedDistrict}
            onChange={e => setSelectedDistrict(e.target.value as DistrictName | 'All')}
            className="bg-slate-50 border border-slate-200 text-xs text-slate-800 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
          >
            <option value="All">All 12 Districts</option>
            {HP_DISTRICTS.map(d => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1.5 ml-2">
            <span className="text-xs text-slate-600 font-medium">Rolling Window:</span>
            <div className="inline-flex rounded-md shadow-2xs">
              <button
                onClick={() => setRollingWindow('3')}
                className={`px-2.5 py-1 text-xs font-medium rounded-l transition-colors ${
                  rollingWindow === '3'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                3-Month
              </button>
              <button
                onClick={() => setRollingWindow('6')}
                className={`px-2.5 py-1 text-xs font-medium rounded-r transition-colors ${
                  rollingWindow === '6'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                6-Month
              </button>
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none ml-2">
            <input
              type="checkbox"
              checked={showOnlyElevated}
              onChange={e => setShowOnlyElevated(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <span className="font-medium">Show only Elevated activity districts</span>
          </label>
        </div>

        <div className="text-xs text-slate-500 font-mono">
          {displayedMetrics.length} of 12 Districts Displayed
        </div>
      </div>

      {/* Hotspot Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {displayedMetrics.map(item => {
          const isSmallSample = item.district === 'Kinnaur' || item.district === 'Lahaul and Spiti';

          return (
            <div
              key={item.district}
              className={`bg-white border rounded-lg p-5 shadow-xs flex flex-col justify-between space-y-4 ${
                item.activityLevel === 'Elevated'
                  ? 'border-red-300 ring-1 ring-red-100'
                  : item.activityLevel === 'Moderate'
                  ? 'border-amber-200'
                  : 'border-slate-200'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{item.district} District</h3>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Corridor: {item.dominantTransitCorridor}
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      item.activityLevel === 'Elevated'
                        ? 'bg-red-100 text-red-800'
                        : item.activityLevel === 'Moderate'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {item.activityLevel} Activity
                  </span>
                </div>

                {/* Key Numbers Grid */}
                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-medium">
                      Rolling Avg ({rollingWindow}M)
                    </span>
                    <span className="font-mono text-sm font-bold text-slate-800 tabular-nums">
                      {rollingWindow === '3' ? item.rolling3MonthAvg : item.rolling6MonthAvg} / mo
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-medium">
                      Recent Change
                    </span>
                    <span
                      className={`font-mono text-sm font-bold flex items-center tabular-nums ${
                        item.percentChange > 0
                          ? 'text-red-700'
                          : item.percentChange < 0
                          ? 'text-emerald-700'
                          : 'text-slate-700'
                      }`}
                    >
                      {item.percentChange > 0 ? (
                        <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                      ) : (
                        <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
                      )}
                      {item.percentChange > 0 ? `+${item.percentChange}%` : `${item.percentChange}%`}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-medium">
                      Anomaly Z-Score
                    </span>
                    <span
                      className={`font-mono text-sm font-bold tabular-nums ${
                        item.zScoreAnomaly >= 1.5 ? 'text-red-700' : 'text-slate-800'
                      }`}
                    >
                      {item.zScoreAnomaly > 0 ? `+${item.zScoreAnomaly}` : item.zScoreAnomaly}
                    </span>
                  </div>
                </div>

                {/* Predictive Risk Forecast Box */}
                <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">Deterministic Next-Month Estimate:</span>
                    {isSmallSample ? (
                      <span className="text-[10px] text-amber-700 font-medium">Low Sample Size</span>
                    ) : (
                      <span className="font-mono font-bold text-slate-900 tabular-nums">
                        ~{item.forecastNextMonthCases} Cases [{item.forecastLowerBound} – {item.forecastUpperBound}]
                      </span>
                    )}
                  </div>

                  {isSmallSample ? (
                    <p className="text-[11px] text-slate-500 leading-tight">
                      Predictive forecasting disabled due to low statistical baseline (&lt; 2
                      cases/month average). Historical monitoring only.
                    </p>
                  ) : (
                    <div className="text-[11px] text-slate-600 leading-tight">
                      {item.modelConfidenceNotes}
                    </div>
                  )}
                </div>
              </div>

              {/* Validation & Limitations Footer */}
              <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400 flex flex-col gap-0.5">
                <div>Primary Category: <strong className="text-slate-600">{item.primarySeizureCategory}</strong></div>
                <div>{item.evaluationMetric}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
