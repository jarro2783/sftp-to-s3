'use strict'

const expect = require('chai').expect
const sinon = require('sinon')
const stringify = require('../lib/stringify')

const sandbox = sinon.createSandbox()

describe ('stringify', () => {
  afterEach(() => {
    sandbox.restore()
  })
  
  var input = [[0x41, 0x42], [0x43, 0x44], [0x45, 0x46]].map(part => {
    return Buffer.from(part)
  })

  it('should join an array of arrays', () => {
    expect(stringify(input)).to.eq('ABCDEF')
  })
})
