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

class UserFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserFile
        fields = ['id', 'name', 'file', 'file_type', 'size']

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
