import React from 'react';
import { useNavigate } from 'react-router-dom';

/* 9 SEAL section menu. Topic 1: Geometry and networks. */
const Seal9Menu: React.FC = () => {
  const navigate = useNavigate();

  const congruence = [
    { label: 'Congruence Tests', icon: 'SAS', color: 'bg-sky-500', route: '/9seal/congruence/tests', blurb: 'Choose SSS, SAS, AAS or RHS' },
    { label: 'Vertex Mappings', icon: 'A↦X', color: 'bg-indigo-500', route: '/9seal/congruence/mappings', blurb: 'Match the corners' },
    { label: 'Proofs', icon: '≡', color: 'bg-fuchsia-500', route: '/9seal/congruence/proofs', blurb: 'Pairs, reasons and the test' },
  ];
  const angles = [
    { label: 'Polygon Angles', icon: '540°', color: 'bg-amber-500', route: '/9seal/skill/polygons', blurb: 'Angle sums, regular polygons, missing angles' },
  ];
  const networks = [
    { label: "Dijkstra's Algorithm", icon: 'A→F', color: 'bg-teal-500', route: '/9seal/skill/dijkstra', blurb: 'Shortest paths, step by step' },
  ];
  const sections = [
    { title: 'Angles and Polygons', buttons: angles },
    { title: 'Congruent Triangles', buttons: congruence },
    { title: 'Networks', buttons: networks },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-900 transition-colors">
      <div className="mb-12 text-center">
        <h1 className="text-6xl font-black tracking-tighter mb-2 text-violet-600 dark:text-violet-400 italic">
          9 SEAL
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium tracking-wide">Advanced Year 9 Mathematics</p>
      </div>

      <div className="w-full max-w-4xl space-y-8">
        {sections.map(sec => (
        <div key={sec.title}>
          <div className="flex items-center justify-between mb-4 px-2">
            <h2 className="text-xl font-black text-violet-600 dark:text-violet-400 uppercase tracking-widest flex items-center gap-2">
              <span>{sec.title}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300 font-bold border border-violet-200 dark:border-violet-800">TOPIC 1</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {sec.buttons.map(btn => (
              <button
                key={btn.label}
                onClick={() => navigate(btn.route)}
                className="group relative h-40 flex flex-col items-center justify-center bg-white dark:bg-slate-800 border-b-4 border-slate-200 dark:border-slate-700 hover:bg-violet-50 dark:hover:bg-violet-950/30 hover:border-violet-300 dark:hover:border-violet-800 rounded-3xl shadow-lg transition-all duration-150 hover:translate-y-1 hover:border-b-0 active:scale-95 z-0 hover:z-10"
              >
                <div className={`w-auto min-w-[3rem] px-3 h-12 rounded-2xl ${btn.color} text-white flex items-center justify-center mb-3 shadow-md transform group-hover:scale-90 transition-all duration-200`}>
                  <span className="text-xl font-bold font-serif italic">{btn.icon}</span>
                </div>
                <span className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight text-center px-1">{btn.label}</span>
                <span className="text-xs text-slate-400 dark:text-slate-500 mt-1 text-center px-2">{btn.blurb}</span>
              </button>
            ))}
          </div>
        </div>
        ))}
      </div>

      <div className="mt-16 text-center text-slate-400 dark:text-slate-600 w-full max-w-lg">
        <button
          onClick={() => navigate('/')}
          className="p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-md hover:shadow-lg transition-all active:scale-90 font-bold uppercase tracking-widest"
        >
          Back to Main Menu
        </button>
      </div>
    </div>
  );
};

export default Seal9Menu;
