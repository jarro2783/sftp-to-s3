var streamToArray = require('stream-to-array')
var stringify = require('./stringify')

module.exports = function (fileStream) {
  return fileToArray(fileStream)
}

function fileToArray(fileStream) {
  return streamToArray(fileStream)
    .then((fileArray) => {
      return {data: stringify(fileArray), key: fileStream.path}
    }).catch(err => {
      throw Error("Error converting '" + fileStream.path + "' to an array: " + err)
    })
}
