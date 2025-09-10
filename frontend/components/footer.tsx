"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Github, ArrowUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useContentManager } from "@/lib/content-manager"

export function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const { content } = useContentManager()
  const footer = content.footer || {}
  const contact = content.contact || {}
  const researchDomains = footer.researchDomains && footer.researchDomains.length > 0
    ? Array.from(new Set(footer.researchDomains.filter(Boolean)))
    : [
        "Intelligence Artificielle",
        "Biotechnologie",
        "Énergies Renouvelables",
        "Nanotechnologie",
        "Médecine Personnalisée",
      ]
  const teamIntroduction = footer.teamIntroduction || "Une équipe de recherche dédiée à l'innovation et à la découverte scientifique, repoussant les frontières de la connaissance."
  const teamName = footer.teamName || "Research Team"
  const copyright =
    footer.copyright || `© ${new Date().getFullYear()} ${teamName}. Tous droits réservés.`

  const contactAddress = contact.address || "123 Rue de la Recherche, 75001 Paris"
  const contactPhone = contact.phone || "+33 1 23 45 67 89"
  const contactEmail = contact.email || "contact@research-team.fr"

  return (
    <footer className="bg-gradient-to-r from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About Section */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center space-x-2 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">R</span>
              </div>
              <span className="font-bold text-xl">{teamName}</span>
            </div>
            <p className="text-gray-300 mb-6">
              {teamIntroduction}
            </p>
            <div className="flex space-x-4">
              {[Facebook, Twitter, Linkedin, Github].map((Icon, index) => (
                <motion.a
                  key={index}
                  href="#"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center hover:bg-purple-600 transition-colors"
                >
                  <Icon className="h-5 w-5" />
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <h3 className="text-xl font-semibold mb-6">Liens Rapides</h3>
            <ul className="space-y-3">
              {[
                { href: "/about", label: "À propos" },
                { href: "/publications", label: "Publications" },
                { href: "/events", label: "Événements" },
                { href: "/contact", label: "Contact" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-gray-300 hover:text-purple-400 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Research Areas */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h3 className="text-xl font-semibold mb-6">Domaines de Recherche</h3>
            <ul className="space-y-3">
              {researchDomains.map((area) => (
                <li key={area}>
                  <span className="text-gray-300">{area}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <h3 className="text-xl font-semibold mb-6">Contact</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <MapPin className="h-5 w-5 text-purple-400" />
                <span className="text-gray-300">{contactAddress}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-purple-400" />
                <span className="text-gray-300">{contactPhone}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-purple-400" />
                <span className="text-gray-300">{contactEmail}</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-700 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">{copyright}</p>
          <div className="flex items-center space-x-6 mt-4 md:mt-0">
            <Link href="/privacy" className="text-gray-400 hover:text-purple-400 text-sm transition-colors">
              Politique de confidentialité
            </Link>
            <Link href="/terms" className="text-gray-400 hover:text-purple-400 text-sm transition-colors">
              Conditions d'utilisation
            </Link>
            <Button onClick={scrollToTop} variant="ghost" size="sm" className="text-gray-400 hover:text-purple-400">
              <ArrowUp className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </footer>
  )
}
