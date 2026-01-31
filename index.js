const express = require('express');
const https = require('https');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

// Validate environment variables
const requiredEnvVars = ['GITHUB_TOKEN', 'GITHUB_USERNAME', 'PORT', 'LOCALHOST'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error(`❌ Error: Missing required environment variables: ${missingVars.join(', ')}`);
  process.exit(1);
}

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_USERNAME = process.env.GITHUB_USERNAME;
const LOCALHOST = process.env.LOCALHOST;
const PORT = process.env.PORT;

// Optional weather configuration
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const OPENWEATHER_CITY = process.env.OPENWEATHER_CITY;
const OPENWEATHER_UNITS = process.env.OPENWEATHER_UNITS || 'metric';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// Persistence for display text
const DATA_FILE = path.join(__dirname, 'data.json');

function loadDisplayText() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      return data.text || '';
    }
  } catch (error) {
    console.error('[ERROR] Failed to load display text:', error.message);
  }
  return '';
}

function saveDisplayText(text) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ text }), 'utf8');
  } catch (error) {
    console.error('[ERROR] Failed to save display text:', error.message);
  }
}

let newText = loadDisplayText();

// Cache for commits endpoint
let commitsCache = {
  data: null,
  timestamp: null,
  TTL: 5 * 60 * 1000 // 5 minutes
};

// Cache for weather endpoint
let weatherCache = {
  data: null,
  timestamp: null,
  TTL: 15 * 60 * 1000 // 15 minutes
};

/**
 * Maps weather condition codes to text descriptions
 */
function getWeatherText(weatherId) {
  // OpenWeatherMap weather condition codes
  if (weatherId >= 200 && weatherId < 300) return 'Storm';
  if (weatherId >= 300 && weatherId < 400) return 'Drizzle';
  if (weatherId >= 500 && weatherId < 600) return 'Rain';
  if (weatherId >= 600 && weatherId < 700) return 'Snow';
  if (weatherId >= 700 && weatherId < 800) return 'Fog';
  if (weatherId === 800) return 'Clear';
  if (weatherId > 800) return 'Cloudy';
  return 'N/A';
}

/**
 * Makes a request to OpenWeatherMap API
 */
