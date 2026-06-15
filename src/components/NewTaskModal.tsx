import React, { useState } from 'react';
import { X, Loader2, ClipboardCheck, Sparkles } from 'lucide-react';
import { UserProfile } from '../types';
import { motion } from 'motion/react';

interface NewTaskModalProps {
  defaultStatus: 'todo' | 'in_progress' | 'review' | 'done';
  users: UserProfile[];
  onClose: () => void;
  onCreateTask: (taskData: {
    title: string;
    description: string;
    status: 'todo' | 'in_progress' | 'review' | 'done';
    priority: 'low' | 'medium' | 'high';
    dueDate?: string;
    assigneeId?: string;
  }) => Promise<void>;
}

export default function NewTaskModal({
  defaultStatus,
  users,
  onClose,
  onCreateTask
}: NewTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'todo' | 'in_progress' | 'review' | 'done'>(defaultStatus);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [assigneeId, setAssigneeId] = useState('');
  const [dueDate, setDueDate] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Por favor, informe o título da tarefa.');
      return;
    }

    if (title.length > 200) {
      setError('O título não deve exceder 200 caracteres.');
      return;
    }

    if (description.length > 2000) {
      setError('A descrição não deve exceder 2000 caracteres.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreateTask({
        title: title.trim(),
        description: description.trim() || 'Sem descrição.',
        status,
        priority,
        dueDate: dueDate || undefined,
        assigneeId: assigneeId || undefined
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Erro ao criar tarefa.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans animate-fade-in">
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-150 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-indigo-650" />
            <h2 className="font-display font-bold text-slate-800 text-base leading-none">
              Nova Tarefa de Trabalho
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition cursor-pointer"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          <div>
            <label className="block text-xs font-mono font-semibold text-slate-550 uppercase tracking-wider mb-1.5">
              Título da Tarefa <span className="text-red-500">*</span>
            </label>
            <input
              id="new-task-title-input"
              type="text"
              placeholder="Ex: Desenhar wireframes das páginas..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              autoFocus
              className="w-full bg-slate-50 border border-slate-200 text-sm px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-indigo-550 focus:bg-white transition font-sans"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-semibold text-slate-550 uppercase tracking-wider mb-1.5 opacity-75">
              Descrição Detalhada
            </label>
            <textarea
              id="new-task-description-input"
              rows={3}
              placeholder="Especifique o entregável e os cenários de aceitação desta tarefa..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={2000}
              className="w-full bg-slate-50 border border-slate-200 text-sm p-3.5 rounded-xl focus:outline-none focus:border-indigo-550 focus:bg-white transition resize-none font-sans"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Status Selector */}
            <div>
              <label className="block text-xs font-mono font-semibold text-slate-440 uppercase tracking-wider mb-1.5">
                Coluna Inicial
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full text-xs text-slate-750 bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-indigo-550 transition cursor-pointer"
              >
                <option value="todo">A Fazer (Todo)</option>
                <option value="in_progress">Em Progresso (Active)</option>
                <option value="review">Revisão (Review)</option>
                <option value="done">Concluído (Done)</option>
              </select>
            </div>

            {/* Priority Selector */}
            <div>
              <label className="block text-xs font-mono font-semibold text-slate-440 uppercase tracking-wider mb-1.5">
                Nível de Prioridade
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full text-xs text-slate-750 bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-indigo-550 transition cursor-pointer"
              >
                <option value="low">Baixa</option>
                <option value="medium">Média</option>
                <option value="high">Alta / Urgente</option>
              </select>
            </div>

            {/* Assignee Selection */}
            <div>
              <label className="block text-xs font-mono font-semibold text-slate-440 uppercase tracking-wider mb-1.5">
                Escolher Responsável
              </label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full text-xs text-slate-750 bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-indigo-550 transition cursor-pointer"
              >
                <option value="">Ninguém (A designar)</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>

            {/* Due Date Input */}
            <div>
              <label className="block text-xs font-mono font-semibold text-slate-440 uppercase tracking-wider mb-1.5">
                Prazo Final (Due Date)
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full text-xs text-slate-705 bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-indigo-550 transition cursor-pointer"
              />
            </div>

          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-650 font-medium font-sans">
              {error}
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-4 border-t border-slate-150 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-500 rounded-xl text-xs font-medium hover:bg-slate-50 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              id="submit-task-btn"
              disabled={isSubmitting || !title.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-5 py-2.5 rounded-xl transition flex items-center gap-1.5 font-medium shadow-sm cursor-pointer disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Criando...</span>
                </>
              ) : (
                <>
                  <ClipboardCheck className="w-3.5 h-3.5" />
                  <span>Criar Tarefa</span>
                </>
              )}
            </button>
          </div>

        </form>
      </motion.div>

    </div>
  );
}
