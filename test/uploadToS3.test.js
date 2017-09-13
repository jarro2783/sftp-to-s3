'use strict'

const AWS = require('aws-sdk')
const expect = require('chai').expect
const sinon = require('sinon')
const uploadToS3 = require('../lib/uploadToS3')
const S3 = {}

describe('uploadToS3', function() {
  sinon.stub(AWS, 'S3').callsFake(function() {
    return S3
  })

  it('should call putObject', function(done) {
    sinon.stub(S3, 'putObject').callsFake(function(params) {
      expect(params.Bucket).to.eq('my-bucket')
      expect(params.Key).to.eq('/foo')
      expect(params.Data).to.eq([])
    })

    var config = {
      aws: {
        bucket: 'my-bucket',
      },
      fileDownloadDir: 'prefix'
    }

    uploadToS3.putBatch([
      {
        key: 'prefix/foo',
        data: []
      }
    ]).then((results) => {
      done()
    })
  })
})
