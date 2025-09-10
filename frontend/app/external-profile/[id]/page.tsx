"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { 
  ArrowLeft, 
  Mail, 
  FileText, 
  Download, 
  Calendar,
  User,
  Building,
  Globe,
  Linkedin,
  Twitter,
  Github,
  Phone,
  MapPin
} from "lucide-react"
import { useRouter } from "next/navigation"

interface ExternalMember {
  id: string;
  name: string;
  email: string;
  cv?: string;
  profile_pic?: string;
  created_at: string;
}

interface ExternalPublication {
  id: string;
  title: string;
  abstract: string;
  posted_at: string;
  keywords?: string[];
}

export default function ExternalProfilePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [externalMember, setExternalMember] = useState<ExternalMember | null>(null)
  const [publications, setPublications] = useState<ExternalPublication[]>([])
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    fetchExternalMemberData()
  }, [params.id])

  const fetchExternalMemberData = async () => {
    try {
      setLoading(true)
      
      // Get authentication token
      const token = localStorage.getItem('token')
      const headers: HeadersInit = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      
      // Fetch external member data
      const response = await fetch(`http://localhost:8000/api/external-members/${params.id}/`, {
        headers
      })
      if (response.ok) {
        const memberData = await response.json()
        setExternalMember(memberData)
      } else {
        console.error('External member not found')
        router.push("/publications")
      }

      // Fetch publications where this external member is tagged
      const publicationsResponse = await fetch(`http://localhost:8000/api/publications/`, {
        headers
      })
      if (publicationsResponse.ok) {
        const allPublications = await publicationsResponse.json()
        const memberPublications = allPublications.filter((pub: any) => 
          pub.tagged_externals?.some((ext: any) => ext.id.toString() === params.id)
        )
        setPublications(memberPublications)
      }
    } catch (error) {
      console.error("Error fetching external member data:", error)
      router.push("/publications")
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadCV = async () => {
    if (!externalMember?.cv) return
    
    setDownloading(true)
    try {
      // For media files, we don't need authentication headers
      const response = await fetch(externalMember.cv)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `CV_${externalMember.name}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Download failed:', error)
      alert('Erreur lors du téléchargement du CV')
    } finally {
      setDownloading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-100 pt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1">
                <div className="h-96 bg-gray-200 rounded-lg"></div>
              </div>
              <div className="lg:col-span-2">
                <div className="h-96 bg-gray-200 rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!externalMember) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-100 pt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Profil externe non trouvé</h1>
            <Button onClick={() => router.push("/publications")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour aux publications
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-100 pt-20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <Button
                variant="ghost"
                onClick={() => router.push("/publications")}
                className="mb-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour aux publications
              </Button>
              <h1 className="text-4xl font-bold text-gray-800">{externalMember.name}</h1>
              <p className="text-xl text-gray-600 mt-2">Profil Externe</p>
            </div>
            <Badge className="bg-green-600 text-white text-lg px-4 py-2">
              Collaborateur Externe
            </Badge>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-1"
          >
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                              <CardHeader className="text-center">
                  <div className="relative mx-auto mb-4">
                    <div className="w-32 h-32 bg-gradient-to-br from-green-400 to-teal-500 rounded-full flex items-center justify-center text-white text-4xl font-bold">
                      {externalMember.name.charAt(0).toUpperCase()}
                    </div>
                    {externalMember.profile_pic && (
                      <img
                        src={externalMember.profile_pic}
                        alt={externalMember.name}
                        className="w-32 h-32 rounded-full object-cover absolute inset-0"
                        onError={(e) => {
                          // Hide the image if it fails to load
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    )}
                  </div>
                <CardTitle className="text-2xl text-gray-800">{externalMember.name}</CardTitle>
                <p className="text-gray-600">Collaborateur Externe</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Contact Information */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="text-gray-800">{externalMember.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm text-gray-500">Membre depuis</p>
                      <p className="text-gray-800">{formatDate(externalMember.created_at)}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* CV Download */}
                {externalMember.cv && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-sm text-gray-500">CV disponible</p>
                        <Button
                          onClick={handleDownloadCV}
                          disabled={downloading}
                          className="bg-green-600 hover:bg-green-700 text-white mt-2"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          {downloading ? 'Téléchargement...' : 'Télécharger CV'}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <Separator />

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{publications.length}</div>
                    <div className="text-sm text-gray-600">Publications</div>
                  </div>
                  <div className="text-center p-3 bg-teal-50 rounded-lg">
                    <div className="text-2xl font-bold text-teal-600">Externe</div>
                    <div className="text-sm text-gray-600">Statut</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Publications */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="lg:col-span-2"
          >
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl text-gray-800 flex items-center gap-2">
                  <FileText className="h-6 w-6 text-green-600" />
                  Publications ({publications.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {publications.length > 0 ? (
                  <div className="space-y-4">
                    {publications.map((publication) => (
                      <div
                        key={publication.id}
                        className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => router.push(`/publications?highlight=${publication.id}`)}
                      >
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">
                          {publication.title}
                        </h3>
                        <p className="text-gray-600 mb-3 line-clamp-2">
                          {publication.abstract}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="border-green-200 text-green-600">
                              {formatDate(publication.posted_at)}
                            </Badge>
                            {publication.keywords && publication.keywords.length > 0 && (
                              <Badge variant="outline" className="border-gray-200 text-gray-600">
                                {publication.keywords[0]}
                              </Badge>
                            )}
                          </div>
                          <Button variant="ghost" size="sm" className="text-green-600">
                            Voir la publication
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">
                      Aucune publication trouvée pour ce collaborateur externe.
                    </p>
                    <p className="text-gray-400 text-sm mt-2">
                      Les publications apparaîtront ici une fois qu'elles seront créées.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
