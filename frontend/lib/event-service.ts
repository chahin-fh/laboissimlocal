interface Event {
  id: string
  title: string
  description: string
  event_type: 'conference' | 'seminar' | 'workshop' | 'meeting' | 'presentation' | 'other'
  location: string
  start_date: string
  end_date: string
  max_participants?: number
  is_active: boolean
  created_by: string
  created_by_name: string
  created_at: string
  updated_at: string
  registered_count: number
  is_full: boolean
  registrations: EventRegistration[]
  user_registration?: EventRegistration | null
}

interface EventRegistration {
  id: string
  event: string
  user: string
  user_name: string
  user_email: string
  user_full_name: string
  status: 'pending' | 'confirmed' | 'cancelled'
  registration_date: string
  notes?: string
}

interface CreateEventData {
  title: string
  description: string
  event_type: Event['event_type']
  location: string
  start_date: string
  end_date: string
  max_participants?: number
}

interface UpdateEventData extends Partial<CreateEventData> {
  is_active?: boolean
}

const API_BASE_URL = 'http://localhost:8000/api'

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token')
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  }
}

// Get all events
export const getEvents = async (): Promise<Event[]> => {
  console.log('Fetching events from:', `${API_BASE_URL}/events/`)
  
  const response = await fetch(`${API_BASE_URL}/events/`, {
    headers: getAuthHeaders(),
  })
  
  console.log('Events response status:', response.status)
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    console.error('Events fetch error:', errorData)
    console.error('Events response status:', response.status)
    throw new Error(errorData.error || errorData.detail || `Failed to fetch events: ${response.status}`)
  }
  
  return response.json()
}

// Get a single event
export const getEvent = async (id: string): Promise<Event> => {
  const response = await fetch(`${API_BASE_URL}/events/${id}/`, {
    headers: getAuthHeaders(),
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch event')
  }
  
  return response.json()
}

// Create a new event
export const createEvent = async (eventData: CreateEventData): Promise<Event> => {
  console.log('Sending event data:', eventData)
  console.log('API URL:', `${API_BASE_URL}/events/`)
  console.log('Headers:', getAuthHeaders())
  
  const response = await fetch(`${API_BASE_URL}/events/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(eventData),
  })
  
  console.log('Response status:', response.status)
  console.log('Response headers:', response.headers)
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    console.error('Event creation error:', errorData)
    console.error('Response status:', response.status)
    console.error('Response text:', await response.text().catch(() => 'Could not read response'))
    throw new Error(errorData.error || errorData.detail || `Failed to create event: ${response.status}`)
  }
  
  return response.json()
}

// Update an event
export const updateEvent = async (id: string, eventData: UpdateEventData): Promise<Event> => {
  const response = await fetch(`${API_BASE_URL}/events/${id}/`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(eventData),
  })
  
  if (!response.ok) {
    throw new Error('Failed to update event')
  }
  
  return response.json()
}

// Delete an event
export const deleteEvent = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/events/${id}/`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  
  if (!response.ok) {
    throw new Error('Failed to delete event')
  }
}

// Register for an event
export const registerForEvent = async (eventId: string, notes?: string): Promise<EventRegistration> => {
  const response = await fetch(`${API_BASE_URL}/events/${eventId}/register/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ notes }),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to register for event')
  }
  
  return response.json()
}

// Unregister from an event
export const unregisterFromEvent = async (eventId: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/events/${eventId}/unregister/`, {
    method: 'POST',
    headers: getAuthHeaders(),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to unregister from event')
  }
}

// Get event registrations (admin only)
export const getEventRegistrations = async (eventId: string): Promise<EventRegistration[]> => {
  const response = await fetch(`${API_BASE_URL}/events/${eventId}/registrations/`, {
    headers: getAuthHeaders(),
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch event registrations')
  }
  
  return response.json()
}

// Update registration status (admin only)
export const updateRegistrationStatus = async (
  eventId: string, 
  registrationId: string, 
  status: EventRegistration['status']
): Promise<EventRegistration> => {
  const response = await fetch(`${API_BASE_URL}/events/${eventId}/update_registration_status/`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      registration_id: registrationId,
      status,
    }),
  })
  
  if (!response.ok) {
    throw new Error('Failed to update registration status')
  }
  
  return response.json()
}

// Get user's event registrations
export const getUserRegistrations = async (): Promise<EventRegistration[]> => {
  const response = await fetch(`${API_BASE_URL}/event-registrations/`, {
    headers: getAuthHeaders(),
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch user registrations')
  }
  
  return response.json()
}

export type { Event, EventRegistration, CreateEventData, UpdateEventData }
