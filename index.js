const express = require('express');
const app = express();
const LOCALHOST = process.env.LOCALHOST;
const PORT = process.env.PORT;

let isEnabled = true;

app.get('/state', (req, res) => {
    const enabled = req.query.enabled === 'true';
    
    isEnabled = enabled;
    
    res.json({ enabled });
});

app.get('/hello', (req, res) => {
    res.json({ content: isEnabled ? "Hello, world!" : "" });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on ${LOCALHOST}:${PORT}`);
});