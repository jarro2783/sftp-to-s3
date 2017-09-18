function retrieveFileStreams (conn, config, fileStreamArray) {
  return Promise.all(
    fileStreamArray.map((file) => {
      // make sure we are returning files and not directories
      if (file.type === '-') {
        name = config.fileDownloadDir + '/' + file.name
        console.log("Downloading '" + name + "'")
        return conn.get(name).catch(err => {
          throw 'Unable to download ' + name + ': ' + err
        })
      }
    }).filter((element) => { return typeof element !== 'undefined' })
  )
}

module.exports = retrieveFileStreams
