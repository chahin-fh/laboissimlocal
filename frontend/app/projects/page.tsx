"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Search, ArrowRight, Calendar, Users, ExternalLink, Download, ArrowLeft } from "lucide-react"

interface Project {
  id: string
  title: string
  shortDescription: string
  fullDescription: string
  category: string
  status: string
  startDate: string
  endDate: string
  team: string[]
  funding: string
  fundingAmount: string
  image: string
  objectives: string[]
  methodology: string[]
  results: string[]
  publications: Array<{
    title: string
    authors: string
    journal: string
    year: number
    url: string
  }>
  documents: Array<{
    name: string
    url: string
  }>
}

function ProjectDetail({ project, onBack }: { project: Project; onBack: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-8"
    >
      <Button onClick={onBack} variant="ghost" className="text-violet-600 hover:text-violet-700 mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Retour aux projets
      </Button>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <div className="relative overflow-hidden">
              <Image
                src={project.image || "/placeholder.svg"}
                alt={project.title}
                width={800}
                height={400}
                className="w-full h-64 object-cover"
              />
              <div className="absolute top-4 left-4 flex gap-2">
                <Badge
                  className={`${
                    project.status === "En cours"
                      ? "bg-green-600"
                      : project.status === "Terminé"
                        ? "bg-blue-600"
                        : "bg-amber-600"
                  } text-white`}
                >
                  {project.status}
                </Badge>
                <Badge className="bg-gradient-primary text-white">{project.category}</Badge>
              </div>
            </div>
            <CardHeader>
              <CardTitle className="text-3xl text-gray-800">{project.title}</CardTitle>
              <p className="text-gray-600 text-lg">{project.fullDescription}</p>
            </CardHeader>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Objectifs</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {project.objectives.map((objective, index) => (
                  <li key={index} className="flex items-start">
                    <div className="mr-3 mt-1 bg-violet-600 rounded-full p-1">
                      <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-gray-700">{objective}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Méthodologie</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {project.methodology.map((method, index) => (
                  <li key={index} className="flex items-start">
                    <div className="mr-3 mt-1 bg-electric-600 rounded-full p-1">
                      <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                    <span className="text-gray-700">{method}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Résultats et Impact</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {project.results.map((result, index) => (
                  <li key={index} className="flex items-start">
                    <div className="mr-3 mt-1 bg-green-600 rounded-full p-1">
                      <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-gray-700">{result}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Publications Associées</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {project.publications.map((pub, index) => (
                  <div key={index} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                    <h4 className="font-medium text-gray-800 mb-1">{pub.title}</h4>
                    <p className="text-sm text-gray-600 mb-2">
                      {pub.journal}, {pub.year} • {pub.authors}
                    </p>
                    <Button variant="ghost" size="sm" className="text-violet-600 p-0 h-auto">
                      Voir la publication <ExternalLink className="ml-1 h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Informations du Projet</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-800 mb-1">Période</h4>
                <div className="flex items-center text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  {new Date(project.startDate).toLocaleDateString()} - {new Date(project.endDate).toLocaleDateString()}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-800 mb-1">Équipe</h4>
                <div className="flex items-center text-gray-600">
                  <Users className="h-4 w-4 mr-2" />
                  {project.team.length} membres
                </div>
                <ul className="mt-2 space-y-1">
                  {project.team.map((member, index) => (
                    <li key={index} className="text-sm text-gray-600">
                      • {member}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-gray-800 mb-1">Financement</h4>
                <p className="text-gray-600">{project.funding}</p>
                <p className="text-lg font-semibold text-violet-600">{project.fundingAmount}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {project.documents.map((doc, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="w-full justify-between border-violet-200 text-violet-600 hover:bg-violet-50"
                  >
                    <span>{doc.name}</span>
                    <Download className="h-4 w-4" />
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  )
}

export default function ProjectsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedProject, setSelectedProject] = useState<string | null>(null)

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

  const projects: Project[] = [
    {
      id: "ai-ethics",
      title: "Intelligence Artificielle Éthique",
      shortDescription: "Développement d'algorithmes d'IA responsables et transparents",
      fullDescription:
        "Ce projet vise à développer des algorithmes d'intelligence artificielle qui sont non seulement performants, mais aussi éthiques, transparents et équitables. Nous travaillons sur des méthodes pour réduire les biais algorithmiques, améliorer l'explicabilité des modèles d'IA, et garantir la protection de la vie privée dans les applications d'apprentissage automatique.",
      category: "Intelligence Artificielle",
      status: "En cours",
      startDate: "2022-01-15",
      endDate: "2025-01-14",
      team: ["Prof. Jean Martin", "Dr. Émilie Moreau", "Dr. Carlos Garcia"],
      funding: "Agence Nationale de la Recherche (ANR)",
      fundingAmount: "850 000 €",
      image: "/placeholder.svg?height=300&width=500",
      objectives: [
        "Développer des algorithmes d'IA explicables et transparents",
        "Réduire les biais algorithmiques dans les systèmes d'IA",
        "Créer des cadres d'évaluation éthique pour les applications d'IA",
        "Établir des lignes directrices pour le développement responsable de l'IA",
      ],
      methodology: [
        "Analyse comparative des méthodes d'explicabilité existantes",
        "Développement de nouvelles techniques de détection et correction de biais",
        "Études de cas dans différents domaines d'application (santé, justice, finance)",
        "Collaboration avec des experts en éthique et en sciences sociales",
      ],
      results: [
        "Publication de 5 articles dans des revues internationales",
        "Développement d'une bibliothèque open-source pour l'IA explicable",
        "Organisation d'un workshop international sur l'éthique de l'IA",
      ],
      publications: [
        {
          title: "Towards Transparent AI: A Framework for Explainable Machine Learning Models",
          authors: "Martin J., Moreau E., Garcia C.",
          journal: "Journal of Artificial Intelligence Research",
          year: 2023,
          url: "#",
        },
      ],
      documents: [
        { name: "Rapport intermédiaire (PDF)", url: "#" },
        { name: "Présentation du projet (PPTX)", url: "#" },
        { name: "Code source (GitHub)", url: "#" },
      ],
    },
    {
      id: "personalized-medicine",
      title: "Médecine Personnalisée",
      shortDescription: "Recherche sur les traitements adaptés au profil génétique",
      fullDescription:
        "Ce projet de recherche explore comment les traitements médicaux peuvent être adaptés au profil génétique unique de chaque patient. En utilisant des techniques avancées de séquençage génomique et d'analyse de données, nous développons des approches thérapeutiques personnalisées qui maximisent l'efficacité tout en minimisant les effets secondaires.",
      category: "Biotechnologie",
      status: "En cours",
      startDate: "2021-09-01",
      endDate: "2024-08-31",
      team: ["Dr. Sophie Dubois", "Dr. Li Chen", "Prof. Jean Martin"],
      funding: "Institut National de la Santé",
      fundingAmount: "1 200 000 €",
      image: "/placeholder.svg?height=300&width=500",
      objectives: [
        "Identifier des biomarqueurs génétiques pour la réponse aux traitements",
        "Développer des algorithmes de prédiction pour la médecine personnalisée",
        "Valider les approches thérapeutiques personnalisées dans des études cliniques",
        "Créer une plateforme intégrée pour la médecine de précision",
      ],
      methodology: [
        "Séquençage génomique complet de cohortes de patients",
        "Analyse bioinformatique et intégration de données multi-omiques",
        "Modélisation in silico de la réponse aux médicaments",
        "Validation expérimentale sur des modèles cellulaires et animaux",
      ],
      results: [
        "Identification de 15 nouveaux biomarqueurs de réponse thérapeutique",
        "Développement d'un algorithme de prédiction avec 85% de précision",
        "Publication de 8 articles scientifiques",
      ],
      publications: [
        {
          title: "Genomic Biomarkers for Personalized Cancer Treatment",
          authors: "Dubois S., Chen L., Martin J.",
          journal: "Nature Medicine",
          year: 2023,
          url: "#",
        },
      ],
      documents: [
        { name: "Protocole de recherche (PDF)", url: "#" },
        { name: "Données préliminaires (XLSX)", url: "#" },
        { name: "Présentation des résultats (PDF)", url: "#" },
      ],
    },
    {
      id: "renewable-energy",
      title: "Énergies Renouvelables",
      shortDescription: "Innovation dans les technologies solaires de nouvelle génération",
      fullDescription:
        "Ce projet se concentre sur le développement de technologies solaires de nouvelle génération, avec un accent particulier sur les cellules photovoltaïques à haut rendement et les matériaux durables. Nous explorons également des solutions innovantes pour le stockage d'énergie et l'intégration des énergies renouvelables dans les réseaux électriques intelligents.",
      category: "Environnement",
      status: "En cours",
      startDate: "2022-03-01",
      endDate: "2025-02-28",
      team: ["Dr. Thomas Leroy", "Dr. Li Chen", "Prof. Jean Martin"],
      funding: "Programme Européen Horizon Europe",
      fundingAmount: "1 500 000 €",
      image: "/placeholder.svg?height=300&width=500",
      objectives: [
        "Développer des cellules solaires à haut rendement (>30%)",
        "Créer des matériaux durables et abordables pour les technologies solaires",
        "Concevoir des solutions innovantes pour le stockage d'énergie",
        "Optimiser l'intégration des énergies renouvelables dans les réseaux électriques",
      ],
      methodology: [
        "Synthèse et caractérisation de nouveaux matériaux photovoltaïques",
        "Modélisation et simulation des performances des cellules solaires",
        "Prototypage et tests en conditions réelles",
        "Analyse du cycle de vie et évaluation de la durabilité",
      ],
      results: [
        "Développement d'une cellule solaire avec un rendement de 28%",
        "Création d'un nouveau matériau photovoltaïque à base de pérovskite stable",
        "Dépôt de 2 brevets internationaux",
      ],
      publications: [
        {
          title: "High-Efficiency Perovskite-Silicon Tandem Solar Cells",
          authors: "Leroy T., Chen L., Martin J.",
          journal: "Nature Energy",
          year: 2023,
          url: "#",
        },
      ],
      documents: [
        { name: "Rapport technique (PDF)", url: "#" },
        { name: "Données de performance (CSV)", url: "#" },
        { name: "Présentation des prototypes (PPTX)", url: "#" },
      ],
    },
  ]

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.shortDescription.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory = selectedCategory === "all" || project.category === selectedCategory
    const matchesStatus = selectedStatus === "all" || project.status === selectedStatus

    return matchesSearch && matchesCategory && matchesStatus
  })

  const categories = Array.from(new Set(projects.map((project) => project.category)))
  const statuses = Array.from(new Set(projects.map((project) => project.status)))

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
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-violet-600 via-electric-600 to-violet-600 bg-clip-text text-transparent mb-6 animate-rotate-gradient bg-[length:200%_auto]">
            Nos Projets de Recherche
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Découvrez les projets innovants sur lesquels notre équipe travaille actuellement et les résultats de nos
            recherches passées.
          </p>
        </motion.div>

        {selectedProject ? (
          <ProjectDetail
            project={projects.find((p) => p.id === selectedProject)!}
            onBack={() => setSelectedProject(null)}
          />
        ) : (
          <>
            {/* Filters */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-12"
            >

            </motion.div>

            {/* Projects Grid */}
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {filteredProjects.length > 0 ? (
                filteredProjects.map((project) => (
                  <motion.div key={project.id} variants={fadeInUp}>
                    <Card
                      className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col cursor-pointer group"
                      onClick={() => setSelectedProject(project.id)}
                    >
                      <div className="relative overflow-hidden">
                        <Image
                          src={project.image || "/placeholder.svg"}
                          alt={project.title}
                          width={500}
                          height={300}
                          className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute top-4 left-4 flex gap-2">
                          <Badge
                            className={`${
                              project.status === "En cours"
                                ? "bg-green-600"
                                : project.status === "Terminé"
                                  ? "bg-blue-600"
                                  : "bg-amber-600"
                            } text-white`}
                          >
                            {project.status}
                          </Badge>
                          <Badge className="bg-gradient-primary text-white">{project.category}</Badge>
                        </div>
                      </div>
                      <CardHeader className="flex-grow">
                        <CardTitle className="text-xl group-hover:text-violet-600 transition-colors">
                          {project.title}
                        </CardTitle>
                        <p className="text-gray-600">{project.shortDescription}</p>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-500">
                            {project.team.length} membres • {project.fundingAmount}
                          </div>
                          <ArrowRight className="h-4 w-4 text-violet-600 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <p className="text-gray-500 text-lg">Aucun projet trouvé avec ces critères.</p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </div>
    </div>
  )
}