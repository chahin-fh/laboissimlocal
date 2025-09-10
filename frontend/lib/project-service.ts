const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface Project {
  id: string;
  title: string;
  description: string;
  image?: string;
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  start_date?: string;
  end_date?: string;
  created_by: string;
  created_by_name: string;
  team_members: string[];
  team_members_names: string[];
  created_at: string;
  updated_at: string;
  documents: ProjectDocument[];
  documents_count: number;
}

export interface ProjectDocument {
  id: string;
  name: string;
  file: string;
  uploaded_by: string;
  uploaded_by_name: string;
  uploaded_at: string;
  file_type: string;
  size: number;
}

export interface CreateProjectData {
  title: string;
  description: string;
  image?: File | null;
  status?: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  start_date?: string;
  end_date?: string;
  team_members?: string[];
}

export interface UpdateProjectData extends Partial<CreateProjectData> {
  id: string;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

const getAuthHeadersForFile = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
  };
};

// Project CRUD operations
export const getProjects = async (): Promise<Project[]> => {
  const response = await fetch(`${API_URL}/api/projects/`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch projects');
  }

  return response.json();
};

export const getProject = async (id: string): Promise<Project> => {
  const response = await fetch(`${API_URL}/api/projects/${id}/`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch project');
  }

  return response.json();
};

export const createProject = async (projectData: CreateProjectData): Promise<Project> => {
  const formData = new FormData();
  
  // Add text fields
  formData.append('title', projectData.title);
  formData.append('description', projectData.description);
  if (projectData.status) formData.append('status', projectData.status);
  if (projectData.priority) formData.append('priority', projectData.priority);
  if (projectData.start_date) formData.append('start_date', projectData.start_date);
  if (projectData.end_date) formData.append('end_date', projectData.end_date);
  
  // Add image if provided
  if (projectData.image) {
    formData.append('image', projectData.image);
  }
  
  // Add team members
  if (projectData.team_members && projectData.team_members.length > 0) {
    projectData.team_members.forEach(memberId => {
      formData.append('team_members', memberId);
    });
  }

  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/api/projects/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      // Don't set Content-Type, let browser set it with boundary for FormData
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to create project');
  }

  return response.json();
};

export const updateProject = async (projectData: UpdateProjectData): Promise<Project> => {
  const { id, ...data } = projectData;
  const response = await fetch(`${API_URL}/api/projects/${id}/`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to update project');
  }

  return response.json();
};

export const deleteProject = async (id: string): Promise<void> => {
  const response = await fetch(`${API_URL}/api/projects/${id}/`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to delete project');
  }
};

// Team member management
export const addTeamMember = async (projectId: string, userId: string): Promise<void> => {
  const response = await fetch(`${API_URL}/api/projects/${projectId}/add_team_member/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ user_id: userId }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to add team member');
  }
};

export const removeTeamMember = async (projectId: string, userId: string): Promise<void> => {
  const response = await fetch(`${API_URL}/api/projects/${projectId}/remove_team_member/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ user_id: userId }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to remove team member');
  }
};

// Project document operations
export const getProjectDocuments = async (projectId: string): Promise<ProjectDocument[]> => {
  const response = await fetch(`${API_URL}/api/project-documents/?project_id=${projectId}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch project documents');
  }

  return response.json();
};

export const uploadProjectDocument = async (projectId: string, file: File): Promise<ProjectDocument> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('name', file.name);
  // Include both keys to satisfy different backends
  formData.append('project_id', String(projectId));
  formData.append('project', String(projectId));

  const response = await fetch(`${API_URL}/api/project-documents/`, {
    method: 'POST',
    headers: getAuthHeadersForFile(),
    body: formData,
  });

  if (!response.ok) {
    try {
      const errorData = await response.json();
      throw new Error(errorData.error || errorData.detail || JSON.stringify(errorData) || 'Failed to upload document');
    } catch (e) {
      const text = await response.text();
      throw new Error(text || 'Failed to upload document');
    }
  }

  return response.json();
};

export const deleteProjectDocument = async (documentId: string): Promise<void> => {
  const response = await fetch(`${API_URL}/api/project-documents/${documentId}/`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to delete document');
  }
};

// Utility functions
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getStatusColor = (status: Project['status']): string => {
  const colors = {
    planning: 'bg-yellow-100 text-yellow-700',
    active: 'bg-green-100 text-green-700',
    on_hold: 'bg-orange-100 text-orange-700',
    completed: 'bg-blue-100 text-blue-700',
    cancelled: 'bg-red-100 text-red-700',
  };
  return colors[status];
};

export const getPriorityColor = (priority: Project['priority']): string => {
  const colors = {
    low: 'bg-gray-100 text-gray-700',
    medium: 'bg-blue-100 text-blue-700',
    high: 'bg-orange-100 text-orange-700',
    urgent: 'bg-red-100 text-red-700',
  };
  return colors[priority];
};

export const getStatusLabel = (status: Project['status']): string => {
  const labels = {
    planning: 'En Planification',
    active: 'Actif',
    on_hold: 'En Pause',
    completed: 'Terminé',
    cancelled: 'Annulé',
  };
  return labels[status];
};

export const getPriorityLabel = (priority: Project['priority']): string => {
  const labels = {
    low: 'Faible',
    medium: 'Moyenne',
    high: 'Élevée',
    urgent: 'Urgente',
  };
  return labels[priority];
};
