# gulp-haxe [![NPM Version](https://img.shields.io/npm/v/gulp-haxe.svg)](https://www.npmjs.com/package/gulp-haxe)

### Set a specific haxe version

Gulp-haxe defaults to the latest haxe version. It includes [switchx](https://github.com/lix-pm/switchx) to set your prefered haxe version which can be defined in `package.json` as haxe.version:

```javascript
{
  "haxe": {
    "version": "3.4.0"
  }
}
```

### Basic usage

```javascript
const gulp = require('gulp')
const haxe = require('gulp-haxe')

gulp.task('compile', function() {
  return haxe('build.hxml')
    .pipe(gulp.dest('bin'))
})
```

### Compile multiple targets

```javascript
gulp.task('compile', function() {
  return haxe([{
    main: 'Client',
    js: 'assets/main.js'
  }, {
    main: 'Server',
    php: 'server'
  }])
    .pipe(gulp.dest('public'))
})
```

### Using the completion server and watching for changes

```javascript
gulp.task('compile', function() {
  return haxe(
    {cp: 'src', main: 'Client', js: 'client.js'},
    {completion: 6000} // Starts the server and connects for you on port 6000
  )
    .pipe(gulp.dest('public'))
})

gulp.task('watch', function() {
  gulp.watch(['src/**/*.hx'], ['compile'])
})

gulp.task('default', ['compile', 'watch'])
```

### Uglify and include sourcemaps

```javascript
gulp.task('compile', function() {
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

### Adding an exit on error flag will result on stream termination and return an error

```javascript
gulp.task('compile', function() {
  return haxe('build.hxml', {exitOnError:true})
    .pipe(gulp.dest('test'))
})
```