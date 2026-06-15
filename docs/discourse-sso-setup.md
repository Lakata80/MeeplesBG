# Discourse SSO интеграция — Настройка

## Как работи потокът

```
Потребителят кликва "Влез" в Discourse
        ↓
Discourse → GET /api/discourse/sso?sso=BASE64&sig=HMAC
        ↓
Ако не е влязъл → redirect /вход (след вход се връща тук)
        ↓
Ако е влязъл → подписваме payload с user данни
        ↓
redirect → return_sso_url?sso=NEW_PAYLOAD&sig=NEW_SIG
        ↓
Discourse приема потребителя (създава или свързва акаунт)
```

## Стъпка 1 — Конфигурирай .env.local

```env
DISCOURSE_URL=https://forum.meeplebg.com
DISCOURSE_SSO_SECRET=поне-10-символа-таен-ключ
NEXT_PUBLIC_DISCOURSE_URL=https://forum.meeplebg.com
```

> **Важно:** `DISCOURSE_SSO_SECRET` трябва да е идентичен в .env.local и в Discourse Admin.

## Стъпка 2 — Конфигурирай Discourse Admin

Влез в **Admin → Settings → Login** и настрой:

| Настройка | Стойност |
|---|---|
| `enable_sso` | ✅ включено |
| `sso_url` | `https://meeplebg.com/api/discourse/sso` |
| `sso_secret` | Същото като `DISCOURSE_SSO_SECRET` |
| `sso_overrides_email` | ✅ включено |
| `sso_overrides_username` | ✅ включено |
| `sso_overrides_name` | ✅ включено |
| `sso_overrides_avatar` | ✅ включено |
| `enable_local_logins` | ❌ изключено (вход само през MeeplesBG) |

## Стъпка 3 — Провери

1. Отиди на `https://forum.meeplebg.com`
2. Кликни **Влез**
3. Discourse трябва да те пренасочи към `https://meeplebg.com/вход`
4. След вход в MeeplesBG → автоматично влизаш и в Discourse

## Дебъгване

### Грешка "Невалиден подпис"
- Провери дали `DISCOURSE_SSO_SECRET` е **идентичен** в двете системи
- Не трябва да има водещи/крайни интервали в secret-а

### Грешка "Невалиден return_sso_url"
- `DISCOURSE_URL` в `.env.local` трябва да **точно съвпада** с URL-а на форума
- Включвай `https://` и без наклонена черта накрая

### Потребителят не се свързва с акаунт
- Увери се, че `sso_overrides_email: true` в Discourse
- Email-ът в MeeplesBG и Discourse трябва да съвпадат

## Защита

- Всяка SSO заявка се верифицира с **HMAC-SHA256** (constant-time comparison)
- `return_sso_url` се валидира да идва от `DISCOURSE_URL`
- Nonce предотвратява replay атаки (Discourse генерира нов nonce за всяка заявка)
