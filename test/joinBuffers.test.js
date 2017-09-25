'use strict'

const expect = require('chai').expect
const sinon = require('sinon')
const joinBuffers = require('../lib/joinBuffers')

const sandbox = sinon.createSandbox()

describe ('joinBuffers', () => {
  afterEach(() => {
    sandbox.restore()
  })
  
  var input = [[0x41, 0x42], [0x43, 0x44], [0x45, 0x46, 0x8b]].map(part => {
    return Buffer.from(part)
  })

  it('should join an array of arrays', () => {
    expect(joinBuffers(input).equals(Buffer.from("ABCDEF\x8b", 'binary'))).true
  })
})
