var 
	gulp = require('gulp'),
	concat = require('gulp-concat'),
	jshint = require('gulp-jshint'),
	rename = require('gulp-rename'),
	uglify = require('gulp-uglify-es').default;

gulp.task('default', ['build']);
gulp.task('build', ['js']);

gulp.task('js', function () {
	gulp.src(['src/**/*.js', '!**/*.min.js'])
	.pipe(jshint())
	.pipe(jshint.reporter('default'))
	.pipe(concat('ng-easy.js'))
	.pipe(gulp.dest('dist'))
	.pipe(rename('ng-easy.min.js'))
	.pipe(uglify())
	.pipe(gulp.dest('dist'));
});
