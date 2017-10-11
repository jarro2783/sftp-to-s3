'use strict'

const Client = require('ssh2-sftp-client')
const cleanupDone = require('./lib/cleanupDone')
const process = require('./lib/processFile')
const tree = require('./lib/listTree')
const sequential = require('promise-sequential')

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
  const manage = typeof client === 'undefined'

  console.log('Executing in ' + config.fileDownloadDir)

  var errors = []

  return checked_connect(sftp, typeof client === 'undefined', config.sftp)
    .then(() => {
      var create = config.fileDownloadDir + '/' + config.completedDir
      console.log('Creating ' + create)
      return sftp.mkdir(create, false)
        .catch((error) => {
          errors.push(error)
        })
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
          return process.processFile(sftp, config, file, errors)
        }
      }))
    })
    .then(() => {
      return cleanupDone.cleanup(config, sftp)
    })
    .then(() => {
      console.log('upload finished')
      if (manage) {
        sftp.end()
      }

      if (errors.length > 0) {
        throw Error(errors)
      } else {
        return 'ftp files uploaded'
      }
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
