"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Users,
  MessageSquare,
  UserPlus,
  Settings,
  BarChart3,
  Shield,
  Trash2,
  Ban,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Save,
  Activity,
  UserCheck,
  Mail,
  Send,
  Calendar,
  Plus,
} from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { useContentManager, type SiteContent } from "@/lib/content-manager"
import { 
  getEvents, 
  createEvent, 
  updateEvent, 
  deleteEvent, 
  getEventRegistrations,
  updateRegistrationStatus,
  type Event,
  type EventRegistration,
  type CreateEventData
} from "@/lib/event-service"

export default function AdminPage() {
  const {
    user,
    loading,
    users,
    messages,
    accountRequests,
    internalMessages,
    connectedUsers,
    banUser,
    unbanUser,
    deleteUser,
    updateUserRole,
    updateMessageStatus,
    updateAccountRequest,
    sendInternalMessage,
    markMessageAsRead,
    getConversation,
    getUnreadCount,
  } = useAuth()
  const { content, updateContent } = useContentManager()
  
  // All useState hooks must be at the top level
  const [editingContent, setEditingContent] = useState<SiteContent>(content)
  const [activeTab, setActiveTab] = useState("dashboard")
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [eventForm, setEventForm] = useState<CreateEventData>({
    title: "",
    description: "",
    event_type: "other",
    location: "",
    start_date: "",
    end_date: "",
    max_participants: undefined,
  })
  const [showEventForm, setShowEventForm] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [eventRegistrations, setEventRegistrations] = useState<EventRegistration[]>([])
  const [unreadInternalMessages, setUnreadInternalMessages] = useState(0)
  
  const router = useRouter()

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      router.push("/login")
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      getUnreadCount()
        .then(count => setUnreadInternalMessages(count))
        .catch(error => console.error('Error fetching unread count:', error))
      
      fetchEvents()
    }
  }, [user])

  if (loading) {
    return null // or a spinner
  }
  if (!user || user.role !== "admin") {
    return null
  }

  const handleContentSave = () => {
    updateContent(editingContent)
  }

  const handleInputChange = (section: keyof SiteContent, field: string, value: string | number) => {
    setEditingContent((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }))
  }

  // Event management functions
  const fetchEvents = async () => {
    try {
      const eventsData = await getEvents()
      setEvents(eventsData)
    } catch (error) {
      console.error('Error fetching events:', error)
      // Show user-friendly error message
      alert('Erreur lors du chargement des événements. Veuillez réessayer.')
    }
  }

  const handleCreateEvent = async () => {
    // Validate form data
    if (!eventForm.title || !eventForm.description || !eventForm.location || !eventForm.start_date || !eventForm.end_date) {
      alert('Veuillez remplir tous les champs obligatoires')
      return
    }
    
    // Validate dates
    const startDate = new Date(eventForm.start_date)
    const endDate = new Date(eventForm.end_date)
    if (endDate <= startDate) {
      alert('La date de fin doit être après la date de début')
      return
    }
    
    // Validate max participants
    if (eventForm.max_participants !== undefined && eventForm.max_participants <= 0) {
      alert('Le nombre maximum de participants doit être supérieur à 0')
      return
    }
    
    try {
      console.log('Creating event with data:', eventForm)
      await createEvent(eventForm)
      setEventForm({
        title: "",
        description: "",
        event_type: "other",
        location: "",
        start_date: "",
        end_date: "",
        max_participants: undefined,
      })
      setShowEventForm(false)
      fetchEvents()
      alert('Événement créé avec succès!')
    } catch (error) {
      console.error('Error creating event:', error)
      alert(error instanceof Error ? error.message : 'Erreur lors de la création de l\'événement')
    }
  }

  const handleUpdateEvent = async () => {
    if (!selectedEvent) return
    
    // Validate form data
    if (!eventForm.title || !eventForm.description || !eventForm.location || !eventForm.start_date || !eventForm.end_date) {
      alert('Veuillez remplir tous les champs obligatoires')
      return
    }
    
    // Validate dates
    const startDate = new Date(eventForm.start_date)
    const endDate = new Date(eventForm.end_date)
    if (endDate <= startDate) {
      alert('La date de fin doit être après la date de début')
      return
    }
    
    // Validate max participants
    if (eventForm.max_participants !== undefined && eventForm.max_participants <= 0) {
      alert('Le nombre maximum de participants doit être supérieur à 0')
      return
    }
    
    try {
      await updateEvent(selectedEvent.id, eventForm)
      setShowEventForm(false)
      setSelectedEvent(null)
      setIsEditing(false)
      fetchEvents()
      alert('Événement mis à jour avec succès!')
    } catch (error) {
      console.error('Error updating event:', error)
      alert(error instanceof Error ? error.message : 'Erreur lors de la mise à jour de l\'événement')
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) {
      return
    }
    
    try {
      await deleteEvent(eventId)
      fetchEvents()
      alert('Événement supprimé avec succès!')
    } catch (error) {
      console.error('Error deleting event:', error)
      alert('Erreur lors de la suppression de l\'événement')
    }
  }

  const handleEditEvent = (event: Event) => {
    setSelectedEvent(event)
    setEventForm({
      title: event.title,
      description: event.description,
      event_type: event.event_type,
      location: event.location,
      start_date: formatDateForDisplay(event.start_date),
      end_date: formatDateForDisplay(event.end_date),
      max_participants: event.max_participants,
    })
    setIsEditing(true)
    setShowEventForm(true)
  }

  const fetchEventRegistrations = async (eventId: string) => {
    try {
      const registrations = await getEventRegistrations(eventId)
      setEventRegistrations(registrations)
    } catch (error) {
      console.error('Error fetching event registrations:', error)
      alert('Erreur lors du chargement des inscriptions')
    }
  }

  const handleUpdateRegistrationStatus = async (registrationId: string, status: EventRegistration['status']) => {
    if (!selectedEvent) return
    try {
      await updateRegistrationStatus(selectedEvent.id, registrationId, status)
      fetchEventRegistrations(selectedEvent.id)
      alert('Statut mis à jour avec succès!')
    } catch (error) {
      console.error('Error updating registration status:', error)
      alert('Erreur lors de la mise à jour du statut')
    }
  }

  // Helper function to format dates for display
  const formatDateForDisplay = (dateString: string): string => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toISOString().slice(0, 16) // Format for datetime-local input
  }

  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter((u) => u.status === "active").length,
    bannedUsers: users.filter((u) => u.status === "banned").length,
    newMessages: messages.filter((m) => m.status === "new").length,
    pendingRequests: accountRequests.filter((r) => r.status === "pending").length,
    connectedNow: connectedUsers.length,
    unreadInternalMessages,
  }

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4 },
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20 pt-20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gradient heading-modern mb-2">Administration</h1>
              <p className="text-professional">Gestion complète de la plateforme</p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className="gradient-primary text-white px-4 py-2">
                <Shield className="h-4 w-4 mr-2" />
                Administrateur
              </Badge>
              {stats.unreadInternalMessages > 0 && (
                <Badge className="bg-red-500 text-white px-3 py-1">
                  {stats.unreadInternalMessages} nouveaux messages
                </Badge>
              )}
            </div>
          </div>
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-7 bg-white/80 backdrop-blur-sm border border-indigo-100 rounded-xl p-1">
            <TabsTrigger value="dashboard" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Tableau de bord</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Utilisateurs</span>
            </TabsTrigger>
            <TabsTrigger value="events" className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Événements</span>
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex items-center space-x-2">
              <UserPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Demandes</span>
            </TabsTrigger>
            <TabsTrigger value="internal" className="flex items-center space-x-2">
              <Mail className="h-4 w-4" />
              <span className="hidden sm:inline">Messagerie</span>
              {stats.unreadInternalMessages > 0 && (
                <Badge className="bg-red-500 text-white text-xs px-1 py-0 min-w-[16px] h-4">
                  {stats.unreadInternalMessages}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center space-x-2">
              <Edit className="h-4 w-4" />
              <span className="hidden sm:inline">Contenu</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Paramètres</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard">
            <motion.div
              variants={{ animate: { transition: { staggerChildren: 0.1 } } }}
              initial="initial"
              animate="animate"
              className="space-y-6"
            >
              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                {[
                  { label: "Utilisateurs", value: stats.totalUsers, icon: Users, color: "indigo" },
                  { label: "Actifs", value: stats.activeUsers, icon: Activity, color: "green" },
                  { label: "Bannis", value: stats.bannedUsers, icon: Ban, color: "red" },
                  {
                    label: "Messages",
                    value: stats.newMessages,
                    icon: MessageSquare,
                    color: "blue",
                    notification: stats.newMessages > 0,
                  },
                  {
                    label: "Demandes",
                    value: stats.pendingRequests,
                    icon: UserPlus,
                    color: "amber",
                    notification: stats.pendingRequests > 0,
                  },
                  { label: "Connectés", value: stats.connectedNow, icon: Activity, color: "purple" },
                  {
                    label: "Messagerie",
                    value: stats.unreadInternalMessages,
                    icon: Mail,
                    color: "red",
                    notification: stats.unreadInternalMessages > 0,
                  },
                ].map((stat, index) => (
                  <motion.div key={index} variants={fadeInUp}>
                    <Card className="card-professional border-0 shadow-lg hover-lift relative">
                      {stat.notification && (
                        <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
                      )}
                      <CardContent className="p-4 text-center">
                        <div
                          className={`w-12 h-12 bg-${stat.color}-100 rounded-xl flex items-center justify-center mx-auto mb-3`}
                        >
                          <stat.icon className={`h-6 w-6 text-${stat.color}-600`} />
                        </div>
                        <div className="text-2xl font-bold text-slate-800">{stat.value}</div>
                        <div className="text-sm text-slate-600">{stat.label}</div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Recent Activity */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="card-professional border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <MessageSquare className="h-5 w-5 mr-2 text-indigo-600" />
                      Messages récents
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {messages.slice(0, 3).map((message) => (
                        <div key={message.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                          <div>
                            <p className="font-medium text-slate-800">{message.name}</p>
                            <p className="text-sm text-slate-600">{message.subject}</p>
                          </div>
                          <Badge
                            className={
                              message.status === "new" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"
                            }
                          >
                            {message.status === "new" ? "Nouveau" : "Lu"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="card-professional border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <UserPlus className="h-5 w-5 mr-2 text-amber-600" />
                      Demandes de compte
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {accountRequests.slice(0, 3).map((request) => (
                        <div key={request.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                          <div>
                            <p className="font-medium text-slate-800">{request.name}</p>
                            <p className="text-sm text-slate-600">{request.email}</p>
                          </div>
                          <Badge className="bg-amber-100 text-amber-700">En attente</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card className="card-professional border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-indigo-600" />
                  Gestion des utilisateurs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((userItem) => (
                    <div key={userItem.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            userItem.status === "active" ? "bg-green-100" : "bg-red-100"
                          }`}
                        >
                          <Users
                            className={`h-5 w-5 ${userItem.status === "active" ? "text-green-600" : "text-red-600"}`}
                          />
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{userItem.name}</p>
                          <p className="text-sm text-slate-600">{userItem.email}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge
                              className={
                                userItem.role === "admin"
                                  ? "bg-purple-100 text-purple-700"
                                  : "bg-blue-100 text-blue-700"
                              }
                            >
                              {userItem.role === "admin" ? "Admin" : "Membre"}
                            </Badge>
                            <Badge
                              className={
                                userItem.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                              }
                            >
                              {userItem.status === "active" ? "Actif" : "Banni"}
                            </Badge>
                            {userItem.verified && (
                              <Badge className="bg-blue-100 text-blue-700">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Vérifié
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Select
                          value={userItem.role}
                          onValueChange={(role: "member" | "admin") => updateUserRole(userItem.id, role)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="member">Membre</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        {userItem.status === "active" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => banUser(userItem.id)}
                            className="border-red-300 text-red-600 hover:bg-red-50"
                          >
                            <Ban className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => unbanUser(userItem.id)}
                            className="border-green-300 text-green-600 hover:bg-green-50"
                          >
                            <UserCheck className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteUser(userItem.id)}
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>


          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events">
            <Card className="card-professional border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-green-600" />
                    Gestion des Événements
                  </CardTitle>
                  <Button onClick={() => setShowEventForm(true)} className="btn-modern text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Nouvel Événement
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {events.map((event) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-slate-50 rounded-lg border"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-medium text-slate-800">{event.title}</h4>
                            <Badge className="bg-green-100 text-green-700">{event.event_type}</Badge>
                            {!event.is_active && <Badge className="bg-red-100 text-red-700">Inactif</Badge>}
                          </div>
                          <p className="text-sm text-slate-600 mb-2">{event.description}</p>
                          <div className="flex items-center space-x-4 text-sm text-slate-500">
                            <span>📍 {event.location}</span>
                            <span>📅 {new Date(event.start_date).toLocaleDateString()}</span>
                            <span>👥 {event.registered_count} inscrits</span>
                            {event.max_participants && (
                              <span>/ {event.max_participants} max</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedEvent(event)
                              fetchEventRegistrations(event.id)
                            }}
                            className="border-blue-300 text-blue-600 hover:bg-blue-50"
                          >
                            <Users className="h-4 w-4 mr-1" />
                            Inscrits
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditEvent(event)}
                            className="border-amber-300 text-amber-600 hover:bg-amber-50"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Modifier
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteEvent(event.id)}
                            className="border-red-300 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Supprimer
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Event Form Modal */}
            {showEventForm && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                onClick={() => setShowEventForm(false)}
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3 className="text-xl font-bold mb-4">
                    {isEditing ? 'Modifier l\'événement' : 'Nouvel événement'}
                  </h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="title">Titre</Label>
                        <Input
                          id="title"
                          value={eventForm.title}
                          onChange={(e) => setEventForm(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="Titre de l'événement"
                        />
                      </div>
                      <div>
                        <Label htmlFor="event_type">Type d'événement</Label>
                        <Select value={eventForm.event_type} onValueChange={(value) => setEventForm(prev => ({ ...prev, event_type: value as any }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="conference">Conférence</SelectItem>
                            <SelectItem value="seminar">Séminaire</SelectItem>
                            <SelectItem value="workshop">Atelier</SelectItem>
                            <SelectItem value="meeting">Réunion</SelectItem>
                            <SelectItem value="presentation">Présentation</SelectItem>
                            <SelectItem value="other">Autre</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={eventForm.description}
                        onChange={(e) => setEventForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Description de l'événement"
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="location">Lieu</Label>
                        <Input
                          id="location"
                          value={eventForm.location}
                          onChange={(e) => setEventForm(prev => ({ ...prev, location: e.target.value }))}
                          placeholder="Lieu de l'événement"
                        />
                      </div>
                      <div>
                        <Label htmlFor="max_participants">Nombre max de participants</Label>
                        <Input
                          id="max_participants"
                          type="number"
                          value={eventForm.max_participants || ''}
                          onChange={(e) => setEventForm(prev => ({ ...prev, max_participants: e.target.value ? parseInt(e.target.value) : undefined }))}
                          placeholder="Illimité si vide"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="start_date">Date et heure de début</Label>
                        <Input
                          id="start_date"
                          type="datetime-local"
                          value={eventForm.start_date}
                          onChange={(e) => setEventForm(prev => ({ ...prev, start_date: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="end_date">Date et heure de fin</Label>
                        <Input
                          id="end_date"
                          type="datetime-local"
                          value={eventForm.end_date}
                          onChange={(e) => setEventForm(prev => ({ ...prev, end_date: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        onClick={isEditing ? handleUpdateEvent : handleCreateEvent} 
                        className="btn-modern text-white flex-1"
                        disabled={!eventForm.title || !eventForm.description || !eventForm.location || !eventForm.start_date || !eventForm.end_date}
                      >
                        {isEditing ? 'Mettre à jour' : 'Créer'}
                      </Button>
                      <Button variant="outline" onClick={() => {
                        setShowEventForm(false)
                        setIsEditing(false)
                        setSelectedEvent(null)
                      }}>
                        Annuler
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* Event Registrations Modal */}
            {selectedEvent && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                onClick={() => setSelectedEvent(null)}
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3 className="text-xl font-bold mb-4">
                    Inscrits à "{selectedEvent.title}"
                  </h3>
                  <div className="space-y-4">
                    {eventRegistrations.map((registration) => (
                      <div key={registration.id} className="p-4 bg-slate-50 rounded-lg border">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-slate-800">{registration.user_full_name}</h4>
                            <p className="text-sm text-slate-600">{registration.user_email}</p>
                            <p className="text-sm text-slate-500">
                              Inscrit le {new Date(registration.registration_date).toLocaleDateString()}
                            </p>
                            {registration.notes && (
                              <p className="text-sm text-slate-700 mt-2">{registration.notes}</p>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge
                              className={
                                registration.status === "confirmed" ? "bg-green-100 text-green-700" :
                                registration.status === "pending" ? "bg-amber-100 text-amber-700" :
                                "bg-red-100 text-red-700"
                              }
                            >
                              {registration.status === "confirmed" ? "Confirmé" :
                               registration.status === "pending" ? "En attente" : "Annulé"}
                            </Badge>
                            <Select
                              value={registration.status}
                              onValueChange={(status) => handleUpdateRegistrationStatus(registration.id, status as any)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">En attente</SelectItem>
                                <SelectItem value="confirmed">Confirmé</SelectItem>
                                <SelectItem value="cancelled">Annulé</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    ))}
                    {eventRegistrations.length === 0 && (
                      <p className="text-center text-slate-500 py-8">Aucun inscrit pour le moment</p>
                    )}
                  </div>
                  <div className="mt-6">
                    <Button variant="outline" onClick={() => setSelectedEvent(null)}>
                      Fermer
                    </Button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </TabsContent>

          {/* Account Requests Tab */}
          <TabsContent value="requests">
            <Card className="card-professional border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <UserPlus className="h-5 w-5 mr-2 text-amber-600" />
                  Demandes de compte
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {accountRequests.map((request) => (
                    <div key={request.id} className="p-4 bg-slate-50 rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-slate-800">{request.name}</h4>
                          <p className="text-sm text-slate-600">{request.email}</p>
                          <p className="text-sm text-slate-500">{new Date(request.createdAt).toLocaleString()}</p>
                        </div>
                        <Badge
                          className={
                            request.status === "pending"
                              ? "bg-amber-100 text-amber-700"
                              : request.status === "approved"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                          }
                        >
                          {request.status === "pending"
                            ? "En attente"
                            : request.status === "approved"
                              ? "Approuvé"
                              : "Rejeté"}
                        </Badge>
                      </div>
                      <p className="text-slate-700 mb-4">{request.reason}</p>
                      {request.status === "pending" && (
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            onClick={async () => {
                              try {
                                await updateAccountRequest(request.id, "approved")
                              } catch (error) {
                                console.error('Error updating account request:', error)
                              }
                            }}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approuver
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              try {
                                await updateAccountRequest(request.id, "rejected")
                              } catch (error) {
                                console.error('Error updating account request:', error)
                              }
                            }}
                            className="border-red-300 text-red-600 hover:bg-red-50"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Rejeter
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Internal Messaging Tab */}
          <TabsContent value="internal">
            <Card className="card-professional border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Mail className="h-5 w-5 mr-2 text-indigo-600" />
                  Messagerie interne
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {internalMessages
                    .filter((m) => m.receiverId === user.id || m.senderId === user.id)
                    .map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-4 rounded-lg ${
                          message.status === "unread" && message.receiverId === user.id
                            ? "bg-blue-50 border border-blue-200"
                            : "bg-slate-50"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-medium text-slate-800">
                              {message.senderId === user.id
                                ? `À: ${message.receiverName}`
                                : `De: ${message.senderName}`}
                            </h4>
                            <p className="text-sm text-slate-500">{new Date(message.createdAt).toLocaleString()}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            {message.status === "unread" && message.receiverId === user.id && (
                              <Badge className="bg-red-100 text-red-700">Non lu</Badge>
                            )}
                            {message.senderId === user.id && (
                              <Badge className="bg-blue-100 text-blue-700">Envoyé</Badge>
                            )}
                          </div>
                        </div>
                        <h5 className="font-medium text-slate-800 mb-2">{message.subject}</h5>
                        <p className="text-slate-700 mb-4">{message.message}</p>
                        {message.status === "unread" && message.receiverId === user.id && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => markMessageAsRead(message.id)}
                            className="border-blue-300 text-blue-600 hover:bg-blue-50"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Marquer comme lu
                          </Button>
                        )}
                      </motion.div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Content Management Tab */}
          <TabsContent value="content">
            <Card className="card-professional border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Edit className="h-5 w-5 mr-2 text-indigo-600" />
                    Gestion du contenu
                  </div>
                  <Button onClick={handleContentSave} className="btn-modern text-white">
                    <Save className="h-4 w-4 mr-2" />
                    Sauvegarder
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="hero" className="space-y-6">
                  <TabsList className="grid w-full grid-cols-6">
                    <TabsTrigger value="hero">Accueil</TabsTrigger>
                    <TabsTrigger value="stats">Stats</TabsTrigger>
                    <TabsTrigger value="about">À propos</TabsTrigger>
                    <TabsTrigger value="team">Équipe</TabsTrigger>
                    <TabsTrigger value="expertise">Expertise</TabsTrigger>
                    <TabsTrigger value="contact">Contact</TabsTrigger>
                  </TabsList>

                  <TabsContent value="hero" className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="hero-title">Titre principal</Label>
                        <Input
                          id="hero-title"
                          value={editingContent.hero.title}
                          onChange={(e) => handleInputChange("hero", "title", e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="hero-subtitle">Sous-titre</Label>
                        <Input
                          id="hero-subtitle"
                          value={editingContent.hero.subtitle}
                          onChange={(e) => handleInputChange("hero", "subtitle", e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="hero-description">Description</Label>
                      <Textarea
                        id="hero-description"
                        value={editingContent.hero.description}
                        onChange={(e) => handleInputChange("hero", "description", e.target.value)}
                        className="mt-1"
                        rows={3}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="stats" className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <Label htmlFor="researchers">Chercheurs</Label>
                        <Input
                          id="researchers"
                          type="number"
                          value={editingContent.stats.researchers}
                          onChange={(e) => handleInputChange("stats", "researchers", Number.parseInt(e.target.value))}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="publications">Publications</Label>
                        <Input
                          id="publications"
                          type="number"
                          value={editingContent.stats.publications}
                          onChange={(e) => handleInputChange("stats", "publications", Number.parseInt(e.target.value))}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="awards">Prix reçus</Label>
                        <Input
                          id="awards"
                          type="number"
                          value={editingContent.stats.awards}
                          onChange={(e) => handleInputChange("stats", "awards", Number.parseInt(e.target.value))}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="events">Événements</Label>
                        <Input
                          id="events"
                          type="number"
                          value={editingContent.stats.events}
                          onChange={(e) => handleInputChange("stats", "events", Number.parseInt(e.target.value))}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="about" className="space-y-6">
                    <div>
                      <Label htmlFor="history-title">Titre de l'histoire</Label>
                      <Input
                        id="history-title"
                        value={editingContent.about.history.title}
                        onChange={(e) =>
                          setEditingContent((prev) => ({
                            ...prev,
                            about: {
                              ...prev.about,
                              history: {
                                ...prev.about.history,
                                title: e.target.value,
                              },
                            },
                          }))
                        }
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label>Contenu de l'histoire</Label>
                      {editingContent.about.history.content.map((paragraph, index) => (
                        <div key={index} className="mt-2">
                          <Textarea
                            value={paragraph}
                            onChange={(e) => {
                              const newContent = [...editingContent.about.history.content]
                              newContent[index] = e.target.value
                              setEditingContent((prev) => ({
                                ...prev,
                                about: {
                                  ...prev.about,
                                  history: {
                                    ...prev.about.history,
                                    content: newContent,
                                  },
                                },
                              }))
                            }}
                            rows={3}
                            placeholder={`Paragraphe ${index + 1}`}
                          />
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => {
                          setEditingContent((prev) => ({
                            ...prev,
                            about: {
                              ...prev.about,
                              history: {
                                ...prev.about.history,
                                content: [...prev.about.history.content, ""],
                              },
                            },
                          }))
                        }}
                      >
                        Ajouter un paragraphe
                      </Button>
                    </div>

                    <div>
                      <Label>Valeurs</Label>
                      {editingContent.about.history.values.map((value, index) => (
                        <div key={index} className="mt-2 p-4 border rounded-lg">
                          <Input
                            value={value.title}
                            onChange={(e) => {
                              const newValues = [...editingContent.about.history.values]
                              newValues[index] = { ...newValues[index], title: e.target.value }
                              setEditingContent((prev) => ({
                                ...prev,
                                about: {
                                  ...prev.about,
                                  history: {
                                    ...prev.about.history,
                                    values: newValues,
                                  },
                                },
                              }))
                            }}
                            placeholder="Titre de la valeur"
                            className="mb-2"
                          />
                          <Textarea
                            value={value.description}
                            onChange={(e) => {
                              const newValues = [...editingContent.about.history.values]
                              newValues[index] = { ...newValues[index], description: e.target.value }
                              setEditingContent((prev) => ({
                                ...prev,
                                about: {
                                  ...prev.about,
                                  history: {
                                    ...prev.about.history,
                                    values: newValues,
                                  },
                                },
                              }))
                            }}
                            placeholder="Description de la valeur"
                            rows={2}
                          />
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="team" className="space-y-6">
                    <div>
                      <Label>Membres de l'équipe</Label>
                      {editingContent.about.team.map((member, index) => (
                        <div key={index} className="mt-4 p-4 border rounded-lg space-y-4">
                          <div className="grid md:grid-cols-2 gap-4">
                            <Input
                              value={member.name}
                              onChange={(e) => {
                                const newTeam = [...editingContent.about.team]
                                newTeam[index] = { ...newTeam[index], name: e.target.value }
                                setEditingContent((prev) => ({
                                  ...prev,
                                  about: { ...prev.about, team: newTeam },
                                }))
                              }}
                              placeholder="Nom"
                            />
                            <Input
                              value={member.role}
                              onChange={(e) => {
                                const newTeam = [...editingContent.about.team]
                                newTeam[index] = { ...newTeam[index], role: e.target.value }
                                setEditingContent((prev) => ({
                                  ...prev,
                                  about: { ...prev.about, team: newTeam },
                                }))
                              }}
                              placeholder="Rôle"
                            />
                          </div>
                          <Textarea
                            value={member.bio}
                            onChange={(e) => {
                              const newTeam = [...editingContent.about.team]
                              newTeam[index] = { ...newTeam[index], bio: e.target.value }
                              setEditingContent((prev) => ({
                                ...prev,
                                about: { ...prev.about, team: newTeam },
                              }))
                            }}
                            placeholder="Biographie"
                            rows={3}
                          />
                          <Input
                            value={member.education}
                            onChange={(e) => {
                              const newTeam = [...editingContent.about.team]
                              newTeam[index] = { ...newTeam[index], education: e.target.value }
                              setEditingContent((prev) => ({
                                ...prev,
                                about: { ...prev.about, team: newTeam },
                              }))
                            }}
                            placeholder="Éducation"
                          />
                          <Input
                            value={member.expertise.join(", ")}
                            onChange={(e) => {
                              const newTeam = [...editingContent.about.team]
                              newTeam[index] = { ...newTeam[index], expertise: e.target.value.split(", ") }
                              setEditingContent((prev) => ({
                                ...prev,
                                about: { ...prev.about, team: newTeam },
                              }))
                            }}
                            placeholder="Expertise (séparée par des virgules)"
                          />
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        className="mt-4"
                        onClick={() => {
                          setEditingContent((prev) => ({
                            ...prev,
                            about: {
                              ...prev.about,
                              team: [
                                ...prev.about.team,
                                {
                                  id: `member-${Date.now()}`,
                                  name: "",
                                  role: "",
                                  bio: "",
                                  expertise: [],
                                  education: "",
                                  publications: 0,
                                  citations: 0,
                                },
                              ],
                            },
                          }))
                        }}
                      >
                        Ajouter un membre
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="expertise" className="space-y-6">
                    <div>
                      <Label>Domaines d'expertise</Label>
                      {editingContent.about.expertise.map((domain, index) => (
                        <div key={index} className="mt-4 p-4 border rounded-lg space-y-4">
                          <Input
                            value={domain.title}
                            onChange={(e) => {
                              const newExpertise = [...editingContent.about.expertise]
                              newExpertise[index] = { ...newExpertise[index], title: e.target.value }
                              setEditingContent((prev) => ({
                                ...prev,
                                about: { ...prev.about, expertise: newExpertise },
                              }))
                            }}
                            placeholder="Titre du domaine"
                          />
                          <Textarea
                            value={domain.description}
                            onChange={(e) => {
                              const newExpertise = [...editingContent.about.expertise]
                              newExpertise[index] = { ...newExpertise[index], description: e.target.value }
                              setEditingContent((prev) => ({
                                ...prev,
                                about: { ...prev.about, expertise: newExpertise },
                              }))
                            }}
                            placeholder="Description"
                            rows={3}
                          />
                          <Input
                            value={domain.skills.join(", ")}
                            onChange={(e) => {
                              const newExpertise = [...editingContent.about.expertise]
                              newExpertise[index] = { ...newExpertise[index], skills: e.target.value.split(", ") }
                              setEditingContent((prev) => ({
                                ...prev,
                                about: { ...prev.about, expertise: newExpertise },
                              }))
                            }}
                            placeholder="Compétences (séparées par des virgules)"
                          />
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        className="mt-4"
                        onClick={() => {
                          setEditingContent((prev) => ({
                            ...prev,
                            about: {
                              ...prev.about,
                              expertise: [
                                ...prev.about.expertise,
                                {
                                  title: "",
                                  description: "",
                                  skills: [],
                                },
                              ],
                            },
                          }))
                        }}
                      >
                        Ajouter un domaine
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="contact" className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="contact-email">Email</Label>
                        <Input
                          id="contact-email"
                          value={editingContent.contact.email}
                          onChange={(e) => handleInputChange("contact", "email", e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="contact-phone">Téléphone</Label>
                        <Input
                          id="contact-phone"
                          value={editingContent.contact.phone}
                          onChange={(e) => handleInputChange("contact", "phone", e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="contact-address">Adresse</Label>
                        <Textarea
                          id="contact-address"
                          value={editingContent.contact.address}
                          onChange={(e) => handleInputChange("contact", "address", e.target.value)}
                          className="mt-1"
                          rows={2}
                        />
                      </div>
                      <div>
                        <Label htmlFor="contact-hours">Horaires</Label>
                        <Input
                          id="contact-hours"
                          value={editingContent.contact.hours}
                          onChange={(e) => handleInputChange("contact", "hours", e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="research-team-name">Research Team name</Label>
                        <Input
                          type="text"
                          id="research-team-name"
                          value={editingContent.footer?.teamName || ''}
                          onChange={e => setEditingContent(prev => ({
                            ...prev,
                            footer: {
                              ...prev.footer,
                              teamName: e.target.value
                            }
                          }))}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="research-team-intro">Research Team introduction</Label>
                        <Textarea
                          id="research-team-intro"
                          value={editingContent.footer?.teamIntroduction || ''}
                          onChange={e => setEditingContent(prev => ({
                            ...prev,
                            footer: {
                              ...prev.footer,
                              teamIntroduction: e.target.value
                            }
                          }))}
                          className="mt-1"
                          rows={2}
                        />
                      </div>
                    </div>
                    {/* Domaines de Recherche Section */}
                    <div className="mt-8">
                      <h3 className="text-lg font-semibold mb-4">Domaines de Recherche</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[1,2,3,4,5].map((num, idx) => (
                          <div key={num} className="flex flex-col">
                            <Label className="mb-1">{num}</Label>
                            <Input
                              type="text"
                              value={editingContent.footer?.researchDomains?.[idx] || ''}
                              onChange={e => {
                                const newDomains = editingContent.footer?.researchDomains ? [...editingContent.footer.researchDomains] : ["", "", "", "", ""];
                                newDomains[idx] = e.target.value;
                                setEditingContent(prev => ({
                                  ...prev,
                                  footer: {
                                    ...prev.footer,
                                    researchDomains: newDomains
                                  }
                                }))
                              }}
                              placeholder={`Domaine de recherche ${num}`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="mt-8">
                      <Label htmlFor="footer-copyright">Copyright</Label>
                      <Input
                        id="footer-copyright"
                        type="text"
                        value={editingContent.footer?.copyright || ''}
                        onChange={e => setEditingContent(prev => ({
                          ...prev,
                          footer: {
                            ...prev.footer,
                            copyright: e.target.value
                          }
                        }))}
                        className="mt-1"
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card className="card-professional border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2 text-indigo-600" />
                  Paramètres système
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <h4 className="font-medium text-slate-800 mb-2">Statistiques de la plateforme</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-indigo-600">
                          {((stats.activeUsers / stats.totalUsers) * 100).toFixed(1)}%
                        </div>
                        <div className="text-sm text-slate-600">Utilisateurs actifs</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{stats.newMessages}</div>
                        <div className="text-sm text-slate-600">Nouveaux messages</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-amber-600">{stats.pendingRequests}</div>
                        <div className="text-sm text-slate-600">Demandes en attente</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">{stats.connectedNow}</div>
                        <div className="text-sm text-slate-600">Connectés maintenant</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
