from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.contrib.auth.models import User
from .models import Publication, exterieurs, UserFile
from rest_framework import serializers
from django.db import models
import logging

# Set up logging
logger = logging.getLogger(__name__)

class PostedBySerializer(serializers.ModelSerializer):
    class Meta:
        model = Publication._meta.get_field('posted_by').related_model
        fields = ['id', 'username']
    
    def to_representation(self, instance):
        return {
            'id': str(instance.id),
            'name': instance.username
        }

class TaggedMemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name']
    
    def to_representation(self, instance):
        return {
            'id': str(instance.id),
            'name': f"{instance.first_name} {instance.last_name}".strip() or instance.username,
            'username': instance.username
        }

class TaggedExternalSerializer(serializers.ModelSerializer):
    class Meta:
        model = exterieurs
        fields = ['id', 'name', 'email']

class ExternalMemberSerializer(serializers.ModelSerializer):
    cv = serializers.SerializerMethodField()
    profile_pic = serializers.SerializerMethodField()
    
    class Meta:
        model = exterieurs
        fields = ['id', 'name', 'email', 'cv', 'profile_pic', 'created_at']
        read_only_fields = ['created_at']
    
    def get_cv(self, obj):
        if obj.cv:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.cv.url)
            return obj.cv.url
        return None
    
    def get_profile_pic(self, obj):
        if obj.profile_pic:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.profile_pic.url)
            return obj.profile_pic.url
        return None

class UserFileSerializer(serializers.ModelSerializer):
    file = serializers.SerializerMethodField()
    
    class Meta:
        model = UserFile
        fields = ['id', 'name', 'file', 'file_type', 'size']
    
    def get_file(self, obj):
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None

class PublicationSerializer(serializers.ModelSerializer):
    posted_by = PostedBySerializer(read_only=True)
    tagged_members = TaggedMemberSerializer(many=True, read_only=True)
    tagged_externals = TaggedExternalSerializer(many=True, read_only=True)
    attached_files = UserFileSerializer(many=True, read_only=True)
    
    class Meta:
        model = Publication
        fields = ['id', 'title', 'abstract', 'posted_by', 'posted_at', 'tagged_members', 'tagged_externals', 'attached_files', 'keywords']
        read_only_fields = ['posted_by', 'posted_at']

class PublicationViewSet(viewsets.ModelViewSet):
    serializer_class = PublicationSerializer

    def get_permissions(self):
        """
        Allow public access to list and retrieve publications,
        but require authentication for create, update, and delete operations.
        """
        if self.action in ['list', 'retrieve']:
            permission_classes = [permissions.AllowAny]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        # Return all publications ordered by posting date
        # Users can only delete their own publications (handled in destroy method)
        return Publication.objects.all().order_by('-posted_at')

    def perform_create(self, serializer):
        publication = serializer.save(posted_by=self.request.user)
        
        # Handle tagged members
        tagged_member_ids = self.request.data.get('tagged_members', [])
        if tagged_member_ids:
            publication.tagged_members.set(tagged_member_ids)
        
        # Handle tagged externals
        tagged_external_ids = self.request.data.get('tagged_externals', [])
        if tagged_external_ids:
            publication.tagged_externals.set(tagged_external_ids)
        
        # Handle attached files
        attached_file_ids = self.request.data.get('attached_files', [])
        if attached_file_ids:
            publication.attached_files.set(attached_file_ids)
    
    def create(self, request, *args, **kwargs):
        """Create publication with proper serializer context"""
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    def retrieve(self, request, *args, **kwargs):
        """Retrieve publication with proper file URLs"""
        instance = self.get_object()
        serializer = self.get_serializer(instance, context={'request': request})
        return Response(serializer.data)
    
    def list(self, request, *args, **kwargs):
        """List publications with proper file URLs"""
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)
            
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        # Only allow users to delete their own publications
        if instance.posted_by != request.user:
            return Response(
                {"error": "You can only delete your own publications"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def search_members(self, request):
        """Search for team members to tag"""
        logger.info(f"search_members called with query: {request.query_params.get('q', '')}")
        
        query = request.query_params.get('q', '')
        
        # If query is empty, return all users (limit to 50 for performance)
        if not query:
            users = User.objects.all()[:50]
            logger.info(f"Returning all users: {users.count()}")
        else:
            # Search by username, first_name, or last_name
            users = User.objects.filter(
                models.Q(username__icontains=query) |
                models.Q(first_name__icontains=query) |
                models.Q(last_name__icontains=query)
            )[:20]
            logger.info(f"Filtered users for query '{query}': {users.count()}")
        
        serializer = TaggedMemberSerializer(users, many=True)
        logger.info(f"Returning {len(serializer.data)} users")
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def search_externals(self, request):
        """Search for external profiles to tag"""
        logger.info(f"search_externals called with query: {request.query_params.get('q', '')}")
        
        query = request.query_params.get('q', '')
        
        # If query is empty, return all externals (limit to 50 for performance)
        if not query:
            externals = exterieurs.objects.all()[:50]
            logger.info(f"Returning all externals: {externals.count()}")
        else:
            # Search by name or email
            externals = exterieurs.objects.filter(
                models.Q(name__icontains=query) |
                models.Q(email__icontains=query)
            )[:20]
            logger.info(f"Filtered externals for query '{query}': {externals.count()}")
        
        serializer = TaggedExternalSerializer(externals, many=True)
        logger.info(f"Returning {len(serializer.data)} externals")
        return Response(serializer.data)

class ExternalMemberViewSet(viewsets.ModelViewSet):
    queryset = exterieurs.objects.all()
    serializer_class = ExternalMemberSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        """Create a new external member with file uploads"""
        logger.info(f"Creating external member with data: {request.data}")
        
        # Check if external member with this email already exists
        email = request.data.get('email')
        if email and exterieurs.objects.filter(email=email).exists():
            existing_external = exterieurs.objects.get(email=email)
            serializer = self.get_serializer(existing_external, context={'request': request})
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        serializer = self.get_serializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            external_member = serializer.save()
            logger.info(f"External member created successfully: {external_member.id}")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            logger.error(f"External member creation failed: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def retrieve(self, request, *args, **kwargs):
        """Retrieve external member with proper file URLs"""
        instance = self.get_object()
        serializer = self.get_serializer(instance, context={'request': request})
        return Response(serializer.data)
    
    def list(self, request, *args, **kwargs):
        """List external members with proper file URLs"""
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)
