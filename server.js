// server.js
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Simple route to respond to Uptime Robot
app.get('/', (req, res) => res.send('Bot is running!'));

// Start Express server
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});

// Start your WhatsApp bot
require('./index.js'); // عدلي على حسب اسم الملف الرئيسي للبوت
