import React from 'react';
import { Task, UserProfile } from '../types';
import TaskCard from './TaskCard';
import { Plus, CheckCircle, Clock, CirclePlay, HelpCircle } from 'lucide-react';

interface ColumnProps {
  status: 'todo' | 'in_progress' | 'review' | 'done';
  title: string;
  tasks: Task[];
  users: UserProfile[];
  commentsMap: { [taskId: string]: number };
  onSelectTask: (task: Task) => void;
  onMoveTask: (task: Task, newStatus: 'todo' | 'in_progress' | 'review' | 'done') => void;
  onAddTask: (status: 'todo' | 'in_progress' | 'review' | 'done') => void;
}

export default function Column({
  status,
  title,
  tasks,
  users,
  commentsMap,
  onSelectTask,
  onMoveTask,
  onAddTask
}: ColumnProps) {
  
  const getHeaderStyles = () => {
    switch (status) {
      case 'in_progress':
        return {
          bg: 'bg-indigo-600',
          text: 'text-indigo-600',
          indicator: 'bg-indigo-500',
          icon: <CirclePlay className="w-4 h-4 text-indigo-500" />
        };
      case 'review':
        return {
          bg: 'bg-amber-500',
          text: 'text-amber-700',
          indicator: 'bg-amber-400',
          icon: <Clock className="w-4 h-4 text-amber-500" />
        };
      case 'done':
        return {
          bg: 'bg-emerald-500',
          text: 'text-emerald-700',
          indicator: 'bg-emerald-400',
          icon: <CheckCircle className="w-4 h-4 text-emerald-500" />
        };
      default:
        return {
          bg: 'bg-slate-400',
          text: 'text-slate-700',
          indicator: 'bg-slate-400',
          icon: <HelpCircle className="w-4 h-4 text-slate-405" />
        };
    }
  };

  const style = getHeaderStyles();

  return (
    <div className="flex flex-col w-full min-w-[280px] bg-slate-50 border border-slate-200/50 rounded-2xl p-4 max-h-[calc(100vh-140px)] shadow-sm">
      
      {/* Column Name Header with count */}
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2">
          {style.icon}
          <h2 className="font-display font-semibold text-slate-800 text-sm tracking-tight capitalize">
            {title}
          </h2>
          <span className="bg-slate-200 text-slate-600 text-[11px] font-mono font-bold px-2 py-0.5 rounded-full">
            {tasks.length}
          </span>
        </div>
        
        <button
          onClick={() => onAddTask(status)}
          className="p-1 hover:bg-slate-200/80 rounded text-slate-500 hover:text-indigo-600 transition cursor-pointer"
          title="Criar tarefa nesta coluna"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Interactive Lists Containers */}
      <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 min-h-[200px]">
        {tasks.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center border border-dashed border-slate-200 rounded-xl bg-slate-100/30">
            <p className="text-xs text-slate-400 font-medium">Nenhuma tarefa</p>
            <p className="text-[10px] text-slate-400 mt-1 max-w-[150px]">
              Arraste do lado ou crie uma nova para iniciar.
            </p>
          </div>
        ) : (
          tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              users={users}
              commentsCount={commentsMap[task.id] || 0}
              onSelect={() => onSelectTask(task)}
              onMoveStatus={(newStatus) => onMoveTask(task, newStatus)}
            />
          ))
        )}
      </div>
    </div>
  );
}
