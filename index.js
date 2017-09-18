'use strict'

const Client = require('ssh2-sftp-client')
const tree = require('./lib/listTree')
const sequential = require('promise-sequential')
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

function rename(sftp, config, file) {
  var source = config.fileDownloadDir + '/' + file.name
  var dest = config.fileDownloadDir + '/' + config.completedDir + '/' + file.name
  console.log('Renaming ' + source + ' to ' + dest)
  return sftp.rename(source, dest).catch(err => {
    throw 'Error renaming ' + source + ' to ' + dest + ': ' + err
  })
}

function process_file(sftp, config, file) {
  return retrieveFileStreams(sftp, config, [file])
    .then(function(streams) {
      return streamToString(streams)
    })
    .then(function(array) {
      return uploadToS3.putBatch(config, array);
    })
    .then(function() {
      return rename(sftp, config, file)
    })
}

exports.batch = function (config, client) {
  const sftp = client || new Client()
  const manage = typeof client === 'undefined'

  console.log('Executing in ' + config.fileDownloadDir)

  return checked_connect(sftp, typeof client === 'undefined', config.sftp)
    .then(() => {
      var create = config.fileDownloadDir + '/' + config.completedDir
      return sftp.mkdir(create, true)
    })
    .then(() => {
      return sftp.list(config.fileDownloadDir)
    })
    .then((fileList) => {
      console.log('Downloading:')
      fileList.forEach(file => {
        console.log(file.name)
      })
      return sequential(fileList.filter(
        file => {
          return file.type == '-'
        }
      ).map(file => {
        return function(previous, responses, current) {
          console.log('Download ' + file.name)
          return process_file(sftp, config, file)
        }
      }))
    }).then(() => {
      console.log('upload finished')
      if (manage) {
        sftp.end()
      }
      return 'ftp files uploaded'
    })
    .catch(function(err) {
      console.error('Error', err)
      if (manage) {
        sftp.end()
      }
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
      console.log('Descending into ' + directories)
      return sequential(directories.map(directory => {
        console.log('Looking at ' + directory)
        var new_config = {}
        Object.assign(new_config, config)
        new_config.fileDownloadDir = directory
        return (previous, responses, current) => {
          return exports.batch(new_config, sftp)
        }
      }))
    }).then(result => {
      sftp.end()
      return result
    }).catch(err => {
      sftp.end()
      throw err
    })
}
