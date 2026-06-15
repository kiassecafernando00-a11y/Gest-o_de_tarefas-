import React, { useState } from 'react';
import { Project, UserProfile } from '../types';
import { 
  FolderKanban, 
  Plus, 
  Users, 
  LogOut, 
  Layers, 
  Sparkles,
  UserPlus,
  Mail,
  UserCheck
} from 'lucide-react';
import { motion } from 'motion/react';

interface SidebarProps {
  currentUser: { uid: string; displayName: string | null; email: string | null; photoURL: string | null };
  projects: Project[];
  activeProjectId: string | null;
  onSelectProject: (id: string) => void;
  onOpenNewProject: () => void;
  users: UserProfile[];
  onInviteMember: (email: string) => void;
  onLogout: () => void;
}

export default function Sidebar({
  currentUser,
  projects,
  activeProjectId,
  onSelectProject,
  onOpenNewProject,
  users,
  onInviteMember,
  onLogout
}: SidebarProps) {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');

  const currentProject = projects.find(p => p.id === activeProjectId);

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError('');
    setInviteSuccess('');
    
    if (!inviteEmail.trim()) {
      setInviteError('Por favor, digite um e-mail.');
      return;
    }

    const targetUser = users.find(u => u.email.toLowerCase() === inviteEmail.trim().toLowerCase());
    if (!targetUser) {
      setInviteError('E-mail não cadastrado na plataforma.');
      return;
    }

    if (currentProject?.members.includes(targetUser.id) || currentProject?.ownerId === targetUser.id) {
      setInviteError('Este usuário já faz parte do projeto.');
      return;
    }

    onInviteMember(targetUser.email);
    setInviteSuccess(`Usuário ${targetUser.name} convidado com sucesso!`);
    setInviteEmail('');
    setTimeout(() => setInviteSuccess(''), 5000);
  };

  return (
    <aside id="sidebar-container" className="fixed top-0 bottom-0 left-0 w-80 bg-slate-900 text-slate-100 flex flex-col border-r border-slate-800 z-10 font-sans shadow-lg">
      
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600 rounded-lg text-white shadow-md shadow-indigo-500/10">
            <Layers className="w-5 h-5 text-indigo-100" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg tracking-tight bg-gradient-to-r from-blue-400 to-indigo-200 bg-clip-text text-transparent">
              BoardFlow
            </h1>
            <p className="text-[10px] font-mono text-slate-400 font-medium uppercase tracking-wider">
              Real-Time Collab
            </p>
          </div>
        </div>
        <span className="flex h-2.5 w-2.5 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
        </span>
      </div>

      {/* Projects Navigation */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-7">
        
        <div>
          <div className="flex items-center justify-between text-xs font-mono font-semibold tracking-wider text-slate-400 uppercase mb-3 px-2">
            <span>Seus Projetos ({projects.length})</span>
            <button 
              id="new-project-sidebar-btn"
              onClick={onOpenNewProject}
              className="p-1 hover:bg-slate-800 rounded transition"
              title="Novo Projeto"
            >
              <Plus className="w-3.5 h-3.5 text-indigo-400" />
            </button>
          </div>
          
          <div className="space-y-1">
            {projects.length === 0 ? (
              <div className="p-4 rounded-lg bg-slate-850 border border-dashed border-slate-800 text-center">
                <p className="text-xs text-slate-400 mb-2">Nenhum projeto ativo</p>
                <button
                  onClick={onOpenNewProject}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1 transition"
                >
                  <Plus className="w-3.5 h-3.5" /> Criar Projeto
                </button>
              </div>
            ) : (
              projects.map(proj => {
                const isActive = proj.id === activeProjectId;
                return (
                  <button
                    key={proj.id}
                    onClick={() => onSelectProject(proj.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between text-sm transition group relative ${
                      isActive 
                        ? 'bg-indigo-600/15 border-l-4 border-indigo-500 text-indigo-100 font-medium' 
                        : 'text-slate-300 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <FolderKanban className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-300'}`} />
                      <span className="truncate">{proj.name}</span>
                    </div>
                    {proj.ownerId === currentUser.uid && (
                      <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono font-semibold uppercase scale-90 group-hover:scale-100 transition">
                        Dono
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Member Invite for active project */}
        {currentProject && (
          <div className="border-t border-slate-800/80 pt-6">
            <div className="text-xs font-mono font-semibold tracking-wider text-slate-400 uppercase mb-3 px-2 flex items-center gap-1.5">
              <UserPlus className="w-3.5 h-3.5 text-indigo-400" />
              <span>Convidar no Projeto</span>
            </div>

            <form onSubmit={handleInviteSubmit} className="space-y-2 px-2">
              <div className="relative">
                <input
                  type="email"
                  placeholder="email@colaborador.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-lg pl-8 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono transition"
                />
                <Mail className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-600" />
              </div>
              
              {inviteError && <p className="text-[10px] text-red-400 px-1">{inviteError}</p>}
              {inviteSuccess && <p className="text-[10px] text-emerald-400 px-1">{inviteSuccess}</p>}
              
              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1 shadow-sm font-sans cursor-pointer"
              >
                Adicionar Colaborador
              </button>
            </form>

            {/* Current Project Members Lists */}
            <div className="mt-4 px-2 space-y-2">
              <div className="text-[10px] font-mono text-slate-500 font-semibold uppercase tracking-wider mb-2">
                Membros Ativos ({1 + (currentProject.members?.length || 0)})
              </div>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {/* Owner */}
                {(() => {
                  const ownerProfile = users.find(u => u.id === currentProject.ownerId);
                  return (
                    <div className="flex items-center gap-2 text-xs text-slate-300">
                      <img
                        referrerPolicy="no-referrer"
                        src={ownerProfile?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${ownerProfile?.name || 'Owner'}`}
                        alt="Owner"
                        className="w-5 h-5 rounded-full border border-indigo-500/30 shadow-sm"
                      />
                      <span className="truncate">{ownerProfile?.name || 'Carregando...'}</span>
                      <span className="text-[9px] text-indigo-400 font-semibold uppercase bg-indigo-950/40 px-1 rounded ml-auto">
                        Dono
                      </span>
                    </div>
                  );
                })()}

                {/* Team members */}
                {currentProject.members?.map(memberId => {
                  const p = users.find(u => u.id === memberId);
                  return (
                    <div key={memberId} className="flex items-center gap-2 text-xs text-slate-300">
                      <img
                        referrerPolicy="no-referrer"
                        src={p?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${p?.name || 'User'}`}
                        alt="Member"
                        className="w-5 h-5 rounded-full border border-slate-800"
                      />
                      <span className="truncate">{p?.name || memberId.substring(0, 8)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Directory of Platform Users */}
        <div className="border-t border-slate-800/80 pt-6">
          <div className="text-xs font-mono font-semibold tracking-wider text-slate-400 uppercase mb-3 px-2 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span>Colegas na Plataforma ({users.length})</span>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto px-2">
            {users.map(u => {
              const isMe = u.id === currentUser.uid;
              return (
                <div key={u.id} className="flex items-center justify-between text-xs text-slate-350 py-0.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      referrerPolicy="no-referrer"
                      src={u.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${u.name}`}
                      alt={u.name}
                      className="w-5.5 h-5.5 rounded-full border border-slate-850 flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-slate-200 font-medium">{u.name}</p>
                      <p className="text-[10px] text-slate-500 truncate font-mono">{u.email}</p>
                    </div>
                  </div>
                  {isMe && (
                    <span className="text-[9px] text-slate-500 font-semibold bg-slate-800 inline-block px-1 rounded flex-shrink-0">
                      Você
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Auth Profile Section Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/60 font-sans">
        <div className="flex items-center justify-between bg-slate-900/40 p-2.5 rounded-xl border border-slate-800/40">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              referrerPolicy="no-referrer"
              src={currentUser.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${currentUser.displayName || 'Me'}`}
              alt="My Avatar"
              className="w-9 h-9 rounded-full border-2 border-indigo-500/40 shadow-sm shadow-indigo-500/10 flex-shrink-0"
            />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate pr-1">
                {currentUser.displayName || 'Colaborador'}
              </p>
              <p className="text-[10px] text-indigo-400 font-mono truncate">
                {currentUser.email}
              </p>
            </div>
          </div>
          
          <button
            onClick={onLogout}
            id="logout-btn"
            className="p-1.5 bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-red-400 rounded-lg border border-slate-700/60 transition cursor-pointer"
            title="Sair da Conta"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
