interface ExternalMember {
  id: string;
  name: string;
  email: string;
  cv?: string;
  profile_pic?: string;
  created_at: string;
}

interface CreateExternalMemberData {
  name: string;
  email: string;
  cv?: File;
  profile_pic?: File;
}

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

export async function createExternalMember(data: CreateExternalMemberData): Promise<ExternalMember> {
  const formData = new FormData();
  
  formData.append('name', data.name);
  formData.append('email', data.email);
  
  if (data.cv) {
    formData.append('cv', data.cv);
  }
  
  if (data.profile_pic) {
    formData.append('profile_pic', data.profile_pic);
  }

  const response = await fetch('http://localhost:8000/api/external-members/', {
    method: 'POST',
    headers: getAuthHeaders(), // Don't set Content-Type for FormData
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Create external member error:', response.status, errorText);
    throw new Error(`Failed to create external member: ${response.status} ${errorText}`);
  }

  return response.json();
}

export async function getExternalMembers(): Promise<ExternalMember[]> {
  const response = await fetch('http://localhost:8000/api/external-members/', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Get external members error:', response.status, errorText);
    throw new Error(`Failed to get external members: ${response.status} ${errorText}`);
  }

  return response.json();
}

export type { ExternalMember, CreateExternalMemberData };
