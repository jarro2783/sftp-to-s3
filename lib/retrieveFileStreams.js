function retrieveFileStreams (conn, config, fileStream) {
  // make sure we are returning files and not directories
  if (fileStream.type === '-') {
    name = config.fileDownloadDir + '/' + fileStream.name
    config.logger("Downloading '" + name + "'")
    return conn.get(name, false, null).catch(err => {
      throw 'Unable to download ' + name + ': ' + err
    })
  } else {
    return Promise.reject(fileStream.path + " is not a file")
  }
}

module.exports = retrieveFileStreams
