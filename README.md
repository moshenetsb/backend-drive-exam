# Prawo Jazdy - Backend & API

Kompletny backend dla platformy edukacyjnej do nauki i rozwiązywania testów na prawo jazdy. System obsługuje sesje egzaminacyjne, tryb nauki, zapisywanie trudnych pytań do powtórek oraz panel administracyjny do zarządzania bazą pytań.

## Technologie

- **Framework:** [NestJS](https://nestjs.com/)
- **Baza danych:** [PostgreSQL](https://www.postgresql.org/)
- **ORM:** [Prisma 8](https://www.prisma.io/)
- **Dokumentacja API:** [Swagger (OpenAPI)](https://swagger.io/)
- **Autoryzacja:** JWT / Guardy NestJS

---

## Schemat Bazy Danych (Prisma)

Baza danych została zaprojektowana z myślą o elastyczności i wydajności:

- **User:** Użytkownicy systemu (role: `USER`, `ADMIN`, status `isActive`).
- **Question:** Pytania egzaminacyjne (zawierają treść, odpowiedzi A/B/C, poprawną odpowiedź, multimedia, poziom trudności oraz punkty).
- **CategoryAssignment:** Przypisanie pytań do konkretnych kategorii prawa jazdy (np. AM, A, B, C, T).
- **ExamSession & ExamSessionQuestion:** Obsługa sesji egzaminacyjnych (generowanie pytań dla danej kategorii, śledzenie kolejności i czasu).
- **UserAnswer:** Zapisane odpowiedzi użytkownika w trakcie sesji wraz z walidacją poprawności.
- **SavedQuestion:** Prywatna lista zapisanych przez użytkownika pytań do późniejszego powtarzania.

---

## Uruchomienie projektu

### 1. Wymagania wstępne

- Node.js
- Menadżer pakietów (npm)
- PostgreSQL

### 2. Klonowanie i instalacja zależności

```bash
git clone https://github.com/moshenetsb/backend-drive-exam.git
cd backend-drive-exam
npm install
```

### 3. Konfiguracja zmiennych środowiskowych

Utwórz plik `.env` w głównym katalogu projektu i uzupełnij go:

```env
APP_PORT=3000

CORS_ORIGINS="http://localhost:3000"
DATABASE_URL="postgresql://user:password@localhost:5432/db_name"

JWT_SECRET=very_secret_key
JWT_EXPIRES_IN="60m"

CATALOG_URL=https://www.gov.pl/attachment/a5c6c329-28a5-4274-a1a8-e2813f0a51bd
MEDIA_ZIP_URL=https://www.gov.pl/pliki/mi/multimedia_do_pytan.zip

DOWNLOAD_IMPORT_FILES=true
```

### 4. Migracja bazy danych

Zainicjalizuj schemat bazy za pomocą Prisma:

```bash
npx prisma db init
```

### 5. Wstępne przygotowanie

Wyczyść bazę danych i dodaj konto administratora:

```bash
npm run db:seed
```

### 6. Dodanie pytań

Dodaj najnowszą pulę pytań na prawo jazdy do bazy danych:

```bash
npm run import
```

### 7. Uruchomienie trybu deweloperskiego

```bash
npm run start:dev
```

Aplikacja uruchomi się na porcie zdefiniowanym w pliku `.env` pod adresem **`http://localhost:[APP_PORT]`** (domyślnie `http://localhost:3000`).

---

## Dokumentacja API (Swagger)

Pełna dokumentacja interaktywna API (Swagger UI) dla endpointów backendowych dostępna jest po uruchomieniu aplikacji pod adresem:

- **`http://localhost:3000/api/docs/v1`** (lub odpowiednio z twoim skonfigurowanym portem `[APP_PORT]`).

---

## Funkcjonalności

### Dla Użytkownika:

- **Rozwiązywanie testów:** Generowanie sesji egzaminacyjnych z podziałem na kategorie (np. kat. B, A) z uwzględnieniem punktacji i limitu czasu.
- **Tryb nauki:** Przeglądanie pytań z podziałem na poziomy (`PODSTAWOWY`, `SPECJALISTYCZNY`).
- **Zapisane pytania:** Dodawanie trudnych pytań do własnej listy ulubionych w celu szybkiego powtórzenia (`SavedQuestion`).

### Dla Administratora:

- **Zarządzanie pytaniami:** Dodawanie, edycja i usuwanie pytań, przypisywanie multimediów oraz punktów.
- **Kontrola kategorii:** Przypisywanie pytań do wielu kategorii prawa jazdy za pomocą powiązań `CategoryAssignment`.
- **Bezpieczeństwo:** Dostęp do funkcji modyfikacji bazy danych wyłącznie dla użytkowników z rolą `ADMIN`.

---

## Autorzy:

[@moshenetsb](https://github.com/moshenetsb)

[@shang1410](https://github.com/shang1410)
