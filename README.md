## Документация по созданию контейнеров для Фронтэнд и Бэкэнд с нуля.

### 1. Подготовка окружения

Перед тем как начать подготовку, необходимо установить Docker и Docker-compose.
[Инструкции по установке Docker](https://docs.docker.com/engine/install/ubuntu/)

#### 1.1 Создать новую директорию для проекта.

#### 1.2 Внутри директории создать новый файл: docker-compose.yml

Содержимое файла:
```js
version: '3'

services:
	api:
		build: ./api
```

#### 1.3 Cоздать внутренние директории для необходимых сервисов

- API бэкенд
- AUTH бэкенд
- FRONTEND

#### 1.4 Внутри папки API создать файл Dockerfile

Содержимое файла:
```js
FROM node:13.12./0-alpine -- монтировать образ NODEJS с минимальным весом
```
После подготовки окружения необходимо протестировать образ.

###2. Установка программ окружения

#### 2.1 Для загрузки и запуска контейнера, выполнить следующую команду:

```sh
docker-compose build
```

#### 2.2 Для инициализации NodeJS папке API, запустить команду NPM INIT

```sh
npm init
```

#### 2.3 Устанавка EXPRESS JS в папке API

```sh
npm install express
```
#### 2.4 устанавка Mongoose в папке API

```sh
npm install mongoose
```
###3. Настройка контейнера API

####3.1 Создать папку SRC и файл index.js внутри

Простой сервер для обработки запроса:
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

####3.2 Настроить Package.json

```JSON
  "scripts": {
    "start": "node src/index.js"// при команде Start - запускаем  index.js 
  }
```

####3.3 Изменить Dockerfile в API

```js
FROM node:13.12./0-alpine

WORKDIR /usr/src/app --указываем рабочую директорию откуда будут браться файлы для создания контейнера

COPY package*.json ./ --копируем файлы package.json и package-lock.json в контейнер

RUN npm install --запускаем команду установки зависимостей node в контейнере

COPY . . --копируем все файлы в папке API во внутрь контейнера
```

####3.4 Запустить команду docker-compose build создания контейнера API

```sh
docker-compose build
```

####3.5 Добавить Dockerfile в API (для STATELESS сервер) порты

```js
EXPOSE 3000 -- открываем порт в контейнере для того, чтобы получить доступ снаружи

CMD ["node", "run start"] -- выполняем внутри контейнера команды для запуска сервера
```

или изменить Docker-compose.yml
```js
version: "3.8"
services:
  api:
    build: ./api
    command: npm run start -- выполняем команду для запуска сервера
    ports:
	- "3000:3000" -- соединяем порты 3000 на локалке и на контейнере  
````

####3.6 Создание и Запуск контейнер API

```sh
docker-compose build

docker-compose up
```

###4. Настройка переменных окружения и Соединение с БВ Mongoose

####4.1 Добавить переменные окружения в Docker-compose

```js
    environment:
      - PORT=3000
      - HOST=http://realworld-docker.com
```

####4.2 Настройка переменных окружения в docker-compose.yml

```js
    environment:
      - PORT=3000
      - HOST=http://realworld-docker.com
      - MONGO_URL=mongodb://api_db/27017/api
    depends_on:
      - api_db -- задаем зависимости! запустить контейнер API после контейнера API_DB

  api_db:
    image: mongo:latest
```

####4.3 Добавить новую папку > configuration и файл index.js 

Cодержимое файла index.js
```js
module.exports.port = process.env.PORT;
module.exports.host = process.env.HOST;
module.exports.db = process.env.MONGO_URL;
```

####4.4 Добавить новую папку >  helpers и файл db.js

Cодержимое файла db.js
```js
const mongoose = require("mongoose");
const { db } = require("../configuration");

module.exports.connectDb = () => {
  mongoose.connect(db, { useNewUrlParser: true });

  return mongoose.connection;
};
```

####4.5 Для соединения с базой редактировать файл index.js в API

```js
const express = require("express");
const mongoose = require("mongoose");
const { port, host, db } = require("./configuration");
const { connectDb } = require("./helpers/db");

const app = express();
const postSchema = new mongoose.Schema({
  name: String
});
const Roque = mongoose.model("Roque", postSchema);

app.get("/test", (req, res) => {
  res.send("Our api server is working correctly");
});

const startServer = () => {
  app.listen(port, () => {
    console.log(`Started api service on port ${port}`);
    console.log(`Our host is ${host}`);
    console.log(`Database url ${db}`);

    const roqueOne = new Roque({ name: "Roque-one" });
    roqueOne.save(function(err, result) {
      if (err) return console.error(err);
      console.log("result", result);
    });
  });
};

connectDb()
  .on("error", console.log)
  .on("disconnected", connectDb)
  .once("open", startServer);
```

####4.6 Настройка Хранилища (хранить БД не в контейнере) с помощью VOLUMES

Добавить файле docker-compose.yml:
```js
  api_db:
    image: mongo:latest
    volumes:
      - mongodb_api:/data/api_db -- указываем где будем хранить данные

volumes: -- инициализируем VOLUMES
    mongodb_api:
```

####4.7 Для просмотра всех VOLUMES выполнить след. команду:

```sh
docker volume ls
```

###5. Разделение DEV от PROD mode

####5.1 Создать новый Docker-compose.development.yml файл:

```js
version: '3'

services:
  api:
    command: npm run dev
    volumes:
      - ./api/src:/usr/src/app/src
````

####5.2 Устанавка nodemon для авто-перезагрузки страницы при внесении изменения

```sh
 npm install nodemon
```

####5.3 Добавить dev команду в Package.json

```JSON
{
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon"
  },
    "dependencies": {
    "express": "^4.17.1",
    "mongoose": "^5.9.7",
    "nodemon": "^2.0.3"
  }
```

####5.4 Создать в папке API файл nodemon.json

```JSON
{
  "verbose": false,
  "watch": ["src"],
  "exec": "node src/index.js"
}

```

####5.5 Запуск контейнера в DEV mode

```sh
docker-compose -f docker-compose.yml -f docker-compose.development.yml up --build
```

###6. Добавbnm имя контейнеру

```js
services:
  api:
    build: ./api
    container_name: roque-one-api -- указываем имя контейнера
    command: npm run start
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - PORT=3000
      - HOST=http://realworld.com
      - MONGO_URL=mongodb://api_db:27017/api
    depends_on:
      - api_db
```

###7. Устанавка и настройка frontend (ReactJS)
Переходим в папку frontend.

####7.1 Запустить установку REACT JS
```sh
npm init react-app frontend
```

####7.2 настройка Docker-compose.yml, добавить новый контейнер для Frontend:

```js
  frontend:
    build: ./frontend
    container_name: roque-one-frontend
    command: npm run start
    restart: unless-stopped
    ports:
      - "3000:3000"
    stdin_open: true -- для интерактивного взаимодействия при создании creact-react-app
    tty: true
```

####7.3 Создать Dokcerfile в папке Frontend
Содержимое файла Dokcerfile
```js
FROM node:13.12./0-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

RUN npm install -g serve
```

####7.4 Установка Serve для DEV мода в Frontend

```sh
npm install -g serv
```

####7.5 Создание и Запуск контейнера Frontend

```sh
docker-compose build

docker-compose up
```

###8. Открытие контейнера и запуск комманд внутри контейнера

```sh
	docker exec -it $container_name echo "Foo"
```

```sh
	docker exec -it $container_name sh
```

###9. Развертывание NGINX контейнер для проксирование запросов на фронтенд

####9.1  Добавить новый контейнер в docker-compose.yml

```js
  nginx:
    image: nginx:stable-alpine
    container_name: roque-one-nginx
    ports:
      - "80:80"
    volumes:
      - ./nginx/nginx.conf.prod:/etc/nginx/conf.d/nginx.conf -- задаем путь к конф. -- файлу NGINX
    depends_on:
      - frontend
```

####9.2 Проверить порт 80, занят ли он NGINX-ом

```sh
ps aux | grep nginx
```

####9.3 Создать конфигурационный файл NGINX > nginx.conf.prod

```js
	server {
	  listen 80;

	  server_name Roque-one.com;

	  location / {
	    proxy_pass http://frontend:3000;
	  }
	}

```
