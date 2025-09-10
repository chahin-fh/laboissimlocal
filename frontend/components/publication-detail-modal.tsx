"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { X, Download, FileText, Users, UserPlus, Tag, Calendar, User, Mail, ExternalLink } from "lucide-react"
import { useRouter } from "next/navigation"

interface PublicationDetailModalProps {
  publication: {
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
  };
  isOpen: boolean;
  onClose: () => void;
}

export default function PublicationDetailModal({ publication, isOpen, onClose }: PublicationDetailModalProps) {
  const router = useRouter();
  const [downloading, setDownloading] = useState(false);

  const handleProfileClick = (profileType: 'member' | 'external', id: string, name: string) => {
    if (profileType === 'member') {
      // Navigate to team member profile
      router.push(`/profile/${id}`);
    } else {
      // Navigate to external profile page
      router.push(`/external-profile/${id}`);
    }
    onClose();
  };

  const handleDownload = async (file: any) => {
    setDownloading(true);
    try {
      // Use the full URL from the backend
      const response = await fetch(file.file);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Erreur lors du téléchargement');
    } finally {
      setDownloading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-800">
            {publication.title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Publication Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className="bg-violet-600 text-white">
                    Publication
                  </Badge>
                  <Badge variant="outline" className="border-gray-300 text-gray-600">
                    {formatDate(publication.posted_at)}
                  </Badge>
                </div>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Posted By */}
              {publication.posted_by && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-600">Publié par:</span>
                  <Button
                    variant="link"
                    className="p-0 h-auto text-blue-600 hover:text-blue-800"
                    onClick={() => handleProfileClick('member', publication.posted_by!.id, publication.posted_by!.name)}
                  >
                    {publication.posted_by.name}
                  </Button>
                </div>
              )}

              {/* Abstract */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Résumé</h3>
                <p className="text-gray-700 leading-relaxed">{publication.abstract}</p>
              </div>

              {/* Keywords */}
              {publication.keywords && publication.keywords.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Tag className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-600">Mots-clés:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {publication.keywords.map((keyword, i) => (
                      <Badge key={i} variant="outline" className="border-violet-200 text-violet-600">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tagged Members */}
          {publication.tagged_members && publication.tagged_members.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-800">Membres tagués</h3>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {publication.tagged_members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-gray-800">{member.name}</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-blue-200 text-blue-600 hover:bg-blue-100"
                        onClick={() => handleProfileClick('member', member.id, member.name)}
                      >
                        Voir profil
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tagged Externals */}
          {publication.tagged_externals && publication.tagged_externals.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-800">Profils externes tagués</h3>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {publication.tagged_externals.map((external) => (
                    <div key={external.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-green-600" />
                        <div>
                          <span className="font-medium text-gray-800">{external.name}</span>
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Mail className="h-3 w-3" />
                            {external.email}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-green-200 text-green-600 hover:bg-green-100"
                        onClick={() => handleProfileClick('external', external.id, external.name)}
                      >
                        Voir profil
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Attached Files */}
          {publication.attached_files && publication.attached_files.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-orange-600" />
                  <h3 className="text-lg font-semibold text-gray-800">Fichiers joints</h3>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {publication.attached_files.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-orange-600" />
                        <div>
                          <div className="font-medium text-gray-800">{file.name}</div>
                          <div className="text-sm text-gray-500">
                            {file.file_type.toUpperCase()} • {formatFileSize(file.size)}
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleDownload(file)}
                        disabled={downloading}
                        className="bg-orange-600 hover:bg-orange-700 text-white"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        {downloading ? 'Téléchargement...' : 'Télécharger'}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              variant="outline"
              className="border-violet-600 text-violet-600 hover:bg-violet-600 hover:text-white"
              onClick={onClose}
            >
              Fermer
            </Button>
            {publication.attached_files && publication.attached_files.length > 0 && (
              <Button
                className="bg-violet-600 hover:bg-violet-700 text-white"
                onClick={() => handleDownload(publication.attached_files![0])}
                disabled={downloading}
              >
                <Download className="h-4 w-4 mr-2" />
                Télécharger le premier fichier
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
