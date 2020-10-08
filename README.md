# docker-run
Docker &amp; docker-compose simple project. Build and run react-web, api, api_db containers via docker. 


### Документация

1) Создаем новую директорию для проекта: realworld-docker

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
      - HOST=http://realworld-docker.com
      - MONGO_URL=mongodb://api_db/27017/api
    depends_on:
      - api_db -- задаем зависимости! запустить контейнер API после контейнера API_DB

  api_db:
    image: mongo:latest
```

19) Добавляем папку configuration и файл index.js со следующим содержимым. 

```js
module.exports.port = process.env.PORT;
module.exports.host = process.env.HOST;
module.exports.db = process.env.MONGO_URL;
```

20) Добавляем папку helpers и файл db.js со следующим содержимым. 
```js
const mongoose = require("mongoose");
const { db } = require("../configuration");

module.exports.connectDb = () => {
  mongoose.connect(db, { useNewUrlParser: true });

  return mongoose.connection;
};
```

21) Для соединения с базой редкатируем файл index.js в API
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

22) Настраиваем Хранилище (хранить БД не в контейнере) с помощью VOLUMES
В файле docker-compose.yml

```js
  api_db:
    image: mongo:latest
    volumes:
      - mongodb_api:/data/api_db -- указываем где будем хранить данные

volumes: -- инициализируем VOLUMES
    mongodb_api:

```

23) Для просмотра всех VOLUMES выполняем след. команду:
```sh
docker volume ls
```

24) Разделяем DEV от PROD

> Создаем новый Docker-compose.development.yml файл:

```js
version: '3'

services:
  api:
    command: npm run dev
    volumes:
      - ./api/src:/usr/src/app/src
````

> Устанавливаем nodemon для авто-перезагрузки страницы при внесении изменения

```sh
 npm install nodemon
```

> Редактируем Package.json

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

> Создаем в папке API файл nodemon.json

```JSON
{
  "verbose": false,
  "watch": ["src"],
  "exec": "node src/index.js"
}

```

> Запускаем DEV mode

```sh
docker-compose -f docker-compose.yml -f docker-compose.development.yml up --build
```

25) Добавляем имя контейнеру

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

26) Устанавливаем и настраиваем REACT контейнер

```sh
npm init react-app frontend
```

> настраиваем Docker-compose.yml, добавляем новый контейнер для Frontend:

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

> создаем Dokcerfile в папке Frontend

```js
FROM node:13.12./0-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

RUN npm install -g serve
```

>  устанавливаем Serve для DEV мода в Frontend

```sh
npm install -g serv
```

27) Открытие контейнера и запуск комманд
```sh
	docker exec -it $container_name echo "Foo"
```

```sh
	docker exec -it $container_name sh
```

28) Развертываем NGINX контейнер для проксирование запросов на фронтенд

> добавляем контейнер в docker-compose.yml

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

> Проверяем порт 80, занят ли он уже NGINX-ом

```sh
ps aux | grep nginx
```

> Создаем конфигурационный файл NGINX > nginx.conf.prod

```js
	server {
	  listen 80;

	  server_name Roque-one.com;

	  location / {
	    proxy_pass http://frontend:3000;
	  }
	}

```
