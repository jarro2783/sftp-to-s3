function cleanupDone(config, sftp) {
  var root = config.fileDownloadDir + '/' + config.completedDir
  return sftp.list(root)
    .then(files => {
      return Promise.all(files.filter(file => {
        var age = Date.now() - file.modifyTime
        console.log(age)
        var keep = 1000 * config.fileRetentionDays * 60 * 60 * 24
        console.log(keep)
        return file.type == '-' && (age > keep)
      }).map(file => {
        return sftp.delete(root + '/' + file.name)
      }))
    })
}

module.exports = {
  cleanup: cleanupDone
}
