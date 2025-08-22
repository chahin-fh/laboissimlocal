"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { uploadFile, getUserFiles, deleteFile, formatFileSize } from "@/lib/file-service"
import { createPublication, getPublications, deletePublication } from "@/lib/publication-service"
import { RecentDocuments } from "@/components/recent-documents"
import { RecentPublications } from "@/components/recent-publications"
import { PublicationForm } from "@/components/publication-form"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Users,
  BookOpen,
  Calendar,
  FileText,
  MessageSquare,
  Upload,
  BarChart3,
  Settings,
  Mail,
  Send,
  Eye,
  User,
  Reply,
  X,
  MessageCircle,
  ArrowLeft,
} from "lucide-react"
import { useAuth } from "@/components/auth-provider"

interface FileResponse {
  id: string;
  name: string;
  file: string;
  uploaded_at: string;
  file_type: string;
  size: number;
  uploaded_by?: {
    id: string;
    name: string;
  };
}

interface PublicationResponse {
  id: string;
  title: string;
  abstract: string;
  posted_at: string;
  posted_by?: {
    id: string;
    name: string;
  };
  tagged_members?: Array<{
    id: string;
    name: string;
    username: string;
  }>;
  tagged_externals?: Array<{
    id: string;
    name: string;
    email: string;
  }>;
  attached_files?: Array<{
    id: string;
    name: string;
    file: string;
    file_type: string;
    size: number;
  }>;
  keywords?: string[];
}

