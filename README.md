# RabbitMQ Producer - Projekt

Prosty producer w Pythonie wysyłający wiadomości do RabbitMQ.

## Wymagania

- Docker i Docker Compose
- Python 3.7+
- pip

## Szybki start

### 1. Uruchom RabbitMQ

```bash
docker-compose up -d
```

Sprawdź, czy działa:
```bash
docker ps
```

Powinien być widoczny kontener `rabbitmq-broker`.

### 2. Zainstaluj zależności Python

```bash
pip install -r requirements.txt
```

### 3. Uruchom producenta

```bash
python producer.py
```

## Co się dzieje?

1. Producer łączy się z RabbitMQ (localhost:5672)
2. Tworzy exchange o nazwie `logs` typu `fanout`
3. Wysyła 4 przykładowe wiadomości JSON
4. Każda wiadomość zawiera: level, msg, timestamp

## Weryfikacja

### Panel zarządzania RabbitMQ

Otwórz w przeglądarce: http://localhost:15672

- Login: `admin`
- Hasło: `admin123`

W zakładce **Exchanges** znajdziesz `logs`.

### Konfiguracja (opcjonalna)

Możesz zmienić ustawienia przez zmienne środowiskowe:

```bash
# Windows (PowerShell)
$env:AMQP_URL="amqp://admin:admin123@localhost:5672/"
$env:EXCHANGE="logs"
$env:EXCHANGE_TYPE="fanout"
python producer.py

# Linux/Mac
export AMQP_URL="amqp://admin:admin123@localhost:5672/"
export EXCHANGE="logs"
export EXCHANGE_TYPE="fanout"
python producer.py
```

## Struktura projektu

```
.
├── docker-compose.yml    # Konfiguracja RabbitMQ
├── producer.py           # Producer w Pythonie
├── requirements.txt      # Zależności Python
└── README.md            # Ta dokumentacja
```

## Co dalej?

- Dodaj consumer w Pythonie (odbieranie wiadomości)
- Dodaj producenta w Go lub Node.js
- Wypróbuj inne typy exchange (direct, topic, headers)
- Dodaj obsługę retry i ACK/NACK

## Troubleshooting

**Problem:** `pika.exceptions.AMQPConnectionError`
- Sprawdź czy RabbitMQ działa: `docker ps`
- Sprawdź czy port 5672 jest wolny
- Restart: `docker-compose restart`

**Problem:** Nie widzę wiadomości w UI
- Wiadomości typu fanout wymagają podłączonych kolejek
- Dodaj consumer aby zobaczyć wiadomości w kolejce

## Kontakt

Projekt w ramach kursu RabbitMQ Message Broker System.
