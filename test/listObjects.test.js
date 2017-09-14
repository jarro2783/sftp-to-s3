'use strict'

const expect = require('chai').expect
const sinon = require('sinon')
const tree = require('../lib/listTree')
const Client = require('ssh2-sftp-client')

const sandbox = sinon.createSandbox()

function directory_listing(dir) {
  if (dir == 'foo') {
    return [
      { name: 'baz', type: 'd' },
      { name: 'bar', type: 'd' },
      { name: 'a', type: '-' },
      { name: 'b', type: '-' }
    ]
  } else if (dir == 'foo/baz') {
    return [
      { name: 'c', type: '-' },
      { name: 'd', type: '-' }
    ]
  } else if (dir == 'foo/bar') {
    return [
      { name: 'e', type: '-' },
      { name: 'f', type: '-' }
    ]
  } else {
    return Promise.reject('List called on unexpected directory')
  }
}

describe('tree.list', function() {
  afterEach(() => {
    sandbox.restore()
  })

  it('lists the contents of subdirectories', function() {
    sandbox.stub(Client.prototype, 'list').callsFake(dir => {
      return Promise.resolve(directory_listing(dir))
    })

    var sftp = new Client()

    return tree.list(sftp, 'foo', () => { return true })
      .then(files => {
        expect(Array.isArray(files)).to.be.true
        expect(files).to.contain('foo')
        expect(files).to.contain('foo/a')
        expect(files).to.contain('foo/b')
        expect(files).to.contain('foo/bar')
        expect(files).to.contain('foo/bar/e')
        expect(files).to.contain('foo/bar/f')
        expect(files).to.contain('foo/baz/c')
        expect(files).to.contain('foo/baz/d')
      })
  })
})