export default function DashboardPage() {
  const {
    user,
    users,
    internalMessages,
    sendInternalMessage,
    markMessageAsRead,
    getConversation,
    getConversations,
    getUnreadCount,
    fetchUsers,
    loading,
  } = useAuth()
  const router = useRouter()
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [messageForm, setMessageForm] = useState({ subject: "", message: "" })
  const [showMessaging, setShowMessaging] = useState(false)
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [replyToMessage, setReplyToMessage] = useState<string | null>(null)
  const [showFloatingMessages, setShowFloatingMessages] = useState(false)
  const [showDocuments, setShowDocuments] = useState(false)
  const [showPublications, setShowPublications] = useState(false)
  const [userFiles, setUserFiles] = useState<FileResponse[]>([])
  const [publications, setPublications] = useState<PublicationResponse[]>([])
  const [conversations, setConversations] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [selectedConversationMessages, setSelectedConversationMessages] = useState<any[]>([])

  // Function to load conversation messages when a conversation is selected
  const loadConversationMessages = async (userId: string) => {
    try {
      const messages = await getConversation(userId)
      setSelectedConversationMessages(messages)
    } catch (error) {
      console.error('Error loading conversation:', error)
    }
  }

  useEffect(() => {
    if (!user && !loading) {
      router.push("/login")
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      getUserFiles()
        .then(files => setUserFiles(files))
        .catch(error => console.error('Error fetching files:', error));
      
      getPublications()
        .then(pubs => setPublications(pubs))
        .catch(error => console.error('Error fetching publications:', error));
      
      // Fetch conversations and unread count
      getConversations()
        .then(conv => setConversations(conv))
        .catch(error => console.error('Error fetching conversations:', error));
      
      getUnreadCount()
        .then(count => setUnreadCount(count))
        .catch(error => console.error('Error fetching unread count:', error));
      
      fetchUsers()
        .then(() => console.log('Users fetched successfully:', users.length))
        .catch(error => console.error('Error fetching users:', error));
    }
  }, [user])

  // Update selected conversation messages when conversation changes
  useEffect(() => {
    if (selectedConversation) {
      loadConversationMessages(selectedConversation)
    } else {
      setSelectedConversationMessages([])
    }
  }, [selectedConversation])

  const handlePublicationSuccess = async () => {
    try {
      const updatedPublications = await getPublications()
      setPublications(updatedPublications)
    } catch (error) {
      console.error('Error refreshing publications:', error)
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return null
  }

  const handleSendMessage = async () => {
    if (selectedUser && messageForm.subject && messageForm.message) {
      try {
        await sendInternalMessage(selectedUser, messageForm.subject, messageForm.message, replyToMessage || undefined)
        setMessageForm({ subject: "", message: "" })
        setReplyToMessage(null)
      } catch (error) {
        console.error('Error sending message:', error)
      }
    }
  }

  const handleReply = (messageId: string, senderId: string, originalSubject: string) => {
    setSelectedUser(senderId)
    setReplyToMessage(messageId)
    setMessageForm({
      subject: originalSubject.startsWith("Re: ") ? originalSubject : `Re: ${originalSubject}`,
      message: "",
    })
    setShowMessaging(true)
  }
  
  // Dynamic stats calculation
  const myDocumentsCount = userFiles.filter(file => file.uploaded_by?.id === user.id).length
  const myPublicationsCount = publications.filter(pub => pub.posted_by?.id === user.id).length

  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  }

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 pt-20">
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">Bienvenue, {user.name} !</h1>
              <p className="text-xl text-gray-600">Votre espace membre - Équipe de Recherche</p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={`${user.role === "admin" ? "bg-purple-600" : "bg-blue-600"} text-white`}>
                {user.role === "admin" ? "Administrateur" : "Membre"}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFloatingMessages(!showFloatingMessages)}
                className="relative"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Messages
                {unreadCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-1 py-0 min-w-[16px] h-4">
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {[
            { icon: FileText, title: "Mes Documents", count: myDocumentsCount.toString(), color: "purple" },
            { icon: MessageSquare, title: "Messages", count: unreadCount.toString(), color: "blue" },
            { icon: Calendar, title: "Événements", count: "3", color: "green" },
            { icon: BookOpen, title: "Publications", count: myPublicationsCount.toString(), color: "orange" },
          ].map((stat, index) => (
            <motion.div key={index} variants={fadeInUp}>
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                      <p className="text-3xl font-bold text-gray-800">{stat.count}</p>
                    </div>
                    <div className={`w-12 h-12 bg-${stat.color}-100 rounded-full flex items-center justify-center`}>
                      <stat.icon className={`h-6 w-6 text-${stat.color}-600`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Messaging Section */}
            <AnimatePresence>
              {showMessaging && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Mail className="h-5 w-5 mr-2 text-purple-600" />
                          Messagerie Interne
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setShowMessaging(false)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </CardTitle>
                      <CardDescription>Communiquez avec les autres membres de l'équipe</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Send Message Section */}
                        <div className="border-b pb-4">
                          <h4 className="font-medium text-gray-800 mb-3">
                            {replyToMessage ? "Répondre au message" : "Envoyer un message"}
                          </h4>
                          {replyToMessage && (
                            <div className="mb-3 p-2 bg-blue-50 rounded-lg border border-blue-200">
                              <p className="text-sm text-blue-700">
                                <Reply className="h-3 w-3 inline mr-1" />
                                Réponse à un message
                              </p>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setReplyToMessage(null)
                                  setMessageForm({ subject: "", message: "" })
                                }}
                                className="text-blue-600 p-0 h-auto"
                              >
                                Annuler la réponse
                              </Button>
                            </div>
                          )}
                          <div className="space-y-3">
                            <div>
                              <Label htmlFor="recipient">Destinataire</Label>
                              <Select value={selectedUser || ""} onValueChange={setSelectedUser}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Sélectionner un destinataire" />
                                </SelectTrigger>
                                <SelectContent>
                                  {users
                                    .filter((u) => u.id !== user.id && u.status === "active")
                                    .map((u) => (
                                      <SelectItem key={u.id} value={u.id}>
                                        <div className="flex items-center space-x-2">
                                          <User className="h-4 w-4" />
                                          <span>{u.name}</span>
                                          <Badge
                                            className={
                                              u.role === "admin"
                                                ? "bg-purple-100 text-purple-700"
                                                : "bg-blue-100 text-blue-700"
                                            }
                                          >
                                            {u.role === "admin" ? "Admin" : "Membre"}
                                          </Badge>
                                        </div>
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="subject">Sujet</Label>
                              <Input
                                id="subject"
                                value={messageForm.subject}
                                onChange={(e) => setMessageForm((prev) => ({ ...prev, subject: e.target.value }))}
                                placeholder="Sujet du message"
                              />
                            </div>
                            <div>
                              <Label htmlFor="message">Message</Label>
                              <Textarea
                                id="message"
                                value={messageForm.message}
                                onChange={(e) => setMessageForm((prev) => ({ ...prev, message: e.target.value }))}
                                placeholder="Votre message..."
                                rows={3}
                              />
                            </div>
                            <Button
                              onClick={handleSendMessage}
                              disabled={!selectedUser || !messageForm.subject || !messageForm.message}
                              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                            >
                              <Send className="h-4 w-4 mr-2" />
                              {replyToMessage ? "Répondre" : "Envoyer"}
                            </Button>
                          </div>
                        </div>

                        {/* Conversations List */}
                        <div>
                          <h4 className="font-medium text-gray-800 mb-3">Conversations</h4>
                          <div className="space-y-2">
                            {conversations.map((conv) => (
                              <motion.div
                                key={conv.userId}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                                  selectedConversation === conv.userId
                                    ? "bg-blue-50 border-blue-200"
                                    : conv.unreadCount > 0
                                      ? "bg-red-50 border-red-200"
                                      : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                                }`}
                                onClick={() =>
                                  setSelectedConversation(selectedConversation === conv.userId ? null : conv.userId)
                                }
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                                      <span className="text-white text-sm font-bold">{conv.userName.charAt(0)}</span>
                                    </div>
                                    <div>
                                      <p className="font-medium text-gray-800">{conv.userName}</p>
                                      <p className="text-sm text-gray-600 truncate max-w-48">
                                        {conv.lastMessage.message}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    {conv.unreadCount > 0 && (
                                      <Badge className="bg-red-500 text-white text-xs px-2 py-1">
                                        {conv.unreadCount}
                                      </Badge>
                                    )}
                                    <span className="text-xs text-gray-500">
                                      {new Date(conv.lastMessage.createdAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>

                        {/* Conversation View */}
                        <AnimatePresence>
                          {selectedConversation && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="border-t pt-4"
                            >
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-medium text-gray-800">
                                  Conversation avec {users.find((u) => u.id === selectedConversation)?.name}
                                </h4>
                                <Button variant="ghost" size="sm" onClick={() => setSelectedConversation(null)}>
                                  <ArrowLeft className="h-4 w-4" />
                                </Button>
                              </div>
                              <ScrollArea className="h-64 border rounded-lg p-3">
                                <div className="space-y-3">
                                  {selectedConversationMessages.map((message) => (
                                    <motion.div
                                      key={message.id}
                                      initial={{ opacity: 0, y: 10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      className={`p-3 rounded-lg ${
                                        message.senderId === user.id ? "bg-blue-100 ml-8" : "bg-gray-100 mr-8"
                                      }`}
                                    >
                                      <div className="flex items-start justify-between mb-2">
                                        <div>
                                          <p className="font-medium text-sm">
                                            {message.senderId === user.id ? "Vous" : message.senderName}
                                          </p>
                                          <p className="text-xs text-gray-500">
                                            {new Date(message.createdAt).toLocaleString()}
                                          </p>
                                        </div>
                                        {message.senderId !== user.id && (
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleReply(message.id, message.senderId, message.subject)}
                                            className="text-blue-600 p-1 h-auto"
                                          >
                                            <Reply className="h-3 w-3" />
                                          </Button>
                                        )}
                                      </div>
                                      <h5 className="font-medium text-gray-800 mb-1">{message.subject}</h5>
                                      <p className="text-gray-700 text-sm">{message.message}</p>
                                      {message.status === "unread" && message.receiverId === user.id && (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => markMessageAsRead(message.id)}
                                          className="mt-2 border-blue-300 text-blue-600 hover:bg-blue-50"
                                        >
                                          <Eye className="h-3 w-3 mr-1" />
                                          Marquer comme lu
                                        </Button>
                                      )}
                                    </motion.div>
                                  ))}
                                </div>
                              </ScrollArea>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Document Sharing Section */}
            <AnimatePresence>
              {showDocuments && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Upload className="h-5 w-5 mr-2 text-blue-600" />
                          Partage de Documents
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setShowDocuments(false)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </CardTitle>
                      <CardDescription>Zone sécurisée pour l'échange de documents</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div
                        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center"
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onDrop={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const files = Array.from(e.dataTransfer.files);
                          for (const file of files) {
                            try {
                              await uploadFile(file);
                              const updatedFiles = await getUserFiles();
                              setUserFiles(updatedFiles);
                            } catch (error) {
                              console.error('Error uploading file:', error);
                            }
                          }
                        }}
                      >
                        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 mb-4">Glissez-déposez vos fichiers ici ou cliquez pour parcourir</p>
                        <Input
                          type="file"
                          className="hidden"
                          onChange={async (e) => {
                            const files = Array.from(e.target.files || []);
                            for (const file of files) {
                              try {
                                await uploadFile(file);
                                const updatedFiles = await getUserFiles();
                                setUserFiles(updatedFiles);
                              } catch (error) {
                                console.error('Error uploading file:', error);
                              }
                            }
                          }}
                          multiple
                          id="file-upload"
                        />
                        <Button 
                          className="bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                          onClick={() => document.getElementById('file-upload')?.click()}
                        >
                          Sélectionner des fichiers
                        </Button>
                      </div>
                      <RecentDocuments 
                        userFiles={userFiles} 
                        currentUserId={user.id}
                        onFileDelete={(fileId) => setUserFiles(files => files.filter(f => f.id !== fileId))}
                      />
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Publication Sharing Section */}
            <AnimatePresence>
              {showPublications && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center">
                          <BookOpen className="h-5 w-5 mr-2 text-green-600" />
                          Partage de Publications
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setShowPublications(false)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </CardTitle>
                      <CardDescription>Partagez vos publications et recherches avec l'équipe</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {/* Enhanced Publication Form */}
                        <div className="border-b pb-6">
                          <h4 className="font-medium text-gray-800 mb-4">Partager une nouvelle publication</h4>
                          <PublicationForm 
                            onSuccess={handlePublicationSuccess}
                            onCancel={() => setShowPublications(false)}
                          />
                        </div>

                        <RecentPublications 
                          publications={publications} 
                          currentUserId={user.id}
                          onPublicationDelete={(publicationId) => setPublications(pubs => pubs.filter(p => p.id !== publicationId))}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Recent Activities */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2 text-purple-600" />
                    Activités Récentes
                  </CardTitle>
                  <CardDescription>Vos dernières actions sur la plateforme</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { action: "Document partagé", item: "Rapport de recherche Q4", time: "Il y a 2h" },
                      { action: "Commentaire ajouté", item: "Projet IA Éthique", time: "Il y a 4h" },
                      { action: "Publication mise à jour", item: "Article Nature", time: "Hier" },
                      { action: "Événement créé", item: "Séminaire mensuel", time: "Il y a 2 jours" },
                    ].map((activity, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-800">{activity.action}</p>
                          <p className="text-sm text-gray-600">{activity.item}</p>
                        </div>
                        <span className="text-xs text-gray-500">{activity.time}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>


          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="h-5 w-5 mr-2 text-green-600" />
                    Actions Rapides
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button 
                      variant={showDocuments ? "default" : "outline"}
                      className={`w-full justify-start ${
                        showDocuments 
                          ? "bg-purple-600 text-white hover:bg-purple-700" 
                          : "border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white"
                      }`}
                      onClick={() => setShowDocuments(!showDocuments)}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      {showDocuments ? "Fermer Documents" : "Nouveau Document"}
                    </Button>
                    <Button
                      variant={showPublications ? "default" : "outline"}
                      className={`w-full justify-start ${
                        showPublications 
                          ? "bg-green-600 text-white hover:bg-green-700" 
                          : "border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
                      }`}
                      onClick={() => setShowPublications(!showPublications)}
                    >
                      <BookOpen className="h-4 w-4 mr-2" />
                      {showPublications ? "Fermer Publications" : "Partager Publication"}
                    </Button>
                    <Button
                      variant={showMessaging ? "default" : "outline"}
                      className={`w-full justify-start ${
                        showMessaging 
                          ? "bg-blue-600 text-white hover:bg-blue-700" 
                          : "border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white"
                      }`}
                      onClick={() => setShowMessaging(!showMessaging)}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      {showMessaging ? "Fermer Messagerie" : "Messagerie"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Team Members */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="h-5 w-5 mr-2 text-orange-600" />
                    Membres de l'Équipe
                  </CardTitle>
                  <CardDescription>Connectez-vous avec vos collègues</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {users
                      .filter((u) => u.id !== user.id && u.status === "active")
                      .slice(0, 5)
                      .map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                              <span className="text-white text-sm font-bold">{member.name.charAt(0)}</span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-800 text-sm">{member.name}</p>
                              <Badge
                                className={
                                  member.role === "admin"
                                    ? "bg-purple-100 text-purple-700"
                                    : "bg-blue-100 text-blue-700"
                                }
                              >
                                {member.role === "admin" ? "Admin" : "Membre"}
                              </Badge>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedUser(member.id)
                              setShowMessaging(true)
                            }}
                            className="border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white"
                          >
                            <Mail className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Upcoming Events */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
            >
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                    Événements à Venir
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      {
                        title: "Séminaire IA Éthique",
                        date: "15 Déc 2024",
                        time: "14:00",
                      },
                      {
                        title: "Réunion d'équipe",
                        date: "18 Déc 2024",
                        time: "10:00",
                      },
                      {
                        title: "Conférence Internationale",
                        date: "22 Déc 2024",
                        time: "09:00",
                      },
                    ].map((event, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-gray-800">{event.title}</p>
                          <p className="text-sm text-gray-600">
                            {event.date} à {event.time}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm" className="text-purple-600">
                          Détails
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* Floating Messages Widget */}
        <AnimatePresence>
          {showFloatingMessages && (
            <motion.div
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              className="fixed bottom-4 right-4 w-80 z-50"
            >
              <Card className="bg-white shadow-2xl border-0">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <MessageCircle className="h-4 w-4 mr-2 text-purple-600" />
                      Messages ({unreadCount})
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setShowFloatingMessages(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  <ScrollArea className="h-64">
                    <div className="space-y-2">
                      {conversations.slice(0, 5).map((conv) => (
                        <motion.div
                          key={conv.userId}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`p-2 rounded-lg cursor-pointer transition-colors ${
                            conv.unreadCount > 0 ? "bg-blue-50 border border-blue-200" : "bg-gray-50 hover:bg-gray-100"
                          }`}
                          onClick={() => {
                            setSelectedUser(conv.userId)
                            setShowMessaging(true)
                            setShowFloatingMessages(false)
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className="w-6 h-6 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs font-bold">{conv.userName.charAt(0)}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm text-gray-800 truncate">{conv.userName}</p>
                                <p className="text-xs text-gray-600 truncate">{conv.lastMessage.message}</p>
                              </div>
                            </div>
                            {conv.unreadCount > 0 && (
                              <Badge className="bg-red-500 text-white text-xs px-1 py-0 min-w-[16px] h-4">
                                {conv.unreadCount}
                              </Badge>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </ScrollArea>
                  <Button
                    className="w-full mt-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                    onClick={() => {
                      setShowMessaging(true)
                      setShowFloatingMessages(false)
                    }}
                  >
                    Ouvrir la messagerie
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
