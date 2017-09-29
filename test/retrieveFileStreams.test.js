'use strict'

const expect = require('chai').expect
const sinon = require('sinon')
const stream = require('../lib/retrieveFileStreams')

const sandbox = sinon.createSandbox()

function make_file(name) {
  return {
    name: name,
    type: '-'
  }
}

describe('retrieveFileStreams', function() {
  var sftp = {
    get: function() {
    }
  }

  afterEach(() => {
    sandbox.restore()
  })

  it('should call get', function() {
    var get = sandbox.stub(sftp, 'get').callsFake(function(file) {
      return Promise.resolve()
    })

    var config = ({
      fileDownloadDir: 'prefix',
      logger: () => {},
    })

    var log = sandbox.stub(config, 'logger')

    return stream(sftp, config, make_file('foo'))
      .then(() => {
        sinon.assert.calledOnce(get)
        sinon.assert.calledWith(get, 'prefix/foo', false, null)
        sinon.assert.calledOnce(log)
        sinon.assert.calledWith(log, "Downloading 'prefix/foo'")
      })
  })
})
