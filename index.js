'use strict'

const Client = require('ssh2-sftp-client')
const tree = require('./lib/listTree')
const streamToString = require('./lib/streamToString')
const retrieveFileStreams = require('./lib/retrieveFileStreams')
const uploadToS3 = require('./lib/uploadToS3')

function real_directory(config) {
  return file => {
    return file.type == 'd' && file.name != config.completedDir
  }
}

function checked_connect(client, connect, config) {
  if (connect) {
    return client.connect(config)
  } else {
    return Promise.resolve()
  }
}

exports.batch = function (config, client) {
  const sftp = client || new Client()

  return checked_connect(sftp, typeof client === 'undefined', config.sftp)
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

  return sftp.connect(config.sftp)
    .then(() => {
      return tree.list(sftp, config.fileDownloadDir, real_directory(config))
    })
    .then(function(directories) {
      return Promise.all(directories.map(directory => {
        var new_config = {}
        Object.assign(new_config, config)
        new_config.fileDownloadDir = directory.name
        return exports.batch(new_config, sftp)
      }))
    })
}
