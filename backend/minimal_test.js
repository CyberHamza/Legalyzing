const express = require('express');
const app = express();

app.get('/', (req, res) => res.send('Minimal server working'));

const PORT = 5000;
app.listen(PORT, (err) => {
    if (err) console.error('Error starting server:', err);
    else console.log(`Minimal server listening on port ${PORT}`);
});
