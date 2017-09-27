function cleanupDone(config, sftp) {
  var root = config.fileDownloadDir + '/' + config.completedDir
  return sftp.list(root)
    .catch(err => {
      // This is to ignore the done directory being missing
      console.log('Skipping: ' + root + ' due to "' + err + '"')
      return []
    })
    .then(files => {
      return Promise.all(files.filter(file => {
        const age = Date.now() - file.modifyTime
        const keep = 1000 * config.fileRetentionDays * 60 * 60 * 24
        return file.type == '-' && (age > keep)
      }).map(file => {
        return sftp.delete(root + '/' + file.name)
      }))
    })
}

module.exports = {
  cleanup: cleanupDone
}
