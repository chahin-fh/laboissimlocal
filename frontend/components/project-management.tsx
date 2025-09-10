"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  FolderPlus,
  X,
  Upload,
  FileText,
  Users,
  Calendar,
  Flag,
  Trash2,
  Edit,
  Plus,
  Download,
  Eye,
} from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  uploadProjectDocument,
  deleteProjectDocument,
  getProjectDocuments,
  formatFileSize,
  getStatusColor,
  getPriorityColor,
  getStatusLabel,
  getPriorityLabel,
  type Project,
  type ProjectDocument,
  type CreateProjectData,
} from "@/lib/project-service";

interface ProjectManagementProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProjectManagement({ isOpen, onClose }: ProjectManagementProps) {
  const { user, users } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [projectForm, setProjectForm] = useState<CreateProjectData>({
    title: "",
    description: "",
    status: "planning",
    priority: "medium",
    start_date: "",
    end_date: "",
    team_members: [],
  });
  const [projectDocuments, setProjectDocuments] = useState<ProjectDocument[]>([]);
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchProjects();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedProject) {
      fetchProjectDocuments(selectedProject.id);
    }
  }, [selectedProject]);

  const fetchProjects = async () => {
    try {
      const projectsData = await getProjects();
      setProjects(projectsData);
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  const fetchProjectDocuments = async (projectId: string) => {
    try {
      const documents = await getProjectDocuments(projectId);
      setProjectDocuments(documents);
    } catch (error) {
      console.error("Error fetching project documents:", error);
    }
  };

  const handleCreateProject = async () => {
    if (!projectForm.title || !projectForm.description) {
      alert("Veuillez remplir tous les champs obligatoires");
      return;
    }

    try {
      const newProject = await createProject(projectForm);
      setProjects([newProject, ...projects]);
      setProjectForm({
        title: "",
        description: "",
        status: "planning",
        priority: "medium",
        start_date: "",
        end_date: "",
        team_members: [],
      });
      setShowProjectForm(false);
      alert("Projet créé avec succès!");
    } catch (error) {
      console.error("Error creating project:", error);
      alert("Erreur lors de la création du projet");
    }
  };

  const handleUpdateProject = async () => {
    if (!selectedProject || !projectForm.title || !projectForm.description) {
      alert("Veuillez remplir tous les champs obligatoires");
      return;
    }

    try {
      const updatedProject = await updateProject({
        id: selectedProject.id,
        ...projectForm,
      });
      setProjects(projects.map(p => p.id === selectedProject.id ? updatedProject : p));
      setSelectedProject(updatedProject);
      setShowProjectForm(false);
      setIsEditing(false);
      alert("Projet mis à jour avec succès!");
    } catch (error) {
      console.error("Error updating project:", error);
      alert("Erreur lors de la mise à jour du projet");
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce projet ?")) {
      return;
    }

    try {
      await deleteProject(projectId);
      setProjects(projects.filter(p => p.id !== projectId));
      if (selectedProject?.id === projectId) {
        setSelectedProject(null);
      }
      alert("Projet supprimé avec succès!");
    } catch (error) {
      console.error("Error deleting project:", error);
      alert("Erreur lors de la suppression du projet");
    }
  };

  const handleEditProject = (project: Project) => {
    setSelectedProject(project);
    setProjectForm({
      title: project.title,
      description: project.description,
      status: project.status,
      priority: project.priority,
      start_date: project.start_date || "",
      end_date: project.end_date || "",
      team_members: project.team_members,
    });
    setIsEditing(true);
    setShowProjectForm(true);
  };

  const handleFileUpload = async (file: File) => {
    if (!selectedProject) return;

    try {
      const document = await uploadProjectDocument(selectedProject.id, file);
      setProjectDocuments([document, ...projectDocuments]);
      alert("Document uploadé avec succès!");
    } catch (error) {
      console.error("Error uploading document:", error);
      alert("Erreur lors de l'upload du document");
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce document ?")) {
      return;
    }

    try {
      await deleteProjectDocument(documentId);
      setProjectDocuments(projectDocuments.filter(d => d.id !== documentId));
      alert("Document supprimé avec succès!");
    } catch (error) {
      console.error("Error deleting document:", error);
      alert("Erreur lors de la suppression du document");
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden"
      >
        <div className="flex h-full">
          {/* Left Sidebar - Projects List */}
          <div className="w-1/3 border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800">Gestion des Projets</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <Button
                onClick={() => {
                  setShowProjectForm(true);
                  setIsEditing(false);
                  setProjectForm({
                    title: "",
                    description: "",
                    status: "planning",
                    priority: "medium",
                    start_date: "",
                    end_date: "",
                    team_members: [],
                  });
                }}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouveau Projet
              </Button>
            </div>
            
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3">
                {projects.map((project) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedProject?.id === project.id
                        ? "bg-blue-50 border-blue-200"
                        : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                    }`}
                    onClick={() => setSelectedProject(project)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-800 mb-1">{project.title}</h3>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {project.description}
                        </p>
                        <div className="flex items-center space-x-2">
                          <Badge className={getStatusColor(project.status)}>
                            {getStatusLabel(project.status)}
                          </Badge>
                          <Badge className={getPriorityColor(project.priority)}>
                            {getPriorityLabel(project.priority)}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 ml-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditProject(project);
                          }}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProject(project.id);
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Right Content - Project Details */}
          <div className="flex-1 flex flex-col">
            {selectedProject ? (
              <>
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-gray-800">{selectedProject.title}</h2>
                      <p className="text-sm text-gray-600">Créé par {selectedProject.created_by_name}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(selectedProject.status)}>
                        {getStatusLabel(selectedProject.status)}
                      </Badge>
                      <Badge className={getPriorityColor(selectedProject.priority)}>
                        {getPriorityLabel(selectedProject.priority)}
                      </Badge>
                    </div>
                  </div>
                </div>

                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-6">
                    {/* Project Description */}
                    <div>
                      <h3 className="font-medium text-gray-800 mb-2">Description</h3>
                      <p className="text-gray-600">{selectedProject.description}</p>
                    </div>

                    {/* Project Info */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-gray-800 mb-1">Date de début</h4>
                        <p className="text-sm text-gray-600">
                          {selectedProject.start_date 
                            ? new Date(selectedProject.start_date).toLocaleDateString('fr-FR')
                            : 'Non définie'
                          }
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800 mb-1">Date de fin</h4>
                        <p className="text-sm text-gray-600">
                          {selectedProject.end_date 
                            ? new Date(selectedProject.end_date).toLocaleDateString('fr-FR')
                            : 'Non définie'
                          }
                        </p>
                      </div>
                    </div>

                    {/* Team Members */}
                    <div>
                      <h3 className="font-medium text-gray-800 mb-2">Membres de l'équipe</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedProject.team_members_names.map((name, index) => (
                          <Badge key={index} className="bg-blue-100 text-blue-700">
                            <Users className="h-3 w-3 mr-1" />
                            {name}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Documents */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-gray-800">Documents</h3>
                        <Button
                          onClick={() => setShowDocumentUpload(!showDocumentUpload)}
                          size="sm"
                          className="bg-green-600 text-white hover:bg-green-700"
                        >
                          <Upload className="h-4 w-4 mr-1" />
                          Ajouter
                        </Button>
                      </div>

                      {showDocumentUpload && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mb-4 p-3 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300"
                        >
                          <Input
                            type="file"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleFileUpload(file);
                                setShowDocumentUpload(false);
                              }
                            }}
                            className="mb-2"
                          />
                        </motion.div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {projectDocuments.map((doc) => {
                          const isImage = (doc.file_type && doc.file_type.startsWith('image/')) || /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(doc.name);
                          const fileExt = (doc.name.split('.').pop() || '').toUpperCase();
                          return (
                            <div
                              key={doc.id}
                              className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white"
                            >
                              <div className="aspect-[4/3] w-full bg-gray-50 flex items-center justify-center overflow-hidden">
                                {isImage ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={doc.file}
                                    alt={doc.name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full flex-col items-center justify-center text-gray-500">
                                    <FileText className="h-10 w-10 mb-2" />
                                    <span className="text-xs font-medium bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                                      {fileExt || 'FILE'}
                                    </span>
                                  </div>
                                )}
                              </div>

                              <div className="p-3">
                                <p className="font-medium text-gray-800 truncate" title={doc.name}>{doc.name}</p>
                                <p className="text-xs text-gray-600 mt-0.5">
                                  {formatFileSize(doc.size)} • {doc.uploaded_by_name}
                                </p>
                              </div>

                              <div className="absolute inset-x-0 bottom-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="flex items-center justify-end space-x-1 rounded bg-white/90 p-1 shadow">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => window.open(doc.file, '_blank')}
                                    className="text-blue-600 hover:text-blue-700"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => window.open(doc.file, '_blank')}
                                    className="text-green-600 hover:text-green-700"
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteDocument(doc.id)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <FolderPlus className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Sélectionnez un projet pour voir les détails</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Project Form Modal */}
        <AnimatePresence>
          {showProjectForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-800">
                      {isEditing ? "Modifier le projet" : "Nouveau projet"}
                    </h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowProjectForm(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">Titre du projet *</Label>
                      <Input
                        id="title"
                        value={projectForm.title}
                        onChange={(e) =>
                          setProjectForm((prev) => ({ ...prev, title: e.target.value }))
                        }
                        placeholder="Titre du projet..."
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">Description *</Label>
                      <Textarea
                        id="description"
                        value={projectForm.description}
                        onChange={(e) =>
                          setProjectForm((prev) => ({ ...prev, description: e.target.value }))
                        }
                        placeholder="Description du projet..."
                        rows={4}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="status">Statut</Label>
                        <Select
                          value={projectForm.status}
                          onValueChange={(value: any) =>
                            setProjectForm((prev) => ({ ...prev, status: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="planning">En Planification</SelectItem>
                            <SelectItem value="active">Actif</SelectItem>
                            <SelectItem value="on_hold">En Pause</SelectItem>
                            <SelectItem value="completed">Terminé</SelectItem>
                            <SelectItem value="cancelled">Annulé</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="priority">Priorité</Label>
                        <Select
                          value={projectForm.priority}
                          onValueChange={(value: any) =>
                            setProjectForm((prev) => ({ ...prev, priority: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Faible</SelectItem>
                            <SelectItem value="medium">Moyenne</SelectItem>
                            <SelectItem value="high">Élevée</SelectItem>
                            <SelectItem value="urgent">Urgente</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="start_date">Date de début</Label>
                        <Input
                          id="start_date"
                          type="date"
                          value={projectForm.start_date}
                          onChange={(e) =>
                            setProjectForm((prev) => ({ ...prev, start_date: e.target.value }))
                          }
                        />
                      </div>

                      <div>
                        <Label htmlFor="end_date">Date de fin</Label>
                        <Input
                          id="end_date"
                          type="date"
                          value={projectForm.end_date}
                          onChange={(e) =>
                            setProjectForm((prev) => ({ ...prev, end_date: e.target.value }))
                          }
                        />
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setShowProjectForm(false)}
                      >
                        Annuler
                      </Button>
                      <Button
                        onClick={isEditing ? handleUpdateProject : handleCreateProject}
                        className="bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                      >
                        {isEditing ? "Mettre à jour" : "Créer"}
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
