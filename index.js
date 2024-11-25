/**
 * Express API server that provides endpoints for display control and GitHub contributions
 * @module server
 * @requires express
 * @requires https
 */

const express = require('express');
const https = require('https');

// Environment constants
const LOCALHOST = process.env.LOCALHOST;
const PORT = process.env.PORT;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_USERNAME = process.env.GITHUB_USERNAME;

// Initialize Express
const app = express();

// Global state
let isEnabled = true;

/**
 * Updates isEnabled state based on server's local time
 * Enabled: 8:00 - 21:59
 * Disabled: 22:00 - 7:59
 */
function updateStateByHour() {
    const hour = new Date().getHours();
    
    isEnabled = hour >= 8 && hour < 22;
}

// Schedule state updates
setInterval(updateStateByHour, 60000);
updateStateByHour();

/**
 * Fetches GitHub contributions data using GraphQL API
 * @async
 * @returns {Promise<Object>} GitHub API response with contributions data
 * @throws {Error} When API request fails
 */
async function getGithubContributions() {
    const query = `
    query {
        user(login: "${GITHUB_USERNAME}") {
            contributionsCollection {
                contributionCalendar {
                    totalContributions
                    weeks {
                        contributionDays {
                            contributionCount
                            date
                        }
                    }
                }
            }
        }
    }`;

    const options = {
        hostname: 'api.github.com',
        path: '/graphql',
        method: 'POST',
        headers: {
            'Authorization': `bearer ${GITHUB_TOKEN}`,
            'Content-Type': 'application/json',
            'User-Agent': 'Node.js'
        }
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        });
        
        req.on('error', reject);
        req.write(JSON.stringify({ query }));
        req.end();
    });
}

/**
 * GET /hello
 * Returns greeting message based on current enabled state
 * @route {GET} /hello
 * @returns {Object} JSON response with content
 */
app.get('/hello', (req, res) => {
    res.json({ content: isEnabled ? "Hello, world!" : "" });
});

app.get('/custom', (req, res) => {
    const text = req.query.text;
    
    res.json({ content: isEnabled ? text : "" });
});

/**
 * GET /state
 * Updates and returns the enabled state
 * @route {GET} /state
 * @example
 * url:port/state?enabled=true
 * url:port/state?enabled=false
 * @param {boolean} req.query.enabled - New state value
 * @returns {Object} JSON response with current enabled state
 */
app.get('/state', (req, res) => {
    const enabled = req.query.enabled === 'true';
    
    isEnabled = enabled;
    
    res.json({ enabled });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on ${LOCALHOST}:${PORT}`);
});