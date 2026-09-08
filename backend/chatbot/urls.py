from django.conf import settings
from django.shortcuts import redirect
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import ConversationViewSet


router = DefaultRouter()
router.register("chats", ConversationViewSet, basename="conversation")


def frontend_redirect(request):
    # Keep old Django links working without serving the retired chat UI.
    frontend_url = getattr(
        settings, "FRONTEND_URL", "http://localhost:3000/"
    )
    return redirect(frontend_url)


urlpatterns = [
    path("", frontend_redirect, name="chat"),
    path("api/", include(router.urls)),
]
