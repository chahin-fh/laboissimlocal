from django.contrib.auth.models import User
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework import serializers, status , viewsets
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.decorators import api_view, permission_classes, action
from django.db import transaction
from .models import SiteContent, UserProfile, Project, ProjectDocument
from django.db import models
from rest_framework.exceptions import PermissionDenied

# Serializer for the User model
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_staff', 'is_superuser', 'date_joined']

# Serializer for UserProfile model
class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['phone', 'bio', 'profile_image', 'location', 'institution', 'website', 'linkedin', 'twitter', 'github']

# Extended User Serializer with profile data
class ExtendedUserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_staff', 'is_superuser', 'date_joined', 'profile', 'full_name']
    
    def get_full_name(self, obj):
        return obj.profile.full_name if hasattr(obj, 'profile') else f"{obj.first_name} {obj.last_name}".strip() or obj.username

# Serializer for the SiteContent
class SiteContentSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiteContent
        fields = '__all__'

# API view to return and update the singleton SiteContent
class SiteContentView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        content, _ = SiteContent.objects.get_or_create(id=1)
        serializer = SiteContentSerializer(content)
        return Response(serializer.data)

    def put(self, request):
        if not request.user.is_staff:
            return Response({'detail': 'Not authorized.'}, status=status.HTTP_403_FORBIDDEN)
        content, _ = SiteContent.objects.get_or_create(id=1)
        serializer = SiteContentSerializer(content, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# API view to return the current user's data
class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = ExtendedUserSerializer(request.user)
        return Response(serializer.data)

# API view to get all team members
class TeamMembersView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        """Get all team members with their profiles"""
        users = User.objects.filter(is_active=True).prefetch_related('profile')
        serializer = ExtendedUserSerializer(users, many=True)
        return Response(serializer.data)

# API view to get all users (for admin purposes)
class UsersView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get all users for admin purposes"""
        users = User.objects.select_related('profile').all()
        users_data = []
        
        for user in users:
            user_data = {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'is_staff': user.is_staff,
                'is_superuser': user.is_superuser,
                'is_active': user.is_active,
                'date_joined': user.date_joined,
                'role': user.profile.role if hasattr(user, 'profile') and user.profile else 'member',
                'verified': False,  # Default to False since UserProfile doesn't have verified field
            }
            users_data.append(user_data)
        
        return Response(users_data)

# API view to update user profile
class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        """Get current user's profile"""
        try:
            profile = request.user.profile
            serializer = UserProfileSerializer(profile)
            return Response(serializer.data)
        except UserProfile.DoesNotExist:
            # Create profile if it doesn't exist
            profile = UserProfile.objects.create(user=request.user)
            serializer = UserProfileSerializer(profile)
            return Response(serializer.data)

    def put(self, request):
        """Update current user's profile"""
        try:
            profile = request.user.profile
        except UserProfile.DoesNotExist:
            profile = UserProfile.objects.create(user=request.user)
        
        # Handle file upload for profile image
        if 'profile_image' in request.FILES:
            profile.profile_image = request.FILES['profile_image']
        
        # Handle other fields
        data = request.data.copy()
        if 'profile_image' in data:
            del data['profile_image']  # Remove from data since we handled it above
        
        serializer = UserProfileSerializer(profile, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request):
        """Partial update of current user's profile"""
        return self.put(request) 

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def update_user_role(request, user_id):
    try:
        user_id_int = int(user_id)
        target_user = User.objects.get(id=user_id_int)
    except (User.DoesNotExist, ValueError):
        return Response(
            {"error": "Utilisateur non trouvé."},
            status=status.HTTP_404_NOT_FOUND
        )

    new_role = request.data.get('role')
    if new_role not in ['member', 'admin', 'chef_d_equipe']:
        return Response(
            {"error": "Rôle spécifié invalide."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Get or create the user profile
    user_profile, created = UserProfile.objects.get_or_create(user=target_user)

    # Update flags based on the role
    try:
        if new_role == 'admin':
            target_user.is_staff = True
            target_user.is_superuser = False  # Changed: Avoid granting superuser unless necessary
        elif new_role == 'chef_d_equipe':
            target_user.is_staff = False
            target_user.is_superuser = False
        else:  # 'member'
            target_user.is_staff = False
            target_user.is_superuser = False

        with transaction.atomic():
            user_profile.role = new_role
            target_user.save()
            user_profile.save()

        serializer = ExtendedUserSerializer(target_user)
        return Response({
            "message": f"Rôle de l'utilisateur mis à jour vers '{new_role}' avec succès.",
            "user": serializer.data
        }, status=status.HTTP_200_OK)

    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error updating user {user_id} role to {new_role}: {str(e)}")
        return Response(
            {"error": f"Erreur lors de la mise à jour du rôle: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def ban_user(request, user_id):
    """Ban a user (set is_active to False)"""
    try:
        user_id_int = int(user_id)
        target_user = User.objects.get(id=user_id_int)
    except (User.DoesNotExist, ValueError):
        return Response(
            {"error": "Utilisateur non trouvé."},
            status=status.HTTP_404_NOT_FOUND
        )

    # Prevent admin from banning themselves
    if target_user.id == request.user.id:
        return Response(
            {"error": "Vous ne pouvez pas vous bannir vous-même."},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        target_user.is_active = False
        target_user.save()
        
        serializer = ExtendedUserSerializer(target_user)
        return Response({
            "message": f"Utilisateur {target_user.username} a été banni avec succès.",
            "user": serializer.data
        }, status=status.HTTP_200_OK)

    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error banning user {user_id}: {str(e)}")
        return Response(
            {"error": f"Erreur lors du bannissement: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def unban_user(request, user_id):
    """Unban a user (set is_active to True)"""
    try:
        user_id_int = int(user_id)
        target_user = User.objects.get(id=user_id_int)
    except (User.DoesNotExist, ValueError):
        return Response(
            {"error": "Utilisateur non trouvé."},
            status=status.HTTP_404_NOT_FOUND
        )

    try:
        target_user.is_active = True
        target_user.save()
        
        serializer = ExtendedUserSerializer(target_user)
        return Response({
            "message": f"Utilisateur {target_user.username} a été débanni avec succès.",
            "user": serializer.data
        }, status=status.HTTP_200_OK)

    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error unbanning user {user_id}: {str(e)}")
        return Response(
            {"error": f"Erreur lors du débannissement: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['DELETE'])
@permission_classes([IsAuthenticated, IsAdminUser])
def delete_user(request, user_id):
    """Delete a user permanently"""
    try:
        user_id_int = int(user_id)
        target_user = User.objects.get(id=user_id_int)
    except (User.DoesNotExist, ValueError):
        return Response(
            {"error": "Utilisateur non trouvé."},
            status=status.HTTP_404_NOT_FOUND
        )

    # Prevent admin from deleting themselves
    if target_user.id == request.user.id:
        return Response(
            {"error": "Vous ne pouvez pas supprimer votre propre compte."},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        username = target_user.username
        target_user.delete()
        
        return Response({
            "message": f"Utilisateur {username} a été supprimé avec succès."
        }, status=status.HTTP_200_OK)

    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error deleting user {user_id}: {str(e)}")
        return Response(
            {"error": f"Erreur lors de la suppression: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# Project Serializers
class ProjectDocumentSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(source='uploaded_by.get_full_name', read_only=True)
    
    class Meta:
        model = ProjectDocument
        fields = ['id', 'name', 'file', 'uploaded_by', 'uploaded_by_name', 'uploaded_at', 'file_type', 'size']

class ProjectSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    team_members_names = serializers.SerializerMethodField()
    documents = ProjectDocumentSerializer(many=True, read_only=True)
    documents_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Project
        fields = [
            'id', 'title', 'description', 'image', 'status', 'priority', 
            'start_date', 'end_date', 'created_by', 'created_by_name',
            'team_members', 'team_members_names', 'created_at', 'updated_at',
            'documents', 'documents_count'
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_at']
    
    def get_team_members_names(self, obj):
        return [f"{member.first_name} {member.last_name}".strip() or member.username for member in obj.team_members.all()]
    
    def get_documents_count(self, obj):
        return obj.documents.count()

# Project Viewsets
class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    def get_queryset(self):
        user = self.request.user
        # Users can see projects they created or are team members of
        return Project.objects.filter(
            models.Q(created_by=user) | models.Q(team_members=user)
        ).distinct()
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def add_team_member(self, request, pk=None):
        project = self.get_object()
        user_id = request.data.get('user_id')
        
        if not user_id:
            return Response({'error': 'user_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(id=user_id)
            project.team_members.add(user)
            return Response({'message': 'Team member added successfully'}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['post'])
    def remove_team_member(self, request, pk=None):
        project = self.get_object()
        user_id = request.data.get('user_id')
        
        if not user_id:
            return Response({'error': 'user_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(id=user_id)
            project.team_members.remove(user)
            return Response({'message': 'Team member removed successfully'}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

class ProjectDocumentViewSet(viewsets.ModelViewSet):
    queryset = ProjectDocument.objects.all()
    serializer_class = ProjectDocumentSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    def get_queryset(self):
        project_id = self.request.query_params.get('project_id')
        if project_id:
            return ProjectDocument.objects.filter(project_id=project_id)
        return ProjectDocument.objects.none()
    
    def perform_create(self, serializer):
        project_id = self.request.data.get('project_id')
        if not project_id:
            raise serializers.ValidationError('project_id is required')
        
        try:
            project = Project.objects.get(id=project_id)
            # Check if user has access to this project
            if project.created_by != self.request.user and self.request.user not in project.team_members.all():
                raise PermissionDenied("You don't have permission to add documents to this project")
            
            serializer.save(uploaded_by=self.request.user, project=project)
        except Project.DoesNotExist:
            raise serializers.ValidationError('Project not found')
