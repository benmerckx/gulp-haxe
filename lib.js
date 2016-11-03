'use strict'
const haxelib = require('haxe').haxelib
const cache = {}
const NON_EXISTENT = 'No such Project'

module.exports = name => {
	if (name in cache) 
		return cache[name]
	const parts = name.split(':')
	const info = {name: parts[0], pinned: parts[1]}
	let versioning, installing
	return cache[name] = {
		version: () => versioning ? versioning : versioning = 
			new Promise((success, _) => {
				let version = null
				const check = haxelib('list', info.name)
				check.stdout.on('data', data => {
					if (info.pinned) {
						if (data.toString().indexOf(info.pinned) > -1)
							version = info.pinned
					} else {
						const res = data.toString().match(/\[(.+)\]/)
						version = res[1]
					}
				})
				check.on('close', () => success(version))
			}),
		install: () => installing ? installing : installing =
			new Promise((success, failure) => {

				const install = haxelib.apply(null, 
					['install', '--always'].concat(name.split(':'))
				)
				let err = null
				install.stdout.on('data', data => 
					data.toString().split('\n').forEach(line => {
						line = line.trim()
						if (line.substr(0, NON_EXISTENT.length) == NON_EXISTENT)
							err = 'Haxelib does not exist: '+name
					})
				)
				install.stderr.on('data', _ => err = _.toString())
				install.on('close', code => {
					if (code > 0) 
						return failure(err)
					versioning = null
					success()
				})
			})
	}
}