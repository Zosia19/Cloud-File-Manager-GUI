# CloudDrive — Cloud File Manager GUI

Aplikacja webowa do zarządzania plikami w chmurze z pełnym interfejsem graficznym. Frontend zbudowany w React + Vite, komunikuje się z backendem REST API ([CloudFileOperationsBackend](./CloudFileOperationsBackend)).

## Funkcje

- Przesyłanie plików (kliknięcie lub drag & drop)
- Pobieranie plików i katalogów (katalogi jako ZIP)
- Tworzenie, usuwanie i zmiana nazwy plików oraz katalogów
- Nawigacja po strukturze katalogów z breadcrumb
- Wyszukiwanie plików
- Sortowanie po nazwie, rozmiarze
- Widok listy i siatki
- Wykres zajętości przestrzeni dyskowej
- Tryb ciemny i jasny
- Autoryzacja (JWT)

## Stos technologiczny

**Frontend**
- React 18
- Vite
- Tailwind CSS
- Recharts (wykres kołowy)

**Backend** — osobne repozytorium [`CloudFileOperationsBackend`](./CloudFileOperationsBackend)
- Go (REST API)
- PostgreSQL
- S3-compatible object storage
- nginx (reverse proxy)
- Docker + Docker Compose

## Uruchomienie

### 1. Backend

```bash
cd CloudFileOperationsBackend

# Tryb developerski
docker compose -f compose.local.yaml up -d --build

# Tryb produkcyjny
docker compose up -d --build
```

API dostępne pod: `http://localhost:8080`

### 2. Frontend

```bash
npm install
npm run dev
```

Aplikacja dostępna pod: `http://localhost:5173`

## Struktura projektu

```
.
├── src/
│   ├── App.jsx              # Główny komponent aplikacji
│   ├── api.js               # Komunikacja z REST API
│   └── components/
│       ├── LoginPage.jsx    # Strona logowania
│       ├── navbar.jsx       # Pasek nawigacji
│       ├── Sidebar.jsx      # Panel boczny
│       └── ...
├── CloudFileOperationsBackend/   # Backend (submoduł)
│   ├── services/
│   │   ├── app/             # Go REST API
│   │   ├── database/        # PostgreSQL
│   │   ├── file-storage/    # S3 object store
│   │   └── reverse-proxy/   # nginx
│   ├── compose.yaml
│   └── compose.local.yaml
├── index.html
└── vite.config.js
```

## Dokumentacja API

Endpointy REST API udokumentowane na [apidog](https://mx3hqpvt7q.apidog.io/).
