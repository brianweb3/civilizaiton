# Инструкция по деплою на Vercel

## Шаг 1: Подготовка репозитория

Убедитесь, что все изменения закоммичены:

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

## Шаг 2: Деплой через Vercel CLI (быстрый способ)

1. Установите Vercel CLI:
```bash
npm i -g vercel
```

2. Войдите в Vercel:
```bash
vercel login
```

3. Задеплойте проект:
```bash
vercel
```

4. Для production деплоя:
```bash
vercel --prod
```

## Шаг 3: Деплой через веб-интерфейс Vercel

1. Зайдите на [vercel.com](https://vercel.com)
2. Войдите через GitHub
3. Нажмите "Add New Project"
4. Выберите ваш репозиторий `nocracy-project`
5. Vercel автоматически определит Next.js
6. Нажмите "Deploy"

## Шаг 4: Настройка переменных окружения (если нужно)

Если нужно скрыть токен Telegram бота, добавьте в Vercel:
- Settings → Environment Variables
- Добавьте `TELEGRAM_BOT_TOKEN` (если хотите использовать переменную)

## Шаг 5: Привязка домена

1. В настройках проекта → Domains
2. Добавьте ваш домен
3. Следуйте инструкциям по настройке DNS:
   - Добавьте A-запись или CNAME
   - Обычно: `CNAME` → `cname.vercel-dns.com`

## Важно!

⚠️ **GitHub токен** - это чувствительная информация:
- НЕ коммитьте его в репозиторий
- Используйте только для деплоя через CLI или настройки в Vercel
- После использования можно отозвать токен в GitHub Settings → Developer settings → Personal access tokens

## Альтернатива: Деплой через GitHub Actions

Если хотите автоматический деплой при каждом пуше, можно настроить GitHub Actions, но Vercel делает это автоматически при подключении репозитория.
