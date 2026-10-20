import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { DistrictName, HP_DISTRICTS } from '../types';
import { HP_DISTRICT_METADATA } from '../data/districtMeta';
import { DISTRICT_AGGREGATE_STATISTICS } from '../data/hpData';

interface DistrictMapProps {
  selectedDistrict?: DistrictName | 'All';
  onSelectDistrict: (district: DistrictName | 'All') => void;
  caseCountByDistrict?: Record<string, number>;
}

export const DistrictMap: React.FC<DistrictMapProps> = ({
  selectedDistrict = 'All',
  onSelectDistrict,
  caseCountByDistrict = {},
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Center of Himachal Pradesh
    const hpCenter: [number, number] = [31.85, 77.15];

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: hpCenter,
        zoom: 7,
        minZoom: 6,
        maxZoom: 12,
        scrollWheelZoom: false,
      });

      // CartoDB Positron / OSM clean basemap
      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: 'abcd',
          maxZoom: 19,
        }
      ).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    const markersGroup = markersLayerRef.current;
    if (markersGroup) {
      markersGroup.clearLayers();

      // Render district circles & markers
      HP_DISTRICTS.forEach(districtName => {
        const meta = HP_DISTRICT_METADATA[districtName];
        if (!meta) return;

        const count = caseCountByDistrict[districtName] || DISTRICT_AGGREGATE_STATISTICS[districtName]?.totalOfficialCases || 0;
        const isSelected = selectedDistrict === districtName;

        // Size radius proportional to case count
        const radius = Math.max(14, Math.min(32, Math.sqrt(count) * 2.2));

        // Determine color based on dominant category
        const historical = DISTRICT_AGGREGATE_STATISTICS[districtName];
        let color = '#2563eb'; // blue
        if (historical?.topCategory?.includes('Charas')) color = '#16a34a'; // green for charas/cannabis
        else if (historical?.topCategory?.includes('Heroin')) color = '#dc2626'; // crimson for heroin/chitta
        else if (historical?.topCategory?.includes('Pharma')) color = '#d97706'; // amber for pharma
        else if (historical?.topCategory?.includes('Opium')) color = '#7c3aed'; // purple for opium

        const circle = L.circleMarker([meta.lat, meta.lng], {
          radius: isSelected ? radius + 5 : radius,
          fillColor: color,
          color: isSelected ? '#0f172a' : '#ffffff',
          weight: isSelected ? 3 : 1.5,
          opacity: 1,
          fillOpacity: isSelected ? 0.85 : 0.65,
        });

        // Popup content with administrative and seizure statistics
        const popupContent = `
          <div style="font-family: 'Plus Jakarta Sans', sans-serif; padding: 4px; min-width: 200px;">
            <div style="font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 2px;">
              ${districtName} District
            </div>
            <div style="font-size: 11px; color: #64748b; margin-bottom: 8px;">
              HQ: ${meta.headquarters} · Pop: ~${meta.populationApprox.toLocaleString()}
            </div>
            <div style="font-size: 12px; margin-bottom: 4px; color: #1e293b;">
              <strong>Total Official Cases:</strong> <span style="font-family: monospace; font-weight: 600;">${count}</span>
            </div>
            <div style="font-size: 12px; margin-bottom: 4px; color: #1e293b;">
              <strong>Primary Seizure:</strong> ${historical?.topCategory || 'Varied'}
            </div>
            <div style="font-size: 11px; color: #475569; margin-top: 6px; border-top: 1px solid #e2e8f0; padding-top: 6px;">
              <strong>Key Transit:</strong> ${meta.keyTransitCorridors[0]}
            </div>
            <button id="btn-select-${districtName}" style="margin-top: 8px; width: 100%; background: #0f172a; color: white; border: none; border-radius: 4px; padding: 4px 8px; font-size: 11px; font-weight: 600; cursor: pointer;">
              ${isSelected ? 'Deselect District' : 'Filter by this District'}
            </button>
          </div>
        `;

        circle.bindPopup(popupContent);

        circle.on('click', () => {
          onSelectDistrict(isSelected ? 'All' : districtName);
        });

        circle.addTo(markersGroup);
      });
    }

    return () => {
      // Keep map alive or clean up on unmount
    };
  }, [selectedDistrict, caseCountByDistrict, onSelectDistrict]);

  return (
    <div className="relative w-full h-[440px] rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
      <div ref={mapContainerRef} className="w-full h-full" />
      
      {/* Map Legend Overlay */}
      <div className="absolute bottom-3 left-3 z-[25] bg-white/95 backdrop-blur-sm border border-slate-200 rounded p-2.5 text-[11px] shadow-sm pointer-events-auto">
        <div className="font-semibold text-slate-800 mb-1.5">Dominant Seizure Profile</div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block" />
            <span>Heroin / Chitta</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
            <span>Charas / Resin</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-600 inline-block" />
            <span>Synthetic Pharma</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block" />
            <span>Opium / Poppy</span>
          </div>
        </div>
        <div className="mt-2 pt-1.5 border-t border-slate-200 text-[10px] text-slate-500">
          Circle size proportional to historical case count. Click marker to filter.
        </div>
      </div>

      {selectedDistrict !== 'All' && (
        <div className="absolute top-3 right-3 z-[25] bg-white/95 backdrop-blur-sm border border-slate-300 rounded px-3 py-1.5 text-xs font-medium text-slate-800 shadow-sm flex items-center gap-2">
          <span>Filtering by: <strong>{selectedDistrict}</strong></span>
          <button
            onClick={() => onSelectDistrict('All')}
            className="text-blue-600 hover:text-blue-800 font-semibold underline text-[11px]"
          >
            Reset
          </button>
        </div>
      )}
    </div>
  );
};
