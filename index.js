const express = require('express');
const app = express();
const LOCALHOST = process.env.LOCALHOST;
const PORT = process.env.PORT;

app.get('/hello', (req, res) => {
    res.json({ content: "Hello, world!" });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor corriendo en ${LOCALHOST}:${PORT}`);
});