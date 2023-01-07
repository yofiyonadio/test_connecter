const gulp = require('gulp')
const install = require('gulp-install')
const rename = require('gulp-rename')
const merge = require('merge-stream')

const BUILD_DEST = './build'

gulp.task('production', function () {
    const streams = []
    streams.push(gulp.src(['./package.json'])
        .pipe(gulp.dest(BUILD_DEST))
        .pipe(install({
            args: ['--only=prod']
        })))
    streams.push(gulp.src(['./env/production.env'])
        .pipe(rename('.env'))
        .pipe(gulp.dest(BUILD_DEST + '/src')))
    return merge(streams)
})

gulp.task('development', function () {
    const streams = []
    streams.push(gulp.src(['./package.json'])
        .pipe(gulp.dest(BUILD_DEST))
        .pipe(install({
            args: ['--only=prod']
        })))
    streams.push(gulp.src(['./env/development.env'])
        .pipe(rename('.env'))
        .pipe(gulp.dest(BUILD_DEST + '/src')))
    return merge(streams)
})