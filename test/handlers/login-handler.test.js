'use strict';

const AuthHandler = require('../../utils/auth-handler');
const sinon = require('sinon');

describe('Handler: Login', () => {

    let authHandler;
    let handler;

    beforeEach(() => {

        const handlerClass = require('../../utils/login-handler');
        authHandler = new AuthHandler(false);

        handler = new handlerClass(authHandler);
    });

    it('should have `result` property', (done) => {

        expect(handler).to.have.property('result');

        done();
    });

    it('should have `_userToken` property', (done) => {

        expect(handler).to.have.property('_userToken');

        done();
    });

    it('should have assigned authHandler', (done) => {

        expect(handler).to.have.property('authHandler');
        expect(handler.authHandler).to.be.an.instanceOf(AuthHandler);

        done();
    });

    it('should getResult()', (done) => {

        const expectedResult = [{ fake: 'result' }];
        handler.result = expectedResult;

        const actualResult = handler.getResult();

        expect(actualResult).to.be.an('array');
        chai.assert.deepEqual(actualResult[0], expectedResult[0], 'getResult() returns invalid result');

        done();
    });

    it('should askCredentials()', async () => {

        const inquirer = require('inquirer');

        const promptStub = sinon.stub().resolves({ username: '', password: '' });
        const createPromptModuleStub = sinon.stub(inquirer, 'createPromptModule').returns(promptStub);

        await handler.askCredentials();

        expect(promptStub.called).to.be.true;

        createPromptModuleStub.reset();
        createPromptModuleStub.restore();

        return Promise.resolve();
    });

    it('should set options.data after askCredentials()', async () => {

        const inquirer = require('inquirer');

        const expectedOptionsData = { username: '', password: '' };
        const promptStub = sinon.stub().resolves(expectedOptionsData);
        const createPromptModuleStub = sinon.stub(inquirer, 'createPromptModule').returns(promptStub);

        await handler.askCredentials();

        const actualOptionsData = handler.options.data;

        chai.assert.deepEqual(actualOptionsData, expectedOptionsData, 'options has not been set after askCredentials()');

        createPromptModuleStub.reset();
        createPromptModuleStub.restore();

        return Promise.resolve();
    });

    it('should login()', async () => {

        const HttpWrapper = require('../../utils/http-wrapper');

        const httpMock = sinon.mock(HttpWrapper.prototype);
        httpMock.expects('post').once().resolves([{ token: '' }]);

        await handler.login();

        httpMock.verify();

        return Promise.resolve();
    });

    it('should parseResponse() when object passed', (done) => {

        const fakeToken = 'fake-token';
        const fakeResponse = [{ token: fakeToken }];

        handler.parseResponse(fakeResponse);

        expect(handler._userToken).to.be.equal(fakeToken);

        done();
    });

    it('should parseResponse() when string passed', (done) => {

        const fakeToken = 'fake-token';
        const fakeResponse = JSON.stringify([{ token: fakeToken }]);

        handler.parseResponse(fakeResponse);

        expect(handler._userToken).to.be.equal(fakeToken);

        done();
    });

    it('should not saveToken() if _userToken is empty', (done) => {

        const expectedResult = [{ 'Status': 'not logged in', 'Message': 'Login failed' }];

        handler._userToken = '';

        handler.saveToken();

        const actualResult = handler.result;

        chai.assert.deepEqual(actualResult[0], expectedResult[0], 'saveToken() did not set expected result');

        done();
    });

    it('should write user token and set handler.result on saveToken()', (done) => {

        const fs = require('fs');

        const mkdirStub = sinon.stub(fs, 'mkdir').callsArgWith(2);
        const writeFileStub = sinon.stub(fs, 'writeFile').returns(undefined);

        const expectedResult = [{ 'Status': 'logged in', 'Message': 'Login successful' }];

        handler._userToken = 'fake-token';

        handler.saveToken();

        const actualResult = handler.result;

        expect(mkdirStub.called).to.be.true;
        expect(writeFileStub.called).to.be.true;
        chai.assert.deepEqual(actualResult[0], expectedResult[0], 'saveToken() did not set expected result');

        mkdirStub.reset();
        writeFileStub.reset();
        mkdirStub.restore();
        writeFileStub.restore();

        done();
    });

    it('should set handler.result on saveToken() if writeFile fails', (done) => {

        const fs = require('fs');

        const fakeError = new Error('Fake error');
        const mkdirStub = sinon.stub(fs, 'mkdir').callsArgWith(2);
        const writeFileStub = sinon.stub(fs, 'writeFile').throws(fakeError);

        const expectedResult = [{ 'Status': 'not logged in', 'Message': `Login failed: ${fakeError.message}` }];

        handler._userToken = 'fake-token';

        handler.saveToken();

        const actualResult = handler.result;

        expect(writeFileStub.called).to.be.true;
        chai.assert.deepEqual(actualResult[0], expectedResult[0], 'saveToken() did not set expected result');

        mkdirStub.reset();
        writeFileStub.reset();
        mkdirStub.restore();
        writeFileStub.restore();

        done();
    });
    
});
