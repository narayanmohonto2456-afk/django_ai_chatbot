from rest_framework import serializers

from .models import Conversation, Message


# ============================================================
# MESSAGE SERIALIZER
# ============================================================

class MessageSerializer(
    serializers.ModelSerializer
):

    class Meta:

        model = Message

        fields = [
            "id",
            "role",
            "content",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
        ]


# ============================================================
# CONVERSATION SERIALIZER
# ============================================================

class ConversationSerializer(
    serializers.ModelSerializer
):

    messages = MessageSerializer(
        many=True,
        read_only=True
    )

    class Meta:

        model = Conversation

        fields = [
            "id",
            "title",
            "created_at",
            "updated_at",
            "messages",
        ]

        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
            "messages",
        ]