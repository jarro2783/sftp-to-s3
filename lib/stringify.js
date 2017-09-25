module.exports = function(parts) {
  return parts.reduce((a, b) => {
    return a.concat(b.toString('binary'))
  }, '')
}
