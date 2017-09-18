'use strict'

const AWS = require('aws-sdk')
const expect = require('chai').expect
const sinon = require('sinon')
const uploadToS3 = require('../lib/uploadToS3')
const S3 = {
  putObject: function() {
  }
}

describe('uploadToS3', function() {
  sinon.stub(AWS, 'S3').callsFake(function() {
    return S3
  })

  it('should call putObject', function() {
    sinon.stub(S3, 'putObject').callsFake(function(params) {
      expect(params.Bucket).to.eq('my-bucket')
      expect(params.Key).to.eq('logs/path/foo')
      expect(params.Body).to.eq('')
      return {
        promise: function() {
          return Promise.resolve()
        }
      }
    })

    var config = {
      aws: {
        bucket: 'my-bucket',
      },
      s3_root: 'logs',
      s3_strip: 'root',
      fileDownloadDir: 'root/path'
    }

    return uploadToS3.put(config,
      {
        key: 'root/path/foo',
        data: []
      }
    )
  })
})
