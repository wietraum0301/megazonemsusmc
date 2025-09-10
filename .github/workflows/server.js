const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 8080;

// 정적 파일은 public 폴더에서 제공 (public 폴더 생성 필요)
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 에러 핸들링 예시
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('서버 오류가 발생했습니다.');
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
