/**
 * Data structures for Real-Time Collaborative Task Manager
 */

export interface UserProfile {
  id: string; // matches firebase auth uid
  name: string;
  email: string;
  avatarUrl: string;
  updatedAt: any;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  members: string[]; // List of developer user uids
  createdAt: any;
  updatedAt: any;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  assigneeId?: string;
  tags?: string[];
  createdBy: string;
  createdAt: any;
  updatedAt: any;
}

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  userName: string;
  userPhoto: string;
  text: string;
  createdAt: any;
}

export interface WorkspaceActivity {
  id: string;
  userId: string;
  userName: string;
  userPhoto: string;
  action: string;
  details: string;
  createdAt: any;
}
