"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { X, Search, Upload, Plus, Users, UserPlus, FileText, Tag, User } from "lucide-react"
import { searchMembers, searchExternals, createPublication } from "@/lib/publication-service"
import { createExternalMember } from "@/lib/external-member-service"
import { uploadFile } from "@/lib/file-service"
import { useToast } from "@/hooks/use-toast"

interface MemberSearchResult {
  id: string;
  name: string;
  username: string;
}

interface ExternalSearchResult {
  id: string;
  name: string;
  email: string;
}

interface PublicationFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function PublicationForm({ onSuccess, onCancel }: PublicationFormProps) {
  const { toast } = useToast()
  const [title, setTitle] = useState("")
  const [abstract, setAbstract] = useState("")
  const [keywords, setKeywords] = useState<string[]>([])
  const [keywordInput, setKeywordInput] = useState("")
  
  // Member search
  const [memberSearchQuery, setMemberSearchQuery] = useState("")
  const [memberSearchResults, setMemberSearchResults] = useState<MemberSearchResult[]>([])
  const [selectedMembers, setSelectedMembers] = useState<MemberSearchResult[]>([])
  const [showMemberResults, setShowMemberResults] = useState(false)
  const memberSearchRef = useRef<HTMLDivElement>(null)
  
  // External search
  const [externalSearchQuery, setExternalSearchQuery] = useState("")
  const [externalSearchResults, setExternalSearchResults] = useState<ExternalSearchResult[]>([])
  const [selectedExternals, setSelectedExternals] = useState<ExternalSearchResult[]>([])
  const [showExternalResults, setShowExternalResults] = useState(false)
  const externalSearchRef = useRef<HTMLDivElement>(null)
  
  // File upload
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // External member form
  const [showExternalMemberForm, setShowExternalMemberForm] = useState(false)
  const [externalMemberForm, setExternalMemberForm] = useState({
    name: '',
    email: '',
    cv: null as File | null,
    profilePic: null as File | null
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load all members when component mounts
  useEffect(() => {
    // Don't load all members automatically - only load when searching
  }, [])

  // Click outside handlers
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (memberSearchRef.current && !memberSearchRef.current.contains(event.target as Node)) {
        setShowMemberResults(false)
      }
      if (externalSearchRef.current && !externalSearchRef.current.contains(event.target as Node)) {
        setShowExternalResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleAddKeyword = () => {
    if (keywordInput.trim() && !keywords.includes(keywordInput.trim())) {
      setKeywords([...keywords, keywordInput.trim()])
      setKeywordInput("")
    }
  }

  const handleRemoveKeyword = (keywordToRemove: string) => {
    setKeywords(keywords.filter(k => k !== keywordToRemove))
  }

  const handleAddMember = (member: MemberSearchResult) => {
    if (!selectedMembers.find(m => m.id === member.id)) {
      setSelectedMembers([...selectedMembers, member])
    }
    setMemberSearchQuery("")
    setShowMemberResults(false)
  }

  const handleRemoveMember = (memberId: string) => {
    setSelectedMembers(selectedMembers.filter(m => m.id !== memberId))
  }

  const handleAddExternal = (external: ExternalSearchResult) => {
    if (!selectedExternals.find(e => e.id === external.id)) {
      setSelectedExternals([...selectedExternals, external])
    }
    setExternalSearchQuery("")
    setShowExternalResults(false)
  }

  const handleRemoveExternal = (externalId: string) => {
    setSelectedExternals(selectedExternals.filter(e => e.id !== externalId))
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setSelectedFiles([...selectedFiles, ...files])
  }

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index))
  }

