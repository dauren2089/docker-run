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

### 2. Установка программ окружения

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
### 3. Настройка контейнера API

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

#### 3.2 Настроить Package.json

```JSON
  "scripts": {
    "start": "node src/index.js"
  }
```

#### 3.3 Изменить Dockerfile в API

```js
FROM node:13.12./0-alpine

WORKDIR /usr/src/app --указываем рабочую директорию откуда будут браться файлы для создания контейнера

COPY package*.json ./ --копируем файлы package.json и package-lock.json в контейнер

RUN npm install --запускаем команду установки зависимостей node в контейнере

COPY . . --копируем все файлы в папке API во внутрь контейнера
```

#### 3.4 Запустить команду docker-compose build создания контейнера API

```sh
docker-compose build
```

#### 3.5 Добавить Dockerfile в API (для STATELESS сервер) порты

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

#### 3.6 Создание и Запуск контейнер API

```sh
docker-compose build

docker-compose up
```

### 4. Настройка переменных окружения и Соединение с БВ Mongoose

#### 4.1 Добавить переменные окружения в Docker-compose

```js
    environment:
      - PORT=3000
      - HOST=http://realworld-docker.com
```

#### 4.2 Настройка переменных окружения в docker-compose.yml

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

#### 4.3 Добавить новую папку > configuration и файл index.js 

Cодержимое файла index.js
```js
module.exports.port = process.env.PORT;
module.exports.host = process.env.HOST;
module.exports.db = process.env.MONGO_URL;
```

#### 4.4 Добавить новую папку >  helpers и файл db.js

Cодержимое файла db.js
```js
const mongoose = require("mongoose");
const { db } = require("../configuration");

module.exports.connectDb = () => {
  mongoose.connect(db, { useNewUrlParser: true });

  return mongoose.connection;
};
```

#### 4.5 Для соединения с базой редактировать файл index.js в API

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

#### 4.6 Настройка Хранилища (хранить БД не в контейнере) с помощью VOLUMES

Добавить файле docker-compose.yml:
```js
  api_db:
    image: mongo:latest
    volumes:
      - mongodb_api:/data/api_db -- указываем где будем хранить данные

volumes: -- инициализируем VOLUMES
    mongodb_api:
```

#### 4.7 Для просмотра всех VOLUMES выполнить след. команду:

```sh
docker volume ls
```

### 5. Разделение DEV от PROD mode

#### 5.1 Создать новый Docker-compose.development.yml файл:

```js
version: '3'

services:
  api:
    command: npm run dev
    volumes:
      - ./api/src:/usr/src/app/src
````

#### 5.2 Устанавка nodemon для авто-перезагрузки страницы при внесении изменения

```sh
 npm install nodemon
```

#### 5.3 Добавить dev команду в Package.json

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

#### 5.4 Создать в папке API файл nodemon.json

```JSON
{
  "verbose": false,
  "watch": ["src"],
  "exec": "node src/index.js"
}

```

#### 5.5 Запуск контейнера в DEV mode

```sh
docker-compose -f docker-compose.yml -f docker-compose.development.yml up --build
```

### 6. Добавbnm имя контейнеру

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

### 7. Устанавка и настройка frontend (ReactJS)
Переходим в папку frontend.

#### 7.1 Запустить установку REACT JS
```sh
npm init react-app frontend
```

#### 7.2 настройка Docker-compose.yml, добавить новый контейнер для Frontend:

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

#### 7.3 Создать Dokcerfile в папке Frontend
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

#### 7.4 Установка Serve для DEV мода в Frontend

```sh
npm install -g serv
```

#### 7.5 Создание и Запуск контейнера Frontend

```sh
docker-compose build

docker-compose up
```

### 8. Открытие контейнера и запуск комманд внутри контейнера

```sh
	docker exec -it $container_name echo "Foo"
```

```sh
	docker exec -it $container_name sh
```

### 9. Развертывание NGINX контейнер для проксирование запросов на фронтенд

#### 9.1  Добавить новый контейнер в docker-compose.yml

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

#### 9.2 Проверить порт 80, занят ли он NGINX-ом

```sh
ps aux | grep nginx
```

#### 9.3 Создать конфигурационный файл NGINX > nginx.conf.prod

```js
	server {
	  listen 80;

	  server_name Roque-one.com;

	  location / {
	    proxy_pass http://frontend:3000;
	  }
	}

```

### 10. Fetching данных

#### 10.1 Установка Axios в API
```sh
npm install -y axios
```

#### 10.2 Добавление функции обмена данными между API и AUTH о пользователях

> Добавить в API Index.js
```js
const axios = require("axios");
const { port, host, db, authApiUrl } = require("./configuration");

app.get('/currentuser', (req, res) => {
  axios.get(authApiUrl + '/currentuser').then(response => {
    res.json({
      currentuser: true,
      currentUserFromAuth: response.data
    });
  });
});
```

> Добавить в AUTH Index.js

```js
app.get("/api/currentuser", (req, res) => {
	res.json({
		id: "12345",
		email: "user@email.com"
	});
});
```
>Добавить в > API/configuration Index.js

```js
module.exports.authApiUrl = process.env.AUTH_API_URL;
```

>Добавить в Docker-compose.yml новую переменную окружения AUTH_API_URL

```js
    environment:
      - AUTH_API_URL=http://auth:3002/api
