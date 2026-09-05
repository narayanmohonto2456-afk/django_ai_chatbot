from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.contrib import messages
from django.shortcuts import render, redirect


def register_view(request):

    if request.user.is_authenticated:
        return redirect("chat")

    if request.method == "POST":

        username = request.POST.get("username", "").strip()
        email = request.POST.get("email", "").strip()
        password = request.POST.get("password", "")
        confirm_password = request.POST.get(
            "confirm_password",
            ""
        )

        if not username or not email or not password:
            messages.error(
                request,
                "All fields are required."
            )
            return redirect("register")

        if password != confirm_password:
            messages.error(
                request,
                "Passwords do not match."
            )
            return redirect("register")

        if User.objects.filter(
            username=username
        ).exists():
            messages.error(
                request,
                "Username already exists."
            )
            return redirect("register")

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
        )

        login(request, user)

        return redirect("chat")

    return render(
        request,
        "accounts/register.html"
    )


def login_view(request):

    if request.user.is_authenticated:
        return redirect("chat")

    if request.method == "POST":

        username = request.POST.get("username", "")
        password = request.POST.get("password", "")

        user = authenticate(
            request,
            username=username,
            password=password,
        )

        if user is not None:
            login(request, user)
            return redirect("chat")

        messages.error(
            request,
            "Invalid username or password."
        )

    return render(
        request,
        "accounts/login.html"
    )


def logout_view(request):

    logout(request)

    return redirect("login")