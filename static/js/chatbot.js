$(document).ready(function () {

    console.log("Chatbot JavaScript loaded successfully.");


    // ============================================================
    // GLOBAL VARIABLES
    // ============================================================

    let currentChatId = null;
    let isSending = false;


    // ============================================================
    // CSRF TOKEN
    // ============================================================

    function getCookie(name) {

        let cookieValue = null;

        if (document.cookie && document.cookie !== "") {

            const cookies = document.cookie.split(";");

            for (let cookie of cookies) {

                cookie = cookie.trim();

                if (
                    cookie.substring(0, name.length + 1) ===
                    name + "="
                ) {

                    cookieValue = decodeURIComponent(
                        cookie.substring(name.length + 1)
                    );

                    break;
                }
            }
        }

        return cookieValue;
    }


    const csrfToken = getCookie("csrftoken");


    // ============================================================
    // GLOBAL AJAX CSRF CONFIGURATION
    // ============================================================

    $.ajaxSetup({

        beforeSend: function (xhr, settings) {

            if (
                !/^(GET|HEAD|OPTIONS|TRACE)$/i.test(
                    settings.type
                )
            ) {

                if (csrfToken) {

                    xhr.setRequestHeader(
                        "X-CSRFToken",
                        csrfToken
                    );
                }
            }
        }

    });


    // ============================================================
    // DOM ELEMENTS
    // ============================================================

    const chatList = $("#chatList");
    const chatMessages = $("#chatMessages");
    const messageInput = $("#messageInput");
    const sendButton = $("#sendButton");
    const newChatButton = $("#newChatButton");


    // ============================================================
    // INITIAL LOAD
    // ============================================================

    loadConversations();


    // ============================================================
    // LOAD ALL CONVERSATIONS
    // ============================================================

    function loadConversations() {

        $.ajax({

            url: "/api/chats/",

            type: "GET",

            success: function (response) {

                console.log(
                    "Conversations loaded:",
                    response
                );

                renderConversationList(response);

            },

            error: function (xhr) {

                console.error(
                    "Failed to load conversations:",
                    xhr
                );

                showError(
                    "Unable to load conversations."
                );
            }

        });
    }


    // ============================================================
    // RENDER CONVERSATION LIST
    // ============================================================

    function renderConversationList(conversations) {

        chatList.empty();


        if (
            !conversations ||
            conversations.length === 0
        ) {

            chatList.html(`
                <div class="text-muted text-center p-3">
                    No conversations yet.
                </div>
            `);

            return;
        }


        conversations.forEach(function (conversation) {

            const chatItem = $(`
                <div
                    class="chat-item d-flex justify-content-between align-items-center"
                    data-chat-id="${conversation.id}"
                >

                    <div class="chat-title text-truncate">
                        ${escapeHtml(
                            conversation.title || "New Chat"
                        )}
                    </div>

                    <button
                        type="button"
                        class="delete-chat btn btn-sm"
                        data-chat-id="${conversation.id}"
                    >
                        <i class="bi bi-trash"></i>
                    </button>

                </div>
            `);


            chatItem.on("click", function (event) {

                if (
                    $(event.target).closest(
                        ".delete-chat"
                    ).length
                ) {

                    return;
                }

                const chatId = $(this).data("chat-id");

                selectConversation(chatId);

            });


            chatItem
                .find(".delete-chat")
                .on("click", function (event) {

                    event.stopPropagation();

                    const chatId = $(this).data(
                        "chat-id"
                    );

                    deleteConversation(chatId);
                });


            chatList.append(chatItem);

        });
    }


    // ============================================================
    // SELECT CONVERSATION
    // ============================================================

    function selectConversation(chatId) {

        currentChatId = chatId;


        $(".chat-item").removeClass(
            "active"
        );


        $(
            `.chat-item[data-chat-id="${chatId}"]`
        ).addClass("active");


        loadConversation(chatId);
    }


    // ============================================================
    // LOAD SINGLE CONVERSATION
    // ============================================================

    function loadConversation(chatId) {

        $.ajax({

            url: `/api/chats/${chatId}/`,

            type: "GET",

            success: function (conversation) {

                console.log(
                    "Conversation loaded:",
                    conversation
                );

                renderMessages(
                    conversation.messages || []
                );

            },

            error: function (xhr) {

                console.error(
                    "Failed to load conversation:",
                    xhr
                );

                showError(
                    "Unable to load conversation."
                );
            }

        });
    }


    // ============================================================
    // NEW CHAT
    // ============================================================

    newChatButton.on("click", function () {

        if (isSending) {
            return;
        }


        $.ajax({

            url: "/api/chats/",

            type: "POST",

            contentType: "application/json",

            data: JSON.stringify({}),


            success: function (conversation) {

                console.log(
                    "New conversation created:",
                    conversation
                );


                currentChatId = conversation.id;


                loadConversations();


                setTimeout(function () {

                    selectConversation(
                        conversation.id
                    );

                }, 200);


                messageInput.focus();

            },


            error: function (xhr) {

                console.error(
                    "Failed to create conversation:",
                    xhr
                );


                handleAjaxError(
                    xhr,
                    "Unable to create a new chat."
                );
            }

        });

    });


    // ============================================================
    // SEND MESSAGE
    // ============================================================

    $("#chatForm").on("submit", function (event) {

        event.preventDefault();


        if (isSending) {
            return;
        }


        const message = messageInput
            .val()
            .trim();


        if (!message) {
            return;
        }


        // --------------------------------------------------------
        // If no chat exists, create one first
        // --------------------------------------------------------

        if (!currentChatId) {

            createChatAndSendMessage(
                message
            );

            return;
        }


        sendMessage(message);

    });


    // ============================================================
    // CREATE CHAT THEN SEND MESSAGE
    // ============================================================

    function createChatAndSendMessage(message) {

        isSending = true;

        setSendingState(true);


        $.ajax({

            url: "/api/chats/",

            type: "POST",

            contentType: "application/json",

            data: JSON.stringify({}),


            success: function (conversation) {

                currentChatId =
                    conversation.id;


                loadConversations();


                sendMessage(
                    message,
                    true
                );

            },


            error: function (xhr) {

                isSending = false;

                setSendingState(false);


                console.error(
                    "Failed to create chat:",
                    xhr
                );


                handleAjaxError(
                    xhr,
                    "Unable to create a new chat."
                );
            }

        });

    }


    // ============================================================
    // SEND MESSAGE TO DJANGO / OLLAMA
    // ============================================================

    function sendMessage(
        message,
        alreadySending = false
    ) {

        if (!alreadySending) {

            isSending = true;

            setSendingState(true);
        }


        // --------------------------------------------------------
        // Add user message immediately
        // --------------------------------------------------------

        appendMessage(
            "user",
            message
        );


        messageInput.val("");


        // --------------------------------------------------------
        // Show AI thinking indicator
        // --------------------------------------------------------

        showThinkingIndicator();


        scrollToBottom();


        $.ajax({

            url: `/api/chats/${currentChatId}/messages/`,

            type: "POST",

            contentType: "application/json",

            data: JSON.stringify({

                message: message

            }),


            success: function (response) {

                console.log(
                    "AI response:",
                    response
                );


                removeThinkingIndicator();


                if (
                    response.assistant_message
                ) {

                    appendMessage(
                        "assistant",
                        response.assistant_message.content
                    );
                }


                // ------------------------------------------------
                // Update conversation title
                // ------------------------------------------------

                if (
                    response.conversation
                ) {

                    updateConversationTitle(
                        response.conversation
                    );
                }


                loadConversations();


                scrollToBottom();

            },


            error: function (xhr) {

                console.error(
                    "Message request failed:",
                    xhr
                );


                removeThinkingIndicator();


                let errorMessage =
                    "Something went wrong while contacting the AI.";


                if (
                    xhr.responseJSON &&
                    xhr.responseJSON.error
                ) {

                    errorMessage =
                        xhr.responseJSON.error;
                }


                appendMessage(
                    "assistant",
                    errorMessage,
                    true
                );

            },


            complete: function () {

                isSending = false;

                setSendingState(false);

                messageInput.focus();

            }

        });

    }


    // ============================================================
    // APPEND MESSAGE
    // ============================================================

    function appendMessage(
        role,
        content,
        isError = false
    ) {

        const messageClass =
            role === "user"
                ? "user-message"
                : "assistant-message";


        const safeContent =
            escapeHtml(content);


        const messageHtml = `

            <div
                class="message ${messageClass} ${
                    isError ? "error-message" : ""
                }"
            >

                <div class="message-content">

                    ${safeContent}

                </div>

            </div>

        `;


        chatMessages.append(
            messageHtml
        );


        scrollToBottom();
    }


    // ============================================================
    // RENDER ALL MESSAGES
    // ============================================================

    function renderMessages(messages) {

        chatMessages.empty();


        if (
            !messages ||
            messages.length === 0
        ) {

            showWelcomeMessage();

            return;
        }


        messages.forEach(function (message) {

            appendMessage(
                message.role,
                message.content
            );

        });


        scrollToBottom();
    }


    // ============================================================
    // WELCOME MESSAGE
    // ============================================================

    function showWelcomeMessage() {

        chatMessages.html(`

            <div class="welcome-message text-center">

                <div class="welcome-icon mb-3">
                    <i class="bi bi-robot"></i>
                </div>

                <h3>
                    How can I help you?
                </h3>

                <p class="text-muted">
                    Ask me anything.
                </p>

            </div>

        `);
    }


    // ============================================================
    // THINKING INDICATOR
    // ============================================================

    function showThinkingIndicator() {

        if (
            $("#thinkingIndicator").length
        ) {
            return;
        }


        chatMessages.append(`

            <div
                id="thinkingIndicator"
                class="message assistant-message"
            >

                <div class="message-content">

                    <span class="thinking-dot"></span>
                    <span class="thinking-dot"></span>
                    <span class="thinking-dot"></span>

                </div>

            </div>

        `);


        scrollToBottom();
    }


    // ============================================================
    // REMOVE THINKING INDICATOR
    // ============================================================

    function removeThinkingIndicator() {

        $("#thinkingIndicator").remove();
    }


    // ============================================================
    // UPDATE CONVERSATION TITLE
    // ============================================================

    function updateConversationTitle(
        conversation
    ) {

        const chatItem = $(
            `.chat-item[data-chat-id="${conversation.id}"]`
        );


        if (chatItem.length) {

            chatItem
                .find(".chat-title")
                .text(
                    conversation.title ||
                    "New Chat"
                );

        }
    }


    // ============================================================
    // DELETE CONVERSATION
    // ============================================================

    function deleteConversation(chatId) {

        if (
            !confirm(
                "Are you sure you want to delete this chat?"
            )
        ) {

            return;
        }


        $.ajax({

            url: `/api/chats/${chatId}/`,

            type: "DELETE",


            success: function () {

                console.log(
                    "Conversation deleted."
                );


                if (
                    currentChatId == chatId
                ) {

                    currentChatId = null;

                    showWelcomeMessage();

                }


                loadConversations();

            },


            error: function (xhr) {

                console.error(
                    "Failed to delete conversation:",
                    xhr
                );


                handleAjaxError(
                    xhr,
                    "Unable to delete the conversation."
                );
            }

        });

    }


    // ============================================================
    // SET SENDING STATE
    // ============================================================

    function setSendingState(
        sending
    ) {

        if (sending) {

            sendButton.prop(
                "disabled",
                true
            );

            messageInput.prop(
                "disabled",
                true
            );

        } else {

            sendButton.prop(
                "disabled",
                false
            );

            messageInput.prop(
                "disabled",
                false
            );
        }

    }


    // ============================================================
    // SCROLL TO BOTTOM
    // ============================================================

    function scrollToBottom() {

        if (!chatMessages.length) {
            return;
        }


        chatMessages.scrollTop(
            chatMessages[0].scrollHeight
        );
    }


    // ============================================================
    // HANDLE AJAX ERRORS
    // ============================================================

    function handleAjaxError(
        xhr,
        defaultMessage
    ) {

        let message =
            defaultMessage;


        if (
            xhr.responseJSON &&
            xhr.responseJSON.error
        ) {

            message =
                xhr.responseJSON.error;

        } else if (
            xhr.status === 401
        ) {

            message =
                "Please login again.";

        } else if (
            xhr.status === 403
        ) {

            message =
                "Permission denied or CSRF token is invalid.";

        } else if (
            xhr.status === 404
        ) {

            message =
                "Requested resource was not found.";

        } else if (
            xhr.status >= 500
        ) {

            message =
                "Server error. Please try again.";

        }


        showError(message);
    }


    // ============================================================
    // SHOW ERROR
    // ============================================================

    function showError(message) {

        console.error(
            "Chatbot error:",
            message
        );


        // Remove previous error
        $(".chatbot-error").remove();


        const errorElement = $(`
            <div
                class="chatbot-error alert alert-danger m-3"
                role="alert"
            >
                ${escapeHtml(message)}
            </div>
        `);


        chatMessages.before(
            errorElement
        );


        setTimeout(function () {

            errorElement.fadeOut(
                300,
                function () {
                    $(this).remove();
                }
            );

        }, 5000);
    }


    // ============================================================
    // ESCAPE HTML
    // ============================================================

    function escapeHtml(text) {

        if (text === null || text === undefined) {

            return "";
        }


        return String(text)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    // ============================================================
    // ENTER KEY
    // ============================================================

    messageInput.on(
        "keydown",
        function (event) {

            if (
                event.key === "Enter" &&
                !event.shiftKey
            ) {

                event.preventDefault();

                $("#chatForm").trigger(
                    "submit"
                );
            }

        }
    );


    // ============================================================
    // INITIAL FOCUS
    // ============================================================

    messageInput.focus();

});