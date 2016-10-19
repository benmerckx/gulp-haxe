'use strict'
const haxeBinary = require('haxe').haxe
const gutil = require('gulp-util')
const fs = require('fs')
const path = require('path')
const eachAsync = require('each-async')
const Readable = require('stream').Readable
const osTmpdir = require('os-tmpdir')
const md5Hex = require('md5-hex')
const glob = require('glob')

const TARGETS = ['js', 'as3', 'swf', 'neko', 'php', 'cpp', 'cs', 'java', 'python', 'lua', 'hl']


function haxeError(target, data) {
	gutil.log(' ')
	gutil.log(gutil.colors.red('['+target+'] Failed to compile'))
	gutil.log(' ')
	data.toString().split('\n').forEach(function (line) {
		/*if (!line) return
		const parts = line.split(':'),
			file = parts.shift(),
			nr = parts.shift(),
			chars = parts.shift()

		gutil.log(
			gutil.colors.green('['+file+':'+nr+']') +
			parts.join(':')
		)*/
		gutil.log(gutil.colors.green(line))
	})
}

function combine(a, b) {
	Object.keys(b).forEach(key => {
		if (key in a)
			a[key] = [].concat(a[key], b[key])
		else
			a[key] = b[key]
	})
	return a
}

function readHxml(source, cb) {
	if (typeof source != 'string') {
		if (Array.isArray(source)) return cb(source)
		return cb([source])
	}
	fs.readFile(source, function(err, data) {
		const response = []

		let current = {}
		let each = {}

		data.toString()
		.split('\n')
		.map(Function.prototype.call, String.prototype.trim)
		.filter(_ => _.substr(0, 1) != '#')
		.forEach(function (command) {
			const parts = command.split(' ')
			const cmd = parts.shift()
			if (cmd.substr(0, 1) != '-')
				return;
				// throw 'To be implemented'
			const key = cmd.substr(1)
			const value = parts.join(' ')

			switch (key) {
				case '-each':
					each = current
					current = {}
					break
				case '-next':
					response.push(combine(current, each))
					current = {}
					break
				default:
					const obj = {}
					obj[key] = value
					combine(current, obj)
			}
		})

		response.push(combine(current, each))
		cb(response)
	})
}

function toArgs(hxml) {
	const reponse = []
	Object.keys(hxml)
	.map(key => {
		const value = hxml[key]
		const cmd = '-'+key
		if (Array.isArray(value)) {
			value.forEach(_ => {
				reponse.push(cmd)
				reponse.push(_)
			})
		} else {
			reponse.push(cmd)
			reponse.push(value)
		}
	})
	return reponse
}

function addFile(file, location, done) {
	fs.readFile(file, function (err, data) {
		if (err) return done(err)
		const filePath = path.join(location.original, path.relative(location.output, file))
		const vinylFile = new gutil.File({
			cwd: process.cwd(),
			base: '.',
			path: filePath
		})
		vinylFile.contents = data
		done(null, vinylFile)
	})
}

function addFiles(stream, files, location, done) {
	eachAsync(files, function (path, _, next) {
		fs.stat(path, (err, stats) => {
			if (err) return next(err)
			if (stats.isDirectory()) return next()
			addFile(path, location, (err, file) => {
				if (err) return next(err)
				stream.push(file)
				next()
			})
		})
	}, done)
}

function compile(stream, hxml, next) {
	const target = Object.keys(hxml).filter(_ => TARGETS.indexOf(_) > -1)[0]
	if (!target)
		throw 'No target set'
	const temp = path.join(osTmpdir(), 'gulp-haxe')
	const location = {
		original: hxml[target],
		output: path.join(temp, md5Hex(toArgs(hxml)))
	}
	hxml[target] = location.output
	const args = toArgs(hxml)
	const haxe = haxeBinary.apply(null, args)

	haxe.stdout.on('data', data => 
		data.toString().split('\n').forEach(line => gutil.log(line))
	)
	haxe.stderr.on('data', haxeError.bind(null, target))

	haxe.on('close', function (code) {
		if (code != 0) return next()

		fs.stat(location.output, (err, stats) => {
			if (err) return next(err)
			const files = []
			if (stats.isDirectory())
				glob(path.join(location.output, '**', '*'), (err, files) => {
					if (err) return next(err)
					addFiles(stream, files, location, next)
				})
			else 
				addFiles(stream, [location.output], location, next)
		})
	})
}

module.exports = (source, options) => {
	const stream = new Readable({objectMode: true})
	stream._read = function () {}

	readHxml(source, all => {
		eachAsync(
			all,
			(hxml, _, next) => compile(stream, hxml, next), 
			err => {
				if (err) console.log(err)
				stream.push(null)
			}
		)
	})

	return stream
}