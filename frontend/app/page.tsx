"use client"

import { useState, useEffect, useRef } from "react"
import { motion, useScroll, useTransform, useInView } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ArrowRight,
  Users,
  BookOpen,
  Calendar,
  Award,
  ChevronDown,
  Star,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react"
import Link from "next/link"
import { useContentManager } from "@/lib/content-manager"
import { ContentEditor } from "@/components/admin/content-editor"

export default function HomePage() {
  const [isVisible, setIsVisible] = useState(false)
  const { content } = useContentManager()
  const heroRef = useRef(null)
  const statsRef = useRef(null)
  const newsRef = useRef(null)
  const ctaRef = useRef(null)

  const isHeroInView = useInView(heroRef, { once: true })
  const isStatsInView = useInView(statsRef, { once: true })
  const isNewsInView = useInView(newsRef, { once: true })
  const isCtaInView = useInView(ctaRef, { once: true })

  const { scrollYProgress } = useScroll()
  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0.8])
  const heroScale = useTransform(scrollYProgress, [0, 0.3], [1, 0.98])

  useEffect(() => {
    setIsVisible(true)
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20">
      <ContentEditor />

      {/* Hero Section */}
      <motion.section
        ref={heroRef}
        className="relative overflow-hidden pt-20 pb-32"
        style={{ opacity: heroOpacity, scale: heroScale }}
      >
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl animate-float-gentle" />
          <div
            className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-200/20 rounded-full blur-3xl animate-float-gentle"
            style={{ animationDelay: "2s" }}
          />
          <div
            className="absolute top-1/2 left-1/2 w-64 h-64 bg-amber-200/20 rounded-full blur-3xl animate-float-gentle"
            style={{ animationDelay: "4s" }}
          />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center max-w-5xl mx-auto"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={isHeroInView ? { scale: 1, rotate: 0 } : {}}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-block mb-8"
            >
              <Badge className="gradient-primary text-white px-8 py-3 text-lg font-medium rounded-full shadow-lg animate-pulse-glow">
                <Sparkles className="h-5 w-5 mr-2 icon-enhanced" />
                {content.about.teamName}
              </Badge>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 50 }}
              animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-6xl md:text-8xl font-bold text-gradient mb-8 heading-modern"
            >
              {content.hero.title}
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="mb-6"
            >
              <Badge
                variant="outline"
                className="border-indigo-200 text-indigo-700 px-6 py-2 text-base bg-white/50 backdrop-blur-sm"
              >
                {content.hero.subtitle}
              </Badge>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="text-xl md:text-2xl text-professional mb-12 leading-relaxed max-w-4xl mx-auto"
            >
              {content.hero.description}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 1, duration: 0.8 }}
              className="flex flex-col sm:flex-row gap-6 justify-center"
            >
              <Button
                size="lg"
                className="btn-modern text-white px-10 py-4 text-lg group relative overflow-hidden rounded-xl"
              >
                <span className="relative z-10 flex items-center">
                  {content.hero.primaryButtonText}
                  <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform icon-enhanced" />
                </span>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-indigo-300 text-indigo-700 hover:bg-indigo-50 px-10 py-4 text-lg rounded-xl backdrop-blur-sm bg-white/50 hover-lift"
              >
                <Users className="mr-3 h-5 w-5 icon-enhanced" />
                {content.hero.secondaryButtonText}
              </Button>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <ChevronDown className="h-8 w-8 text-indigo-400 animate-bounce icon-enhanced" />
        </motion.div>
      </motion.section>

      {/* Stats Section */}
      <section ref={statsRef} className="py-20 relative">
        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm" />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate={isStatsInView ? "animate" : "initial"}
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {[
              {
                icon: Users,
                number: `${content.stats.researchers}+`,
                label: "Chercheurs",
                color: "indigo",
                description: "Experts internationaux",
              },
              {
                icon: BookOpen,
                number: `${content.stats.publications}+`,
                label: "Publications",
                color: "purple",
                description: "Articles scientifiques",
              },
              {
                icon: Award,
                number: content.stats.awards.toString(),
                label: "Prix reçus",
                color: "amber",
                description: "Reconnaissances",
              },
              {
                icon: Calendar,
                number: `${content.stats.events}+`,
                label: "Événements",
                color: "indigo",
                description: "Conférences organisées",
              },
            ].map((stat, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                className="text-center group"
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
              >
                <motion.div
                  className={`card-professional rounded-2xl w-20 h-20 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-all duration-300 bg-${stat.color}-50 border-${stat.color}-100`}
                  whileHover={{
                    boxShadow: "0 20px 40px rgba(99, 102, 241, 0.2)",
                    transition: { duration: 0.3 },
                  }}
                >
                  <stat.icon className={`h-10 w-10 text-${stat.color}-600 icon-enhanced`} />
                </motion.div>
                <motion.div
                  className="text-4xl font-bold text-slate-800 mb-2 heading-modern"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={isStatsInView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ duration: 0.5, delay: index * 0.1 + 0.3 }}
                >
                  {stat.number}
                </motion.div>
                <div className="text-slate-600 font-medium mb-1">{stat.label}</div>
                <div className="text-sm text-slate-400">{stat.description}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>


      {/* News Section */}
      <section ref={newsRef} className="py-20 gradient-primary text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-white rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  opacity: [0.3, 1, 0.3],
                  scale: [1, 1.5, 1],
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: Number.POSITIVE_INFINITY,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={isNewsInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <motion.span
              className="inline-block"
              initial={{ opacity: 0, scale: 0, rotate: -180 }}
              animate={isNewsInView ? { opacity: 1, scale: 1, rotate: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Star className="h-12 w-12 text-white/90 mx-auto mb-6 icon-enhanced" />
            </motion.span>
            <h2 className="text-5xl md:text-6xl font-bold mb-6 heading-modern relative">
              Actualités & Succès
              <motion.span
                className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 h-1 bg-white rounded-full"
                initial={{ width: 0 }}
                animate={isNewsInView ? { width: "120px" } : {}}
                transition={{ duration: 0.8, delay: 0.5 }}
              />
            </h2>
            <p className="text-xl text-indigo-100 max-w-3xl mx-auto">
              Suivez nos dernières découvertes et reconnaissances internationales
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate={isNewsInView ? "animate" : "initial"}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {[
              {
                date: "15 Nov 2024",
                title: "Prix d'Excellence en Recherche",
                excerpt: "Notre équipe reçoit le prix national pour ses travaux révolutionnaires en IA éthique",
                category: "Prix",
              },
              {
                date: "08 Nov 2024",
                title: "Publication Nature",
                excerpt: "Article publié dans Nature sur les avancées en médecine personnalisée",
                category: "Publication",
              },
              {
                date: "01 Nov 2024",
                title: "Conférence Internationale",
                excerpt: "Présentation keynote au Symposium Mondial de l'Innovation Scientifique",
                category: "Événement",
              },
            ].map((news, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                className="group"
              >
                <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 transition-all duration-300 h-full hover-lift">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant="outline" className="border-white/30 text-white bg-white/10">
                        {news.category}
                      </Badge>
                      <span className="text-indigo-200 text-sm">{news.date}</span>
                    </div>
                    <CardTitle className="text-xl group-hover:text-indigo-100 transition-colors heading-modern">
                      {news.title}
                    </CardTitle>
                    <CardDescription className="text-indigo-100 leading-relaxed">{news.excerpt}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="ghost" className="text-white hover:text-indigo-200 p-0 group/btn">
                      Lire la suite
                      <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform icon-enhanced" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section ref={ctaRef} className="py-20 bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 via-white to-indigo-50/30" />

        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={isCtaInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={isCtaInView ? { scale: 1, rotate: 0 } : {}}
              transition={{ type: "spring", stiffness: 100, delay: 0.3 }}
              className="w-24 h-24 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-xl animate-pulse-glow"
            >
              <Users className="h-12 w-12 text-white icon-enhanced" />
            </motion.div>

            <h2 className="text-5xl md:text-6xl font-bold text-gradient mb-8 heading-modern">Rejoignez l'Excellence</h2>
            <p className="text-xl text-professional mb-12 max-w-3xl mx-auto leading-relaxed">
              Collaborez avec nous pour façonner l'avenir de la recherche scientifique et créer des solutions innovantes
              pour demain
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link href="/contact">
                <Button size="lg" className="btn-modern text-white px-10 py-4 text-lg rounded-xl">
                  <span className="relative z-10">Nous Contacter</span>
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-indigo-300 text-indigo-700 hover:bg-indigo-50 px-10 py-4 text-lg rounded-xl hover-lift"
              >
                <span className="relative z-10">Voir les Opportunités</span>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
