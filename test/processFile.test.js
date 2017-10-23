const Client = require('ssh2-sftp-client')
const expect = require('chai').expect
const process = require('../lib/processFile')
const sinon = require('sinon')
const uploadToS3 = require('../lib/uploadToS3')

const sandbox = sinon.createSandbox()

const config = {
  completedDir: 'done',
  fileDownloadDir: 'foo'
}

const sftp = {
  get: () => {},
  rename: () => {},
}

describe('processFile', function() {
  afterEach(function() {
    sandbox.restore()
  })

  it('should upload a file', function() {
    const fileName = config.fileDownloadDir + '/' + 'bar'

    sandbox.stub(Client.prototype, 'connect').callsFake(() => {
      return Promise.resolve()
    })

    const rename = sandbox.stub(Client.prototype, 'rename')
      .callsFake(function(from, to) {
        return Promise.resolve()
      })

    const get = sandbox.stub(Client.prototype, 'get')
      .callsFake(function() {
        return Promise.resolve({path: 'foo/bar'})
      })

    const put = sandbox.stub(uploadToS3, 'put').callsFake(function(config, file) {
      return Promise.resolve()
    })

    var errors = []

    return process.processFile(config, {name: 'bar', type: '-'}, errors)
      .then(() => {
        expect(errors).to.be.an('array').that.is.empty

        sinon.assert.calledOnce(rename)
        sinon.assert.calledWith(rename, fileName, 'foo/done/bar')

        sinon.assert.calledOnce(get)
        sinon.assert.calledWith(get, fileName)

        sinon.assert.calledOnce(put)
        sinon.assert.calledWith(put,
          sinon.match.object,
          sinon.match({key: fileName}))
      })
  })
})
