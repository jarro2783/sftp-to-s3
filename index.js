const Client = require('ssh2-sftp-client')
const listTree = require('./lib/listTree')
const streamToString = require('./lib/streamToString')
const retrieveFileStreams = require('./lib/retrieveFileStreams')
const uploadToS3 = require('./lib/uploadToS3')

exports.batch = function (config, client) {
  const sftp = client || new Client()

  return sftp.connect(config.sftp)
    .then(() => {
      return sftp.list(config.fileDownloadDir)
    })
    .then((fileList) => {
      return retrieveFileStreams(sftp, config, fileList, "sftp")
    })
    .then((fileStreams) => {
      return streamToString(fileStreams)
    })
    .then((dataArray) => {
      return uploadToS3.putBatch(config, dataArray)
    })
    .then((files) => {
      sftp.mkdir(config.completedDir, true)
      return sftp.list(config.fileDownloadDir)
    })
    .then((files) => {
      files.map((file) => {
        sftp.rename(config.fileDownloadDir + '/' + file.name,
          config.completedDir + '/' + file.name)
      })
      console.log("upload finished")
      sftp.end()
      return "ftp files uploaded"
    })
    .catch( function(err) {
      console.error("Error", err)
      sftp.end()
      throw err
    })
}

exports.recursive = function(config) {
  const sftp = new Client()

  listTree(sftp, config.fileDownloadDir, real_directories).
    then(function(directories) {
    })
}
