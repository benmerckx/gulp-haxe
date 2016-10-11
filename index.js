const haxeBinary = require('haxe').haxe
const gutil = require('gulp-util')
const fs = require('fs')
const path = require('path')
const eachAsync = require('each-async')
const Readable = require('stream').Readable
const osTmpdir = require('os-tmpdir')

const TARGETS = ['js', 'as3', 'swf', 'neko', 'php', 'cpp', 'cs', 'java', 'python', 'lua', 'hl']

function hxmlCommand(line) {
	return line.substr(1).split(' ')[0]
}

function getTargets(hxml) {
	return hxml
		.filter(_ => TARGETS.indexOf(hxmlCommand(_)) > -1)
		.map(line => {
			var parts = line.split(' ')
			parts.shift()
			return parts.join(' ')
		})
}

function haxeError(data) {
	gutil.log(' ')
	gutil.log(gutil.colors.red('Haxe compiler error'))
	gutil.log(' ')
	data.toString().split('\n').forEach(function (line) {
		if (!line) return
		const parts = line.split(':'),
			file = parts.shift(),
			nr = parts.shift(),
			chars = parts.shift()

		gutil.log(
			gutil.colors.green('['+file+':'+nr+']') +
			parts.join(':')
		)
	})
	gutil.log(' ')
}

function compile(source, options) {
	const temp = path.join(osTmpdir(), 'gulp-haxe')
	//const dir = path.join()
	const stream = new Readable({objectMode: true});
	stream._read = function () {}

	fs.readFile(source, function(err, data) {
		if (err) return stream.push(null)
		const hxml = 
			data.toString().split('\n')
			.map(Function.prototype.call, String.prototype.trim)

		const targets = getTargets(hxml)
		const haxe = haxeBinary(source)

		haxe.stdout.on('data', data => 
			data.toString().split('\n').forEach(line => gutil.log(line))
		)
		haxe.stderr.on('data', haxeError)

		haxe.on('close', function (code) {
			if (code != 0) return stream.push(null)
			eachAsync(targets, function (path, _, done) {
				console.log(path)
				fs.readFile(path, function (err, data) {
					if (err) return done(err)

					const vinylFile = new gutil.File({
						cwd: process.cwd(),
						base: './',
						path: path
					})
					vinylFile.contents = data
					stream.push(vinylFile)
					done()
				})
			}, function(err) {
				stream.push(null)
			})
		})
	})

	return stream
}

module.exports = compile