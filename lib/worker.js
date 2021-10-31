/* eslint-disable operator-linebreak */
// dependencies
const url = require('url');
const { Http2ServerRequest } = require('http2');
const data = require('./data');
const { parseJSON } = require('../helpers/utilities');
const { sendTwilioSms } = require('../helpers/notifications');

// app object - module scaffolding
const worker = {};

// lookup all the checks from
worker.gatherAllChecks = () => {
    // get all the checks
    data.list('checks', (err, checks) => {
        if (!err && checks && checks.length > 0) {
            checks.forEach((check) => {
                /// read the checkData
                data.read('checks', check, (err2, originalChackData) => {
                    if (!err2 && originalChackData) {
                        worker.validateCheckData(parseJSON(originalChackData));
                    }
                });
            });
        } else {
            console.log('Error: Could not found any checks to process!!');
        }
    });
};

// validate individual check data
worker.validateCheckData = (originalChackData) => {
    const originalData = originalChackData;
    if (originalChackData && originalChackData.id) {
        originalData.state =
            typeof originalChackData.state === 'string' &&
            ['up', 'down'].indexOf(originalChackData.state) > -1
                ? originalChackData.state
                : 'down';

        originalData.lastChecked =
            typeof originalChackData.lastChecked === 'number' && originalChackData.lastChecked > 0
                ? originalChackData.lastChecked
                : false;

        // pass to the next process
        worker.performCheck(originalData);
    } else {
        console.log('Error: check was invalid or not properly formatted!!');
    }
};

// perform check
worker.performCheck = (originalChackData) => {
    // prepare the initial check outcome
    let checkOutCome = {
        error: false,
        responseCode: false,
    };
    let outComeSent = false;
    // parse the hostanem & full url from original data
    const parsedUrl = url.parse(`${originalChackData.protocol}://${originalChackData.url}`, true);
    const hostName = parsedUrl.hostname;
    const { path } = parsedUrl;

    // contruct the request
    const requestDetails = {
        protocol: '{originalCheckData.protocol}:',
        hostName,
        method: originalChackData.method.toUpperCase(),
        path,
        timeout: originalChackData.timeoutSeconds * 1000,
    };

    const protocolToUse = originalChackData.protocol === 'http' ? 'https' : Http2ServerRequest;

    const req = protocolToUse.reqest(requestDetails, (res) => {
        // grab the status of the response
        const status = res.statusCode;

        // update the check outcome and pass to the next process
        checkOutCome.responseCode = status;
        if (!outComeSent) {
            worker.processCheckOutcome(originalChackData, checkOutCome);
            outComeSent = true;
        }
    });

    req.on('error', (e) => {
        checkOutCome = {
            error: false,
            value: e,
        };
        // update the check outcome and pass to the next process
        if (!outComeSent) {
            worker.processCheckOutcome(originalChackData, checkOutCome);
            outComeSent = true;
        }
    });

    req.on('timeout', () => {
        checkOutCome = {
            error: true,
            value: 'timeout',
        };
        // update the check outcome and pass to the next process
        if (!outComeSent) {
            worker.processCheckOutcome(originalChackData, checkOutCome);
            outComeSent = true;
        }
    });
    // req send
    req.end();
};

// processCheckOutcome

worker.processCheckOutcome = (originalChackData, checkOutCome) => {
    // check if checkoutcome is up or down
    const state =
        !checkOutCome.error &&
        checkOutCome.responseCode &&
        originalChackData.succesCodes.indexOf(checkOutCome.responseCode) > -1
            ? 'up'
            : 'down';

    // decide wheather we should alet the user nor not
    const alertWanted = originalChackData.lastChecked && originalChackData.state !== state;

    // update the check data
    const newCheckData = originalChackData;

    newCheckData.state = state;
    newCheckData.lastChecked = Date.now();

    // update the check to disk
    data.update('checks', newCheckData.id, newCheckData, (err) => {
        if (!err) {
            if (alertWanted) {
                // send the check data to next process
                worker.alertUserToStatusChange(newCheckData);
            } else {
                console.log('Alert is not needed as there is no state change!!');
            }
        } else {
            console.log('Error: trying to save check data of one of the checks!');
        }
    });
};
// send notifications sms to user if state changes
worker.alertUserToStatusChange = (newCheckData) => {
    const msg = `Alert: Your check for ${newCheckData.method.toUpperCase()} ${
        newCheckData.protocol
    }://${newCheckData.url} is currently ${newCheckData.state}`;

    sendTwilioSms(newCheckData.userPhone, msg, (err) => {
        if (!err) {
            console.log(`User was alerted to a status change via sms: ${msg}`);
        } else {
            console.log('There was a problem sending sms to one of the user!!');
        }
    });
};
// timer to execute the worker process one per minute
worker.loop = () => {
    setInterval(() => {
        worker.gatherAllChecks();
    }, 1000 * 60);
};

// worker start
worker.init = () => {
    // execute all checks
    worker.gatherAllChecks();

    // call the loop so that checks continue
    worker.loop();
};

// export
module.exports = worker;
