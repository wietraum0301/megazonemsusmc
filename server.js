const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 8080;

// 현재 폴더(루트)에서 정적 파일 제공
app.use(express.static('.'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
