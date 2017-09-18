'use strict'

const expect = require('chai').expect
const sinon = require('sinon')
const streams = require('../lib/retrieveFileStreams')

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

    var config = {
      fileDownloadDir: 'prefix'
    }

    return streams(sftp, config, [make_file('foo'), make_file('bar')])
      .then(() => {
        sinon.assert.calledTwice(get)
        sinon.assert.calledWith(get, 'prefix/foo')
        sinon.assert.calledWith(get, 'prefix/bar')
      })
  })
})
