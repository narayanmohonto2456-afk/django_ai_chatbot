# Local AI Chatbot

A full-stack local AI chatbot built with Next.js, Django REST Framework, PostgreSQL, and Ollama.

**Status:** Working local-development prototype. The main login, conversation, streaming, and responsive-interface workflows have been manually tested. Public deployment is not yet configured.

## Features

- Django session authentication with a Next.js login screen.
- Create, search, rename, and delete conversations.
- Persist conversations and messages in PostgreSQL.
- Stream responses from the local `llama3.2:3b` model.
- Markdown rendering and syntax-highlighted code.
- Responsive desktop/mobile layout, auto-scroll, and jump to latest.

## Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 16, React, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Python, Django, Django REST Framework |
| Database | PostgreSQL |
| AI | Ollama, `llama3.2:3b` |
| Authentication | Django sessions and CSRF protection |

## Architecture

```text
Browser → Next.js :3000 → Django REST API :8000
                              ├── PostgreSQL
                              └── Ollama :11434
```

Django handles authentication, conversation ownership, persistence, and model requests. The browser does not call Ollama directly.

## Project structure

```text
django_ai_chatbot/
├── backend/
│   ├── accounts/
│   ├── chatbot/
│   ├── config/
│   ├── static/
│   ├── templates/
│   │   ├── accounts/
│   │   └── base.html
│   └── manage.py
├── frontend/
│   └── src/
│       ├── app/
│       ├── components/chat/
│       ├── components/ui/
│       ├── lib/api.ts
│       └── types/chat.ts
└── .gitignore
```

The legacy Django chat HTML and JavaScript have been retired. Django retains fallback account pages, and its root URL redirects to Next.js. The REST API remains in the backend.

## Local setup

These instructions target Windows PowerShell. Install Python, Node.js/npm, PostgreSQL, and Ollama. The project has been developed with Python 3.14.3, Node.js 24, and Next.js 16.3.4.

### 1. Ollama

```powershell
ollama pull llama3.2:3b
ollama serve
```

If Ollama is already running, do not start a second instance.

### 2. PostgreSQL and backend

Create a local database and user. Configure the variables read by Django in your ignored `.env` file:

```dotenv
DB_NAME=your_database
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_HOST=localhost
DB_PORT=5432
```

Activate the existing working virtual environment, then run:

```powershell
cd "E:\solo projects\django_ai_chatbot"
.\venv\Scripts\Activate.ps1
cd backend
python manage.py migrate
python manage.py check
python manage.py runserver localhost:8000
```

**Fresh-clone limitation:** A reviewed backend dependency manifest still needs to be committed. Do not claim the project is fully reproducible until that is done. From the project root, with the working virtual environment active, create and review a dependency snapshot:

```powershell
python -m pip freeze > backend\requirements.txt
```

Once the reviewed file is committed, a fresh environment can install it with:

```powershell
python -m pip install -r backend\requirements.txt
```

### 3. Next.js

In another terminal:

```powershell
cd "E:\solo projects\django_ai_chatbot\frontend"
npm install
```

Create `frontend/.env.local`:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Then run:

```powershell
npm run dev
```

Open `http://localhost:3000` and sign in with an existing Django account. The registration link opens the Django registration page. Use `localhost` consistently for both applications so session cookies work as expected.

## API overview

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/api/csrf/` | GET | Obtain the CSRF cookie |
| `/api/chats/` | GET, POST | List or create conversations |
| `/api/chats/<id>/` | GET, PATCH, DELETE | Retrieve, rename, or delete a conversation |
| `/api/chats/<id>/messages/` | POST | Send a non-streaming message |
| `/api/chats/<id>/stream/` | POST | Stream an AI response |

Conversation endpoints require authentication and operate on the current user's conversations. The streaming endpoint returns newline-delimited JSON events.

## Verification

From `backend/`:

```powershell
python manage.py check
```

From `frontend/`:

```powershell
npm run lint
npm run build
```

The main local workflows have been manually checked: login, saved history, streaming, rename/delete, mobile layout, and scrolling. This is not a claim of automated integration-test coverage or production readiness.

## Troubleshooting

**403 loading conversations:** Sign in through the Next.js login screen. If already signed in, inspect the failed request response and confirm both servers use `localhost`.

**Hydration warning mentioning `crxlauncher`:** A browser extension may modify HTML before React hydrates. Test with extensions disabled before changing application code.

**Temporary `/_next/hmr` warning:** This is the development hot-reload connection. A temporary disconnect followed by reconnection is not a Django or Ollama failure.

**Ollama unavailable:** Check that the service is running and the configured model is installed.

## Recruiter demo

Record a short demonstration of login, creating a chat, streamed output with Markdown/code, refreshing to show saved history, renaming/deleting a test conversation, and the mobile layout.

Suggested explanation:

> I built this full-stack chatbot with Next.js, Django REST Framework, PostgreSQL, and Ollama. Django handles authenticated conversation APIs and persistence, while the frontend renders streamed AI responses. I also implemented conversation management, Markdown rendering, and a responsive interface. The model runs locally, so the demo does not require a paid AI API.

## Security and deployment status

**Do not expose this development configuration to the public internet.** The reviewed Django settings still contain a hard-coded secret key and force `DEBUG=True`. Security cleanup is not yet complete.

Before public deployment, generate a new secret key, remove the hard-coded value, and load it securely from the environment. Treat the previously committed key as exposed. Configure production `DEBUG`, `ALLOWED_HOSTS`, HTTPS, session-cookie, CSRF, and CORS settings; keep credentials out of Git; add reviewed dependencies and automated tests; and review backups, resource limits, and error handling. Do not expose Ollama directly to the public internet.

## Author

Narayan Mohanta

[GitHub](https://github.com/narayanmohonto2456-afk)

Portfolio demonstration of full-stack development and integration with a locally hosted language model.
