'use strict'

const Client = require('ssh2-sftp-client')
const cleanupDone = require('./lib/cleanupDone')
const processFile = require('./lib/processFile')
const tree = require('./lib/listTree')
const sequential = require('promise-sequential')
const winston = require('winston')

if ('LOG_LEVEL' in process.env) {
  winston.level = process.env.LOG_LEVEL
} else {
  winston.level = 'info'
}

function real_directory(config) {
  return file => {
    return file.type == 'd' && file.name != config.completedDir
  }
}

function sftp_connect(client, config) {
  return client.connect(config)
}

exports.batch = function (config) {
  const sftp = new Client()
  const manage = typeof client === 'undefined'

  winston.log('info', 'Executing in ' + config.fileDownloadDir)

  var errors = []

  return sftp_connect(sftp, config.sftp)
    .then(() => {
      var create = config.fileDownloadDir + '/' + config.completedDir
      winston.log('info', 'Creating ' + create)
      return sftp.mkdir(create, false)
        .catch((error) => {
          errors.push(error)
        })
    })
    .then(() => {
      return sftp.list(config.fileDownloadDir)
    })
    .then((fileList) => {
      winston.log('info', 'Downloading:')
      fileList.forEach(file => {
        winston.log('info', file.name)
      })
      return sequential(fileList.filter(
        file => {
          return file.type == '-'
        }
      ).map(file => {
        return function(previous, responses, current) {
          winston.log('info', 'Download ' + file.name)
          return processFile.processFile(sftp, config, file, errors)
        }
      }))
    })
    .then(() => {
      return cleanupDone.cleanup(config, sftp)
    })
    .then(() => {
      winston.log('info', 'upload finished')
      sftp.end()

      if (errors.length > 0) {
        throw Error(errors)
      } else {
        return 'ftp files uploaded'
      }
    })
    .catch(function(err) {
      winston.log('error', 'Error', err)
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
      winston.log('info', 'Descending into ' + directories)
      return sequential(directories.map(directory => {
        winston.log('info', 'Looking at ' + directory)
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
