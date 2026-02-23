import React from 'react';
import { GraphConfig } from '../types';

interface DevToolsProps {
  config: GraphConfig;
  setConfig: (config: GraphConfig) => void;
  onClose: () => void;
}

const DevTools: React.FC<DevToolsProps> = ({ config, setConfig, onClose }) => {
  const handleChange = (key: keyof GraphConfig, value: number) => {
    setConfig({ ...config, [key]: value });
  };

  return (
    <div className="fixed bottom-4 right-4 z-[100] bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-80 max-h-[80vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-black text-lg text-slate-800 dark:text-slate-100">GRAPH DIAGNOSTICS</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">✕</button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Grid Columns ({config.gridColumns})</label>
          <input 
            type="range" min="1" max="4" step="1"
            value={config.gridColumns}
            onChange={(e) => handleChange('gridColumns', parseInt(e.target.value))}
            className="w-full accent-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Axis Stroke ({config.axisStrokeWidth})</label>
          <input 
            type="range" min="0.1" max="3" step="0.1"
            value={config.axisStrokeWidth}
            onChange={(e) => handleChange('axisStrokeWidth', parseFloat(e.target.value))}
            className="w-full accent-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Grid Stroke ({config.gridStrokeWidth})</label>
          <input 
            type="range" min="0.1" max="2" step="0.1"
            value={config.gridStrokeWidth}
            onChange={(e) => handleChange('gridStrokeWidth', parseFloat(e.target.value))}
            className="w-full accent-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Graph Stroke ({config.graphStrokeWidth})</label>
          <input 
            type="range" min="0.5" max="5" step="0.1"
            value={config.graphStrokeWidth}
            onChange={(e) => handleChange('graphStrokeWidth', parseFloat(e.target.value))}
            className="w-full accent-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Tick Font Size ({config.fontSize})</label>
          <input 
            type="range" min="2" max="12" step="0.5"
            value={config.fontSize}
            onChange={(e) => handleChange('fontSize', parseFloat(e.target.value))}
            className="w-full accent-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Axis Label Size ({config.axisFontSize})</label>
          <input 
            type="range" min="4" max="16" step="0.5"
            value={config.axisFontSize}
            onChange={(e) => handleChange('axisFontSize', parseFloat(e.target.value))}
            className="w-full accent-indigo-500"
          />
        </div>
      </div>
    </div>
  );
};

export default DevTools;
