const spawn = require('child_process').spawn

module.exports = function (file) {
	return function (args) {
		return spawn(process.execPath, ['./node_modules/'+file].concat(args))
	}
}