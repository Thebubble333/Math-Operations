import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { SEAL9_TOPICS, Level } from './seal9Topics';

/* "What's in each level?" for the 9 SEAL typed-parts pages. */
const TypedPartsLevelsPage: React.FC = () => {
  const navigate = useNavigate();
  const { topic } = useParams();
  const topicKey = topic && SEAL9_TOPICS[topic] ? topic : 'polygons';
  const t = SEAL9_TOPICS[topicKey];
  const unit = (n: number) => `${n} ${t.noun === 'Graph' ? 'graphs' : 'questions'}`;

  return (
    <div className="min-h-screen flex flex-col items-center p-6 bg-slate-50 dark:bg-slate-900">
      <div className="w-full max-w-3xl">
        <button onClick={() => navigate(`/9seal/skill/${topicKey}`)} className="mb-6 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 shadow-sm font-bold text-slate-600 dark:text-slate-300 active:scale-95">← Back to practice</button>
        <h1 className="text-4xl font-black tracking-tighter text-violet-600 dark:text-violet-400 italic mb-1">{t.title}</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-8">What changes from level to level. A round with 80% accuracy or better moves you up a level.</p>

        <div className="space-y-5">
          {([1, 2, 3] as Level[]).map(l => {
            const lv = t.levels[l];
            return (
              <section key={l} id={`level-${l}`} className="bg-white dark:bg-slate-800 rounded-3xl shadow-lg p-6 border-b-4 border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-1">
                  <span className={`w-10 h-10 rounded-2xl ${t.color} text-white font-black text-lg flex items-center justify-center shadow`}>{l}</span>
                  <h2 className="text-xl font-black text-slate-800 dark:text-slate-100">{lv.name}</h2>
                </div>
                <p className="text-slate-500 dark:text-slate-400 mb-4">{lv.summary} {unit(lv.roundLength)} per round.</p>
                <ul className="space-y-2 mb-5">
                  {lv.skills.map(s => (
                    <li key={s.title} className="text-slate-700 dark:text-slate-200 leading-relaxed">
                      <span className="font-bold">{s.title}.</span> {s.text}
                    </li>
                  ))}
                </ul>
                <button onClick={() => navigate(`/9seal/skill/${topicKey}/${l}`)}
                  className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-tight shadow-md active:scale-95">
                  Start level {l}
                </button>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TypedPartsLevelsPage;
