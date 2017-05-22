module.exports = (chai, server) => {
    const should = chai.should();

    describe('/auth/register', () => {
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
                res.should.have.status(409);
                res.should.be.json;
                res.body.should.be.a('object');
                res.body.should.have.property('success');
                res.body.success.should.be.False;
                res.body.should.have.property('errors');
                res.body.errors.should.be.a('array');
                done();
            });
        });
    });
};