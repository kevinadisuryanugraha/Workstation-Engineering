import React from 'react';
import { Play, CheckCircle, ArrowRight, Clock } from 'lucide-react';
import { WorkItemStatus } from '../../types.ts';

interface QuickStatusButtonProps {
  currentStatus: WorkItemStatus;
  onTransition: (nextStatus: WorkItemStatus) => Promise<void> | void;
  isLoading?: boolean;
}

export const QuickStatusButton: React.FC<QuickStatusButtonProps> = ({
  currentStatus,
  onTransition,
  isLoading = false,
}) => {
  if (currentStatus === 'BACKLOG' || currentStatus === 'READY') {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onTransition('IN_PROGRESS');
        }}
        disabled={isLoading}
        className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border-2 border-slate-900 retro-shadow-sm transition-all active:translate-x-0.5 active:translate-y-0.5"
        title="Start working on this task"
      >
        <Play className="w-3.5 h-3.5 fill-current" />
        <span>Start</span>
      </button>
    );
  }

  if (currentStatus === 'IN_PROGRESS') {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onTransition('IN_REVIEW');
        }}
        disabled={isLoading}
        className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded bg-amber-100 hover:bg-amber-200 text-amber-900 border-2 border-slate-900 retro-shadow-sm transition-all active:translate-x-0.5 active:translate-y-0.5"
        title="Submit this task for code review"
      >
        <Clock className="w-3.5 h-3.5" />
        <span>Review</span>
      </button>
    );
  }

  if (currentStatus === 'IN_REVIEW') {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onTransition('READY_FOR_TEST');
        }}
        disabled={isLoading}
        className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded bg-sky-100 hover:bg-sky-200 text-sky-900 border-2 border-slate-900 retro-shadow-sm transition-all active:translate-x-0.5 active:translate-y-0.5"
        title="Approve review and move to QA Testing"
      >
        <ArrowRight className="w-3.5 h-3.5" />
        <span>To QA</span>
      </button>
    );
  }

  if (currentStatus === 'TESTING' || currentStatus === 'READY_FOR_TEST') {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onTransition('DONE');
        }}
        disabled={isLoading}
        className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded bg-purple-100 hover:bg-purple-200 text-purple-900 border-2 border-slate-900 retro-shadow-sm transition-all active:translate-x-0.5 active:translate-y-0.5"
        title="Verify and Mark as DONE (Definition of Done Gate)"
      >
        <CheckCircle className="w-3.5 h-3.5" />
        <span>Mark Done</span>
      </button>
    );
  }

  return (
    <span className="text-xs font-bold text-slate-500 font-mono">
      {currentStatus}
    </span>
  );
};
