'use strict'

function recurse(sftp, root, filter) {
  return files => {
    var fileList = []
    var promises = []

    fileList.push(root)

    files.forEach(file => {
      if (filter(file)) {
        if (file.type == 'd') {
          promises.push(listTree(sftp, root + '/' + file.name, filter))
        } else if (file.type == '-') {
          fileList.push(root + '/' + file.name)
        }
      }
    })

    return Promise.all(promises).then(lists => {
      lists.forEach(list => {
        fileList.push(...list)
      })
      return fileList
    })
  }
}

function listTree(sftp, directory, filter) {
  return sftp.list(directory).then(recurse(sftp, directory, filter))
    .catch(reason => {
      throw reason
    })
}

module.exports = {
  list: listTree
}
