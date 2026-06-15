import React from 'react';
import { WorkspaceActivity } from '../types';
import { History, Clock, FileText, ChevronRight, MessageSquare, ArrowUpRight } from 'lucide-react';

interface ActivityLogProps {
  activities: WorkspaceActivity[];
}

export default function ActivityLog({ activities }: ActivityLogProps) {
  
  const getActionIcon = (action: string) => {
    const text = action.toLowerCase();
    if (text.includes('comment') || text.includes('comentou')) {
      return <MessageSquare className="w-3 h-3 text-sky-500" />;
    }
    if (text.includes('criou') || text.includes('create')) {
      return <FileText className="w-3 h-3 text-indigo-500" />;
    }
    return <ArrowUpRight className="w-3 h-3 text-amber-500" />;
  };

  return (
    <div className="w-80 bg-white border-l border-slate-200/80 p-5 flex flex-col h-[calc(100vh-100px)] fixed top-[100px] right-0 z-10 shadow-sm hidden lg:flex font-sans">
      
      {/* Header Title */}
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
        <History className="w-4 h-4 text-slate-500" />
        <h3 className="font-display font-bold text-slate-800 text-sm tracking-tight uppercase">
          Atividades em Tempo Real
        </h3>
        <span className="flex h-1.5 w-1.5 rounded-full bg-indigo-500 pulse-glow"></span>
      </div>

      {/* Activity list */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {activities.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-4">
            <Clock className="w-8 h-8 text-slate-200 mb-2 stroke-[1.5]" />
            <p className="text-xs font-semibold">Sem atividades</p>
            <p className="text-[10px] text-slate-400 mt-1 max-w-[150px]">
              Tudo calmo! As ações do grupo aparecerão aqui ao vivo.
            </p>
          </div>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="relative pl-6 pb-1 group/activity">
              {/* Connector Line */}
              <div className="absolute left-2.5 top-3.5 bottom-[-16px] w-[1px] bg-slate-200 group-last/activity:bg-transparent" />
              
              {/* Action Circle Bullet */}
              <div className="absolute left-1 top-1 w-3.5 h-3.5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
                {getActionIcon(activity.action)}
              </div>

              {/* Log Information */}
              <div>
                <div className="flex items-center gap-1.5">
                  <img
                    referrerPolicy="no-referrer"
                    src={activity.userPhoto}
                    alt={activity.userName}
                    className="w-4 h-4 rounded-full border border-slate-150 shadow-xs"
                  />
                  <span className="text-xs font-bold text-slate-800 truncate block max-w-28">{activity.userName}</span>
                  <span className="text-[9px] font-mono text-slate-400 ml-auto flex-shrink-0">
                    {new Date(activity.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  <strong className="text-indigo-650 font-semibold">{activity.action}</strong> {activity.details}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
