/* eslint-disable operator-linebreak */
/* eslint-disable no-underscore-dangle */
// module scaffolding
// depndencies
const data = require('../../lib/data');

const { hash } = require('../../helpers/utilities');
const { parseJSON } = require('../../helpers/utilities');
const tokenHandler = require('./tokenHandler');

// module scaffholding
const handler = {};

handler.userHandler = (requestProperties, callback) => {
    const acceptedMethods = ['get', 'post', 'put', 'delete'];
    if (acceptedMethods.indexOf(requestProperties.method) > -1) {
        handler._users[requestProperties.method](requestProperties, callback);
    } else {
        callback(405);
    }
};
handler._users = {};

handler._users.post = (requestProperties, callback) => {
    const firstName =
        typeof requestProperties.body.firstName === 'string' &&
        requestProperties.body.firstName.trim().length > 0
            ? requestProperties.body.firstName
            : false;

    const lastName =
        typeof requestProperties.body.lastName === 'string' &&
        requestProperties.body.lastName.trim().length > 0
            ? requestProperties.body.lastName
            : false;

    const phone =
        typeof requestProperties.body.phone === 'string' &&
        requestProperties.body.phone.trim().length === 11
            ? requestProperties.body.phone
            : false;

    const password =
        typeof requestProperties.body.password === 'string' &&
        requestProperties.body.password.trim().length > 0
            ? requestProperties.body.password
            : false;

    const tosAgrement =
        typeof requestProperties.body.tosAgrement === 'boolean'
            ? requestProperties.body.tosAgrement
            : false;

    if (firstName && lastName && phone && password && tosAgrement) {
        // make sure that user doesn't exists
        data.read('users', phone, (err1) => {
            if (err1) {
                const userObject = {
                    firstName,
                    lastName,
                    phone,
                    password: hash(password),
                    tosAgrement,
                };

                // store the user to db
                data.create('users', phone, userObject, (err2) => {
                    if (!err2) {
                        callback(200, {
                            message: 'user was created successfully',
                        });
                    } else {
                        callback(500, {
                            error: 'Could not create user!',
                        });
                    }
                });
            } else {
                callback(500, {
                    error: 'There was a problem in server side!',
                });
            }
        });
    } else {
        callback(400, {
            error: 'You hava problem in your request',
        });
    }
};

handler._users.get = (requestProperties, callback) => {
    // check the phone unmber valid or not
    const phone =
        typeof requestProperties.queryStringObject.phone === 'string' &&
        requestProperties.queryStringObject.phone.trim().length === 11
            ? requestProperties.queryStringObject.phone
            : false;
    if (phone) {
        // verify user
        const token =
            typeof requestProperties.headersObject.token === 'string'
                ? requestProperties.headersObject.token
                : false;

        tokenHandler._token.verify(token, phone, (tokenId) => {
            if (tokenId) {
                // lookup the user
                data.read('users', phone, (err, u) => {
                    const user = { ...parseJSON(u) };
                    if (!err && user) {
                        delete user.password;
                        callback(200, user);
                    } else {
                        callback(404, {
                            error: 'Requested user not founds!',
                        });
                    }
                });
            } else {
                callback(403, {
                    error: 'Authentication failure',
                });
            }
        });
    } else {
        callback(404, {
            error: 'Requested user not found!',
        });
    }
};

handler._users.put = (requestProperties, callback) => {
    // check if the phone number is valid
    const phone =
        typeof requestProperties.body.phone === 'string' &&
        requestProperties.body.phone.trim().length === 11
            ? requestProperties.body.phone
            : false;
    const firstName =
        typeof requestProperties.body.firstName === 'string' &&
        requestProperties.body.firstName.trim().length > 0
            ? requestProperties.body.firstName
            : false;

    const lastName =
        typeof requestProperties.body.lastName === 'string' &&
        requestProperties.body.lastName.trim().length > 0
            ? requestProperties.body.lastName
            : false;

    const password =
        typeof requestProperties.body.password === 'string' &&
        requestProperties.body.password.trim().length > 0
            ? requestProperties.body.password
            : false;

    if (phone) {
        if (firstName || lastName || password) {
            const token =
                typeof requestProperties.headersObject.token === 'string'
                    ? requestProperties.headersObject.token
                    : false;

            tokenHandler._token.verify(token, phone, (tokenId) => {
                if (tokenId) {
                    // lookup the user in DB

                    data.read('users', phone, (err1, u) => {
                        const userData = { ...parseJSON(u) };
                        if (!err1 && userData) {
                            if (firstName) {
                                userData.firstName = firstName;
                            }
                            if (lastName) {
                                userData.lastName = lastName;
                            }
                            if (password) {
                                userData.password = hash(password);
                            }

                            // update DB
                            data.update('users', phone, userData, (err2) => {
                                if (!err2) {
                                    callback(200, {
                                        message: 'user was updated successfully!!',
                                    });
                                } else {
                                    callback(500, {
                                        error: 'there was problem in serverside!!',
                                    });
                                }
                            });
                        } else {
                            callback(400, {
                                error: 'invalid request1',
                            });
                        }
                    });
                } else {
                    callback(403, {
                        error: 'Authentication failure',
                    });
                }
            });
        } else {
            callback(400, {
                error: 'invalid request2',
            });
        }
    } else {
        callback(400, {
            error: 'invalid phone number',
        });
    }
};

handler._users.delete = (requestProperties, callback) => {
    // check the phone unmber valid or not
    const phone =
        typeof requestProperties.queryStringObject.phone === 'string' &&
        requestProperties.queryStringObject.phone.trim().length === 11
            ? requestProperties.queryStringObject.phone
            : false;
    if (phone) {
        const token =
            typeof requestProperties.headersObject.token === 'string'
                ? requestProperties.headersObject.token
                : false;

        tokenHandler._token.verify(token, phone, (tokenId) => {
            if (tokenId) {
                // lookup the user
                data.read('users', phone, (err1, userData) => {
                    if (!err1 && userData) {
                        data.delete('users', phone, (err2) => {
                            if (!err2) {
                                callback(200, {
                                    message: 'user was successfully deleted',
                                });
                            } else {
                                callback(500, {
                                    error: 'there was a serverside error',
                                });
                            }
                        });
                    } else {
                        callback(500, {
                            error: 'There was a server side problem.',
                        });
                    }
                });
            } else {
                callback(403, {
                    error: 'Authentication failure',
                });
            }
        });
        // lookup phone nuber
    } else {
        callback(400, {
            error: 'there was a problem in your request!',
        });
    }
};

// exports
module.exports = handler;