  const handleSubmitExternalMember = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!externalMemberForm.name.trim() || !externalMemberForm.email.trim()) {
      toast({
        title: "Erreur",
        description: "Le nom et l'email sont requis pour créer un profil externe",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Create the external member using the API
      const newExternalMember = await createExternalMember({
        name: externalMemberForm.name,
        email: externalMemberForm.email,
        cv: externalMemberForm.cv || undefined,
        profile_pic: externalMemberForm.profilePic || undefined
      })

      console.log('External member created successfully:', newExternalMember)

      // Add the new member to the selected externals
      setSelectedExternals(prev => [...prev, {
        id: newExternalMember.id,
        name: newExternalMember.name,
        email: newExternalMember.email
      }])

      toast({
        title: "Succès",
        description: "Profil externe créé avec succès et ajouté à la publication",
      })
      
      // Reset form
      setExternalMemberForm({
        name: '',
        email: '',
        cv: null,
        profilePic: null
      })
      setShowExternalMemberForm(false)
      
    } catch (error) {
      console.error('Error creating external member:', error)
      toast({
        title: "Erreur",
        description: "Impossible de créer le profil externe",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim() || !abstract.trim()) {
      toast({
        title: "Erreur",
        description: "Le titre et l'abstract sont requis",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // First, upload all selected files
      const uploadedFileIds: string[] = []
      
      if (selectedFiles.length > 0) {
        toast({
          title: "Upload en cours",
          description: "Téléchargement des fichiers...",
        })
        
        for (const file of selectedFiles) {
          try {
            const uploadedFile = await uploadFile(file)
            uploadedFileIds.push(uploadedFile.id)
          } catch (error) {
            console.error(`Error uploading file ${file.name}:`, error)
            toast({
              title: "Erreur",
              description: `Impossible de télécharger le fichier ${file.name}`,
              variant: "destructive",
            })
            return
          }
        }
      }

      const publicationData = {
        title: title.trim(),
        abstract: abstract.trim(),
        tagged_members: selectedMembers.map(m => m.id),
        tagged_externals: selectedExternals.map(e => e.id),
        keywords: keywords,
        attached_files: uploadedFileIds,
      }

      console.log('Publication data being sent:', publicationData)

      await createPublication(publicationData)
      
      toast({
        title: "Succès",
        description: "Publication créée avec succès",
      })
      
      // Reset form
      setTitle("")
      setAbstract("")
      setKeywords([])
      setSelectedMembers([])
      setSelectedExternals([])
      setSelectedFiles([])
      
      onSuccess?.()
    } catch (error) {
      console.error('Error creating publication:', error)
      toast({
        title: "Erreur",
        description: "Impossible de créer la publication",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Nouvelle Publication
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Titre *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titre de la publication..."
              required
            />
          </div>

          {/* Abstract */}
          <div className="space-y-2">
            <Label htmlFor="abstract">Abstract *</Label>
            <Textarea
              id="abstract"
              value={abstract}
              onChange={(e) => setAbstract(e.target.value)}
              placeholder="Résumé de la publication..."
              rows={4}
              required
            />
          </div>

          {/* Keywords */}
          <div className="space-y-2">
            <Label>Mots-clés</Label>
            <div className="flex gap-2">
              <Input
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                placeholder="Ajouter un mot-clé..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddKeyword()
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddKeyword}
                disabled={!keywordInput.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {keywords.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {keywords.map((keyword, index) => (
                  <Badge key={index} variant="secondary" className="gap-1">
                    <Tag className="h-3 w-3" />
                    {keyword}
                    <button
                      type="button"
                      onClick={() => handleRemoveKeyword(keyword)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Member Search */}
          <div className="space-y-2" ref={memberSearchRef}>
            <Label className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Taguer des membres de l'équipe
            </Label>
            <div className="relative">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    value={memberSearchQuery}
                    onChange={(e) => {
                      const query = e.target.value
                      setMemberSearchQuery(query)
                      if (query.trim()) {
                        setShowMemberResults(true)
                        // Search for members when typing
                        searchMembers(query).then(results => {
                          setMemberSearchResults(results)
                        }).catch(error => {
                          console.error('Error searching members:', error)
                        })
                      } else {
                        setShowMemberResults(false)
                        setMemberSearchResults([])
                      }
                    }}
                    onFocus={() => {
                      // Only show results if there's a search query
                      if (memberSearchQuery.trim()) {
                        setShowMemberResults(true)
                      }
                    }}
                    placeholder="Rechercher un membre..."
                    className="pl-10"
                  />
                </div>
              </div>
              
              {showMemberResults && memberSearchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {memberSearchResults.map((member) => (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => handleAddMember(member)}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium">{member.name}</div>
                      <div className="text-sm text-gray-500">@{member.username}</div>
                    </button>
                  ))}
                </div>
              )}
              
              {showMemberResults && memberSearchQuery.trim() && memberSearchResults.length === 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-4 text-center text-gray-500">
                  Aucun membre trouvé
                </div>
              )}
            </div>
            
            {selectedMembers.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedMembers.map((member) => (
                  <Badge key={member.id} variant="outline" className="gap-1">
                    <Users className="h-3 w-3" />
                    {member.name}
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(member.id)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* External Search */}
          <div className="space-y-2" ref={externalSearchRef}>
            <Label className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Taguer des profils externes
            </Label>
            <div className="relative">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    value={externalSearchQuery}
                    onChange={(e) => {
                      const query = e.target.value
                      setExternalSearchQuery(query)
                      if (query.trim()) {
                        setShowExternalResults(true)
                        // Search for externals when typing
                        searchExternals(query).then(results => {
                          setExternalSearchResults(results)
                        }).catch(error => {
                          console.error('Error searching externals:', error)
                        })
                      } else {
                        setShowExternalResults(false)
                        setExternalSearchResults([])
                      }
                    }}
                    onFocus={() => {
                      // Only show results if there's a search query
                      if (externalSearchQuery.trim()) {
                        setShowExternalResults(true)
                      }
                    }}
                    placeholder="Rechercher un profil externe..."
                    className="pl-10"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowExternalMemberForm(true)}
                  className="whitespace-nowrap bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Ajouter un profil
                </Button>
              </div>
              
              {showExternalResults && externalSearchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {externalSearchResults.map((external) => (
                    <button
                      key={external.id}
                      type="button"
                      onClick={() => handleAddExternal(external)}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium">{external.name}</div>
                      <div className="text-sm text-gray-500">{external.email}</div>
                    </button>
                  ))}
                </div>
              )}
              
              {showExternalResults && externalSearchQuery.trim() && externalSearchResults.length === 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-4 text-center text-gray-500">
                  Aucun profil externe trouvé
                </div>
              )}
            </div>
            
            {selectedExternals.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedExternals.map((external) => (
                  <Badge key={external.id} variant="outline" className="gap-1">
                    <UserPlus className="h-3 w-3" />
                    {external.name}
                    <button
                      type="button"
                      onClick={() => handleRemoveExternal(external.id)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Fichiers joints
            </Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Sélectionner des fichiers
              </Button>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            
            {selectedFiles.length > 0 && (
              <div className="space-y-2 mt-2">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{file.name}</span>
                      <span className="text-xs text-gray-500">
                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Création..." : "Créer la publication"}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Annuler
              </Button>
            )}
          </div>
        </form>
      </CardContent>
      
      {/* External Member Form Modal */}
      {showExternalMemberForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Ajouter un profil externe</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowExternalMemberForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <form onSubmit={handleSubmitExternalMember} className="space-y-4">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="externalName">Nom complet *</Label>
                <Input
                  id="externalName"
                  value={externalMemberForm.name}
                  onChange={(e) => setExternalMemberForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nom et prénom..."
                  required
                />
              </div>
              
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="externalEmail">Email *</Label>
                <Input
                  id="externalEmail"
                  type="email"
                  value={externalMemberForm.email}
                  onChange={(e) => setExternalMemberForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="email@exemple.com"
                  required
                />
              </div>
              
              {/* CV Upload */}
              <div className="space-y-2">
                <Label htmlFor="externalCV">CV (PDF)</Label>
                <Input
                  id="externalCV"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null
                    setExternalMemberForm(prev => ({ ...prev, cv: file }))
                  }}
                  className="cursor-pointer"
                />
                <p className="text-xs text-gray-500">Formats acceptés: PDF, DOC, DOCX</p>
                {externalMemberForm.cv && (
                  <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-md">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-blue-800">{externalMemberForm.cv.name}</span>
                    <span className="text-xs text-blue-600">
                      ({(externalMemberForm.cv.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setExternalMemberForm(prev => ({ ...prev, cv: null }))}
                      className="text-blue-600 hover:text-blue-800 ml-auto"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
              
              {/* Profile Picture Upload */}
              <div className="space-y-2">
                <Label htmlFor="externalProfilePic">Photo de profil</Label>
                <Input
                  id="externalProfilePic"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null
                    setExternalMemberForm(prev => ({ ...prev, profilePic: file }))
                  }}
                  className="cursor-pointer"
                />
                <p className="text-xs text-gray-500">Formats acceptés: JPG, PNG, GIF</p>
                {externalMemberForm.profilePic && (
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded-md">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-green-600" />
                    </div>
                    <span className="text-sm text-green-800">{externalMemberForm.profilePic.name}</span>
                    <span className="text-xs text-green-600">
                      ({(externalMemberForm.profilePic.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setExternalMemberForm(prev => ({ ...prev, profilePic: null }))}
                      className="text-green-600 hover:text-green-800 ml-auto"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
              
              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4">
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {isSubmitting ? "Création..." : "Créer le profil"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowExternalMemberForm(false)}
                  className="flex-1"
                >
                  Annuler
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Card>
  )
}
