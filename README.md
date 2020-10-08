# docker-run
Docker &amp; docker-compose simple project. Build and run react-web, api, api_db containers via docker. 


### Документация
1) Создаем новую директорию для проекта: docker

2) внутри директории создаем новый файл: docker-compose.yml

```js
version: '3'

services:
	api:
		build: ./api
```

3) создаем внутренние директории для сервисов

API
AUTH
FRONTEND и т.д

4) Внутри папки API создаем файл Dockerfile
```js
FROM node:13.12./0-alpine
```

5) Запускаем команду
```sh
docker-compose build
```

6) В папке API запускаем команду NPM INIT
```sh
npm init
```

7) В папке API устанавливаем EXPRESS JS
```sh
npm install express
```

8) Создаем папку SRC и файл index.js внутри
```js
const express = require('express');
const app = express();

app.get('/test', (req, res) => {
	res.send("Our API sercer is working correctly");
});

app.listen(3000, () => {
	console.log("Started API service");
})
```

9) Изменяем Package.json
```JSON
  "scripts": {
    "start": "node src/index.js"
  }
```

10) изменяем Dockerfile в API
```js
FROM node:13.12./0-alpine

WORKDIR /usr/src/app --указываем рабочую директорию откуда будут браться файлы для создания контейнера

COPY package*.json ./ --копируем файлы package.json и package-lock.json в контейнер

RUN npm install --запускаем команду установки зависимостей node в контейнере

COPY . . --копируем все файлы в папке API во внутрь контейнера
```

11) запускаем команду docker-compose build

```sh
docker-compose build
```

12) изменяем Dockerfile в API (для STATELESS сервер)
```js
EXPOSE 3000 -- открываем порт в контейнере для того, чтобы получить доступ снаружи

CMD ["node", "run start"] -- выполняем внутри контейнера команды для запуска сервера
```


14) или попроще изменяем Docker-compose.yml

```js
version: "3.8"
services:
  api:
    build: ./api
    command: npm run start -- выполняем команду для запуска сервера
    ports:
	- "3000:3000" -- соединяем порты 3000 на локалке и на контейнере  
````

15) запускаем созданный контейнер API

```sh
docker-compose build

docker-compose up
```

16) добавляем переменные окружения в Docker-compose
```js
    environment:
      - PORT=3000
      - HOST=http://realworld-docker.com
```

17) устанавливаем базу данных Mongoose в папке API
```sh
npm install mongoose
```

18) Настраиваем docker-compose.yml

```js
    environment:
      - PORT=3000
      - HOST=http://docker.com
      - MONGO_URL=mongodb://api_db/27017/api
    depends_on:
      - api_db -- задаем зависимости! запустить контейнер API после контейнера API_DB

  api_db:
    image: mongo:latest
```
