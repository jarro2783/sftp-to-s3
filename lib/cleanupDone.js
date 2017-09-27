const sequential = require('promise-sequential')

function cleanupDone(config, sftp) {
  var root = config.fileDownloadDir + '/' + config.completedDir
  return sftp.list(root)
    .then(files => {
      return sequential(files.filter(file => {
        const age = Date.now() - file.modifyTime
        const keep = 1000 * config.fileRetentionDays * 60 * 60 * 24
        return file.type == '-' && (age > keep)
      }).map(file => {
        return (previous, responses, current) => {
          var path = root + '/' + file.name
          console.log('Deleting ' + path)
          return sftp.delete(path)
        }
      }))
    })
}

module.exports = {
  cleanup: cleanupDone
}