```

### 11. Сети Docker

Вывести список сетей docker
```sh
	docker network ls
```

Создать сеть и присоединить к нему приложение APP.(файл docker-compose)
```js
app:
  	networks:
      - docker-up
	networks:
  		docker-up:
    		driver: bridge
```

### 12. Проксирование Фронтэнд

#### 12.1 Добавить прокси в файл nginx.conf.prod

```js
 location /api {
    proxy_pass http://api:3001;
    rewrite ^/api/(.*) /$1 break;
  }

  location /api {
    proxy_pass http://auth:3002;
    rewrite ^/auth/api/(.*) /$1 break;
  }
```

#### 12.2 Установить axios в Frontend

```sh
npm i -y axios
```
#### 12.3 Запустить PROD контейнеры
```sh
docker-compose up --build
```

#### 12.4 Запустить DEV контейнеры
```sh
docker-compose -f docker-compose.yml -f docker-compose.development.yml up --build
```

# Практика по Docker Swarm 

## 13 Инициализация контейнеров и стэка

### 13.1 Установка на хост машине

```sh
$ docker swarm init --advertise-addr 192.168.99.100
```
### 13.2 Проверка списка стэка

```sh
$ docker node ls
```

### 13.3 Вывести Токен для Добавление новых нод в стэк (Worker-ов)

```sh
$ docker swarm join-token worker
```

### 13.4 Вывести Токен для Добавление новых нод в стэк (Manager-ов)

```sh
$ docker swarm join-token manager
```

### 13.5 Добавление новых нод в стэк (Worker-ов)

```sh
$ docker swarm join \
    --token SWMTKN-1-49nj1cmql0jkz5s954yi3oex3nedyz0fb0xx14ie39trti4wxv-8vxv8rssmk743ojnwacrr2e7c \
    192.168.99.100:2377
```

### 13.6 Добавление новых нод в стэк (Manager-ов)

```sh
$ docker swarm join --token SWMTKN-1-5gn6hc6uvds8ckh886raf3peq1lcc3txbmm57vosbzvb561zpb-bp3nf5auzhzt2hbyi5vfo9jan 192.168.99.100:2377
```

## 14 Проверка статусов и сервисов

### 14.1 Вывести инфо о контейнерах

```sh
$ docker info
```

### 14.2 Вывести инфо о нодах

```sh
$ docker node ls
```

### 14.3 Вывести инфо о запущенных сервисах

```sh
$ docker service ls
```

### 14.4 Инспектирование главной ноды

```sh
$ docker node inspect self --pretty
```

### 14.5 Инспектирование нодов

```sh
$ docker node inspect node_name
```

## 15 Удаление нодов

### 15.1 Выход из стэка (выполнить на удаляемой машине)
```sh
$ docker swarm leave
```

### 15.2 Удаление ноды из стека (выполнить на главной машине)
```sh
$ docker node rm node_name
```

## 16 Установка Стэка из YML файла

### 16.1 Создание инструкции для YML файла

```JSON
version: "3"

services:
  wordpress:
    image: wordpress
    ports:
      - 80:80
    environment:
      WORDPRESS_DB_HOST: mysql
      WORDPRESS_DB_NAME: wp
      WORDPRESS_DB_USER: wp
      WORDPRESS_DB_PASSWORD: wp_pass

  mysql:
    image: mysql:5.7
    environment:
      MYSQL_USER: wp
      MYSQL_PASSWORD: wp_pass
      MYSQL_DATABASE: wp
      MYSQL_ROOT_PASSWORD: root

  phpmyadmin:
    image: phpmyadmin
    ports:
      - 8080:80
    environment:
      PMA_HOST: mysql
```

### 16.2 Запуск стэка из YML файла (выполнить на главной машине)

```sh
$ docker stack deploy --compose-file stack_file_name.yaml stack_name 
OR
$ docker stack deploy -c stack_file_name.yaml stack_name
```

### 16.3 Проверка списка Стэка

```sh
$ docker service ls
OR
$ docker stack services stack_name
```

### 16.4 Удаление стэка

```sh
$ docker stack rm stack_name
```

## 17 Portainer UI-для управление контейнерами и стэком
[Инструкции по установке Portainer](https://www.portainer.io/installation/)

### 17.1 Установка Portainer

```sh
$ curl -L https://downloads.portainer.io/portainer-agent-stack.yml -o portainer-agent-stack.yml
$ docker stack deploy --compose-file=portainer-agent-stack.yml portainer
```

### 17.2 Развертывание нового Стэка с помощью Portainer.

Необходимо зайти в Portainer, добавить новый стэк из YML файла.

Содержимое YML файла:
```json
version: "3"

services:
  redmine:
    image: redmine
    ports:
      - 3000:3000
    environment:
      REDMINE_DB_MYSQL: db
      REDMINE_DB_USERNAME: redmine
      REDMINE_DB_PASSWORD: password

  db:
    image: mysql:5.7
    environment:
      MYSQL_DATABASE: redmine
      MYSQL_USER: redmine
      MYSQL_PASSWORD: password
      MYSQL_ROOT_PASSWORD: root
```

docker swarm join --token SWMTKN-1-0ccqj23o6lsngvg7c2jkq0hliklxx0rh6daxey9v2or no296ve-0ajjott1nth4p6g5ly8jtwxqr 192.168.0.28:2377
