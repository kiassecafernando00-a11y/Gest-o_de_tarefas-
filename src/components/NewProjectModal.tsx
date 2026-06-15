import React, { useState } from 'react';
import { X, Loader2, Sparkles, FolderPlus } from 'lucide-react';
import { motion } from 'motion/react';

interface NewProjectModalProps {
  onClose: () => void;
  onCreateProject: (name: string, description: string) => Promise<void>;
}

export default function NewProjectModal({
  onClose,
  onCreateProject
}: NewProjectModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Por favor, informe o nome do projeto.');
      return;
    }

    if (name.length > 100) {
      setError('O nome do projeto não deve exceder 100 caracteres.');
      return;
    }

    if (description.length > 500) {
      setError('A descrição não deve exceder 500 caracteres.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreateProject(name.trim(), description.trim() || 'Sem descrição.');
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Erro ao criar projeto.');
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
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-150 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <FolderPlus className="w-5 h-5 text-indigo-600" />
            <h2 className="font-display font-bold text-slate-800 text-base leading-none">
              Novo Espaço de Trabalho
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
              Nome do Projeto <span className="text-red-500">*</span>
            </label>
            <input
              id="new-project-name-input"
              type="text"
              placeholder="Ex: Desenvolvimento Frontend"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              autoFocus
              className="w-full bg-slate-50 border border-slate-200 text-sm px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-indigo-550 focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-semibold text-slate-550 uppercase tracking-wider mb-1.5 opacity-75">
              Descrição do Projeto
            </label>
            <textarea
              id="new-project-description-input"
              rows={3}
              placeholder="Descreva detalhes como objetivos, escopo geral e cronogramas principais..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              className="w-full bg-slate-50 border border-slate-200 text-sm p-3.5 rounded-xl focus:outline-none focus:border-indigo-550 focus:bg-white transition resize-none"
            />
            <div className="text-right text-[10px] font-mono text-slate-400 mt-1">
              {description.length}/500 caracteres
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-650 font-medium">
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
              id="submit-project-btn"
              disabled={isSubmitting || !name.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-5 py-2.5 rounded-xl transition flex items-center gap-1.5 font-medium shadow-sm cursor-pointer disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Criando...</span>
                </>
              ) : (
                <>
                  <FolderPlus className="w-3.5 h-3.5" />
                  <span>Criar Espaço</span>
                </>
              )}
            </button>
          </div>

        </form>
      </motion.div>

    </div>
  );
}
