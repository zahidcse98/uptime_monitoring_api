/* eslint-disable operator-linebreak */
/* eslint-disable prettier/prettier */
// dependencies
const https = require('https');
const queryString = require('querystring');
const { twilio } = require('./environments');
// module scaffolding
const notifications = {};

// send sms to user using twilio api

notifications.sendTwilioSms = (phone, msg, callback) => {
    // input validation
    const userPhone =
        typeof phone === 'string' && phone.trim().length === 11
            ? phone.trim()
            : false;

    const userMsg =
        typeof msg === 'string' && msg.trim().length > 0 && msg.trim().length <= 1600
            ? msg.trim()
            : false;

    if (userPhone && userMsg) {
        // configure the request payload
        const payload = {
            From: twilio.fromPhone,
            To: `+88${userPhone}`,
            Body: userMsg,
        };

        // stringfy the object
        const strigfyPayload = queryString.stringify(payload);

        // configure the request details
        const requestDetails = {
            hostname: 'api.twilio.com',
            method: 'POST',
            path: `/2010-04-01/Acounts/${twilio.accountSid}/Messages.json`,
            auth: `${twilio.accountSid}:${twilio.authToken}`,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        };

        /// instantiate the rquest object
        const req = https.request(requestDetails, (res) => {
            // get the status of the sent request
            const status = res.statusCode;
            // callback successfully if the request went though
            if (status === 200 || status === 201) {
                callback(false);
            } else {
                callback(`Status code returned was ${status}`);
            }
        });
        req.on('error', (e) => {
            callback(e);
        });

        req.write(strigfyPayload);
        req.end();
    } else {
        callback('Given parameters were missing or invalid!');
    }
};
// export module
module.exports = notifications;
