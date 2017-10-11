const retrieveFileStreams = require('./retrieveFileStreams')
const streamToString = require('./streamToString')
const uploadToS3 = require('./uploadToS3')

function rename(sftp, config, file) {
  var source = config.fileDownloadDir + '/' + file.name
  var dest = config.fileDownloadDir + '/' + config.completedDir + '/' + file.name
  console.log('Renaming ' + source + ' to ' + dest)
  return sftp.rename(source, dest).catch(err => {
    throw 'Error renaming ' + source + ' to ' + dest + ': ' + err
  })
}

module.exports = {
  processFile: function(sftp, config, file, errors) {
  return retrieveFileStreams(sftp, config, file)
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
