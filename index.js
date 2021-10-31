// dependencies
const server = require('./lib/server');
const workers = require('./lib/worker');
// const data = require('./lib/data');
// const environment = require('./helpers/environments');
// app object - module scaffolding
const app = {};
app.init = () => {
    // start the server
    server.init();
    // start the workers
    workers.init();
};

app.init();

// export the app
module.exports = app;
