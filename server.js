const express = require('express');
const Emulator = require('./emulator');

const app = express();
app.use(express.json());

// Create one emulator instance
const emu = new Emulator(null);
let loopInterval = null;

function loop() {
    for (let i = 0; i < emu.STEPS_PER_DELAY; i++)
    {
        emu.step();
    } 
}

// --- GET state ---
app.get('/state', (req, res) => {
    res.json(JSON.parse(emu.getState()));
});

// --- POST state (load save) ---
app.post('/state', (req, res) => {
    try {
        if (loopInterval !== null)
        {
            clearInterval(loopInterval); // stop previous loop
        }
        emu.setState(JSON.stringify(req.body));
        loopInterval = setInterval(loop, 4);
        res.json({ status: 'ok' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Start server
const PORT = process.env.PORT || 3535;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Running on port ${PORT}`);
});