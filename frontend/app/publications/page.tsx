"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Search, BookOpen, FileText, Users, Award, ExternalLink, Download, Eye } from "lucide-react"
import { getPublications } from "@/lib/publication-service"

interface PublicationResponse {
  id: string;
  title: string;
  abstract: string;
  posted_at: string;
  posted_by?: {
    id: string;
    name: string;
  };
}

export default function PublicationsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState("all")
  const [selectedYear, setSelectedYear] = useState("all")
  const [dynamicPublications, setDynamicPublications] = useState<PublicationResponse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPublications = async () => {
      try {
        const publications = await getPublications()
        setDynamicPublications(publications)
      } catch (error) {
        console.error('Error fetching publications:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPublications()
  }, [])

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

  // Transform dynamic publications to match the display format
  const transformedDynamicPublications = dynamicPublications.map((pub) => ({
    id: pub.id,
    title: pub.title,
    authors: [pub.posted_by?.name || "Utilisateur"],
    journal: "Publication Équipe", // Since we don't have journal field anymore
    year: new Date(pub.posted_at).getFullYear(),
    type: "Article",
    abstract: pub.abstract,
    keywords: ["Recherche", "Équipe"], // Default keywords since we don't have this field
    doi: `internal.${pub.id}`,
    url: "#",
    citations: 0, // Default since we don't track citations for internal publications
    pdf: "#",
  }))



  // Combine dynamic and static publications
  const allPublications = [...transformedDynamicPublications]

  const filteredPublications = allPublications.filter((pub) => {
    const matchesSearch =
      pub.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pub.authors.join(" ").toLowerCase().includes(searchQuery.toLowerCase()) ||
      pub.abstract.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pub.keywords.join(" ").toLowerCase().includes(searchQuery.toLowerCase())

    const matchesType = selectedType === "all" || pub.type === selectedType
    const matchesYear = selectedYear === "all" || pub.year.toString() === selectedYear

    return matchesSearch && matchesType && matchesYear
  })

  const publicationTypes = Array.from(new Set(allPublications.map((pub) => pub.type)))
  const publicationYears = Array.from(new Set(allPublications.map((pub) => pub.year.toString())))

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-electric-50 to-violet-100 pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des publications...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-electric-50 to-violet-100 pt-20">
      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
          >
            <BookOpen className="h-10 w-10 text-white" />
          </motion.div>

          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-violet-600 via-electric-600 to-violet-600 bg-clip-text text-transparent mb-6 animate-rotate-gradient bg-[length:200%_auto]">
            Nos Publications
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Découvrez les publications scientifiques de notre équipe de recherche dans des revues internationales de
            premier plan.
          </p>
        </motion.div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12"
        >
          {[
            { icon: FileText, number: allPublications.length.toString(), label: "Publications", color: "violet" },
            { icon: Users, number: Array.from(new Set(allPublications.flatMap(p => p.authors))).length.toString(), label: "Auteurs", color: "electric" },
            { icon: Award, number: "12", label: "Prix", color: "violet" },
            { icon: BookOpen, number: allPublications.reduce((total, pub) => total + pub.citations, 0).toString(), label: "Citations", color: "electric" },
          ].map((stat, index) => (
            <motion.div
              key={index}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-violet-100"
            >
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 bg-${stat.color}-100 rounded-full flex items-center justify-center`}>
                  <stat.icon className={`h-6 w-6 text-${stat.color}-600`} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-800">{stat.number}</div>
                  <div className="text-gray-600">{stat.label}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-12"
        >
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-grow">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    placeholder="Rechercher une publication..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 border-gray-200 focus:border-violet-500 focus:ring-violet-500"
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="w-full sm:w-48">
                    <Select value={selectedType} onValueChange={setSelectedType}>
                      <SelectTrigger className="border-gray-200 focus:border-violet-500 focus:ring-violet-500">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les types</SelectItem>
                        {publicationTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-full sm:w-48">
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                      <SelectTrigger className="border-gray-200 focus:border-violet-500 focus:ring-violet-500">
                        <SelectValue placeholder="Année" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes les années</SelectItem>
                        {publicationYears.map((year) => (
                          <SelectItem key={year} value={year}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Publications List */}
        <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
          {filteredPublications.length > 0 ? (
            filteredPublications.map((publication, index) => (
              <motion.div key={publication.id} variants={fadeInUp}>
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex-grow">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge
                            className={`${
                              publication.type === "Article"
                                ? "bg-violet-600"
                                : publication.type === "Review"
                                  ? "bg-electric-600"
                                  : "bg-green-600"
                            } text-white`}
                          >
                            {publication.type}
                          </Badge>
                          <Badge variant="outline" className="border-gray-300 text-gray-600">
                            {publication.year}
                          </Badge>
                        </div>
                        <CardTitle className="text-xl text-gray-800 mb-2 hover:text-violet-600 transition-colors cursor-pointer">
                          {publication.title}
                        </CardTitle>
                        <p className="text-gray-600 mb-2">
                          <strong>Auteurs:</strong> {publication.authors.join(", ")}
                        </p>
                        <p className="text-gray-600 mb-3">
                          <strong>Journal:</strong> {publication.journal}
                        </p>
                        <p className="text-gray-700 leading-relaxed">{publication.abstract}</p>
                      </div>
                      <div className="flex flex-col items-end space-y-2 min-w-fit">
                        <div className="text-right">
                          <div className="text-2xl font-bold text-violet-600">{publication.citations}</div>
                          <div className="text-sm text-gray-500">Citations</div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {publication.keywords.map((keyword, i) => (
                        <Badge key={i} variant="outline" className="border-violet-200 text-violet-600">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        variant="outline"
                        className="border-violet-600 text-violet-600 hover:bg-violet-600 hover:text-white"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Voir l'article
                      </Button>
                      <Button
                        variant="outline"
                        className="border-electric-600 text-electric-600 hover:bg-electric-600 hover:text-white"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Télécharger PDF
                      </Button>
                      <Button variant="ghost" className="text-gray-600 hover:text-violet-600">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        DOI: {publication.doi}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">Aucune publication trouvée avec ces critères.</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
