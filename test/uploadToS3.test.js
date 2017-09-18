'use strict'

const AWS = require('aws-sdk')
const expect = require('chai').expect
const sinon = require('sinon')
const uploadToS3 = require('../lib/uploadToS3')
const S3 = {
  putObject: function() {
  }
}
const sandbox = sinon.createSandbox()
const s3Promise = {
  promise: function() {
    return Promise.resolve()
  }
}

describe('uploadToS3', function() {
  afterEach(() => {
    sandbox.restore()
  })

  sandbox.stub(AWS, 'S3').callsFake(function() {
    return S3
  })

  it('should call putObject', function() {
    sandbox.stub(S3, 'putObject').callsFake(function(params) {
      expect(params.Bucket).to.eq('my-bucket')
      expect(params.Key).to.eq('logs/path/foo')
      expect(params.Body).to.eq('')
      return s3Promise
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

  describe('without a root path', function() {
    it('should have the correct key', function() {
      sandbox.stub(AWS, 'S3').callsFake(() => {
        return S3
      })

      sandbox.stub(S3, 'putObject').callsFake(function(params) {
        expect(params.Bucket).to.eq('my-bucket')
        expect(params.Key).to.eq('path/foo')

        return s3Promise
      })

      var config = {
        aws: {
          bucket: 'my-bucket'
        },
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
})
