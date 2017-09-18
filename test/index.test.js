'use strict'
const expect = require('chai').expect
const tree = require('../lib/listTree')
const sinon = require('sinon')
const SftpToS3 = require('../index')
const Client = require('ssh2-sftp-client')
const uploadToS3 = require('../lib/uploadToS3')
const config = {
  aws: {
    bucket: 'my-bucket'
  },
  completedDir: 'done',
  fileDownloadDir: 'foo'
}

const sandbox = sinon.createSandbox()

describe('batch', function() {
  afterEach(function() {
    sandbox.restore()
  })

  it('should run succesfully', function() {
    sandbox.stub(Client.prototype, 'connect').callsFake(function() {
      return Promise.resolve()
    })

    sandbox.stub(Client.prototype, 'list').callsFake(function() {
      return Promise.resolve([{name: 'meow', type: '-'}, {name: 'dir', type: 'd'}])
    })

    sandbox.stub(Client.prototype, 'get').callsFake(function() {
      return Promise.resolve({path: 'foo/meow'})
    })

    sandbox.stub(Client.prototype, 'mkdir').callsFake(function() {
      return Promise.resolve()
    })

    sandbox.stub(Client.prototype, 'rename').callsFake(function(from, to) {
      expect(from).to.eq('foo/meow')
      expect(to).to.eq('foo/done/meow')
      return Promise.resolve()
    })

    sandbox.stub(Client.prototype, 'end')

    var s3 = sandbox.stub(uploadToS3, 'putBatch').callsFake(function(config, files) {
      expect(config).to.have.property('fileDownloadDir')
      expect(config).to.have.property('aws')
      expect(files.length).to.equal(1)
      expect(files[0].key).to.equal('foo/meow')
      return Promise.resolve()
    })

    return SftpToS3.batch(config)
      .then((success) => {
        sinon.assert.calledOnce(Client.prototype.connect)
        sinon.assert.calledOnce(Client.prototype.list)
        sinon.assert.calledOnce(Client.prototype.mkdir)
        sinon.assert.calledOnce(Client.prototype.rename)
        sinon.assert.calledOnce(Client.prototype.end)
        sinon.assert.calledOnce(s3)
        expect(success).to.equal('ftp files uploaded')
      })
  })

  it('should handle errors', function(done) {
    sandbox.stub(Client.prototype, 'connect').callsFake(function() {
      return Promise.reject('meowlure')
    })

    sandbox.stub(Client.prototype, 'end')

    SftpToS3.batch(config)
      .catch((err) => {
        expect(err).to.equal('meowlure')
        done()
      })
    sinon.assert.calledOnce(Client.prototype.connect)
  })
})

describe('recursive', function() {
  afterEach(function() {
    sandbox.restore()
  })

  it('should call batch on each directory', function() {
    var batch = sandbox.stub(SftpToS3, 'batch').callsFake(function() {
      return Promise.resolve()
    })

    sandbox.stub(Client.prototype, 'connect').callsFake(function() {
      return Promise.resolve({})
    })

    sandbox.stub(tree, 'list').callsFake(function() {
      return Promise.resolve([
        'foo', 
        'foo/bar',
        'foo/baz'
      ])
    })

    var end = sandbox.stub(Client.prototype, 'end')

    return SftpToS3.recursive(config).then(result => {
      sinon.assert.calledThrice(batch)
      sinon.assert.calledWithMatch(batch, {fileDownloadDir: 'foo'})
      sinon.assert.calledWithMatch(batch, {fileDownloadDir: 'foo/bar'})
      sinon.assert.calledWithMatch(batch, {fileDownloadDir: 'foo/baz'})

      expect(Array.isArray(result)).to.be.true
      expect(result.length).to.eq(3)

      sinon.assert.calledOnce(end)
    })
  })
})
