const express = require('express');
const app = express();
const port = 3000;

// Get latencies from env vars, default to 0
const headerLatency = parseInt(process.env.SIMULATED_HEADER_LATENCY_MS, 10) || 0;
const bodyLatency = parseInt(process.env.SIMULATED_BODY_LATENCY_MS, 10) || 0;

app.get('/', (req, res) => {
    console.log('Root endpoint hit');
    console.log('Request Headers:', req.headers);
    console.log('Request Method:', req.method);
    console.log('Request URL:', req.url);
    console.log('Request Body:', req.body);
    console.log('Request Params:', req.params);

    // Simulate response header latency and body latency separately
    setTimeout(() => {
        res.setHeader('X-Response-Time', `${headerLatency + bodyLatency}ms`);
        res.flushHeaders();

        setTimeout(() => {
            res.write('Hello from Node.js!');
            res.end();
        }, bodyLatency);
    }, headerLatency);
});

registerGracefulExit();

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
    console.log(`Simulated header latency: ${headerLatency}ms`);
    console.log(`Simulated body latency: ${bodyLatency}ms`);
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
