import React, { useState, useRef, useEffect } from 'react';
import { Search, X, MapPin } from 'lucide-react';
import { GeospatialDistrictPrediction } from '../../types';

interface DistrictSearchProps {
  districts: GeospatialDistrictPrediction[];
  selectedDistrictId: string | null;
  onSelectDistrict: (districtId: string | null) => void;
}

export const DistrictSearch: React.FC<DistrictSearchProps> = ({
  districts,
  selectedDistrictId,
  onSelectDistrict,
}) => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const selected = districts.find((d) => d.district === selectedDistrictId);
    if (selected && !open) {
      setQuery(selected.district_display_name);
    } else if (!selectedDistrictId && !open) {
      setQuery('');
    }
  }, [selectedDistrictId, districts, open]);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const filtered = districts.filter((d) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      d.district_display_name.toLowerCase().includes(q) ||
      d.district.toLowerCase().includes(q) ||
      d.region.toLowerCase().includes(q)
    );
  });

  const handleChoose = (districtId: string) => {
    const chosen = districts.find((d) => d.district === districtId);
    setQuery(chosen ? chosen.district_display_name : '');
    setOpen(false);
    onSelectDistrict(districtId);
  };

  const handleClear = () => {
    setQuery('');
    setOpen(false);
    onSelectDistrict(null);
  };

  return (
    <div ref={containerRef} className="relative w-full sm:w-64">
      <div className="relative flex items-center">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
        <input
          type="text"
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            if (!e.target.value.trim()) {
              onSelectDistrict(null);
            }
          }}
          placeholder="Search 15 study districts..."
          aria-label="Search District"
          className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
        />
        {(query || selectedDistrictId) && (
          <button
            type="button"
            onClick={handleClear}
            title="Clear district search"
            className="absolute right-2.5 p-0.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute z-[1100] mt-1.5 w-full max-h-60 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl py-1">
          {filtered.length === 0 ? (
            <div className="px-3 py-2.5 text-xs text-slate-500 dark:text-slate-400">
              No matching study district found.
            </div>
          ) : (
            filtered.map((d) => {
              const isSelected = d.district === selectedDistrictId;
              return (
                <button
                  key={d.district}
                  type="button"
                  onClick={() => handleChoose(d.district)}
                  className={`w-full text-left px-3 py-2 flex items-center justify-between text-xs transition ${
                    isSelected
                      ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-bold'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="flex items-center gap-2 truncate">
                    <MapPin className="w-3.5 h-3.5 shrink-0 text-teal-600 dark:text-teal-400" />
                    <span className="truncate">{d.district_display_name}</span>
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 shrink-0 ml-2">
                    {d.region}
                  </span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

