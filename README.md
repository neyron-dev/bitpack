# Bitpack

**Bitpack** — это Webpack-сборка, предназначенная для упрощения и стандартизации процесса сборки фронтенд-ресурсов в проектах на 1С-Битрикс.

## Особенности

- Сборка JavaScript и CSS с использованием Webpack.
- Обработка стилей через PostCSS.
- Гибкая настройка через `ConfigHelper.js`.
- Удобная структура исходников (`src/`).
- Поддержка режима разработки (`watch`) и production-сборки (`build`).

## Установка

1. Клонируйте репозиторий:

   ```bash
   git clone https://github.com/neyron-dev/bitpack.git
   ```

2. Перейдите в папку проекта:

   ```bash
   cd bitpack
   ```

3. Установите зависимости:

   ```bash
   npm install
   ```

## Использование

### Сборка проекта

```bash
npm run build
```

### Режим разработки (с отслеживанием изменений)

```bash
npm run watch
```

## Структура проекта

```
bitpack/
├── src/                 # Исходные файлы (JS, SCSS и пр.)
├── dist/                # Скомпилированные файлы (build output)
├── webpack.config.js    # Основной конфиг Webpack
├── postcss.config.js    # Конфиг PostCSS
├── ConfigHelper.js      # Помощник для настройки путей
├── package.json         # Зависимости и npm-скрипты
└── .gitignore
```

## Требования

- Node.js (рекомендуется LTS)
- npm (или yarn)

## Лицензия

MIT
