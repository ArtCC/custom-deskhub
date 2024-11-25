const express = require('express');
const https = require('https');
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_USERNAME = process.env.GITHUB_USERNAME;
const LOCALHOST = process.env.LOCALHOST;
const PORT = process.env.PORT;
const app = express();

let shutdownOnNightIsEnabled = false;
let isEnabled = false;
let newText = "";

/**
 * Updates isEnabled state based on server's local time
 * Enabled: 8:00 - 21:59
 * Disabled: 22:00 - 7:59
 */
function updateStateByHour() {
    if (shutdownOnNightIsEnabled) {
        const hour = new Date().getHours();
       
        isEnabled = hour >= 8 && hour < 22;
    }
}

setInterval(updateStateByHour, 60000);
updateStateByHour();

app.get('/display', (req, res) => {
    res.json({ content: isEnabled ? newText : "" });
});

app.get('/setDisplay', (req, res) => {
    const text = req.query.text;

    newText = text;
    
    res.json({ content: newText });
});

app.get('/show', (req, res) => {
    const enabled = req.query.enabled;

    if (enabled === 'true') {
        isEnabled = true;
    } else if (enabled === 'false') {
        isEnabled = false;
    } else {
        return res.status(400).json({ error: "Invalid value for 'enabled'. Use 'true' or 'false'." });
    }
        
    res.json({ isEnabled });
});

app.get('/shutdownOnNightEnabled', (req, res) => {
    const enabled = req.query.enabled;

    if (enabled === 'true') {
        shutdownOnNightIsEnabled = true;
    } else if (enabled === 'false') {
        shutdownOnNightIsEnabled = false;
        isEnabled = true;
    } else {
        return res.status(400).json({ error: "Invalid value for 'enabled'. Use 'true' or 'false'." });
    }
        
    res.json({ shutdownOnNightIsEnabled });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on ${LOCALHOST}:${PORT}`);
});