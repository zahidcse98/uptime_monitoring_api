/* eslint-disable prettier/prettier */
// dependencies

// module scaffolding
const environments = {};

// staging environment
environments.staging = {
    port: 3000,
    envName: 'staging',
    secretKey: 'fkasdghskfj',
    maxChecks: 5,
    twilio: {
        fromPhone: '+13192545825',
        accountSid: 'AC7198ec9e7a85f86e31b5aa192c8216e0',
        authToken: 'b827a254349de9cae90bbedd43cb4026',

    },
};

// production environment
environments.production = {
    port: 5000,
    envName: 'production',
    secretKey: 'salkdjfslahdg',
    maxChecks: 5,
    twilio: {
        fromPhone: '+13192545825',
        accountSid: 'AC7198ec9e7a85f86e31b5aa192c8216e0',
        authToken: 'b827a254349de9cae90bbedd43cb4026',
    },
};

// determine which environment was passed
// eslint-disable-next-line no-trailing-spaces
const currentEnvironment = typeof process.env.NODE_ENV === 'string' ? process.env.NODE_ENV : 'staging';

// export corresponding environment object
// eslint-disable-next-line no-trailing-spaces
const environmentToExport = typeof environments[currentEnvironment] === 'object'
        ? environments[currentEnvironment]
        : environments.staging;

// export module
module.exports = environmentToExport;
