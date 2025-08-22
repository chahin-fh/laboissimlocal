from rest_framework import viewsets, status, permissions, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import Event, EventRegistration
from django.contrib.auth.models import User

class EventRegistrationSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = EventRegistration
        fields = '__all__'
        read_only_fields = ['registration_date', 'user_name', 'user_email', 'user_full_name']
    
    def get_user_full_name(self, obj):
        profile = getattr(obj.user, 'profile', None)
        if profile:
            return profile.full_name
        return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.username

class EventSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    registered_count = serializers.IntegerField(read_only=True)
    is_full = serializers.BooleanField(read_only=True)
    registrations = EventRegistrationSerializer(many=True, read_only=True)
    user_registration = serializers.SerializerMethodField()
    
    class Meta:
        model = Event
        fields = '__all__'
        read_only_fields = ['created_by', 'created_by_name', 'created_at', 'updated_at', 'registered_count', 'is_full', 'user_registration']
    
    def get_user_registration(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            try:
                registration = obj.registrations.get(user=request.user)
                return EventRegistrationSerializer(registration).data
            except EventRegistration.DoesNotExist:
                return None
        return None

class EventViewSet(viewsets.ModelViewSet):
    serializer_class = EventSerializer
    
    def get_permissions(self):
        """Allow public access for viewing events, require auth for actions"""
        if self.action in ['list', 'retrieve']:
            permission_classes = [permissions.AllowAny]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        """Return all active events for public, all events for admin"""
        if self.request.user.is_authenticated and self.request.user.is_staff:
            return Event.objects.all().prefetch_related('registrations', 'registrations__user', 'registrations__user__profile')
        return Event.objects.filter(is_active=True).prefetch_related('registrations', 'registrations__user', 'registrations__user__profile')
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def register(self, request, pk=None):
        """Register current user for an event"""
        event = self.get_object()
        user = request.user
        
        # Check if user is already registered
        if event.registrations.filter(user=user).exists():
            return Response({'error': 'Vous êtes déjà inscrit à cet événement'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if event is full
        if event.is_full:
            return Response({'error': 'Cet événement est complet'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Create registration
        registration = EventRegistration.objects.create(
            event=event,
            user=user,
            notes=request.data.get('notes', '')
        )
        
        return Response(EventRegistrationSerializer(registration).data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def unregister(self, request, pk=None):
        """Unregister current user from an event"""
        event = self.get_object()
        user = request.user
        
        try:
            registration = event.registrations.get(user=user)
            registration.delete()
            return Response({'message': 'Inscription annulée avec succès'}, status=status.HTTP_200_OK)
        except EventRegistration.DoesNotExist:
            return Response({'error': 'Vous n\'êtes pas inscrit à cet événement'}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'])
    def registrations(self, request, pk=None):
        """Get all registrations for an event (admin only)"""
        event = self.get_object()
        
        if not request.user.is_staff:
            return Response({'error': 'Accès non autorisé'}, status=status.HTTP_403_FORBIDDEN)
        
        registrations = event.registrations.all().select_related('user', 'user__profile')
        return Response(EventRegistrationSerializer(registrations, many=True).data)
    
    @action(detail=True, methods=['patch'])
    def update_registration_status(self, request, pk=None):
        """Update registration status (admin only)"""
        event = self.get_object()
        
        if not request.user.is_staff:
            return Response({'error': 'Accès non autorisé'}, status=status.HTTP_403_FORBIDDEN)
        
        registration_id = request.data.get('registration_id')
        new_status = request.data.get('status')
        
        if not registration_id or not new_status:
            return Response({'error': 'registration_id et status sont requis'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            registration = event.registrations.get(id=registration_id)
            registration.status = new_status
            registration.save()
            return Response(EventRegistrationSerializer(registration).data)
        except EventRegistration.DoesNotExist:
            return Response({'error': 'Inscription non trouvée'}, status=status.HTTP_404_NOT_FOUND)

class EventRegistrationViewSet(viewsets.ModelViewSet):
    serializer_class = EventRegistrationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Return registrations for the current user"""
        return EventRegistration.objects.filter(user=self.request.user).select_related('event', 'user', 'user__profile')
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
