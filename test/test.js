process.env.NODE_ENV = 'test';

const chai         = require('chai');
const chaiHttp     = require('chai-http');
const server       = require('../app');
const LoggedInUser = require('../models/LoggedInUser');

chai.use(chaiHttp);


describe('Test Suite', () => {
    describe('/auth', () => {
        require('./auth')(chai, server);
    });

    after((done) => {
        cleanup((error, result) => {
            if (error) {
                done(error);
            } else {
                done();
            }
        });
    });
});

function cleanup(callback) {
    LoggedInUser.findOne({ email: 'test@gmail.com' }).exec((error, user) => {
        if (error) {
            callback(error, null)
        } else if (user) {
            user.remove((error) => {
                if (error) {
                    callback(error, null);
                } else {
                    callback(null, true);
                }
            });
        } else {
            callback(null, true);
        }
    });
}