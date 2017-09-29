'use strict'

const cleanupDone = require('../lib/cleanupDone')
const chai = require('chai')
const expect = chai.expect
const fail = chai.fail
const tree = require('../lib/listTree')
const sinon = require('sinon')
const SftpToS3 = require('../index')
const Client = require('ssh2-sftp-client')
const uploadToS3 = require('../lib/uploadToS3')
const parameters = {
  aws: {
    bucket: 'my-bucket'
  },
  completedDir: 'done',
  fileDownloadDir: 'foo',
  ssh: {},
}

const config = new SftpToS3.Config(parameters)

const sandbox = sinon.createSandbox()

describe('Config', function() {
  context('when the aws parameter is missing', () => {
    it('throws an exception', () => {
      var c = {
        completedDir: 'done',
        fileDownloadDir: 'path',
        ssh: {}
      }

      expect(() => {new SftpToS3.Config(c)}).to.throw()
    })
  })

  context('when fileRetentionDays is not set', () => {
    it('defaults to 14', () => {
      var c = new SftpToS3.Config(config)
      expect(c.fileRetentionDays).to.eq(14)
    })
  })
})

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

    var s3 = sandbox.stub(uploadToS3, 'put').callsFake(function(config, file) {
      expect(config).to.have.property('fileDownloadDir')
      expect(config).to.have.property('aws')
      expect(file.key).to.equal('foo/meow')
      return Promise.resolve()
    })

    var cleanup = sandbox.stub(cleanupDone, 'cleanup').callsFake(() => {
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
        sinon.assert.calledOnce(cleanup)
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

  context('when the configuration is the wrong object', () => {
    it ('rejects', () => {
      return SftpToS3.batch({})
        .then(() => {
        fail('The promise was resolved')
      }, err => {
        expect(err.message).to.eq('Configuration is not an instance of Config')
      })
    })
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
