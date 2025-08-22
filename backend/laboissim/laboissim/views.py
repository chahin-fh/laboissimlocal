from django.contrib.auth.models import User
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework import serializers, status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .models import SiteContent, UserProfile

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
        users = User.objects.all().values('id', 'username', 'email', 'first_name', 'last_name', 'is_staff', 'is_superuser', 'is_active', 'date_joined')
        return Response(list(users))

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