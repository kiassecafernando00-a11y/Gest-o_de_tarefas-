import React, { useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut 
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { 
  auth, 
  db, 
  googleProvider, 
  handleFirestoreError, 
  OperationType 
} from './firebase';
import { Project, Task, UserProfile, WorkspaceActivity } from './types';
import Sidebar from './components/Sidebar';
import Column from './components/Column';
import TaskModal from './components/TaskModal';
import NewProjectModal from './components/NewProjectModal';
import NewTaskModal from './components/NewTaskModal';
import ActivityLog from './components/ActivityLog';
import { 
  LogIn, 
  Layers, 
  Loader2, 
  Sparkles, 
  Plus, 
  Search, 
  ArrowRight, 
  History,
  CheckCircle2,
  Lock,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Collections Data State
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activities, setActivities] = useState<WorkspaceActivity[]>([]);

  // Selected state
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Modals Toggle
  const [showNewProject, setShowNewProject] = useState(false);
  const [showNewTask, setShowNewTask] = useState(false);
  const [newTaskDefaultStatus, setNewTaskDefaultStatus] = useState<'todo' | 'in_progress' | 'review' | 'done'>('todo');
  const [showActivityLog, setShowActivityLog] = useState(true);

  // Error States
  const [authError, setAuthError] = useState('');

  // 1. Auth Sync and User Profile Creation
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setIsSyncing(true);
        try {
          // Sync profile to /users/{userId} matching rule validation
          const profileDocRef = doc(db, 'users', firebaseUser.uid);
          const profile: UserProfile = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || 'Colaborador Anônimo',
            email: firebaseUser.email || '',
            avatarUrl: firebaseUser.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${firebaseUser.displayName || 'User'}`,
            updatedAt: serverTimestamp()
          };
          await setDoc(profileDocRef, profile, { merge: true });
          setCurrentUser(firebaseUser);
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, `users/${firebaseUser.uid}`);
        } finally {
          setIsSyncing(false);
        }
      } else {
        setCurrentUser(null);
        // Clean active project/task states
        setActiveProjectId(null);
        setSelectedTask(null);
        setProjects([]);
        setTasks([]);
        setActivities([]);
      }
      setLoadingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Sync /users collection (Real-time roster)
  useEffect(() => {
    if (!currentUser) return;

    const rosterQuery = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(rosterQuery, (snapshot) => {
      const list: UserProfile[] = [];
      snapshot.forEach(docSnap => {
        list.push(docSnap.data() as UserProfile);
      });
      setUsers(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });

    return () => unsubscribe();
  }, [currentUser]);

  // 3. Sync Projects /projects (where members array-contains user.uid)
  useEffect(() => {
    if (!currentUser) return;

    const projectsQuery = query(
      collection(db, 'projects'),
      where('members', 'array-contains', currentUser.uid)
    );

    const unsubscribe = onSnapshot(projectsQuery, (snapshot) => {
      const list: Project[] = [];
      snapshot.forEach(docSnap => {
        list.push(docSnap.data() as Project);
      });
      setProjects(list);
      
      // Auto-select first project if nothing selected yet and projects exist
      if (list.length > 0 && !activeProjectId) {
        setActiveProjectId(list[0].id);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'projects');
    });

    return () => unsubscribe();
  }, [currentUser, activeProjectId]);

  // 4. Sync tasks and activities of selected project
  useEffect(() => {
    if (!currentUser || !activeProjectId) {
      setTasks([]);
      setActivities([]);
      return;
    }

    // A: Sync Tasks Subcollection
    const tasksQuery = query(collection(db, 'projects', activeProjectId, 'tasks'));
    const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
      const list: Task[] = [];
      snapshot.forEach(docSnap => {
        list.push(docSnap.data() as Task);
      });
      setTasks(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `projects/${activeProjectId}/tasks`);
    });

    // B: Sync Activities Subcollection (limit 30)
    const activitiesQuery = query(
      collection(db, 'projects', activeProjectId, 'activities'),
      orderBy('createdAt', 'desc'),
      limit(30)
    );
    const unsubscribeActivities = onSnapshot(activitiesQuery, (snapshot) => {
      const list: WorkspaceActivity[] = [];
      snapshot.forEach(docSnap => {
        const d = docSnap.data();
        list.push({
          id: docSnap.id,
          userId: d.userId,
          userName: d.userName,
          userPhoto: d.userPhoto,
          action: d.action,
          details: d.details,
          createdAt: d.createdAt ? d.createdAt.toDate() : new Date(),
        } as WorkspaceActivity);
      });
      setActivities(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `projects/${activeProjectId}/activities`);
    });

    return () => {
      unsubscribeTasks();
      unsubscribeActivities();
    };
  }, [currentUser, activeProjectId]);

  // Sync state for opening specific selected tasks on real-time changes
  useEffect(() => {
    if (selectedTask && tasks.length > 0) {
      const updated = tasks.find(t => t.id === selectedTask.id);
      if (updated) setSelectedTask(updated);
    }
  }, [tasks, selectedTask]);

  // --- ACTIONS HANDLERS ---

  const handleLogin = async () => {
    setAuthError('');
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e: any) {
      console.error(e);
      setAuthError('Falha no login com o Google. Por favor, tente novamente.');
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  const logActivity = async (projId: string, action: string, details: string) => {
    try {
      const meName = currentUser.displayName || 'Colaborador';
      const mePhoto = currentUser.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${meName}`;
      const activityPayload = {
        id: crypto.randomUUID(),
        userId: currentUser.uid,
        userName: meName,
        userPhoto: mePhoto,
        action,
        details,
        createdAt: serverTimestamp()
      };
      await addDoc(collection(db, 'projects', projId, 'activities'), activityPayload);
    } catch (err) {
      console.error('Falha ao auditar ação em tempo real:', err);
    }
  };

  const handleCreateProject = async (name: string, description: string) => {
    const projectId = crypto.randomUUID();
    const projectPath = `projects/${projectId}`;
    const projectDocRef = doc(db, 'projects', projectId);

    const projectPayload: Project = {
      id: projectId,
      name,
      description,
      ownerId: currentUser.uid,
      members: [currentUser.uid], // includes owner as member so 1 simple query gets all
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    try {
      await setDoc(projectDocRef, projectPayload);
      setActiveProjectId(projectId);
      await logActivity(projectId, 'criou o projeto', `"${name}"`);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, projectPath);
    }
  };

  const handleCreateTask = async (taskData: {
    title: string;
    description: string;
    status: 'todo' | 'in_progress' | 'review' | 'done';
    priority: 'low' | 'medium' | 'high';
    dueDate?: string;
    assigneeId?: string;
  }) => {
    if (!activeProjectId) return;

    const taskId = crypto.randomUUID();
    const taskPath = `projects/${activeProjectId}/tasks/${taskId}`;
    const taskDocRef = doc(db, 'projects', activeProjectId, 'tasks', taskId);

    const taskPayload: Task = {
      id: taskId,
      projectId: activeProjectId,
      title: taskData.title,
      description: taskData.description,
      status: taskData.status,
      priority: taskData.priority,
      dueDate: taskData.dueDate,
      assigneeId: taskData.assigneeId,
      createdBy: currentUser.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    try {
      await setDoc(taskDocRef, taskPayload);
      await logActivity(activeProjectId, 'adicionou a tarefa', `"${taskData.title}"`);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, taskPath);
    }
  };

  const handleUpdateTaskMetadata = async (updatedFields: Partial<Task>) => {
    if (!activeProjectId || !selectedTask) return;

    const taskPath = `projects/${activeProjectId}/tasks/${selectedTask.id}`;
    const taskDocRef = doc(db, 'projects', activeProjectId, 'tasks', selectedTask.id);

    try {
      await updateDoc(taskDocRef, {
        ...updatedFields,
        updatedAt: serverTimestamp()
      });
      
      const changeDesc = updatedFields.status !== selectedTask.status 
        ? `da etapa "${selectedTask.status}" para "${updatedFields.status}"` 
        : `detalhes`;

      await logActivity(activeProjectId, 'atualizou a tarefa', `"${selectedTask.title}" (${changeDesc})`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, taskPath);
    }
  };

  const handleMoveTaskStatus = async (task: Task, newStatus: 'todo' | 'in_progress' | 'review' | 'done') => {
    if (!activeProjectId) return;

    const taskPath = `projects/${activeProjectId}/tasks/${task.id}`;
    const taskDocRef = doc(db, 'projects', activeProjectId, 'tasks', task.id);

    try {
      await updateDoc(taskDocRef, {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      await logActivity(activeProjectId, 'moveu a tarefa', `"${task.title}" para o estágio "${newStatus}"`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, taskPath);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!activeProjectId || !selectedTask) return;

    const taskPath = `projects/${activeProjectId}/tasks/${taskId}`;
    const taskDocRef = doc(db, 'projects', activeProjectId, 'tasks', taskId);

    try {
      await deleteDoc(taskDocRef);
      await logActivity(activeProjectId, 'removeu a tarefa', `"${selectedTask.title}"`);
      setSelectedTask(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, taskPath);
    }
  };

  const handleInviteMember = async (email: string) => {
    if (!activeProjectId) return;

    const currentProj = projects.find(p => p.id === activeProjectId);
    if (!currentProj) return;

    const invitee = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!invitee) return;

    const projectPath = `projects/${activeProjectId}`;
    const projectDocRef = doc(db, 'projects', activeProjectId);

    try {
      const updatedMembers = [...currentProj.members, invitee.id];
      await updateDoc(projectDocRef, {
        members: updatedMembers,
        updatedAt: serverTimestamp()
      });
      await logActivity(activeProjectId, 'incluiu o membro', `"${invitee.name}" (${invitee.email}) no projeto`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, projectPath);
    }
  };

  const triggerAddTaskModal = (status: 'todo' | 'in_progress' | 'review' | 'done') => {
    setNewTaskDefaultStatus(status);
    setShowNewTask(true);
  };

  // --- RENDERS ---

  if (loadingAuth) {
    return (
      <div className="flex flex-col h-screen w-screen items-center justify-center bg-slate-50 font-sans">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-3" />
        <p className="text-sm font-medium text-slate-500">Sincronizando ambiente seguro...</p>
      </div>
    );
  }

  // A: Landing & Authorizations View
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row font-sans overflow-hidden">
        
        {/* Presentation Hero Column */}
        <div className="md:w-1/2 p-10 md:p-16 flex flex-col justify-between relative bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 border-r border-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600 rounded-lg text-white">
              <Layers className="w-5 h-5 text-indigo-150" />
            </div>
            <h1 className="font-display font-bold text-lg text-white tracking-tight">BoardFlow</h1>
          </div>

          <div className="my-12 space-y-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-505/10 border border-indigo-500/20 rounded-full text-xs font-mono font-medium text-indigo-300">
              <Sparkles className="w-3.5 h-3.5" />
              Real-Time Collab Sync
            </span>
            <h2 className="font-display font-extrabold text-3xl md:text-5xl leading-tight text-white tracking-tight">
              Gerencie suas tarefas em <span className="bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">tempo real</span>
            </h2>
            <p className="text-slate-400 text-sm md:text-base leading-relaxed max-w-lg">
              Uma ferramenta projetada para equipes dinâmicas que querem coordenar fluxos Kanban de trabalho, trocar feedbacks e sincronizar estados sem precisar atualizar a página.
            </p>

            <div className="space-y-3.5 pt-4">
              <div className="flex items-start gap-3">
                <div className="p-1 bg-slate-900 rounded border border-slate-800 text-emerald-400 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <p className="text-sm text-slate-350"><strong className="text-slate-200">Segurança Hardened:</strong> Permissões e integridade de identidades verificadas via Firebase.</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-1 bg-slate-900 rounded border border-slate-800 text-emerald-400 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <p className="text-sm text-slate-350"><strong className="text-slate-200">Estágios Dinâmicos:</strong> Arraste e posicione tarefas em Todo, Doing, Review ou Done.</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-1 bg-slate-900 rounded border border-slate-800 text-emerald-400 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <p className="text-sm text-slate-350"><strong className="text-slate-200">Chat & Discussões:</strong> Envie comentários em canais que atualizam instantaneamente.</p>
              </div>
            </div>
          </div>

          <p className="text-[11px] font-mono text-slate-500">
            Powered by Google Cloud & Firebase Firestore Engine.
          </p>
        </div>

        {/* Login Credentials Gate Column */}
        <div className="md:w-1/2 flex flex-col justify-center items-center p-8 bg-slate-950 relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_120%,rgba(99,102,241,0.08),transparent_50%)]" />

          <div className="w-full max-w-sm space-y-8 relative z-10 text-center md:text-left">
            <div>
              <h3 className="font-display font-bold text-2xl text-white tracking-tight">Comece a Colaborar</h3>
              <p className="text-slate-450 text-xs mt-2.5 leading-relaxed">
                Autentique-se com sua conta para acessar seus projetos compartilhados e sincronizar o progresso ao vivo.
              </p>
            </div>

            <button
              id="google-signin-btn"
              onClick={handleLogin}
              className="w-full bg-white hover:bg-slate-50 text-slate-900 font-semibold py-3.5 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3 cursor-pointer group"
            >
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span>Entrar com o Google</span>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition" />
            </button>

            {authError && (
              <div className="p-3 bg-rose-950/20 border border-rose-900/30 rounded-xl text-xs text-rose-400 font-medium">
                {authError}
              </div>
            )}

            <div className="pt-6 border-t border-slate-900">
              <p className="text-[10px] text-slate-500 leading-normal">
                Ao fazer login, você concorda com o provisionamento automático de perfil colaborativo para identificar suas alterações.
              </p>
            </div>
          </div>

        </div>

      </div>
    );
  }

  // B: Core Workspace Hub Layout
  const activeProject = projects.find(p => p.id === activeProjectId);
  
  // Categorized Tasks
  const todoTasks = tasks.filter(t => t.status === 'todo');
  const activeTasks = tasks.filter(t => t.status === 'in_progress');
  const reviewTasks = tasks.filter(t => t.status === 'review');
  const doneTasks = tasks.filter(t => t.status === 'done');

  return (
    <div className="h-screen w-screen flex bg-slate-50 text-slate-800 font-sans overflow-hidden">
      
      {/* Sidebar navigation */}
      <Sidebar
        currentUser={currentUser}
        projects={projects}
        activeProjectId={activeProjectId}
        onSelectProject={setActiveProjectId}
        onOpenNewProject={() => setShowNewProject(true)}
        users={users}
        onInviteMember={handleInviteMember}
        onLogout={handleLogout}
      />

      {/* Main Container Area */}
      <main id="main-content" className={`flex-1 flex flex-col ml-80 ${showActivityLog ? 'lg:mr-80' : ''} transition-all duration-300 h-full overflow-hidden`}>
        
        {/* Workspace Top Bar */}
        <header className="px-8 py-5 border-b border-slate-200/80 bg-white flex items-center justify-between shadow-xs flex-shrink-0">
          <div>
            {activeProject ? (
              <>
                <h2 className="font-display font-bold text-slate-900 text-lg leading-tight flex items-center gap-2">
                  <span>{activeProject.name}</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1 max-w-xl truncate">
                  {activeProject.description}
                </p>
              </>
            ) : (
              <>
                <h2 className="font-display font-bold text-slate-900 text-lg">Selecione um Projeto</h2>
                <p className="text-xs text-slate-500 mt-0.5">Abra a barra para gerenciar seus projetos cadastrados.</p>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              id="header-activity-toggle"
              onClick={() => setShowActivityLog(!showActivityLog)}
              className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                showActivityLog 
                  ? 'bg-slate-100 border-slate-300 text-indigo-650' 
                  : 'bg-white border-slate-200 text-slate-500 hover:text-slate-750'
              } hidden lg:flex`}
              title="Alternar Atividades Recentes"
            >
              <History className="w-4 h-4" />
              <span>Atividades</span>
            </button>

            {activeProject && (
              <button
                id="header-add-task-btn"
                onClick={() => triggerAddTaskModal('todo')}
                className="bg-indigo-600 hover:bg-indigo-505 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-md shadow-indigo-600/10 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Nova Tarefa</span>
              </button>
            )}
          </div>
        </header>

        {/* Board Canvas Area */}
        <div className="flex-1 overflow-x-auto p-8 bg-[#f8fafc]">
          {activeProject ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 h-full items-start">
              
              <Column
                status="todo"
                title="A Fazer"
                tasks={todoTasks}
                users={users}
                commentsMap={{}}
                onSelectTask={setSelectedTask}
                onMoveTask={handleMoveTaskStatus}
                onAddTask={triggerAddTaskModal}
              />

              <Column
                status="in_progress"
                title="Em Progresso"
                tasks={activeTasks}
                users={users}
                commentsMap={{}}
                onSelectTask={setSelectedTask}
                onMoveTask={handleMoveTaskStatus}
                onAddTask={triggerAddTaskModal}
              />

              <Column
                status="review"
                title="Revisão"
                tasks={reviewTasks}
                users={users}
                commentsMap={{}}
                onSelectTask={setSelectedTask}
                onMoveTask={handleMoveTaskStatus}
                onAddTask={triggerAddTaskModal}
              />

              <Column
                status="done"
                title="Concluído"
                tasks={doneTasks}
                users={users}
                commentsMap={{}}
                onSelectTask={setSelectedTask}
                onMoveTask={handleMoveTaskStatus}
                onAddTask={triggerAddTaskModal}
              />

            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto p-4">
              <Layers className="w-12 h-12 text-slate-300 stroke-[1.5] mb-4 pulse-glow" />
              <h3 className="font-display font-extrabold text-slate-800 text-base">Crie seu primeiro projeto</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Você ainda não criou nenhum projeto colaborativo. Crie um novo espaço agora clicando no botão abaixo!
              </p>
              <button
                onClick={() => setShowNewProject(true)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs px-5 py-2.5 rounded-xl transition mt-5 flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Criar Projeto</span>
              </button>
            </div>
          )}
        </div>

      </main>

      {/* Real-time audit Activity log timeline drawer */}
      {showActivityLog && activeProjectId && (
        <ActivityLog activities={activities} />
      )}

      {/* --- FLOATING MODALS GATE --- */}

      <AnimatePresence>
        {/* Modal: Details / Update Task */}
        {selectedTask && activeProjectId && (
          <TaskModal
            task={selectedTask}
            projectId={activeProjectId}
            projectOwnerId={projects.find(p => p.id === activeProjectId)?.ownerId || ''}
            currentUserId={currentUser.uid}
            users={users}
            onClose={() => setSelectedTask(null)}
            onUpdateTask={handleUpdateTaskMetadata}
            onDeleteTask={handleDeleteTask}
          />
        )}

        {/* Modal: New Project */}
        {showNewProject && (
          <NewProjectModal
            onClose={() => setShowNewProject(false)}
            onCreateProject={handleCreateProject}
          />
        )}

        {/* Modal: New Task */}
        {showNewTask && (
          <NewTaskModal
            defaultStatus={newTaskDefaultStatus}
            users={users}
            onClose={() => setShowNewTask(false)}
            onCreateTask={handleCreateTask}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
