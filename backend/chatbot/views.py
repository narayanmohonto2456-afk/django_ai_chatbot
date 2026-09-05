import json

from django.contrib.auth.decorators import login_required
from django.http import JsonResponse, StreamingHttpResponse
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
from .services import (
    generate_ai_response,
    stream_ai_response,
)


# ============================================================
# FRONTEND CHAT PAGE
# ============================================================

@login_required
@ensure_csrf_cookie
def chat_view(request):
    return render(
        request,
        "chatbot/chat.html",
    )


# ============================================================
# CSRF ENDPOINT FOR NEXT.JS
# ============================================================

@ensure_csrf_cookie
def csrf_view(request):
    return JsonResponse(
        {
            "detail": "CSRF cookie set.",
        }
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

    # ========================================================
    # NORMAL / NON-STREAMING MESSAGE ENDPOINT
    # ========================================================

    @action(
        detail=True,
        methods=["post"],
        url_path="messages",
    )
    def send_message(
        self,
        request,
        pk=None,
    ):
        conversation = self.get_object()

        message = request.data.get(
            "message",
            "",
        )

        # ----------------------------------------------------
        # Validate message
        # ----------------------------------------------------

        if not isinstance(
            message,
            str,
        ):
            return Response(
                {
                    "error":
                        "Message must be a string.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        message = message.strip()

        if not message:
            return Response(
                {
                    "error":
                        "Message cannot be empty.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ----------------------------------------------------
        # Save user message
        # ----------------------------------------------------

        user_message = Message.objects.create(
            conversation=conversation,
            role="user",
            content=message,
        )

        # ----------------------------------------------------
        # Automatically generate chat title
        # ----------------------------------------------------

        if conversation.title == "New Chat":
            title = message

            if len(title) > 50:
                title = (
                    title[:50].rstrip()
                    + "..."
                )

            conversation.title = title

            conversation.save(
                update_fields=[
                    "title",
                    "updated_at",
                ]
            )

        # ----------------------------------------------------
        # Get conversation history
        # ----------------------------------------------------

        previous_messages = (
            Message.objects.filter(
                conversation=conversation
            )
            .order_by("created_at")
        )

        messages_for_ai = []

        for msg in previous_messages:
            messages_for_ai.append(
                {
                    "role": msg.role,
                    "content": msg.content,
                }
            )

        # ----------------------------------------------------
        # Generate full AI response
        # ----------------------------------------------------

        try:
            ai_response = (
                generate_ai_response(
                    messages_for_ai
                )
            )

        except Exception as error:
            return Response(
                {
                    "error":
                        f"Ollama error: {str(error)}",
                },
                status=(
                    status.HTTP_500_INTERNAL_SERVER_ERROR
                ),
            )

        # ----------------------------------------------------
        # Save assistant response
        # ----------------------------------------------------

        assistant_message = (
            Message.objects.create(
                conversation=conversation,
                role="assistant",
                content=ai_response,
            )
        )

        # ----------------------------------------------------
        # Update conversation timestamp
        # ----------------------------------------------------

        conversation.save(
            update_fields=[
                "updated_at",
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
        # Return complete response
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
            status=status.HTTP_201_CREATED,
        )

    # ========================================================
    # STREAMING MESSAGE ENDPOINT
    # ========================================================

    @action(
        detail=True,
        methods=["post"],
        url_path="stream",
    )
    def stream_message(
        self,
        request,
        pk=None,
    ):
        conversation = self.get_object()

        message = request.data.get(
            "message",
            "",
        )

        # ----------------------------------------------------
        # Validate message
        # ----------------------------------------------------

        if not isinstance(
            message,
            str,
        ):
            return Response(
                {
                    "error":
                        "Message must be a string.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        message = message.strip()

        if not message:
            return Response(
                {
                    "error":
                        "Message cannot be empty.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ----------------------------------------------------
        # Save user message
        # ----------------------------------------------------

        user_message = Message.objects.create(
            conversation=conversation,
            role="user",
            content=message,
        )

        # ----------------------------------------------------
        # Automatically generate title
        # ----------------------------------------------------

        if conversation.title == "New Chat":
            title = message

            if len(title) > 50:
                title = (
                    title[:50].rstrip()
                    + "..."
                )

            conversation.title = title

            conversation.save(
                update_fields=[
                    "title",
                    "updated_at",
                ]
            )

        # ----------------------------------------------------
        # Prepare conversation history for Ollama
        # ----------------------------------------------------

        previous_messages = list(
            Message.objects.filter(
                conversation=conversation
            ).order_by("created_at")
        )

        messages_for_ai = [
            {
                "role": msg.role,
                "content": msg.content,
            }
            for msg in previous_messages
        ]

        # ----------------------------------------------------
        # Serialize data before streaming starts
        # ----------------------------------------------------

        conversation_data = (
            ConversationSerializer(
                conversation
            ).data
        )

        user_message_data = (
            MessageSerializer(
                user_message
            ).data
        )

        # ----------------------------------------------------
        # Streaming generator
        # ----------------------------------------------------

        def generate():
            full_response = ""

            # ------------------------------------------------
            # Tell Next.js streaming has started
            # ------------------------------------------------

            yield (
                json.dumps(
                    {
                        "type": "start",

                        "conversation":
                            conversation_data,

                        "user_message":
                            user_message_data,
                    }
                )
                + "\n"
            )

            try:
                # --------------------------------------------
                # Receive chunks from Ollama
                # --------------------------------------------

                for chunk in stream_ai_response(
                    messages_for_ai
                ):
                    full_response += chunk

                    yield (
                        json.dumps(
                            {
                                "type":
                                    "token",

                                "content":
                                    chunk,
                            }
                        )
                        + "\n"
                    )

                # --------------------------------------------
                # Save final assistant message
                # --------------------------------------------

                assistant_message = (
                    Message.objects.create(
                        conversation=
                            conversation,

                        role=
                            "assistant",

                        content=
                            full_response,
                    )
                )

                # --------------------------------------------
                # Update timestamp
                # --------------------------------------------

                conversation.save(
                    update_fields=[
                        "updated_at",
                    ]
                )

                # --------------------------------------------
                # Fetch fresh conversation
                # --------------------------------------------

                updated_conversation = (
                    Conversation.objects.get(
                        pk=conversation.pk
                    )
                )

                # --------------------------------------------
                # Tell frontend stream is complete
                # --------------------------------------------

                yield (
                    json.dumps(
                        {
                            "type":
                                "done",

                            "conversation":
                                ConversationSerializer(
                                    updated_conversation
                                ).data,

                            "user_message":
                                MessageSerializer(
                                    user_message
                                ).data,

                            "assistant_message":
                                MessageSerializer(
                                    assistant_message
                                ).data,
                        }
                    )
                    + "\n"
                )

            except Exception as error:
                # --------------------------------------------
                # Send streaming error to frontend
                # --------------------------------------------

                yield (
                    json.dumps(
                        {
                            "type":
                                "error",

                            "error":
                                str(error),
                        }
                    )
                    + "\n"
                )

        # ----------------------------------------------------
        # Create streaming HTTP response
        # ----------------------------------------------------

        response = StreamingHttpResponse(
            generate(),
            content_type=(
                "application/x-ndjson"
            ),
        )

        response[
            "Cache-Control"
        ] = "no-cache"

        response[
            "X-Accel-Buffering"
        ] = "no"

        return response