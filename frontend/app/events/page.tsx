"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  UserCheck,
  UserX,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Eye,
} from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { 
  getEvents, 
  registerForEvent, 
  unregisterFromEvent,
  getEventRegistrations,
  type Event,
  type EventRegistration
} from "@/lib/event-service"

export default function EventsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [showRegistrationForm, setShowRegistrationForm] = useState(false)
  const [showEventDetails, setShowEventDetails] = useState(false)
  const [registrationNotes, setRegistrationNotes] = useState("")
  const [isRegistering, setIsRegistering] = useState(false)
  const [eventRegistrations, setEventRegistrations] = useState<EventRegistration[]>([])

  useEffect(() => {
    // Always fetch events, even when not logged in
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      const eventsData = await getEvents()
      setEvents(eventsData)
    } catch (error) {
      console.error('Error fetching events:', error)
    }
  }

  const fetchEventRegistrations = async (eventId: string) => {
    try {
      const registrations = await getEventRegistrations(eventId)
      setEventRegistrations(registrations)
    } catch (error) {
      console.error('Error fetching event registrations:', error)
    }
  }

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event)
    setShowEventDetails(true)
    // Fetch registrations for this event
    fetchEventRegistrations(event.id)
  }

  const handleRegister = async () => {
    if (!selectedEvent) return
    
    setIsRegistering(true)
    try {
      await registerForEvent(selectedEvent.id, registrationNotes)
      setShowRegistrationForm(false)
      setRegistrationNotes("")
      setSelectedEvent(null)
      fetchEvents() // Refresh events to update registration status
      // Also refresh registrations if details modal is open
      if (showEventDetails && selectedEvent) {
        fetchEventRegistrations(selectedEvent.id)
      }
    } catch (error) {
      console.error('Error registering for event:', error)
      alert(error instanceof Error ? error.message : 'Erreur lors de l\'inscription')
    } finally {
      setIsRegistering(false)
    }
  }

  const handleUnregister = async (eventId: string) => {
    try {
      await unregisterFromEvent(eventId)
      fetchEvents() // Refresh events to update registration status
      // Also refresh registrations if details modal is open
      if (showEventDetails && selectedEvent) {
        fetchEventRegistrations(selectedEvent.id)
      }
    } catch (error) {
      console.error('Error unregistering from event:', error)
      alert(error instanceof Error ? error.message : 'Erreur lors de la désinscription')
    }
  }

  const handleRegisterClick = (event: Event) => {
    if (!user) {
      // Redirect to login if not authenticated
      router.push('/login')
      return
    }
    
    setSelectedEvent(event)
    setShowRegistrationForm(true)
  }

  const getEventTypeColor = (eventType: Event['event_type']) => {
    switch (eventType) {
      case 'conference': return 'bg-purple-100 text-purple-700'
      case 'seminar': return 'bg-blue-100 text-blue-700'
      case 'workshop': return 'bg-green-100 text-green-700'
      case 'meeting': return 'bg-orange-100 text-orange-700'
      case 'presentation': return 'bg-pink-100 text-pink-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getEventTypeLabel = (eventType: Event['event_type']) => {
    switch (eventType) {
      case 'conference': return 'Conférence'
      case 'seminar': return 'Séminaire'
      case 'workshop': return 'Atelier'
      case 'meeting': return 'Réunion'
      case 'presentation': return 'Présentation'
      default: return 'Autre'
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20 pt-20">Loading...</div>
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
              <h1 className="text-4xl font-bold text-gradient heading-modern mb-2">Événements</h1>
              <p className="text-professional">Découvrez et participez aux événements de notre équipe</p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className="gradient-primary text-white px-4 py-2">
                <Calendar className="h-4 w-4 mr-2" />
                {events.length} événements
              </Badge>
            </div>
          </div>
        </motion.div>

        {/* Events Grid */}
        <motion.div
          variants={{
            animate: {
              transition: {
                staggerChildren: 0.1,
              },
            },
          }}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {events.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group"
            >
              <Card 
                className="card-professional border-0 overflow-hidden h-full hover-lift cursor-pointer"
                onClick={() => handleEventClick(event)}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between mb-3">
                    <Badge className={getEventTypeColor(event.event_type)}>
                      {getEventTypeLabel(event.event_type)}
                    </Badge>
                    {event.user_registration && (
                      <Badge className="bg-green-100 text-green-700">
                        <UserCheck className="h-3 w-3 mr-1" />
                        Inscrit
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-xl group-hover:text-indigo-600 transition-colors heading-modern">
                    {event.title}
                  </CardTitle>
                  <p className="text-professional text-sm line-clamp-3">
                    {event.description}
                  </p>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center text-sm text-slate-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      {event.location}
                    </div>
                    <div className="flex items-center text-sm text-slate-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      {new Date(event.start_date).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                    <div className="flex items-center text-sm text-slate-600">
                      <Clock className="h-4 w-4 mr-2" />
                      {new Date(event.start_date).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })} - {new Date(event.end_date).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                    <div className="flex items-center text-sm text-slate-600">
                      <Users className="h-4 w-4 mr-2" />
                      {event.registered_count} inscrits
                      {event.max_participants && ` / ${event.max_participants} max`}
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    {event.user_registration ? (
                      <Button
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleUnregister(event.id)
                        }}
                        className="border-red-300 text-red-600 hover:bg-red-50 flex-1"
                      >
                        <UserX className="h-4 w-4 mr-2" />
                        Se désinscrire
                      </Button>
                    ) : (
                      <Button 
                        className="btn-modern text-white flex-1"
                        disabled={event.is_full}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRegisterClick(event)
                        }}
                      >
                        <UserCheck className="h-4 w-4 mr-2" />
                        {event.is_full ? 'Complet' : 'S\'inscrire'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {events.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Calendar className="h-16 w-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-slate-600 mb-2">Aucun événement pour le moment</h3>
            <p className="text-slate-500">Les nouveaux événements apparaîtront ici.</p>
          </motion.div>
        )}
      </div>

      {/* Event Details Modal */}
      {showEventDetails && selectedEvent && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowEventDetails(false)}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-3">
                  <Badge className={getEventTypeColor(selectedEvent.event_type)}>
                    {getEventTypeLabel(selectedEvent.event_type)}
                  </Badge>
                  {selectedEvent.user_registration && (
                    <Badge className="bg-green-100 text-green-700">
                      <UserCheck className="h-3 w-3 mr-1" />
                      Inscrit
                    </Badge>
                  )}
                  {!selectedEvent.is_active && (
                    <Badge className="bg-red-100 text-red-700">Inactif</Badge>
                  )}
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">{selectedEvent.title}</h2>
                <p className="text-slate-600 mb-4">{selectedEvent.description}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-slate-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      {selectedEvent.location}
                    </div>
                    <div className="flex items-center text-sm text-slate-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      {new Date(selectedEvent.start_date).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                    <div className="flex items-center text-sm text-slate-600">
                      <Clock className="h-4 w-4 mr-2" />
                      {new Date(selectedEvent.start_date).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })} - {new Date(selectedEvent.end_date).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                    <div className="flex items-center text-sm text-slate-600">
                      <Users className="h-4 w-4 mr-2" />
                      {selectedEvent.registered_count} inscrits
                      {selectedEvent.max_participants && ` / ${selectedEvent.max_participants} max`}
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-slate-600">
                      <span className="font-medium">Créé par:</span>
                      <span className="ml-2">{selectedEvent.created_by_name}</span>
                    </div>
                    <div className="flex items-center text-sm text-slate-600">
                      <span className="font-medium">Créé le:</span>
                      <span className="ml-2">{new Date(selectedEvent.created_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                    <div className="flex items-center text-sm text-slate-600">
                      <span className="font-medium">Dernière mise à jour:</span>
                      <span className="ml-2">{new Date(selectedEvent.updated_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                </div>

                {/* Registration Action */}
                <div className="mb-6">
                  {selectedEvent.user_registration ? (
                    <Button
                      variant="outline"
                      onClick={() => handleUnregister(selectedEvent.id)}
                      className="border-red-300 text-red-600 hover:bg-red-50"
                    >
                      <UserX className="h-4 w-4 mr-2" />
                      Se désinscrire
                    </Button>
                  ) : (
                    <Button 
                      className="btn-modern text-white"
                      disabled={selectedEvent.is_full}
                      onClick={() => {
                        setShowEventDetails(false)
                        handleRegisterClick(selectedEvent)
                      }}
                    >
                      <UserCheck className="h-4 w-4 mr-2" />
                      {selectedEvent.is_full ? 'Complet' : 'S\'inscrire'}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Registered Members List */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Membres inscrits ({eventRegistrations.length})
              </h3>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {eventRegistrations.length > 0 ? (
                  eventRegistrations.map((registration) => (
                    <div key={registration.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-slate-800">{registration.user_full_name}</h4>
                        <p className="text-sm text-slate-600">{registration.user_email}</p>
                        <p className="text-sm text-slate-500">
                          Inscrit le {new Date(registration.registration_date).toLocaleDateString('fr-FR')}
                        </p>
                        {registration.notes && (
                          <p className="text-sm text-slate-700 mt-1">{registration.notes}</p>
                        )}
                      </div>
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
                    </div>
                  ))
                ) : (
                  <p className="text-center text-slate-500 py-8">Aucun inscrit pour le moment</p>
                )}
              </div>
            </div>

            <div className="mt-6">
              <Button variant="outline" onClick={() => setShowEventDetails(false)}>
                Fermer
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Registration Form Modal */}
      {showRegistrationForm && selectedEvent && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowRegistrationForm(false)}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-4">
              S'inscrire à "{selectedEvent.title}"
            </h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="notes">Notes (optionnel)</Label>
                <Textarea
                  id="notes"
                  value={registrationNotes}
                  onChange={(e) => setRegistrationNotes(e.target.value)}
                  placeholder="Ajoutez des notes ou commentaires..."
                  rows={3}
                />
              </div>
              <div className="flex space-x-2">
                <Button 
                  onClick={handleRegister}
                  className="btn-modern text-white flex-1"
                  disabled={isRegistering}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {isRegistering ? 'Inscription...' : 'Confirmer l\'inscription'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowRegistrationForm(false)}
                  disabled={isRegistering}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Annuler
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
