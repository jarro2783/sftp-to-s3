const Client = require('ssh2-sftp-client')
const retrieveFileStreams = require('./retrieveFileStreams')
const streamToString = require('./streamToString')
const uploadToS3 = require('./uploadToS3')
const winston = require('winston')

function rename(sftp, config, file) {
  const source = config.fileDownloadDir + '/' + file.name
  const dest = config.fileDownloadDir + '/' + config.completedDir + '/' + file.name
  winston.log('info', 'Renaming ' + source + ' to ' + dest)
  return sftp.rename(source, dest).catch(err => {
    throw 'Error renaming ' + source + ' to ' + dest + ': ' + err
  })
}

module.exports = {
  processFile: function(config, file, errors) {
    const sftp = new Client()
    return sftp.connect(config.sftp)
      .then(function() {
        return retrieveFileStreams(sftp, config, file)
      })
      .then(function(stream) {
        return streamToString(stream)
      })
      .then(function(data) {
        return uploadToS3.put(config, data);
      })
      .then(function() {
        return rename(sftp, config, file)
      })
      .catch(function(error) {
        errors.push(error)
      })
  }
}
