const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const app = express();

app.use(express.json());

app.get('/', (req, res) => {
    res.send("test server 1.0");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log("서버가 " + PORT + "번 포트에서 대기 중입니다.");
});