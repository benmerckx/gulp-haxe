# gulp-haxe [![NPM Version](https://img.shields.io/npm/v/gulp-haxe.svg)](https://www.npmjs.com/package/gulp-haxe)

```javascript
// Basic usage

const gulp = require('gulp')
const haxe = require('gulp-haxe')

gulp.task('compile', function () {
  return haxe('build.hxml')
    .pipe(gulp.dest('bin'))
})
```

```javascript
// Example: uglify and include sourcemaps

gulp.task('compile', function () {
  return haxe({
  	main: 'Main', 
  	lib: ['tink_core', 'tink_macro'], 
  	js: 'build.js',
    debug: true // Required for sourcemaps
  })
    .pipe(sourcemaps.init())
    .pipe(uglify())
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('bin'))
})
```

```javascript
// Compile multiple targets

gulp.task('compile', function () {
  return haxe({
  	main: 'Client',
  	js: 'assets/main.js'
  }, {
  	main: 'Server',
  	php: 'server'
  })
    .pipe(gulp.dest('public'))
})
```
