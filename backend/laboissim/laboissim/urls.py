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
from rest_framework.routers import DefaultRouter
from .email_token_view import EmailTokenObtainPairView, GoogleLoginJWTView
from .views import CurrentUserView, SiteContentView, UserProfileView, TeamMembersView, UsersView
from .file_views import FileViewSet
from .publication_views import PublicationViewSet
from .message_views import ContactMessageViewSet, AccountRequestViewSet, InternalMessageViewSet
from .event_views import EventViewSet, EventRegistrationViewSet

router = DefaultRouter(trailing_slash=False)
router.register(r'files', FileViewSet, basename='file')
router.register(r'publications', PublicationViewSet, basename='publication')
router.register(r'messages/contact', ContactMessageViewSet, basename='contact-message')
router.register(r'messages/account-requests', AccountRequestViewSet, basename='account-request')
router.register(r'messages/internal', InternalMessageViewSet, basename='internal-message')
router.register(r'events', EventViewSet, basename='event')
router.register(r'event-registrations', EventRegistrationViewSet, basename='event-registration')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/token/email/', EmailTokenObtainPairView.as_view(), name='token_obtain_pair_email'),

    path('api/', include(router.urls)),
    
    # Explicit URL patterns for events (backup)
    path('api/events/', EventViewSet.as_view({'get': 'list', 'post': 'create'}), name='event-list'),
    path('api/events/<int:pk>/', EventViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='event-detail'),
    path('api/events/<int:pk>/register/', EventViewSet.as_view({'post': 'register'}), name='event-register'),
    path('api/events/<int:pk>/unregister/', EventViewSet.as_view({'post': 'unregister'}), name='event-unregister'),
    path('api/events/<int:pk>/registrations/', EventViewSet.as_view({'get': 'registrations'}), name='event-registrations'),
    path('api/events/<int:pk>/update_registration_status/', EventViewSet.as_view({'patch': 'update_registration_status'}), name='event-update-registration-status'),
    
    # Explicit URL patterns for publication search actions (backup)
    path('api/publications/search_members/', PublicationViewSet.as_view({'get': 'search_members'}), name='search_members_explicit'),
    path('api/publications/search_externals/', PublicationViewSet.as_view({'get': 'search_externals'}), name='search_externals_explicit'),
    
    path('auth/', include('social_django.urls', namespace='social')),
    path('auth/google/jwt/', GoogleLoginJWTView.as_view(), name='google_login_jwt'),
    path('api/user/', CurrentUserView.as_view(), name='current-user'),
    path('api/user/profile/', UserProfileView.as_view(), name='user-profile'),
    path('api/site-content/', SiteContentView.as_view(), name='site-content'),
    path('api/team-members/', TeamMembersView.as_view(), name='team-members'),
    path('api/users/', UsersView.as_view(), name='users'),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
