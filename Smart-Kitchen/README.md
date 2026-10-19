# Smart Kitchen

A project that turns an ordinary kitchen into a connected, safety-aware
assistant. An ESP32 watches the room for gas leaks, flames and overheating and can
shut the gas valve on its own; an ASP.NET Core API stores and interprets what the
sensors report; and a Flutter app lets the cook follow recipes, get AI help and
keep an eye on the kitchen from anywhere.

---

## Contents

- [System overview](#system-overview)
- [Features](#features)
- [Repository layout](#repository-layout)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
  - [1. Backend API](#1-backend-api)
  - [2. Python image service](#2-python-image-service)
  - [3. Flutter app](#3-flutter-app)
  - [4. ESP32 firmware](#4-esp32-firmware)
- [Configuration](#configuration)
- [API surface](#api-surface)
- [Assets not included in this repository](#assets-not-included-in-this-repository)

---

## System overview

```
   ┌──────────────────┐         sensor readings (HTTP POST, every 10 s)
   │   ESP32 board    │ ─────────────────────────────────────────────┐
   │  gas · flame     │                                              │
   │  temp · motion   │ ◀──────────── valve / buzzer commands ───────┤
   └──────────────────┘                                              │
                                                                     ▼
   ┌──────────────────┐      REST + SignalR      ┌──────────────────────────┐
   │   Flutter app    │ ◀──────────────────────▶ │   ASP.NET Core 8 API     │
   │  recipes · chat  │                          │  Identity · JWT · EF     │
   │  live sensors    │                          │  ONNX hazard model       │
   └──────────────────┘                          └────────────┬─────────────┘
                                                              │
                                        ┌─────────────────────┼──────────────┐
                                        ▼                     ▼              ▼
                                 ┌─────────────┐      ┌──────────────┐  ┌──────────┐
                                 │ SQL Server  │      │ FastAPI image│  │  Gemini  │
                                 │  EF Core    │      │   service    │  │  chatbot │
                                 └─────────────┘      └──────────────┘  └──────────┘
```

The board posts a reading every 10 seconds. The API classifies it, writes it to the
database, and pushes anything alarming to connected clients over the SignalR hub at
`/hubs/safety`, so the app reacts without polling.

---

## Features

**Kitchen safety**

- Continuous monitoring of gas (MQ-2), flame, temperature and humidity (DHT22),
  motion (IR) and proximity (ultrasonic).
- Autonomous danger mode on the board itself — if gas passes the threshold or the
  temperature climbs past 60 °C, the ESP32 closes the gas valve, cuts the relay and
  sounds the buzzer **without waiting for the server**.
- An ONNX model (`Models/warning_model.onnx`) runs server-side via ONNX Runtime to
  classify readings and raise graded safety alerts.
- Live alert broadcasting to every connected app through SignalR.
- Remote gas-valve control from the phone (`/api/gas`).
- A hands-free waste bin that opens when the ultrasonic sensor sees a hand.

**Recipes**

- A large recipe catalogue with ingredients, step-by-step instructions and photos.
- Browsing by category, cuisine, course, preparation time, skill level and season.
- Search with history, favourites, and per-user activity logging.
- Dietary and allergen filtering — vegetarian, vegan, keto, low-carb, paleo, plus
  gluten, dairy, egg, soy, fish, garlic and onion allergens.
- Personalised recommendations, including seasonal suggestions.

**Assistant and accounts**

- A cooking chatbot backed by Google Gemini 2.5 Flash, with recipe context injected
  into the conversation.
- Registration and login with ASP.NET Identity and JWT, plus Google and Facebook
  sign-in through Firebase.
- OTP verification and password reset over email (MailKit) or SMS (Vonage / Twilio).
- Profile management, account deletion and a contact/support channel.

---

## Repository layout

```
.
├── flutter_trial-main/flutter_trial-main/   Flutter mobile client
│   ├── lib/screens/                         ~40 UI screens
│   ├── lib/models/                          data models
│   └── android/ · web/ · assets/
│
├── sk backend/                              ASP.NET Core 8 Web API
│   ├── Controllers/                         17 REST controllers
│   ├── Services/                            business logic, ML, integrations
│   ├── Models/ · DTOs/ · Data/              EF Core entities and context
│   ├── Migrations/                          33 EF Core migrations
│   ├── Hubs/SafetyHub.cs                    SignalR hub for live alerts
│   └── python_service/                      FastAPI image microservice
│       ├── app/                             crawler, downloader, validator
│       └── dataset/metadata/                recipe metadata
│
└── sk hardware.cpp                          ESP32 firmware (Arduino)
```

---

## Tech stack

| Layer | Technology |
|---|---|
| Mobile | Flutter (Dart SDK ≥ 3.10), Firebase Auth, Google & Facebook sign-in |
| Backend | ASP.NET Core 8, Entity Framework Core, SQL Server, ASP.NET Identity |
| Realtime | SignalR |
| Machine learning | ONNX Runtime (hazard classification) |
| AI assistant | Google Gemini 2.5 Flash |
| Image service | Python 3.11, FastAPI, aiohttp, Pillow, OpenCV |
| Messaging | MailKit (email), Vonage & Twilio (SMS) |
| Cloud | Firebase / Firestore, Google Custom Search |
| Hardware | ESP32, MQ-2, DHT22, flame sensor, IR, HC-SR04, servos, relay, buzzer |
| Docs | Swagger / OpenAPI |

---

## Getting started

### 1. Backend API

**Requirements:** .NET 8 SDK, SQL Server (LocalDB or full instance).

```bash
cd "sk backend"

# Create appsettings.json first - see Configuration below.
dotnet restore
dotnet ef database update      # applies the 33 migrations
dotnet run
```

Swagger UI is served at `/swagger` once the API is running.

### 2. Python image service

**Requirements:** Python 3.11.

```bash
cd "sk backend/python_service"

python -m venv .venv311
.venv311\Scripts\activate        # Windows
# source .venv311/bin/activate   # Linux / macOS

pip install -r requirements.txt
uvicorn app.main:app --port 8000
```

The backend expects this service at the URL set in `ImageService:BaseUrl`
(`http://localhost:8000` by default). A `Dockerfile` and `docker-compose.yml` are
provided as an alternative.

### 3. Flutter app

**Requirements:** Flutter SDK with Dart ≥ 3.10.

```bash
cd flutter_trial-main/flutter_trial-main

flutter pub get
flutter run
```

Point the app at your backend before running it. Firebase client config is not
committed, because it contains API keys. Copy the examples and replace the
placeholders locally, or run `flutterfire configure`:

- `android/app/google-services.json.example` → `android/app/google-services.json`
- `lib/firebase_options.example.dart` → `lib/firebase_options.dart`

Do not commit the real API keys.

### 4. ESP32 firmware

**Requirements:** Arduino IDE or PlatformIO with the ESP32 board package, plus the
`ESP32Servo` and `DHT sensor` libraries.

Open `sk hardware.cpp`, set your Wi-Fi credentials and the `apiURL` to your backend's
`/api/sensors/data` endpoint, then flash the board.

**Pin assignment**

| Pin | Component | | Pin | Component |
|---|---|---|---|---|
| 4  | IR sensor            | | 23 | Relay |
| 25 | Ultrasonic trigger   | | 26 | Bin servo |
| 33 | Ultrasonic echo      | | 18 | Gas-valve servo |
| 2  | Light sensor         | | 16 | DHT22 |
| 34 | MQ-2 gas sensor      | | 22 | Buzzer |
| 27 | Flame sensor         | | | |

**Thresholds** — gas 2000, temperature 60 °C, hand-detection distance 80 cm,
transmission interval 10 s.

---

## Configuration

`appsettings.json` is deliberately **not** tracked in this repository, because it
holds live credentials. Create `sk backend/appsettings.json` with the structure
below and fill in your own values:

```jsonc
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=YOUR_SERVER;Database=SmartKitchenDB;Trusted_Connection=True;TrustServerCertificate=True"
  },
  "Jwt": {
    "Key": "<a long random signing key>",
    "Issuer": "SmartKitchenAPI",
    "Audience": "SmartKitchenClients",
    "ExpiresInMinutes": "60"
  },
  "ContactEmail": {
    "Host": "smtp.gmail.com", "Port": "587",
    "Username": "<address>", "Password": "<app password>",
    "SenderEmail": "<address>", "SenderName": "Smart Kitchen",
    "RecipientEmail": "<address>"
  },
  "OtpSettings": {
    "Email":  { "Host": "smtp.gmail.com", "Port": 587,
                "Username": "<address>", "Password": "<app password>",
                "SenderEmail": "<address>", "SenderName": "Smart Kitchen" },
    "Vonage": { "ApiKey": "<key>", "ApiSecret": "<secret>" }
  },
  "Gemini":   { "ApiKey": "<key>" },
  "Google":   { "ApiKey": "<key>", "Cx": "<custom search engine id>" },
  "Firebase": { "ProjectId": "<project id>" },

  "ImageService":  { "BaseUrl": "http://localhost:8000" },
  "ImageSettings": { "StorageRoot": "<absolute path for images>",
                     "PublicBaseUrl": "<public base url>" },
  "Datasets": {
    "RecipeCsvPath": "python_service/dataset/metadata/RAW_recipes after cleaning.csv",
    "ImagesRootPath": "python_service/dataset/images"
  }
}
```

> **Never commit this file.** `.gitignore` already excludes `appsettings.json` and
> the `bin/`, `obj/` and `publish/` folders that build copies of it into.

---

## API surface

All routes are prefixed with `/api`. Authentication uses a JWT bearer token.

| Route | Purpose |
|---|---|
| `auth` · `account` | Registration, login, OTP, password reset, profile |
| `sensors` | Receives readings from the ESP32; exposes history |
| `alerts` | Safety alerts raised from sensor readings |
| `gas` | Remote gas-valve state and control |
| `recipes` · `ingredients` | Recipe and ingredient catalogue |
| `categories` · `cuisines` | Browsing taxonomies |
| `search` | Search with per-user history |
| `favorites` | Saved recipes |
| `chatbot` | Gemini-backed cooking assistant |
| `datasets` | Dataset ingestion and validation |
| `media` | Image, video and document upload |
| `activity-log` · `home` · `support` | Activity feed, home content, contact |

Realtime hub: `/hubs/safety`.

---

## Assets not included in this repository

Some files are excluded to keep the repository a reasonable size and free of
credentials. You will need to supply them yourself:

- **`RAW_recipes after cleaning.csv`** (~234 MB) — the raw recipe dataset. Place it
  at the path configured under `Datasets:RecipeCsvPath`.
- **Recipe images** — roughly 16,000 downloaded photos under `sk backend/images/`.
  The Python service can regenerate these.
- **Database backup** — a 557 MB SQL Server `.bak`. Use `dotnet ef database update`
  to build the schema from migrations instead.
- **`appsettings.json`** — see [Configuration](#configuration).
- Build output, virtual environments and dependency folders.
