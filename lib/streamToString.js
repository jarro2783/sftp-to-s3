var streamToArray = require('stream-to-array')

module.exports = function (fileStream) {
  return fileToArray(fileStream)
}

function fileToArray(fileStream) {
  return streamToArray(fileStream)
    .then((fileArray) => {
      return {data: fileArray, key: fileStream.path}
    }).catch(err => {
      throw Error("Error converting '" + fileStream.path + "' to an array: " + err)
    })
}
