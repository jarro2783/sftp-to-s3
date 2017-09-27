'use strict'

const cleanupDone = require('../lib/cleanupDone')
const expect = require('chai').expect
const sinon = require('sinon')
const Client = require('ssh2-sftp-client')

const sandbox = sinon.createSandbox()

const config = {
  completedDir: 'done',
  fileDownloadDir: 'foo',
  fileRetentionDays: 1,
}

describe('cleanupDone', () => {
  afterEach(() => {
    sandbox.restore()
  })

  it('removes old files from done directory', () => {
    sandbox.stub(Client.prototype, 'list').callsFake(path => {
      var value = []
      if (path == 'foo/done') {
        value = [
          {
            type: '-',
            name: 'foo',
            modifyTime: Date.now() - 1000 * 60 * 60 * 24 * 2,
          },
          {
            type: '-',
            name: 'bar',
            modifyTime: Date.now(),
          },
        ]
      }

      return Promise.resolve(value)
    })

    var del = sandbox.stub(Client.prototype, 'delete')

    var sftp = new Client

    return cleanupDone.cleanup(config, sftp)
      .then(() => {
        sinon.assert.calledOnce(Client.prototype.list)
        sinon.assert.calledOnce(Client.prototype.delete)
        sinon.assert.calledWith(del, 'foo/done/foo')
      })
  })
})
