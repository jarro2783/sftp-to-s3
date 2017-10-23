const AWS = require('aws-sdk')
const winston = require('winston')

function putBatch(config, files) {
  return Promise.all(files.map((file) => {
    return put(config, file)
  }))
}

function put (config, file) {
  var s3 = new AWS.S3(config.aws)
  if (typeof file.key && file.data !== undefined) {
    var root = config.s3_root || ''
    var destination = (root + file.key.replace(config.s3_strip, ''))
      .replace(/^\/+/, '').replace(/\/+/, '/')
    winston.log('info', "Uploading '" + file.key + "' to '" + destination + "'")
    var params = {
      Bucket: config.aws.bucket,
      Key: destination,
      Body: file.data
    }
    return s3.putObject(params).promise()
  }
}

module.exports = {
  putBatch: putBatch,
  put: put
}
