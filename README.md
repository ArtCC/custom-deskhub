# custom-deskhub

Node.js project to extend DeskHub functionality with custom features. Containerized with Docker and deployed using Docker Compose for easy setup.

'''
version: '3.8'
services:
  app:
    image: node:20-alpine
    container_name: custom-deskhub
    working_dir: /app
    ports:
      - "3005:3005"
    environment:
      - PORT=3005
      - LOCALHOST=http://localhost
    command: >
      sh -c "apk add --no-cache git &&
             git clone https://github.com/ArtCC/custom-deskhub.git . &&
             npm install &&
             node index.js"
'''