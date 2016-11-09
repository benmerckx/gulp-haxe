const gutil = require('gulp-util')
const fs = require('fs')

module.exports = (target, data) => {
	gutil.log(' ')
	gutil.log(gutil.colors.red('['+target+'] Failed to compile'))
	gutil.log(' ')
	data.toString().split('\n').forEach(data => {
		const pattern = /([^:]+):(\d+): characters (\d+)-(\d+) : (.*)/g
		const check = pattern.exec(data)
		if (check) {
			const file = check[1],
				line = check[2],
				start = check[3],
				end = check[4],
				err = check[5]

			gutil.log('['+file+':'+line+'] '+err)
		} else {
			gutil.log(gutil.colors.green(data))
		}
	})
}