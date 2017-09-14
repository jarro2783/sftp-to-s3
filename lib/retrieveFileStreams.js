function retrieveFileStreams (conn, config, fileStreamArray, client_type) {
  return Promise.all(
    fileStreamArray.map((file) => {
      // make sure we are using sftp library
      if (client_type === "sftp") {
        // make sure we are returning files and not directories
        if (file.type === "-") {
          file = config.fileDownloadDir + '/' + file.name
          console.log("Downloading '" + file + "'")
          return conn.get(file).catch(err => {
            throw 'Unable to download ' + file + ': ' + err
          })
        }
      }
    }).filter((element) => { return typeof element !== 'undefined' })
  );
}

module.exports = retrieveFileStreams;
