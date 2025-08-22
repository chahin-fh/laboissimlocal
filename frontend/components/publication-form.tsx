"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { X, Search, Upload, Plus, Users, UserPlus, FileText, Tag } from "lucide-react"
import { searchMembers, searchExternals, createPublication } from "@/lib/publication-service"
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
  const [memberSearchLoading, setMemberSearchLoading] = useState(false)
  const memberSearchRef = useRef<HTMLDivElement>(null)
  
  // External search
  const [externalSearchQuery, setExternalSearchQuery] = useState("")
  const [externalSearchResults, setExternalSearchResults] = useState<ExternalSearchResult[]>([])
  const [selectedExternals, setSelectedExternals] = useState<ExternalSearchResult[]>([])
  const [showExternalResults, setShowExternalResults] = useState(false)
  const [externalSearchLoading, setExternalSearchLoading] = useState(false)
  const externalSearchRef = useRef<HTMLDivElement>(null)
  
  // File upload
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load all members when component mounts
  useEffect(() => {
    loadAllMembers()
    loadAllExternals()
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

  const loadAllMembers = async () => {
    try {
      setMemberSearchLoading(true)
      const results = await searchMembers("") // Empty query to get all members
      setMemberSearchResults(results)
    } catch (error) {
      console.error('Error loading members:', error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les membres",
        variant: "destructive",
      })
    } finally {
      setMemberSearchLoading(false)
    }
  }

  const loadAllExternals = async () => {
    try {
      setExternalSearchLoading(true)
      const results = await searchExternals("") // Empty query to get all externals
      setExternalSearchResults(results)
    } catch (error) {
      console.error('Error loading externals:', error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les profils externes",
        variant: "destructive",
      })
    } finally {
      setExternalSearchLoading(false)
    }
  }

  // Debounced search for members
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      try {
        setMemberSearchLoading(true)
        const results = await searchMembers(memberSearchQuery)
        setMemberSearchResults(results)
        setShowMemberResults(true)
      } catch (error) {
        console.error('Error searching members:', error)
        toast({
          title: "Erreur",
          description: "Impossible de rechercher les membres",
          variant: "destructive",
        })
      } finally {
        setMemberSearchLoading(false)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [memberSearchQuery, toast])

  // Debounced search for externals
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      try {
        setExternalSearchLoading(true)
        const results = await searchExternals(externalSearchQuery)
        setExternalSearchResults(results)
        setShowExternalResults(true)
      } catch (error) {
        console.error('Error searching externals:', error)
        toast({
          title: "Erreur",
          description: "Impossible de rechercher les profils externes",
          variant: "destructive",
        })
      } finally {
        setExternalSearchLoading(false)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [externalSearchQuery, toast])

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
      const publicationData = {
        title: title.trim(),
        abstract: abstract.trim(),
        tagged_members: selectedMembers.map(m => m.id),
        tagged_externals: selectedExternals.map(e => e.id),
        keywords: keywords,
        // Note: File upload would need to be handled separately with FormData
        // For now, we'll skip attached_files
      }

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
                    onChange={(e) => setMemberSearchQuery(e.target.value)}
                    onFocus={() => setShowMemberResults(true)}
                    placeholder="Rechercher un membre..."
                    className="pl-10"
                  />
                  {memberSearchLoading && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                    </div>
                  )}
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
              
              {showMemberResults && memberSearchResults.length === 0 && !memberSearchLoading && (
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
                    onChange={(e) => setExternalSearchQuery(e.target.value)}
                    onFocus={() => setShowExternalResults(true)}
                    placeholder="Rechercher un profil externe..."
                    className="pl-10"
                  />
                  {externalSearchLoading && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-green-600 rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
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
              
              {showExternalResults && externalSearchResults.length === 0 && !externalSearchLoading && (
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
    </Card>
  )
}
