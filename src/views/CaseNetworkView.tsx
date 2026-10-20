import React, { useState, useMemo } from 'react';
import {
  Network,
  Info,
  Shield,
  Layers,
  CheckCircle,
  HelpCircle,
  Filter,
  Eye,
  Link2,
} from 'lucide-react';
import { DistrictName, HP_DISTRICTS, NetworkEdge, NetworkNode } from '../types';
import { INITIAL_NETWORK_EDGES, INITIAL_NETWORK_NODES } from '../data/hpData';
import { AppMode } from '../services/api';

interface CaseNetworkViewProps {
  appMode: AppMode;
}

export const CaseNetworkView: React.FC<CaseNetworkViewProps> = () => {
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictName | 'All'>('All');
  const [filterType, setFilterType] = useState<string>('All');
  const [onlyDocumented, setOnlyDocumented] = useState<boolean>(false);
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(INITIAL_NETWORK_NODES[0]);
  const [selectedEdge, setSelectedEdge] = useState<NetworkEdge | null>(null);

  // Filter edges and connected nodes
  const filteredEdges = useMemo(() => {
    return INITIAL_NETWORK_EDGES.filter(edge => {
      if (onlyDocumented && !edge.isDocumentedConnection) return false;
      if (filterType !== 'All' && edge.relationshipType !== filterType) return false;

      if (selectedDistrict !== 'All') {
        const sourceNode = INITIAL_NETWORK_NODES.find(n => n.id === edge.source);
        const targetNode = INITIAL_NETWORK_NODES.find(n => n.id === edge.target);
        const touches = sourceNode?.district === selectedDistrict || targetNode?.district === selectedDistrict;
        if (!touches) return false;
      }
      return true;
    });
  }, [selectedDistrict, filterType, onlyDocumented]);

  // Node position calculation for SVG rendering
  // Preset clean spatial layout for the 15 nodes
  const nodePositions: Record<string, { x: number; y: number }> = {
    'node-dist-solan': { x: 220, y: 340 },
    'node-dist-kullu': { x: 420, y: 160 },
    'node-dist-kangra': { x: 180, y: 160 },
    'node-dist-mandi': { x: 380, y: 260 },
    'node-dist-shimla': { x: 440, y: 360 },
    'node-dist-una': { x: 100, y: 260 },
    'node-dist-sirmaur': { x: 380, y: 440 },

    'node-corridor-nh3': { x: 460, y: 230 },
    'node-corridor-nh154': { x: 280, y: 200 },
    'node-corridor-nh105': { x: 140, y: 380 },
    'node-check-bajoura': { x: 390, y: 110 },
    'node-check-kandwal': { x: 130, y: 110 },

    'node-cat-charas': { x: 550, y: 140 },
    'node-cat-heroin': { x: 260, y: 80 },
    'node-cat-pharma': { x: 300, y: 440 },
  };

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'District':
        return '#1e3a8a'; // Deep blue
      case 'Transit Corridor':
        return '#0284c7'; // Sky
      case 'Checkpoint Hub':
        return '#d97706'; // Amber
      case 'Seizure Category':
        return '#059669'; // Emerald
      default:
        return '#475569';
    }
  };

  return (
    <div className="space-y-6">
      {/* Ethical Constitution Header & Disclaimer */}
      <div className="bg-slate-900 text-white rounded-lg p-5 shadow-xs border border-slate-800 space-y-2">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-400" />
          <h2 className="text-sm font-bold tracking-tight">
            Case Pattern and Transit Corridor Network Analysis
          </h2>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
          This module models lawful, public-domain relationships between documented administrative
          transit checkpoints, inter-district arterial routes, and verified seizure profiles in
          Himachal Pradesh.
        </p>
        <div className="pt-2 border-t border-slate-800 text-[11px] text-amber-300/90 font-medium">
          CRITICAL ETHICAL GOVERNANCE: Relationships represent physical infrastructure and documented
          procedural seizure bottlenecks. Network closeness must NEVER be used to infer criminal guilt,
          target vulnerable populations, or fabricate public suspect listings.
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span>Focus District:</span>
          </div>
          <select
            value={selectedDistrict}
            onChange={e => setSelectedDistrict(e.target.value as DistrictName | 'All')}
            className="bg-slate-50 border border-slate-200 text-xs text-slate-800 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
          >
            <option value="All">All Districts</option>
            {HP_DISTRICTS.map(d => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs text-slate-800 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
          >
            <option value="All">All Relationship Types</option>
            <option value="Documented Supply Corridor">Documented Supply Corridors</option>
            <option value="Inter-District Route">Inter-District Routes</option>
            <option value="Common Seizure Profile">Common Seizure Profiles</option>
            <option value="Statistical Correlation">Statistical Correlations Only</option>
          </select>

          <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none ml-2">
            <input
              type="checkbox"
              checked={onlyDocumented}
              onChange={e => setOnlyDocumented(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <span className="font-medium">Show only verified documented links</span>
          </label>
        </div>

        <div className="text-xs text-slate-500 font-mono">
          Showing {INITIAL_NETWORK_NODES.length} Nodes · {filteredEdges.length} Edges
        </div>
      </div>

      {/* Main Grid: Interactive Network Canvas + Inspection Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Network Graph Visualizer */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-lg p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-slate-800">
              Interactive Route & Intercept Topology
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-0.5 bg-blue-600 inline-block" /> Documented
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-0.5 border-t border-dashed border-slate-400 inline-block" />{' '}
                Statistical
              </span>
            </div>
          </div>

          <div className="relative w-full h-[520px] bg-slate-50 border border-slate-200 rounded-lg overflow-hidden">
            <svg className="w-full h-full" viewBox="0 0 680 500" preserveAspectRatio="xMidYMid meet">
              <defs>
                <marker
                  id="arrow-documented"
                  viewBox="0 0 10 10"
                  refX="18"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#3b82f6" />
                </marker>
              </defs>

              {/* Render Edges */}
              {filteredEdges.map(edge => {
                const sPos = nodePositions[edge.source];
                const tPos = nodePositions[edge.target];
                if (!sPos || !tPos) return null;

                const isEdgeSelected = selectedEdge?.id === edge.id;

                return (
                  <g key={edge.id} className="cursor-pointer" onClick={() => setSelectedEdge(edge)}>
                    <line
                      x1={sPos.x}
                      y1={sPos.y}
                      x2={tPos.x}
                      y2={tPos.y}
                      stroke={
                        isEdgeSelected
                          ? '#dc2626'
                          : edge.isDocumentedConnection
                          ? '#2563eb'
                          : '#94a3b8'
                      }
                      strokeWidth={isEdgeSelected ? 3.5 : Math.max(1.5, edge.weight * 0.35)}
                      strokeDasharray={edge.isDocumentedConnection ? 'none' : '4,4'}
                      strokeOpacity={isEdgeSelected ? 1 : 0.75}
                      className="hover:stroke-red-500 transition-colors"
                    />
                  </g>
                );
              })}

              {/* Render Nodes */}
              {INITIAL_NETWORK_NODES.map(node => {
                const pos = nodePositions[node.id];
                if (!pos) return null;

                const isNodeSelected = selectedNode?.id === node.id;
                const color = getNodeColor(node.type);

                return (
                  <g
                    key={node.id}
                    transform={`translate(${pos.x}, ${pos.y})`}
                    className="cursor-pointer select-none"
                    onClick={() => {
                      setSelectedNode(node);
                      setSelectedEdge(null);
                    }}
                  >
                    <circle
                      r={isNodeSelected ? node.size * 0.6 + 4 : node.size * 0.6}
                      fill={color}
                      stroke={isNodeSelected ? '#0f172a' : '#ffffff'}
                      strokeWidth={isNodeSelected ? 3 : 1.5}
                      className="transition-all hover:opacity-90"
                    />
                    <text
                      y={node.size * 0.6 + 13}
                      textAnchor="middle"
                      className="text-[10px] font-semibold fill-slate-800 pointer-events-none"
                    >
                      {node.label}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Canvas Legend */}
            <div className="absolute bottom-3 left-3 bg-white/95 border border-slate-200 rounded p-2 text-[10px] space-y-1 shadow-xs">
              <div className="font-semibold text-slate-800">Node Types:</div>
              <div className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-900 inline-block" /> District Hub
              </div>
              <div className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-600 inline-block" /> Transit Corridor
              </div>
              <div className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-600 inline-block" /> Checkpoint Hub
              </div>
              <div className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" /> Seizure Category
              </div>
            </div>
          </div>
        </div>

        {/* Inspection Panel (Source of Relationship Basis) */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-blue-600" />
              Evidence & Relationship Inspector
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Inspect the documented legal/administrative rationale behind linked records.
            </p>
          </div>

          {selectedEdge ? (
            /* Edge Detail */
            <div className="space-y-3">
              <div className="bg-blue-50 border border-blue-200 rounded p-3 text-xs">
                <span className="text-[10px] font-semibold text-blue-900 uppercase tracking-wide block mb-1">
                  Selected Relationship
                </span>
                <div className="font-bold text-slate-900 text-sm">{selectedEdge.relationshipType}</div>
                <div className="text-slate-600 mt-1">
                  <strong>Source:</strong> {selectedEdge.source.replace('node-', '')} →{' '}
                  <strong>Target:</strong> {selectedEdge.target.replace('node-', '')}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-800">
                  Documented Evidentiary Basis:
                </span>
                <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded border border-slate-200 leading-relaxed">
                  {selectedEdge.evidenceBasis}
                </p>
              </div>

              <div className="text-xs space-y-1">
                <span className="text-slate-500 block text-[11px]">Verification Standard</span>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                      selectedEdge.isDocumentedConnection
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {selectedEdge.isDocumentedConnection
                      ? 'Confirmed Documented Connection'
                      : 'Statistical Correlation / Co-Occurrence'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedEdge(null)}
                className="w-full text-center text-xs text-blue-600 hover:text-blue-800 font-medium underline pt-2"
              >
                Back to Node Inspection
              </button>
            </div>
          ) : selectedNode ? (
            /* Node Detail */
            <div className="space-y-3">
              <div className="bg-slate-50 border border-slate-200 rounded p-3 text-xs">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide block mb-1">
                  {selectedNode.type}
                </span>
                <div className="font-bold text-slate-900 text-base">{selectedNode.label}</div>
                {selectedNode.district && (
                  <div className="text-slate-600 mt-0.5">
                    District Jurisdiction: <strong>{selectedNode.district}</strong>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-800">Administrative Context:</span>
                <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded border border-slate-200 leading-relaxed">
                  {selectedNode.details}
                </p>
              </div>

              {/* Connected Edges List */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-xs font-semibold text-slate-800">
                  Connected Links ({filteredEdges.filter(e => e.source === selectedNode.id || e.target === selectedNode.id).length}):
                </span>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {filteredEdges
                    .filter(e => e.source === selectedNode.id || e.target === selectedNode.id)
                    .map(e => (
                      <button
                        key={e.id}
                        onClick={() => setSelectedEdge(e)}
                        className="w-full text-left text-xs p-2 rounded bg-slate-50 hover:bg-blue-50 border border-slate-200 text-slate-800 transition-colors flex items-center justify-between"
                      >
                        <span className="truncate">{e.relationshipType}</span>
                        <span className="text-[10px] text-blue-600 font-medium shrink-0 ml-2">
                          Inspect →
                        </span>
                      </button>
                    ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-400 py-8 text-center">
              Click any node or link in the topology to view documented relationships.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
