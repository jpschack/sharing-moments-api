process.env.NODE_ENV = 'test';

const chai         = require('chai');
const chaiHttp     = require('chai-http');
const server       = require('../app');
const should       = chai.should();
const LoggedInUser = require('../models/LoggedInUser');

chai.use(chaiHttp);


describe('auth', () => {
    it('should register test user', (done) => {
        chai.request(server)
        .post('/auth/register')
        .send({ 'email': 'test@gmail.com', 'username': 'testUser', 'password': 'test123' })
        .end((error, res) => {
            res.should.have.status(200);
            res.should.be.json;
            res.body.should.be.a('object');
            res.body.should.have.property('success');
            res.body.success.should.be.True;
            res.body.should.have.property('data');
            res.body.data.should.be.a('object');
            res.body.should.have.property('totalCount');
            res.body.totalCount.should.be.equal(1);
            done();
        });
    });

    it('should fail registering the same user', (done) => {
        chai.request(server)
        .post('/auth/register')
        .send({ 'email': 'test@gmail.com', 'username': 'testUser', 'password': 'test123' })
        .end((error, res) => {
            res.should.have.status(400);
            res.should.be.json;
            res.body.should.be.a('object');
            res.body.should.have.property('success');
            res.body.success.should.be.False;
            res.body.should.have.property('errors');
            res.body.errors.should.be.a('array');
            done();
        });
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