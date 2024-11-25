# Custom DesKhub

Node.js project to extend DeskHub functionality with custom features. Containerized with Docker and deployed using Docker Compose for easy setup.

Don’t you have a DeskHub? It was developed by Max Blade, and you can buy it at the following URL:

[DeskHub](https://getdeskhub.com/)

![DeskHub](https://getdeskhub.com/_next/image?url=%2Fhero2.webp&w=1080&q=75)

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
      - PORT='Your port'
      - LOCALHOST='Your url server'
    command: >
      sh -c "apk add --no-cache git &&
             git clone https://github.com/ArtCC/custom-deskhub.git . &&
             npm install &&
             node index.js"
```

## Installation:

'Your GitHub token': Create a token in your GitHub account and use it to fetch data from GitHub GraphQL.
'Your port': Add the port you want to listen on; in my case, I use 3005 to avoid interference with other ports on my local server.
'Your url server': Add your server's IP address here; in my case, I use `http://192.168.50.244`.

## License

[Apache License](LICENSE)

---

**Arturo Carretero Calvo - 2024**