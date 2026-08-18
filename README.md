# Гид по парку Краснодар

MVP Telegram Mini App: персональный гид с выбором старта, картой, точками, маршрутами, поиском и избранным.

## Локальный запуск

Требуется Node.js 22 или новее.

```bash
npm install
npm run dev
```

Откройте адрес, который покажет Vite (обычно `http://localhost:5173`). Геолокацию нужно разрешить в браузере.

## Публикация через GitHub Pages

1. Создайте на GitHub пустой репозиторий, например `krasnodar-park-guide`.
2. В папке проекта выполните:

```bash
git init
git add .
git commit -m "Initial MVP of Krasnodar Park Guide"
git branch -M main
git remote add origin https://github.com/ВАШ_ЛОГИН/krasnodar-park-guide.git
git push -u origin main
```

3. В репозитории откройте **Settings → Pages → Build and deployment → Source** и выберите **GitHub Actions**.
4. Дождитесь зелёного workflow **Deploy to GitHub Pages**. Ссылка будет вида `https://ВАШ_ЛОГИН.github.io/krasnodar-park-guide/`.

GitHub Pages даёт HTTPS, что необходимо для обычного запуска Telegram Mini App и запроса геолокации.

## Проверка в Telegram

1. Откройте [@BotFather](https://t.me/BotFather), отправьте `/newbot` и создайте отдельного тестового бота, например `Krasnodar Park Guide Test` / `your_park_guide_test_bot`.
2. Не отправляйте токен бота в чат и не добавляйте его в GitHub — в текущем MVP он вообще не нужен.
3. В BotFather откройте `/mybots` → выберите созданного бота → **Bot Settings → Menu Button → Configure menu button**.
4. Укажите текст кнопки `Открыть гид` и вставьте опубликованный HTTPS-адрес GitHub Pages.
5. Откройте чат с ботом, нажмите **Start**, затем кнопку меню **Открыть гид**. Приложение запустится внутри Telegram.

Для финальной версии вместо тестового бота можно настроить **Main Mini App** в настройках выбранного бота, чтобы на его профиле появилась кнопка запуска приложения.

## Что будет следующим этапом

- настоящая карта MapLibre и проверенные координаты объектов;
- Supabase/PostgreSQL для событий, ресторанов, избранного и истории прогулок;
- серверная проверка `initData` от Telegram перед сохранением персональных данных.
