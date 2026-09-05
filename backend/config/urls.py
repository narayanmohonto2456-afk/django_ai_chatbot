from django.contrib import admin
from django.urls import path, include
from chatbot.views import csrf_view


urlpatterns = [

    path(
        "admin/",
        admin.site.urls
    ),

    path(
        "accounts/",
        include("accounts.urls")
    ),

    path(
        "",
        include("chatbot.urls")
    ),
    path(
    "api/csrf/",
    csrf_view,
    name="csrf",
    ),

]