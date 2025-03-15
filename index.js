const express = require('express');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const { Client, LocalAuth } = require('whatsapp-web.js');

const app = express();
const PORT = process.env.PORT || 3000;

// Configurare upload pentru creds.json
const upload = multer({ dest: 'uploads/' });

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

let client;

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/upload-creds', upload.single('creds'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No creds.json file uploaded' });
    }

    fs.renameSync(req.file.path, path.join(__dirname, 'creds.json'));

    client = new Client({
        authStrategy: new LocalAuth({ dataPath: path.join(__dirname, 'creds.json') })
    });

    client.on('qr', qr => {
        console.log('Scan this QR code:', qr);
    });

    client.on('ready', () => {
        console.log('Client is ready!');
    });

    client.initialize();
    res.json({ success: true, message: 'Session started! Scan QR code in terminal.' });
});

app.post('/send-message', async (req, res) => {
    if (!client) return res.status(400).json({ error: "WhatsApp client not initialized!" });

    const { numbers, message, delay } = req.body;
    if (!numbers || !message) return res.status(400).json({ error: "Missing parameters!" });

    try {
        for (const number of numbers.split(',')) {
            await new Promise(resolve => setTimeout(resolve, delay * 1000));
            await client.sendMessage(`${number.trim()}@s.whatsapp.net`, message);
        }
        res.json({ success: true, message: "Messages sent!" });
    } catch (error) {
        res.status(500).json({ error: "Failed to send message.", details: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
