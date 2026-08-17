from django.contrib.auth.decorators import login_required
from django.shortcuts import render
from django.views.decorators.csrf import ensure_csrf_cookie

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Conversation, Message
from .serializers import (
    ConversationSerializer,
    MessageSerializer,
)

from .services import generate_ai_response


# ============================================================
# FRONTEND CHAT PAGE
# ============================================================

@login_required
@ensure_csrf_cookie
def chat_view(request):
    return render(
        request,
        "chatbot/chat.html"
    )


# ============================================================
# CONVERSATION API
# ============================================================

class ConversationViewSet(viewsets.ModelViewSet):

    serializer_class = ConversationSerializer
    permission_classes = [IsAuthenticated]

    # --------------------------------------------------------
    # Only return conversations belonging to logged-in user
    # --------------------------------------------------------

    def get_queryset(self):

        return Conversation.objects.filter(
            user=self.request.user
        ).order_by("-updated_at")

    # --------------------------------------------------------
    # Automatically assign logged-in user
    # --------------------------------------------------------

    def perform_create(self, serializer):

        serializer.save(
            user=self.request.user
        )

    # --------------------------------------------------------
    # Retrieve conversation with messages
    # --------------------------------------------------------

    def retrieve(self, request, *args, **kwargs):

        conversation = self.get_object()

        serializer = self.get_serializer(
            conversation
        )

        return Response(
            serializer.data
        )

    # --------------------------------------------------------
    # Send message to Ollama
    # --------------------------------------------------------

    @action(
        detail=True,
        methods=["post"],
        url_path="messages"
    )
    def send_message(self, request, pk=None):

        conversation = self.get_object()

        message = request.data.get("message", "")

        # ----------------------------------------------------
        # Validate message
        # ----------------------------------------------------

        if not isinstance(message, str):

            return Response(
                {
                    "error": "Message must be a string."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        message = message.strip()

        if not message:

            return Response(
                {
                    "error": "Message cannot be empty."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # ----------------------------------------------------
        # Create user message
        # ----------------------------------------------------

        user_message = Message.objects.create(
            conversation=conversation,
            role="user",
            content=message
        )

        # ----------------------------------------------------
        # Automatically generate title
        # ----------------------------------------------------

        if conversation.title == "New Chat":

            title = message.strip()

            if len(title) > 50:
                title = title[:50].rstrip() + "..."

            conversation.title = title

            conversation.save(
                update_fields=[
                    "title",
                    "updated_at"
                ]
            )

        # ----------------------------------------------------
        # Get previous conversation history
        # ----------------------------------------------------

        previous_messages = Message.objects.filter(
            conversation=conversation
        ).order_by("created_at")

        messages_for_ai = []

        for msg in previous_messages:

            messages_for_ai.append(
                {
                    "role": msg.role,
                    "content": msg.content
                }
            )

        # ----------------------------------------------------
        # Generate AI response
        # ----------------------------------------------------

        try:

            ai_response = generate_ai_response(
                messages_for_ai
            )

        except Exception as e:

            return Response(
                {
                    "error": f"Ollama error: {str(e)}"
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # ----------------------------------------------------
        # Save assistant message
        # ----------------------------------------------------

        assistant_message = Message.objects.create(
            conversation=conversation,
            role="assistant",
            content=ai_response
        )

        # ----------------------------------------------------
        # Update conversation timestamp
        # ----------------------------------------------------

        conversation.save(
            update_fields=[
                "updated_at"
            ]
        )

        # ----------------------------------------------------
        # Serialize response
        # ----------------------------------------------------

        conversation_serializer = (
            ConversationSerializer(
                conversation
            )
        )

        user_message_serializer = (
            MessageSerializer(
                user_message
            )
        )

        assistant_message_serializer = (
            MessageSerializer(
                assistant_message
            )
        )

        # ----------------------------------------------------
        # Return response
        # ----------------------------------------------------

        return Response(
            {
                "conversation":
                    conversation_serializer.data,

                "user_message":
                    user_message_serializer.data,

                "assistant_message":
                    assistant_message_serializer.data,
            },
            status=status.HTTP_201_CREATED
        )