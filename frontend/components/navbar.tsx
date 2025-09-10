"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, X, Home, Users, FolderOpen, BookOpen, Calendar, Mail, LogIn, User, Settings, History, Lightbulb, ChevronDown, LogOut } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { usePathname } from "next/navigation"
import { useContentManager } from "@/lib/content-manager"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { user, logout } = useAuth()
  const { content } = useContentManager()
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const navItems = [
    { href: "/", label: "Accueil", icon: Home },
    {
      href: "/about",
      label: "À propos",
      icon: Users,
      subItems: [
        { href: "/about?tab=history", label: "Histoire", icon: History },
        { href: "/about?tab=team", label: "Équipe", icon: Users },
        { href: "/about?tab=expertise", label: "Expertise", icon: Lightbulb },
      ],
    },
    { href: "/projects", label: "Projets", icon: FolderOpen },
    { href: "/publications", label: "Publications", icon: BookOpen },
    { href: "/events", label: "Événements", icon: Calendar },
    { href: "/contact", label: "Contact", icon: Mail },
  ]

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white/95 backdrop-blur-xl shadow-lg border-b border-indigo-100" : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <motion.div
              className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-lg icon-enhanced"
              whileHover={{
                boxShadow: "0 8px 25px rgba(99, 102, 241, 0.4)",
                rotate: [0, 5, -5, 0],
                transition: { duration: 0.5 },
              }}
            >
              <span className="text-white font-bold text-lg">R</span>
            </motion.div>
            <div className="flex flex-col">
              <span className="font-bold text-lg text-gradient heading-modern">{content.logo.text}</span>
              <span className="text-xs text-slate-500 -mt-1">{content.logo.subtitle}</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "?")

              if (item.subItems) {
                return (
                  <DropdownMenu key={item.href}>
                    <DropdownMenuTrigger className="focus:outline-none">
                      <div
                        className={`flex items-center space-x-2 text-slate-600 hover:text-indigo-600 transition-all duration-200 group relative ${
                          isActive ? "text-indigo-600 font-medium" : ""
                        }`}
                      >
                        <item.icon
                          className={`h-4 w-4 group-hover:scale-110 transition-transform icon-enhanced ${
                            isActive ? "text-indigo-600" : ""
                          }`}
                        />
                        <span className="text-sm">{item.label}</span>
                        <ChevronDown className="h-3 w-3" />
                        {isActive && (
                          <motion.div
                            className="absolute -bottom-2 left-0 right-0 h-0.5 gradient-primary rounded-full"
                            layoutId="navbar-indicator"
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ duration: 0.3 }}
                          />
                        )}
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      {item.subItems.map((subItem) => (
                        <DropdownMenuItem key={subItem.href} asChild>
                          <Link
                            href={subItem.href}
                            className="flex items-center space-x-2 text-sm cursor-pointer"
                          >
                            <subItem.icon className="h-4 w-4" />
                            <span>{subItem.label}</span>
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-2 text-slate-600 hover:text-indigo-600 transition-all duration-200 group relative ${
                    isActive ? "text-indigo-600 font-medium" : ""
                  }`}
                >
                  <item.icon
                    className={`h-4 w-4 group-hover:scale-110 transition-transform icon-enhanced ${
                      isActive ? "text-indigo-600" : ""
                    }`}
                  />
                  <span className="text-sm">{item.label}</span>
                  {isActive && (
                    <motion.div
                      className="absolute -bottom-2 left-0 right-0 h-0.5 gradient-primary rounded-full"
                      layoutId="navbar-indicator"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  )}
                </Link>
              )
            })}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
                    <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">{user.name.charAt(0)}</span>
                    </div>
                    <span className="text-sm font-medium">{user.name}</span>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center space-x-2 cursor-pointer">
                      <User className="h-4 w-4" />
                      <span>Profil</span>
                    </Link>
                  </DropdownMenuItem>
                  {user.role === "admin" && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="flex items-center space-x-2 cursor-pointer">
                        <Settings className="h-4 w-4" />
                        <span>Administration</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="flex items-center space-x-2 cursor-pointer">
                      <User className="h-4 w-4" />
                      <span>Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={logout}
                    className="flex items-center space-x-2 cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Déconnexion</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-3">
                <Link href="/login">
                  <Button variant="ghost" className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
                    <LogIn className="h-4 w-4 mr-2 icon-enhanced" />
                    Connexion
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button variant="ghost" size="sm" className="md:hidden hover:bg-indigo-50" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? (
              <X className="h-6 w-6 text-indigo-600 icon-enhanced" />
            ) : (
              <Menu className="h-6 w-6 text-indigo-600 icon-enhanced" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-white/95 backdrop-blur-xl border-t border-indigo-100 shadow-lg"
          >
            <div className="container mx-auto px-4 py-4">
              <div className="flex flex-col space-y-4">
                {navItems.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "?")

                  if (item.subItems) {
                    return (
                      <div key={item.href} className="space-y-1">
                        <div className={`flex items-center space-x-3 text-slate-600 py-2 px-3 ${
                          isActive ? "text-indigo-600 font-medium" : ""
                        }`}>
                          <item.icon className={`h-5 w-5 icon-enhanced ${isActive ? "text-indigo-600" : ""}`} />
                          <span>{item.label}</span>
                        </div>
                        <div className="ml-8 space-y-1">
                          {item.subItems.map((subItem) => (
                            <Link
                              key={subItem.href}
                              href={subItem.href}
                              className="flex items-center space-x-3 text-slate-600 hover:text-indigo-600 transition-colors py-2 px-3 rounded-lg hover:bg-indigo-50"
                              onClick={() => setIsOpen(false)}
                            >
                              <subItem.icon className="h-4 w-4 icon-enhanced" />
                              <span className="text-sm">{subItem.label}</span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )
                  }

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center space-x-3 text-slate-600 hover:text-indigo-600 transition-colors py-2 px-3 rounded-lg hover:bg-indigo-50 ${
                        isActive ? "text-indigo-600 font-medium bg-indigo-50" : ""
                      }`}
                      onClick={() => setIsOpen(false)}
                    >
                      <item.icon className={`h-5 w-5 icon-enhanced ${isActive ? "text-indigo-600" : ""}`} />
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
                <div className="border-t border-slate-200 pt-4">
                  {user ? (
                    <div className="flex flex-col space-y-2">
                      {/* User Info */}
                      <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg">
                        <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-bold">{user.name.charAt(0)}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-800">{user.name}</span>
                          <span className="text-xs text-gray-500">{user.email}</span>
                        </div>
                      </div>
                      
                      {/* Menu Items */}
                      <Link href="/profile" onClick={() => setIsOpen(false)}>
                        <Button variant="ghost" className="w-full justify-start text-indigo-600 hover:bg-indigo-50">
                          <User className="h-4 w-4 mr-2 icon-enhanced" />
                          Profil
                        </Button>
                      </Link>
                      {user.role === "admin" && (
                        <Link href="/admin" onClick={() => setIsOpen(false)}>
                          <Button variant="ghost" className="w-full justify-start text-amber-600 hover:bg-amber-50">
                            <Settings className="h-4 w-4 mr-2 icon-enhanced" />
                            Administration
                          </Button>
                        </Link>
                      )}
                      <Link href="/dashboard" onClick={() => setIsOpen(false)}>
                        <Button variant="ghost" className="w-full justify-start text-indigo-600 hover:bg-indigo-50">
                          <User className="h-4 w-4 mr-2 icon-enhanced" />
                          Dashboard
                        </Button>
                      </Link>
                      <Button
                        onClick={() => {
                          logout()
                          setIsOpen(false)
                        }}
                        variant="outline"
                        className="w-full border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                      >
                        <LogOut className="h-4 w-4 mr-2 icon-enhanced" />
                        Déconnexion
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col space-y-2">
                      <Link href="/login">
                        <Button variant="ghost" className="w-full justify-start text-indigo-600 hover:bg-indigo-50">
                          <LogIn className="h-4 w-4 mr-2 icon-enhanced" />
                          Connexion
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}