Create docker-compose nats server
stack.yml:
```
# Hello!
version: '3.1'

services:

  nats:
    image: nats
    restart: always
    ports:
      - 42222:4222
```

Create docker-compose mariadb server
stack.yml:

```
# Use root/example as user/password credentials
version: '3.1'

services:

  db:
    image: mariadb
    restart: always
    environment:
      MARIADB_ROOT_PASSWORD: superSecret123
    ports:
      - 3306:3306

  adminer:
    image: adminer
    restart: always
    ports:
      - 8080:8080
```

```
$ docker-compose -f stack.yml up
```

```
CREATE DATABASE adminpanel;
CREATE USER glenda@'%' IDENTIFIED BY 'putinPidor2022';
GRANT ALL PRIVILEGES ON adminpanel.* TO 'glenda'@'%' IDENTIFIED BY 'putinPidor2022';
```