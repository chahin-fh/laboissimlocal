from rest_framework import viewsets, status, permissions, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Q
from django.contrib.auth.models import User
from .models import ContactMessage, AccountRequest, InternalMessage

class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = '__all__'
        read_only_fields = ['created_at']

class AccountRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = AccountRequest
        fields = '__all__'
        read_only_fields = ['created_at']

class InternalMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.username', read_only=True)
    receiver_name = serializers.CharField(source='receiver.username', read_only=True)
    conversation_id = serializers.CharField(read_only=True)
    
    class Meta:
        model = InternalMessage
        fields = '__all__'
        read_only_fields = ['created_at', 'sender', 'sender_name', 'receiver_name', 'conversation_id']

class ContactMessageViewSet(viewsets.ModelViewSet):
    queryset = ContactMessage.objects.all()
    serializer_class = ContactMessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_permissions(self):
        """
        Allow public access to create contact messages,
        but require authentication for admin operations.
        """
        if self.action == 'create':
            permission_classes = [permissions.AllowAny]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def perform_create(self, serializer):
        serializer.save()

class AccountRequestViewSet(viewsets.ModelViewSet):
    queryset = AccountRequest.objects.all()
    serializer_class = AccountRequestSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_permissions(self):
        """
        Allow public access to create account requests,
        but require authentication for admin operations.
        """
        if self.action == 'create':
            permission_classes = [permissions.AllowAny]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def perform_create(self, serializer):
        serializer.save()

class InternalMessageViewSet(viewsets.ModelViewSet):
    serializer_class = InternalMessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Return messages where the current user is sender or receiver"""
        return InternalMessage.objects.filter(
            Q(sender=self.request.user) | Q(receiver=self.request.user)
        ).order_by('-created_at')
    
    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)
    
    @action(detail=False, methods=['get'])
    def conversations(self, request):
        """Get all conversations for the current user"""
        user = request.user
        
        # Get all unique conversations
        conversations = {}
        
        # Get messages where user is sender or receiver
        messages = InternalMessage.objects.filter(
            Q(sender=user) | Q(receiver=user)
        ).select_related('sender', 'receiver').order_by('-created_at')
        
        for message in messages:
            # Determine the other user in the conversation
            if message.sender == user:
                other_user = message.receiver
                other_user_name = message.receiver.username
            else:
                other_user = message.sender
                other_user_name = message.sender.username
            
            conversation_id = message.conversation_id
            
            if conversation_id not in conversations:
                # Count unread messages from this user
                unread_count = InternalMessage.objects.filter(
                    sender=other_user,
                    receiver=user,
                    status='unread'
                ).count()
                
                conversations[conversation_id] = {
                    'user_id': other_user.id,
                    'user_name': other_user_name,
                    'last_message': InternalMessageSerializer(message).data,
                    'unread_count': unread_count
                }
        
        return Response(list(conversations.values()))
    
    @action(detail=False, methods=['get'])
    def conversation(self, request):
        """Get messages for a specific conversation"""
        other_user_id = request.query_params.get('user_id')
        if not other_user_id:
            return Response({'error': 'user_id parameter is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            other_user = User.objects.get(id=other_user_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Get all messages between current user and other user
        messages = InternalMessage.objects.filter(
            (Q(sender=request.user) & Q(receiver=other_user)) |
            (Q(sender=other_user) & Q(receiver=request.user))
        ).order_by('created_at')
        
        # Mark messages as read
        messages.filter(sender=other_user, receiver=request.user, status='unread').update(status='read')
        
        return Response(InternalMessageSerializer(messages, many=True).data)
    
    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        """Mark a message as read"""
        message = self.get_object()
        
        # Only allow marking messages as read if the current user is the receiver
        if message.receiver != request.user:
            return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
        
        message.status = 'read'
        message.save()
        
        return Response(InternalMessageSerializer(message).data)
    
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Get count of unread messages"""
        user_id = request.query_params.get('user_id')
        
        if user_id:
            # Count unread messages from specific user
            count = InternalMessage.objects.filter(
                sender_id=user_id,
                receiver=request.user,
                status='unread'
            ).count()
        else:
            # Count all unread messages
            count = InternalMessage.objects.filter(
                receiver=request.user,
                status='unread'
            ).count()
        
        return Response({'unread_count': count})


