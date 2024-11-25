# Custom DeskHub

Node.js project to extend DeskHub functionality with custom features. Containerized with Docker and deployed using Docker Compose for easy setup.

Don’t you have a DeskHub? It was developed by Max Blade, and you can buy it at the following URL:

[DeskHub](https://getdeskhub.com/)

![DeskHub](https://getdeskhub.com/_next/image?url=%2Fhero2.webp&w=1080&q=75)

## Installation:

```
version: '3.8'
services:
  app:
    image: node:20-alpine
    container_name: custom-deskhub
    working_dir: /app
    ports:
      - "'Your port':'Your port'"
    environment:
      - GITHUB_TOKEN='Your GitHub token'
      - GITHUB_USERNAME='Your GitHub username'
      - PORT='Your port'
      - LOCALHOST='Your url server'
    command: >
      sh -c "apk add --no-cache git &&
             git clone https://github.com/ArtCC/custom-deskhub.git . &&
             npm install &&
             node index.js"
```

## Environment:

- 'Your GitHub token': Create a token in your GitHub account and use it to fetch data from GitHub GraphQL.
- 'Your GitHub username': Add your GitHub username.
- 'Your port': Add the port you want to listen on; in my case, I use 3005 to avoid interference with other ports on my local server.
- 'Your url server': Add your server's IP address here; in my case, I use `http://192.168.50.244`.

## Use:

In your DeskHub, use /display with the *content* parameter; there's no need to use any other endpoint.

```
url:port/display
```

With /setDisplay, you can change the displayed text, but for now, I'm not sure how to enable scrolling via an endpoint.

```
url:port/setDisplay?text=Hello
```

With /show, you can enable or disable the visibility of something on the screen.

```
url:port/show?enabled=true
```

With /shutdownOnNightEnabled, you can set it to turn off at 10 PM and turn back on at 8 AM.

```
url:port/shutdownOnNightEnabled?enabled=true
```

## License

[Apache License](LICENSE)

---

**Arturo Carretero Calvo - 2024**