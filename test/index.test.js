'use strict';
const expect = require('chai').expect;
const sinon = require('sinon');
const SftpToS3 = require('../index');
const retrieveFileStreams = require('../lib/retrieveFileStreams');
const Client = require('ssh2-sftp-client');
const uploadToS3 = require('../lib/uploadToS3');
const config = {
  aws: {
    bucket: 'my-bucket'
  },
  completedDir: 'done',
  fileDownloadDir: 'foo'
};

const sandbox = sinon.createSandbox()

describe("batch", function() {
  afterEach(function() {
    sandbox.restore()
  })

  it('should run succesfully', function(done) {
    sandbox.stub(Client.prototype, 'connect').callsFake(function() {
      return Promise.resolve();
    });

    sandbox.stub(Client.prototype, 'list').callsFake(function() {
      return Promise.resolve([{name: "meow", type: '-'}]);
    });

    sandbox.stub(Client.prototype, 'get').callsFake(function() {
      return Promise.resolve({path: 'meow'})
    });

    sandbox.stub(Client.prototype, 'mkdir');

    sandbox.stub(Client.prototype, 'rename').callsFake(function(from, to) {
      expect(from).to.eq('foo/meow')
      expect(to).to.eq('done/meow')
    })

    sandbox.stub(Client.prototype, 'end');

    sandbox.stub(uploadToS3, 'putBatch').callsFake(function(config, files) {
      expect(config).to.have.property('fileDownloadDir')
      expect(config).to.have.property('aws')
      expect(files.length).to.equal(1)
      expect(files[0].key).to.equal('meow')
      return Promise.resolve();
    });

    SftpToS3.batch(config)
      .then((success) => {
        sinon.assert.calledTwice(Client.prototype.list);
        sinon.assert.calledOnce(Client.prototype.mkdir);
        sinon.assert.calledOnce(Client.prototype.rename);
        sinon.assert.calledOnce(Client.prototype.end);
        expect(success).to.equal("ftp files uploaded");
        done()
      })
    sinon.assert.calledOnce(Client.prototype.connect);
  });

  it('should handle errors', function(done) {
    sandbox.stub(Client.prototype, 'connect').callsFake(function() {
      return Promise.reject("meowlure");
    });

    sandbox.stub(Client.prototype, 'end');

    SftpToS3.batch(config)
      .catch((err) => {
        expect(err).to.equal("meowlure");
        done()
      })
    sinon.assert.calledOnce(Client.prototype.connect);
  });
});
