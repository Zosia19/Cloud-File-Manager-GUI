# CloudDrive — Cloud File Manager GUI

Aplikacja webowa do zarządzania plikami w chmurze z pełnym interfejsem graficznym. Frontend zbudowany w React + Vite, komunikuje się z backendem REST API.

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
- Rejestracja i logowanie (JWT)

## Stos technologiczny

**Frontend**
- React 19 + Vite
- Tailwind CSS v4
- Recharts (wykres kołowy)
- Axios

**Backend**
- Go (REST API, Gin)
- PostgreSQL
- S3-compatible object storage (SeaweedFS)
- nginx (reverse proxy)
- Docker + Docker Compose

---

## Jak uruchomić na nowym komputerze

### Wymagania wstępne

Zainstaluj dwa programy (jeśli jeszcze ich nie masz):

| Program | Do pobrania |
|---|---|
| **Docker Desktop** | https://www.docker.com/products/docker-desktop/ |
| **Node.js** (wersja 18+) | https://nodejs.org/ |

> Po zainstalowaniu Docker Desktop **uruchom go** i poczekaj aż ikona w zasobniku systemowym przestanie się kręcić.

---

### Krok 1 — Pobierz repozytorium

```bash
git clone https://github.com/kamil-abbasi/CloudFileOperationsBackend
```

> Jeśli nie masz git, pobierz repo jako ZIP z GitHub (zielony przycisk „Code → Download ZIP"), rozpakuj gdzieś na dysku.

---

### Krok 2 — Uruchom backend

Otwórz terminal w folderze projektu i wpisz:

```bash
cd CloudFileOperationsBackend
docker compose -f compose.local.yaml up -d --build
```

Pierwsze uruchomienie pobiera obrazy Dockera — **może trwać kilka minut**.

Sprawdź czy backend działa (wszystkie kontenery powinny mieć status `healthy`):

```bash
docker compose -f compose.local.yaml ps
```

Backend API dostępne pod: `http://localhost:8080`

---

### Krok 3 — Uruchom frontend

Wróć do głównego folderu projektu (tam gdzie jest `package.json`):

```bash
cd ..
npm install
npm run dev
```

Aplikacja dostępna pod: **http://localhost:5173**

> Jeśli port 5173 jest zajęty, Vite automatycznie wybierze kolejny (5174, 5175 itd.) — adres pojawi się w terminalu.

---

### Jak zatrzymać

```bash
# Backend
cd CloudFileOperationsBackend
docker compose -f compose.local.yaml down

# Frontend — Ctrl+C w terminalu gdzie działa npm run dev
```

---

## Struktura projektu

```
.
├── src/
│   ├── App.jsx              # Główny komponent aplikacji
│   ├── api.js               # Komunikacja z REST API
│   └── components/
│       └── LoginPage.jsx    # Strona logowania/rejestracji
├── CloudFileOperationsBackend/
│   ├── services/
│   │   ├── app/             # Go REST API (air hot reload)
│   │   ├── database/        # PostgreSQL
│   │   ├── file-storage/    # SeaweedFS (S3)
│   │   └── reverse-proxy/   # nginx
│   ├── compose.yaml         # Produkcja
│   └── compose.local.yaml   # Developerski (z hot reload)
├── index.html
└── vite.config.js
```

## Dokumentacja API

Endpointy REST API: [apidog](https://mx3hqpvt7q.apidog.io/)
