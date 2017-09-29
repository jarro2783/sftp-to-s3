function cleanupDone(config, sftp) {
  var root = config.fileDownloadDir + '/' + config.completedDir
  return sftp.list(root)
    .catch(err => {
      // This is to ignore the done directory being missing
      config.logger('Skipping: ' + root + ' due to "' + err + '"')
      return []
    })
    .then(files => {
      return Promise.all(files.filter(file => {
        const age = Date.now() - file.modifyTime
        const keep = 1000 * config.fileRetentionDays * 60 * 60 * 24
        return file.type == '-' && (age > keep)
      }).map(file => {
        var name = root + '/' + file.name
        config.logger('Deleting old file: ' + name)
        return sftp.delete(name)
      }))
    })
}

module.exports = {
  cleanup: cleanupDone
}
