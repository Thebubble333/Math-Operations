import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SEAL9_ALTS } from './seal9Alts';

/* 9 SEAL section menu, grouped by ALT. The ALTs and their skills live in seal9Alts.ts. */
const Seal9Menu: React.FC = () => {
  const navigate = useNavigate();
  const newest = SEAL9_ALTS[SEAL9_ALTS.length - 1].id;
  const [open, setOpen] = useState<Record<string, boolean>>({ [newest]: true });
  const many = SEAL9_ALTS.length > 1;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-900 transition-colors">
      <div className="mb-12 text-center">
        <h1 className="text-6xl font-black tracking-tighter mb-2 text-violet-600 dark:text-violet-400 italic">
          9 SEAL
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium tracking-wide">Advanced Year 9 Mathematics</p>
      </div>

      <div className="w-full max-w-4xl space-y-12">
        {[...SEAL9_ALTS].reverse().map(alt => {
          const shown = !many || open[alt.id];
          return (
            <section key={alt.id}>
              <button
                onClick={() => many && setOpen(o => ({ ...o, [alt.id]: !o[alt.id] }))}
                aria-expanded={shown}
                className={`w-full flex items-baseline gap-3 px-2 pb-3 mb-6 border-b-2 border-violet-200 dark:border-violet-900 text-left ${many ? 'cursor-pointer' : 'cursor-default'}`}>
                <span className="text-3xl font-black italic tracking-tight text-violet-600 dark:text-violet-400">{alt.title}</span>
                <span className="text-lg font-bold text-slate-500 dark:text-slate-400">{alt.subtitle}</span>
                {many && <span className="ml-auto text-violet-400 text-xl">{shown ? '▾' : '▸'}</span>}
              </button>

              {shown && (
                <div className="space-y-8">
                  {alt.sections.map(sec => (
                    <div key={sec.title}>
                      <h2 className="text-xl font-black text-violet-600 dark:text-violet-400 uppercase tracking-widest mb-4 px-2">{sec.title}</h2>
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
              )}
            </section>
          );
        })}
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
