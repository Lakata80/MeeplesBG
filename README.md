# MeeplesBG 🎲

Най-голямата база данни с настолни игри на български език.

## Технологии

- **Frontend**: Next.js 14+ (App Router) + TypeScript + Tailwind CSS
- **База данни**: PostgreSQL (Railway) + Prisma ORM
- **Автентикация**: NextAuth.js v5 (Google + Facebook)
- **Търсене**: MeiliSearch
- **Форум**: Discourse (SSO интеграция)
- **CMS**: Sanity.io
- **Hosting**: Vercel (frontend) + Railway (backend/DB)
- **CDN/SSL**: Cloudflare
- **Имейли**: Resend

## Инсталация и стартиране

### Предварителни изисквания

- Node.js 18+
- npm или yarn
- PostgreSQL база данни (локална или Railway)
- MeiliSearch инстанция (опционално за разработка)

### 1. Клонирай проекта

```bash
git clone https://github.com/yourusername/MeeplesBG.git
cd MeeplesBG
```

### 2. Инсталирай зависимостите

```bash
npm install
```

### 3. Конфигурирай environment variables

Копирай `.env.local` и попълни стойностите:

```bash
cp .env.local .env.local.example
```

| Променлива | Описание |
|-----------|---------|
| `DATABASE_URL` | PostgreSQL connection string от Railway |
| `NEXTAUTH_SECRET` | Генерирай с `openssl rand -base64 32` |
| `NEXTAUTH_URL` | URL на приложението (http://localhost:3000 за dev) |
| `GOOGLE_CLIENT_ID` | От Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | От Google Cloud Console |
| `FACEBOOK_CLIENT_ID` | От Facebook Developer Portal |
| `FACEBOOK_CLIENT_SECRET` | От Facebook Developer Portal |
| `MEILISEARCH_URL` | URL на MeiliSearch инстанцията |
| `MEILISEARCH_KEY` | Master key за MeiliSearch |
| `RESEND_API_KEY` | API ключ от Resend.com |

### 4. Настрой базата данни

```bash
# Генерирай Prisma клиент
npx prisma generate

# Приложи миграциите
npx prisma db push

# (Опционално) Отвори Prisma Studio
npx prisma studio
```

### 5. Стартирай в development режим

```bash
npm run dev
```

Отвори [http://localhost:3000](http://localhost:3000) в браузъра.

## Структура на проекта

```
MeeplesBG/
├── app/
│   ├── (site)/          # Публични страници
│   │   ├── игри/        # Каталог с игри
│   │   ├── категории/   # Категории
│   │   ├── механики/    # Механики
│   │   ├── потребители/ # Потребителски профили
│   │   └── колекция/    # Лична колекция
│   ├── (admin)/         # Административни страници
│   │   ├── dashboard/   # Административно табло
│   │   ├── игри/        # Управление на игри
│   │   └── потребители/ # Управление на потребители
│   └── api/             # API маршрути
│       ├── auth/        # NextAuth handlers
│       ├── игри/        # Игри API
│       └── bgg/         # BGG API прокси
├── components/
│   ├── ui/              # Базови UI компоненти
│   ├── игри/            # Компоненти за игри
│   ├── layout/          # Layout компоненти
│   └── auth/            # Auth компоненти
├── lib/
│   ├── bgg/             # BGG XML API клиент
│   ├── search/          # MeiliSearch клиент
│   ├── email/           # Resend имейл клиент
│   └── utils/           # Помощни функции
├── prisma/
│   └── schema.prisma    # Схема на базата данни
└── types/
    └── index.ts         # TypeScript типове
```

## Налични скриптове

```bash
npm run dev        # Стартира development сървъра
npm run build      # Билдва за продукция
npm run start      # Стартира production сървъра
npm run lint       # Проверява кода за грешки
```

## Принос към проекта

Виж [CONTRIBUTING.md](CONTRIBUTING.md) за насоки.

## Лиценз

MIT © MeeplesBG
