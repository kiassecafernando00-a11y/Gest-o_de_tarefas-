import React from 'react';
import { Task, UserProfile } from '../types';
import { 
  Calendar, 
  MessageSquare, 
  ChevronRight, 
  ChevronLeft, 
  Paperclip,
  Clock,
  ArrowUpRight
} from 'lucide-react';
import { motion } from 'motion/react';

interface TaskCardProps {
  key?: string;
  task: Task;
  users: UserProfile[];
  commentsCount: number;
  onSelect: () => void;
  onMoveStatus: (newStatus: 'todo' | 'in_progress' | 'review' | 'done') => void;
}

export default function TaskCard({
  task,
  users,
  commentsCount,
  onSelect,
  onMoveStatus
}: TaskCardProps) {
  const assignee = users.find(u => u.id === task.assigneeId);
  const creator = users.find(u => u.id === task.createdBy);

  const getPriorityStyles = (p: string) => {
    switch (p) {
      case 'high':
        return 'bg-rose-50 border-rose-100 text-rose-700 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-400';
      case 'medium':
        return 'bg-amber-50 border-amber-100 text-amber-700 dark:bg-amber-950/20 dark:border-amber-900/30 dark:text-amber-400';
      default:
        return 'bg-sky-50 border-sky-100 text-sky-700 dark:bg-sky-950/20 dark:border-sky-900/30 dark:text-sky-450';
    }
  };

  const formattedDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString('pt-BR') : null;

  const handleNextStatus = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (task.status === 'todo') onMoveStatus('in_progress');
    else if (task.status === 'in_progress') onMoveStatus('review');
    else if (task.status === 'review') onMoveStatus('done');
  };

  const handlePrevStatus = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (task.status === 'done') onMoveStatus('review');
    else if (task.status === 'review') onMoveStatus('in_progress');
    else if (task.status === 'in_progress') onMoveStatus('todo');
  };

  return (
    <motion.div
      layoutId={`task-${task.id}`}
      onClick={onSelect}
      className="p-5 bg-white border border-slate-200/80 rounded-xl hover:shadow-[0_4px_20px_-4px_rgba(15,23,42,0.08)] transition-all cursor-pointer group flex flex-col justify-between min-h-40"
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
    >
      <div>
        {/* Header Badges */}
        <div className="flex items-center justify-between mb-3.5">
          <span className={`text-[10px] font-semibold uppercase font-mono tracking-wider px-2 py-0.5 rounded-full border ${getPriorityStyles(task.priority)}`}>
            {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Média' : 'Baixa'}
          </span>
          
          {/* Quick status controls */}
          <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition duration-300">
            {task.status !== 'todo' && (
              <button
                onClick={handlePrevStatus}
                className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded transition"
                title="Voltar etapa"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            )}
            
            {task.status !== 'done' && (
              <button
                onClick={handleNextStatus}
                className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded transition"
                title="Avançar etapa"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Task Title */}
        <h3 className="font-display font-semibold text-slate-850 text-sm group-hover:text-indigo-600 transition truncate leading-tight mb-1.5 flex items-center justify-between gap-2">
          <span>{task.title}</span>
          <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0" />
        </h3>

        {/* Task Description Snippet */}
        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
          {task.description || 'Sem descrição.'}
        </p>
      </div>

      {/* Footer Details */}
      <div className="border-t border-slate-100 pt-3.5 flex items-center justify-between mt-auto">
        <div className="flex items-center gap-2.5 text-slate-400 text-[11px] font-mono">
          {formattedDate && (
            <div className="flex items-center gap-1 text-slate-500" title={`Prazo final: ${formattedDate}`}>
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{formattedDate}</span>
            </div>
          )}
          
          <div className="flex items-center gap-1 text-slate-550" title="Mensagens em tempo real">
            <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold">{commentsCount}</span>
          </div>
        </div>

        {/* Assignee Avatar */}
        <div className="flex items-center gap-1.5">
          {assignee ? (
            <div className="flex items-center gap-1">
              <img
                src={assignee.avatarUrl}
                alt={assignee.name}
                className="w-5.5 h-5.5 rounded-full border border-slate-200 shadow-sm"
                title={`Responsável: ${assignee.name}`}
                referrerPolicy="no-referrer"
              />
              <span className="text-[10px] text-slate-500 max-w-16 truncate font-medium sm:block hidden">
                {assignee.name.split(' ')[0]}
              </span>
            </div>
          ) : (
            <span className="text-[10px] text-slate-400 italic">Sem responsável</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
