import React, { useState, useEffect, useRef } from 'react';
import { Task, UserProfile, TaskComment } from '../types';
import { 
  X, 
  Calendar, 
  User, 
  MessageSquare,
  Trash2, 
  Check, 
  Sparkles, 
  Send,
  Loader2,
  Clock,
  ChevronRight,
  UserCheck
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';

interface TaskModalProps {
  task: Task;
  projectId: string;
  projectOwnerId: string;
  currentUserId: string;
  users: UserProfile[];
  onClose: () => void;
  onUpdateTask: (updatedFields: Partial<Task>) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
}

export default function TaskModal({
  task,
  projectId,
  projectOwnerId,
  currentUserId,
  users,
  onClose,
  onUpdateTask,
  onDeleteTask
}: TaskModalProps) {
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSendingComment, setIsSendingComment] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Local edit states
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [status, setStatus] = useState(task.status);
  const [priority, setPriority] = useState(task.priority);
  const [assigneeId, setAssigneeId] = useState(task.assigneeId || '');
  const [dueDate, setDueDate] = useState(task.dueDate || '');
  
  const commentsEndRef = useRef<HTMLDivElement>(null);

  // Check roles: Tier 1 (Admin/Owner/Creator) vs Tier 2 (Contributor)
  const isTier1 = currentUserId === projectOwnerId || currentUserId === task.createdBy;

  // Sync real-time comments specifically targeting this task
  useEffect(() => {
    const commentsPath = `projects/${projectId}/tasks/${task.id}/comments`;
    const commentsCol = collection(db, 'projects', projectId, 'tasks', task.id, 'comments');
    const q = query(commentsCol, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: TaskComment[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        items.push({
          id: docSnap.id,
          taskId: d.taskId,
          userId: d.userId,
          userName: d.userName,
          userPhoto: d.userPhoto,
          text: d.text,
          createdAt: d.createdAt ? d.createdAt.toDate() : new Date(),
        } as TaskComment);
      });
      setComments(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, commentsPath);
    });

    return () => unsubscribe();
  }, [projectId, task.id]);

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  const handleSaveMetadata = async () => {
    setIsUpdating(true);
    try {
      const payload: Partial<Task> = {
        status,
        updatedAt: serverTimestamp()
      };

      // Only Tier 1 users can alter title, description, priority, assignee, and due date
      if (isTier1) {
        payload.title = title;
        payload.description = description;
        payload.priority = priority;
        payload.assigneeId = assigneeId || undefined;
        payload.dueDate = dueDate || undefined;
      }

      await onUpdateTask(payload);
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSendingComment(true);
    const me = users.find(u => u.id === currentUserId);
    const commentsPath = `projects/${projectId}/tasks/${task.id}/comments`;

    try {
      const commentPayload = {
        id: crypto.randomUUID(),
        taskId: task.id,
        userId: currentUserId,
        userName: me?.name || 'Colaborador',
        userPhoto: me?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${me?.name || 'Anonymous'}`,
        text: newComment.trim(),
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'projects', projectId, 'tasks', task.id, 'comments'), commentPayload);
      setNewComment('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, commentsPath);
    } finally {
      setIsSendingComment(false);
    }
  };

  const handleDeleteSelf = async () => {
    if (window.confirm('Tem certeza que deseja remover esta tarefa definitivamente?')) {
      await onDeleteTask(task.id);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans animate-fade-in">
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200"
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-150 flex items-center justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono bg-slate-200 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                Tarefa ID: {task.id.slice(0, 8)}
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Criado por: {users.find(u => u.id === task.createdBy)?.name || 'Anônimo'}
              </span>
            </div>
            
            {isTier1 ? (
              <input
                id="task-title-edit-input"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="font-display font-bold text-lg md:text-xl text-slate-850 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none transition w-full p-0.5"
                placeholder="Nome da Tarefa"
              />
            ) : (
              <h2 className="font-display font-bold text-lg md:text-xl text-slate-850">{title}</h2>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isTier1 && (
              <button
                onClick={handleDeleteSelf}
                className="p-2 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                title="Excluir Tarefa"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Columns Grid */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-slate-150">
          
          {/* LEFT: Metadata and Descriptions */}
          <div className="md:col-span-3 p-6 space-y-6 flex flex-col justify-between">
            <div className="space-y-6">
              
              {/* Task Description */}
              <div>
                <label className="block text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Descrição da Tarefa
                </label>
                {isTier1 ? (
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full text-sm text-slate-750 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-indigo-500 p-3 rounded-xl focus:outline-none transition resize-none placeholder-slate-400"
                    placeholder="Adicione detalhes minuciosos do escopo desta tarefa..."
                  />
                ) : (
                  <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {description || <em className="text-slate-400 text-xs">Sem descrição cadastrada.</em>}
                  </div>
                )}
              </div>

              {/* Grid fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Board Column Status */}
                <div>
                  <label className="block text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Estágio / Coluna
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full text-xs text-slate-750 bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-indigo-500 transition cursor-pointer"
                  >
                    <option value="todo">A Fazer (Todo)</option>
                    <option value="in_progress">Em Progresso (Active)</option>
                    <option value="review">Revisão (Review)</option>
                    <option value="done">Concluído (Done)</option>
                  </select>
                </div>

                {/* Priority Levels */}
                <div>
                  <label className="block text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider mb-1.5 opacity-75">
                    Prioridade {!isTier1 && <span className="text-[10px] text-amber-500 italic">(Bloqueado)</span>}
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    disabled={!isTier1}
                    className="w-full text-xs text-slate-750 bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-indigo-500 transition disabled:opacity-75 cursor-pointer"
                  >
                    <option value="low">Baixa</option>
                    <option value="medium">Média</option>
                    <option value="high">Alta / Urgente</option>
                  </select>
                </div>

                {/* Assignee Selection */}
                <div>
                  <label className="block text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Responsável {!isTier1 && <span className="text-[10px] text-amber-500 italic">(Bloqueado)</span>}
                  </label>
                  <select
                    value={assigneeId}
                    onChange={(e) => setAssigneeId(e.target.value)}
                    disabled={!isTier1}
                    className="w-full text-xs text-slate-755 bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-indigo-500 transition disabled:opacity-75 cursor-pointer"
                  >
                    <option value="">Sem responsável</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>

                {/* Due Date Indicator */}
                <div>
                  <label className="block text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Prazo Final {!isTier1 && <span className="text-[10px] text-amber-500 italic">(Bloqueado)</span>}
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    disabled={!isTier1}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full text-xs text-slate-750 bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-indigo-500 transition disabled:opacity-75 cursor-pointer"
                  />
                </div>

              </div>

            </div>

            {/* Quick save actions */}
            <div className="pt-6 border-t border-slate-100 flex items-center justify-between mt-auto">
              <span className="text-xs text-slate-450 italic flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Atualizado em tempo real
              </span>
              
              <button
                id="save-task-metadata-btn"
                onClick={handleSaveMetadata}
                disabled={isUpdating}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-5 py-2.5 rounded-xl transition flex items-center gap-2 font-medium shadow-sm shadow-indigo-500/10 cursor-pointer disabled:opacity-70"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Salvar Alterações</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* RIGHT: Real-time Comments Thread */}
          <div className="md:col-span-2 p-6 flex flex-col bg-slate-50/50 h-[450px] md:h-auto overflow-hidden">
            <div className="text-xs font-mono font-semibold text-slate-450 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-indigo-500" />
              <span>Discussão Tempo Real ({comments.length})</span>
            </div>

            {/* Comments Stream */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1 scroll-smooth">
              {comments.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                  <MessageSquare className="w-8 h-8 text-slate-300 stroke-[1.5] mb-2" />
                  <p className="text-xs font-medium">Sem comentários ainda</p>
                  <p className="text-[10px] text-slate-400 mt-1 max-w-[180px]">
                    Comece a conversar abaixo sobre esta atividade!
                  </p>
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="bg-white border border-slate-200/60 p-3 rounded-2xl shadow-xs">
                    <div className="flex items-center gap-2 mb-1.5">
                      <img
                        referrerPolicy="no-referrer"
                        src={comment.userPhoto}
                        alt={comment.userName}
                        className="w-5 h-5 rounded-full border border-slate-150"
                      />
                      <span className="text-xs font-bold text-slate-800 truncate max-w-28">{comment.userName}</span>
                      <span className="text-[9px] font-mono text-slate-400 ml-auto">
                        {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed font-sans">{comment.text}</p>
                  </div>
                ))
              )}
              <div ref={commentsEndRef} />
            </div>

            {/* Send Comment Form */}
            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                id="task-comment-input"
                type="text"
                placeholder="Escreva um comentário..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                disabled={isSendingComment}
                className="flex-1 bg-white border border-slate-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-indigo-500 disabled:opacity-70 font-sans"
              />
              <button
                type="submit"
                id="task-comment-send-btn"
                disabled={isSendingComment || !newComment.trim()}
                className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition cursor-pointer disabled:opacity-50"
                title="Enviar comentário"
              >
                {isSendingComment ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </form>
          </div>

        </div>
      </motion.div>

    </div>
  );
}
