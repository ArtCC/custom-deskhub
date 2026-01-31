# Custom DeskHub Backend 🖥️

[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.21+-blue.svg)](https://expressjs.com/)
[![License](https://img.shields.io/badge/License-Apache%202.0-yellow.svg)](LICENSE)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg)](https://www.docker.com/)

A powerful Node.js backend service to extend [DeskHub](https://getdeskhub.com/) functionality with custom features, including real-time GitHub commit tracking and dynamic content display.

![DeskHub](https://getdeskhub.com/_next/image?url=%2Fhero2.webp&w=1080&q=75)

> **About DeskHub**: DeskHub is an innovative physical device developed by [Max Blade](https://getdeskhub.com/). If you don't have one yet, check it out!

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [API Endpoints](#-api-endpoints)
- [Docker Deployment](#-docker-deployment)
- [Development](#-development)
- [Project Structure](#-project-structure)
- [License](#-license)

---

## ✨ Features

- **🎯 Dynamic Content Display**: Control what your DeskHub displays in real-time
- **📊 GitHub Integration**: Automatically fetch and display today's commit statistics
- **💾 Persistent Storage**: Content persists between server restarts
- **⚡ Smart Caching**: 5-minute cache for GitHub data to avoid rate limits
- **🔒 Environment Validation**: Ensures all required credentials are present
- **🌐 CORS Enabled**: Ready for cross-origin requests
- **📝 Structured Logging**: Comprehensive logging with timestamps
- **🐳 Docker Ready**: Easy deployment with Docker Compose

---

## 🛠 Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: Express.js 4.21+
- **API**: GitHub GraphQL API
- **Containerization**: Docker & Docker Compose
- **Code Quality**: ESLint 9
- **Development**: Nodemon

---

## 📦 Prerequisites

Before you begin, ensure you have:

- **Node.js** 20 or higher ([Download](https://nodejs.org/))
- **npm** (comes with Node.js)
- **Docker** (optional, for containerized deployment)
- **GitHub Account** with a personal access token
- **DeskHub Device** ([Get one here](https://getdeskhub.com/))

---

## 🚀 Installation

### Local Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/ArtCC/custom-deskhub.git
   cd custom-deskhub
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   GITHUB_TOKEN=your_github_personal_access_token
   GITHUB_USERNAME=your_github_username
   PORT=3005
   LOCALHOST=http://192.168.1.100
   ```

4. **Start the server**
   ```bash
   node index.js
   ```

   For development with auto-reload:
   ```bash
   npm run dev
   ```

---

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `GITHUB_TOKEN` | GitHub Personal Access Token ([Create one](https://github.com/settings/tokens)) | `ghp_xxxxxxxxxxxx` | ✅ Yes |
| `GITHUB_USERNAME` | Your GitHub username | `ArtCC` | ✅ Yes |
| `PORT` | Server listening port | `3005` | ✅ Yes |
| `LOCALHOST` | Server URL/IP address | `http://192.168.1.100` | ✅ Yes |

### Creating a GitHub Token

1. Go to [GitHub Settings → Developer Settings → Personal Access Tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Select scopes: `read:user` and `repo` (or `public_repo` for public repos only)
4. Copy the generated token

---

## 🔌 API Endpoints

### `GET /display`

Returns the current content to display on DeskHub.

**Response:**
```json
{
  "content": "Your custom text here"
}
```

**DeskHub Usage:**
```
http://your-server:3005/display
```

---

### `GET /setDisplay`

Updates the display content. Content persists between server restarts.

**Parameters:**
- `text` (required): The text to display

**Example:**
```bash
curl "http://your-server:3005/setDisplay?text=Hello%20World"
```

**Response:**
```json
{
  "content": "Hello World"
}
```

---

### `GET /commits`

Fetches your GitHub commits for the current day. Results are cached for 5 minutes.

**Example:**
```bash
curl "http://your-server:3005/commits"
```

**Response:**
```json
{
  "content": "Commits today: 5\n\nRepositories:\n- custom-deskhub: 3 commits\n- my-project: 2 commits"
}
```

**Features:**
- ✅ Automatic caching (5 min TTL)
- ✅ Formatted for DeskHub display
- ✅ Counts commits from midnight UTC

---

## 🐳 Docker Deployment

### Using Docker Compose

Create a `docker-compose.yml` file:

```yaml
version: '3.8'

services:
  custom-deskhub:
    image: node:20-alpine
    container_name: custom-deskhub
    working_dir: /app
    restart: unless-stopped
    ports:
      - "3005:3005"
    environment:
      - GITHUB_TOKEN=${GITHUB_TOKEN}
      - GITHUB_USERNAME=${GITHUB_USERNAME}
      - PORT=3005
      - LOCALHOST=http://192.168.1.100
    volumes:
      - ./data.json:/app/data.json
    command: >
      sh -c "apk add --no-cache git &&
             git clone https://github.com/ArtCC/custom-deskhub.git . &&
             npm install &&
             node index.js"
    networks:
      - deskhub-network

networks:
  deskhub-network:
    driver: bridge
```

**Run with Docker:**
```bash
docker-compose up -d
```

**View logs:**
```bash
docker-compose logs -f
```

**Stop the service:**
```bash
docker-compose down
```

---

## 💻 Development

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start the production server |
| `npm run dev` | Start with auto-reload (nodemon) |
| `npm run lint` | Check code style with ESLint |
| `npm run lint:fix` | Auto-fix linting issues |

### Code Style

This project uses ESLint with the following rules:
- Indentation: 2 spaces
- Quotes: Single quotes
- Semicolons: Required
- Line endings: Unix (LF)

### Development Workflow

1. Make your changes
2. Run `npm run lint:fix` to auto-fix style issues
3. Test your changes locally
4. Commit with meaningful messages

---

## 📁 Project Structure

```
custom-deskhub/
├── index.js              # Main application file
├── data.json             # Persistent storage (auto-generated)
├── package.json          # Project dependencies
├── eslint.config.js      # ESLint configuration
├── docker-compose.yml    # Docker deployment config
├── .env                  # Environment variables (create this)
├── LICENSE               # Apache 2.0 License
└── README.md             # This file
```

---

## 🔧 Troubleshooting

### Server won't start

**Error:** `Missing required environment variables`
- **Solution:** Ensure your `.env` file contains all required variables

### GitHub API errors

**Error:** `Failed to fetch GitHub commits`
- **Solution 1:** Check your GitHub token is valid
- **Solution 2:** Ensure token has correct scopes (`read:user`)
- **Solution 3:** Check GitHub API rate limits

### Docker container exits immediately

**Solution:** Check logs with `docker-compose logs` and verify environment variables

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Arturo Carretero Calvo**

- GitHub: [@ArtCC](https://github.com/ArtCC)
- Year: 2026

---

## 🙏 Acknowledgments

- **Max Blade** for creating the amazing DeskHub device
- **GitHub** for their GraphQL API
- The Node.js and Express.js communities

---

<p align="center">Made with ❤️ for DeskHub users</p>