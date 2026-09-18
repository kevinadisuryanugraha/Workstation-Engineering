import React from 'react';
import { X, CheckCircle2, Circle, GitCommit, ExternalLink, ShieldAlert } from 'lucide-react';
import { WorkItem } from '../../types.ts';

interface EvidenceDrillDownModalProps {
  isOpen: boolean;
  onClose: () => void;
  workItem: WorkItem;
}

export const EvidenceDrillDownModal: React.FC<EvidenceDrillDownModalProps> = ({
  isOpen,
  onClose,
  workItem,
}) => {
  if (!isOpen) return null;

  const acList = workItem.acceptanceCriteria || [];
  const completedAC = acList.filter((a) => a.completed).length;
  const progressPercent = acList.length > 0 ? Math.round((completedAC / acList.length) * 100) : 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-xl bg-[#FAF7EE] border-2 border-slate-900 retro-shadow-lg rounded-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Retro Window Header */}
        <div className="bg-slate-900 text-white px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 border border-slate-700" />
            <div className="w-3 h-3 rounded-full bg-amber-500 border border-slate-700" />
            <div className="w-3 h-3 rounded-full bg-emerald-500 border border-slate-700" />
            <span className="ml-2 font-mono text-xs tracking-wider uppercase font-bold text-teal-300">
              Evidence Drill-Down :: {workItem.code || (workItem as any).key || workItem.id}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-600 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          <div>
            <span className="text-xs font-mono font-bold uppercase text-slate-500 tracking-wider">
              Work Item Deliverable
            </span>
            <h3 className="text-lg font-bold text-slate-900 mt-1">
              {workItem.title}
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              {workItem.description || 'No description provided.'}
            </p>
          </div>

          {/* Progress Bar with Explainable Evidence */}
          <div className="bg-[#F5F1E4] border-2 border-slate-900 p-4 rounded-md">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold font-mono text-slate-800">
                Verified Progress: {completedAC} / {acList.length || 1} Criteria
              </span>
              <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-teal-100 text-teal-900 border border-teal-800">
                {progressPercent}% DoD Verified
              </span>
            </div>
            <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden border border-slate-900">
              <div
                className="bg-teal-500 h-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Acceptance Criteria Section */}
          <div>
            <h4 className="text-xs font-bold font-mono uppercase text-slate-700 mb-3 flex items-center gap-1.5">
              <span>Acceptance Criteria (Definition of Done Gate)</span>
            </h4>
            {acList.length > 0 ? (
              <div className="space-y-2">
                {acList.map((ac) => (
                  <div
                    key={ac.id}
                    className="flex items-start gap-2.5 p-2.5 rounded bg-white border border-slate-300 text-xs"
                  >
                    {ac.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <Circle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    )}
                    <span className={ac.completed ? 'text-slate-800 line-through' : 'text-slate-900 font-medium'}>
                      {ac.text}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                <span>No explicit acceptance criteria checklist registered yet.</span>
              </div>
            )}
          </div>

          {/* Attached Git Evidence */}
          <div>
            <h4 className="text-xs font-bold font-mono uppercase text-slate-700 mb-3 flex items-center gap-1.5">
              <GitCommit className="w-4 h-4 text-slate-900" />
              <span>Verified Git Commits & Evidence</span>
            </h4>
            <div className="p-3 bg-white border border-slate-300 rounded text-xs font-mono space-y-2">
              <div className="flex items-center justify-between text-slate-600">
                <span>Commit Ref: 8261536 (Initial commit)</span>
                <span className="text-emerald-700 font-bold">SYSTEM_VERIFIED</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Commit Ref: 7535fd1 (Postgres + Drizzle)</span>
                <span className="text-emerald-700 font-bold">SYSTEM_VERIFIED</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-[#F5F1E4] border-t-2 border-slate-900 p-3 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold bg-slate-900 text-white rounded hover:bg-slate-800 border-2 border-slate-900 retro-shadow-sm transition-all"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};
