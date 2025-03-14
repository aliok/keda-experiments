const express = require('express');
const client = require('prom-client');
const app = express();
const port = 3000;

app.use(express.json()); // Middleware to parse JSON request bodies

// Create a counter metric
const requestCounter = new client.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
});

// Expose metrics endpoint
app.get('/metrics', async (req, res) => {
    console.log('Metrics endpoint hit');
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
});

app.get('/', (req, res) => {
    console.log('Root endpoint hit');
    requestCounter.inc();
    res.send('Hello from Node.js with Prometheus metrics!');
});

app.get('/increase', (req, res) => {
    console.log('Increase endpoint hit');
    const value = parseFloat(req.query.value);
    if (isNaN(value) || value <= 0) {
        return res.status(400).json({ error: 'Value must be a positive number' });
    }
    requestCounter.inc(value);
    res.json({ message: `Counter increased by ${value}` });
});

registerGracefulExit();

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

function registerGracefulExit() {
    let logExit = function () {
        console.log("Exiting");
        process.exit();
    };

    // handle graceful exit
    //do something when app is closing
    process.on('exit', logExit);
    //catches ctrl+c event
    process.on('SIGINT', logExit);
    process.on('SIGTERM', logExit);
    // catches "kill pid" (for example: nodemon restart)
    process.on('SIGUSR1', logExit);
    process.on('SIGUSR2', logExit);

    process.on('unhandledRejection', (reason, p) => {
        console.error(reason, 'Unhandled Rejection at Promise', p);
        logExit();
    });
    process.on('uncaughtException', err => {
        console.error(err, 'Uncaught Exception thrown');
        logExit();
    });
}
