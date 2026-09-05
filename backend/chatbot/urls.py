from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    chat_view,
    ConversationViewSet,
)


router = DefaultRouter()

router.register(
    "chats",
    ConversationViewSet,
    basename="conversation"
)


urlpatterns = [

    # Frontend
    path(
        "",
        chat_view,
        name="chat"
    ),

    # API
    path(
        "api/",
        include(router.urls)
    ),

]