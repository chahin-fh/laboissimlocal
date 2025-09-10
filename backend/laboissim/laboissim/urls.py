"""
URL configuration for laboissim project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
Including another URLconf
    1. Import the include() function: from my_app import views
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from .email_token_view import EmailTokenObtainPairView, GoogleLoginJWTView
from .views import CurrentUserView, SiteContentView, UserProfileView, TeamMembersView, UsersView , update_user_role, ban_user, unban_user, delete_user, ProjectViewSet, ProjectDocumentViewSet
from .file_views import FileViewSet
from .publication_views import PublicationViewSet, ExternalMemberViewSet
from .message_views import ContactMessageViewSet, AccountRequestViewSet, InternalMessageViewSet
from .event_views import EventViewSet, EventRegistrationViewSet

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/token/email/', EmailTokenObtainPairView.as_view(), name='token_obtain_pair_email'),
    
    path('api/admin/update-user-role/<int:user_id>/', update_user_role, name='update_user_role'),
    path('api/admin/ban-user/<int:user_id>/', ban_user, name='ban_user'),
    path('api/admin/unban-user/<int:user_id>/', unban_user, name='unban_user'),
    path('api/admin/delete-user/<int:user_id>/', delete_user, name='delete_user'),

    # Explicit URL patterns for account requests
    path('api/messages/account-requests/', AccountRequestViewSet.as_view({'get': 'list', 'post': 'create'}), name='account-request-list'),
    path('api/messages/account-requests/<int:pk>/', AccountRequestViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='account-request-detail'),
    
    # Explicit URL patterns for contact messages
    path('api/messages/contact/', ContactMessageViewSet.as_view({'get': 'list', 'post': 'create'}), name='contact-message-list'),
    path('api/messages/contact/<int:pk>/', ContactMessageViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='contact-message-detail'),
    
    # Explicit URL patterns for internal messages
    path('api/messages/internal/', InternalMessageViewSet.as_view({'get': 'list', 'post': 'create'}), name='internal-message-list'),
    path('api/messages/internal/<int:pk>/', InternalMessageViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='internal-message-detail'),
    path('api/messages/internal/conversations/', InternalMessageViewSet.as_view({'get': 'conversations'}), name='internal-message-conversations'),
    path('api/messages/internal/conversation/', InternalMessageViewSet.as_view({'get': 'conversation'}), name='internal-message-conversation'),
    path('api/messages/internal/<int:pk>/mark_as_read/', InternalMessageViewSet.as_view({'post': 'mark_as_read'}), name='internal-message-mark-read'),
    path('api/messages/internal/unread_count/', InternalMessageViewSet.as_view({'get': 'unread_count'}), name='internal-message-unread-count'),
    
    # Explicit URL patterns for files
    path('api/files/', FileViewSet.as_view({'get': 'list', 'post': 'create'}), name='file-list'),
    path('api/files/<int:pk>/', FileViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='file-detail'),
    
    # Explicit URL patterns for publications
    path('api/publications/', PublicationViewSet.as_view({'get': 'list', 'post': 'create'}), name='publication-list'),
    path('api/publications/<int:pk>/', PublicationViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='publication-detail'),
    path('api/publications/search_members/', PublicationViewSet.as_view({'get': 'search_members'}), name='search_members_explicit'),
    path('api/publications/search_externals/', PublicationViewSet.as_view({'get': 'search_externals'}), name='search_externals_explicit'),
    
    # Explicit URL patterns for external members
    path('api/external-members/', ExternalMemberViewSet.as_view({'get': 'list', 'post': 'create'}), name='external-member-list'),
    path('api/external-members/<int:pk>/', ExternalMemberViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='external-member-detail'),
    
    # Explicit URL patterns for events (backup)
    path('api/events/', EventViewSet.as_view({'get': 'list', 'post': 'create'}), name='event-list'),
    path('api/events/<int:pk>/', EventViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='event-detail'),
    path('api/events/<int:pk>/register/', EventViewSet.as_view({'post': 'register'}), name='event-register'),
    path('api/events/<int:pk>/unregister/', EventViewSet.as_view({'post': 'unregister'}), name='event-unregister'),
    path('api/events/<int:pk>/registrations/', EventViewSet.as_view({'get': 'registrations'}), name='event-registrations'),
    path('api/events/<int:pk>/update_registration_status/', EventViewSet.as_view({'patch': 'update_registration_status'}), name='event-update-registration-status'),
    
    # Explicit URL patterns for event registrations
    path('api/event-registrations/', EventRegistrationViewSet.as_view({'get': 'list', 'post': 'create'}), name='event-registration-list'),
    path('api/event-registrations/<int:pk>/', EventRegistrationViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='event-registration-detail'),
    
    path('auth/', include('social_django.urls', namespace='social')),
    path('auth/google/jwt/', GoogleLoginJWTView.as_view(), name='google_login_jwt'),
    path('api/user/', CurrentUserView.as_view(), name='current-user'),
    path('api/user/profile/', UserProfileView.as_view(), name='user-profile'),
    path('api/site-content/', SiteContentView.as_view(), name='site-content'),
    path('api/team-members/', TeamMembersView.as_view(), name='team-members'),
    path('api/users/', UsersView.as_view(), name='users'),
    
    # Project URLs
    path('api/projects/', ProjectViewSet.as_view({'get': 'list', 'post': 'create'}), name='project-list'),
    path('api/projects/<int:pk>/', ProjectViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='project-detail'),
    path('api/projects/<int:pk>/add_team_member/', ProjectViewSet.as_view({'post': 'add_team_member'}), name='project-add-team-member'),
    path('api/projects/<int:pk>/remove_team_member/', ProjectViewSet.as_view({'post': 'remove_team_member'}), name='project-remove-team-member'),
    
    # Project Document URLs
    path('api/project-documents/', ProjectDocumentViewSet.as_view({'get': 'list', 'post': 'create'}), name='project-document-list'),
    path('api/project-documents/<int:pk>/', ProjectDocumentViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='project-document-detail'),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
