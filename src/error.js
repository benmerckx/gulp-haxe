'use strict'
const gutil = require('gulp-util')
const fs = require('fs')
const logger = console

function logLine(file, index, start, end) {
	let line = file[index-1]
	if (!line) return
	if (start) {
		const begin = line.substr(0, start)
		const err = line.substr(start, end-start)
		const stop = line.substr(end)
		line = gutil.colors.red('> '+index+' ')+gutil.colors.dim(begin.split("\t").join(' ')) + gutil.colors.red(err) + gutil.colors.dim(stop)
	} else {
		line = gutil.colors.dim('> '+index+' ')+gutil.colors.dim(line.split("\t").join(' '))
	}
	logger.log(line)
}

module.exports = (target, data) => {
	const files = {}
	logger.log(' ')
	logger.log(gutil.colors.red('> Failed to compile target: ')+target)

	let lastError

	data.toString().split('\n').forEach(data => {
		const singlePattern = /([^:]+):(\d+): characters (\d+)-(\d+) : (.*)/g
		const linesPattern = /([^:]+):(\d+): lines (\d+)-(\d+) : (.*)/g
		let file, position, err

		let check
		if (check = singlePattern.exec(data)) {
			file = check[1]
			position = {
				line: parseInt(check[2], 10),
				start: parseInt(check[3], 10),
				end: parseInt(check[4], 10)
			}
			err = check[5]
		} else if (check = linesPattern.exec(data)) {
			file = check[1]
			position = {
				from: parseInt(check[3], 10),
				to: parseInt(check[4], 10)
			}
			err = check[5]
		}

		if (file && fs.existsSync(file)) {
			const pos = JSON.stringify(position)
			if (lastError != pos) {
				lastError = pos
				if (!(file in files))
					files[file] = fs.readFileSync(file, 'utf-8').split("\n")
				
				logger.log(' ')
				logger.log(gutil.colors.dim('> ')+file.split('/').pop()+gutil.colors.dim(':')+
					(position.line ? position.line : position.from)
				)
				if (position.line) {
					logLine(files[file], position.line-1)
					logLine(files[file], position.line, position.start, position.end)
					logLine(files[file], position.line+1)
				} else {
					for (let i = position.from; i < position.to; i++)
						logLine(files[file], i)
				}
			}			
			logger.log(gutil.colors.green('> '+err))
		} else {
			logger.log(gutil.colors.green(data))
		}
	})
}