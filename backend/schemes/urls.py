from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import SchemeContentView, SchemeViewSet

router = DefaultRouter()
router.register('schemes', SchemeViewSet, basename='scheme')

urlpatterns = [
    path('', include(router.urls)),
    path('schemes/<int:scheme_id>/content/', SchemeContentView.as_view(), name='scheme-content'),
]