function fetchWeather() {
  return new Promise((resolve, reject) => {
    if (!OPENWEATHER_API_KEY || !OPENWEATHER_CITY) {
      reject(new Error('Weather API not configured'));
      return;
    }

    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(OPENWEATHER_CITY)}&appid=${OPENWEATHER_API_KEY}&units=${OPENWEATHER_UNITS}`;

    https.get(url, (response) => {
      let body = '';
      response.on('data', (chunk) => body += chunk);
      response.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', reject);
  });
}

/**
 * Makes a GraphQL request to GitHub API
 */
function fetchGitHubGraphQL(query) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query });

    const options = {
      hostname: 'api.github.com',
      path: '/graphql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'User-Agent': 'custom-deskhub'
      }
    };

    const req = https.request(options, (response) => {
      let body = '';
      response.on('data', (chunk) => body += chunk);
      response.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

app.get('/display', (req, res) => {
  res.json({ content: newText });
});

app.get('/setDisplay', (req, res) => {
  const text = req.query.text;

  if (text === undefined || text === null) {
    return res.status(400).json({ error: 'Missing required parameter: text' });
  }

  newText = text;
  saveDisplayText(newText);

  console.log(`[INFO] Display text updated: "${newText}"`);
  res.json({ content: newText });
});

app.get('/commits', async (req, res) => {
  try {
    // Check cache first
    const now = Date.now();
    if (commitsCache.data && commitsCache.timestamp && (now - commitsCache.timestamp < commitsCache.TTL)) {
      console.log('[INFO] Returning cached commits data');
      return res.json({ content: commitsCache.data });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    const query = `
      query {
        user(login: "${GITHUB_USERNAME}") {
          contributionsCollection(from: "${todayISO}") {
            commitContributionsByRepository {
              repository {
                name
                owner {
                  login
                }
              }
              contributions(first: 100) {
                nodes {
                  commitCount
                  occurredAt
                }
              }
            }
            totalCommitContributions
          }
        }
      }
    `;

    const result = await fetchGitHubGraphQL(query);

    if (result.errors) {
      console.error('[ERROR] GitHub API errors:', result.errors);
      return res.status(500).json({ error: 'GitHub API returned errors', details: result.errors });
    }

    if (!result.data || !result.data.user) {
      console.error('[ERROR] Invalid GitHub API response');
      return res.status(500).json({ error: 'Invalid response from GitHub API' });
    }

    const contributions = result.data.user.contributionsCollection;
    const totalCommits = contributions?.totalCommitContributions || 0;
    const repositories = contributions?.commitContributionsByRepository || [];

    let textResult = `Today: ${totalCommits} commit${totalCommits !== 1 ? 's' : ''}`;

    if (repositories.length > 0) {
      const repoList = repositories.map(repo => {
        const commits = repo.contributions.nodes.length;
        return `${repo.repository.name}: ${commits}`;
      }).join(', ');
      textResult += ` (${repoList})`;
    }

    // Update cache
    commitsCache.data = textResult;
    commitsCache.timestamp = now;

    console.log(`[INFO] Fetched ${totalCommits} commits from GitHub`);
    res.json({ content: textResult });
  } catch (error) {
    console.error('[ERROR] Error fetching commits:', error.message);
    res.status(500).json({ error: 'Failed to fetch GitHub commits', message: error.message });
  }
});

app.get('/weather', async (req, res) => {
  try {
    // Check if weather is configured
    if (!OPENWEATHER_API_KEY || !OPENWEATHER_CITY) {
      return res.status(503).json({
        error: 'Weather service not configured',
        message: 'Please set OPENWEATHER_API_KEY and OPENWEATHER_CITY environment variables'
      });
    }

    // Check cache first
    const now = Date.now();
    if (weatherCache.data && weatherCache.timestamp && (now - weatherCache.timestamp < weatherCache.TTL)) {
      console.log('[INFO] Returning cached weather data');
      return res.json({ content: weatherCache.data });
    }

    const weatherData = await fetchWeather();

    if (weatherData.cod !== 200) {
      console.error('[ERROR] Weather API error:', weatherData.message);
      return res.status(500).json({ error: 'Weather API error', message: weatherData.message });
    }

    const temp = Math.round(weatherData.main.temp);
    const city = weatherData.name;
    const weatherId = weatherData.weather[0].id;
    const condition = getWeatherText(weatherId);
    const unit = OPENWEATHER_UNITS === 'imperial' ? 'F' : 'C';

    const textResult = `${city}: ${temp}${unit} ${condition}`;

    // Update cache
    weatherCache.data = textResult;
    weatherCache.timestamp = now;

    console.log(`[INFO] Fetched weather for ${city}: ${temp}${unit} ${condition}`);
    res.json({ content: textResult });
  } catch (error) {
    console.error('[ERROR] Error fetching weather:', error.message);
    res.status(500).json({ error: 'Failed to fetch weather data', message: error.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('='.repeat(50));
  console.log('✅ Custom DeskHub Server Started');
  console.log('='.repeat(50));
  console.log(`🌐 Server URL: ${LOCALHOST}:${PORT}`);
  console.log(`👤 GitHub User: ${GITHUB_USERNAME}`);
  console.log(`📝 Display text loaded: "${newText}"`);
  if (OPENWEATHER_API_KEY && OPENWEATHER_CITY) {
    console.log(`🌤️  Weather: ${OPENWEATHER_CITY} (${OPENWEATHER_UNITS})`);
  }
  console.log('='.repeat(50));
  console.log('Available endpoints:');
  console.log(`  GET  ${LOCALHOST}:${PORT}/display`);
  console.log(`  GET  ${LOCALHOST}:${PORT}/setDisplay?text=<text>`);
  console.log(`  GET  ${LOCALHOST}:${PORT}/commits`);
  console.log(`  GET  ${LOCALHOST}:${PORT}/weather`);
  console.log('='.repeat(50));
});