var 
	gulp = require('gulp'),
	bump = require('gulp-bump'),
	concat = require('gulp-concat'),
	jshint = require('gulp-jshint'),
	rename = require('gulp-rename'),
	tagVersion = require('gulp-tag-version'),
	uglify = require('gulp-uglify-es').default,
	yargs = require('yargs');

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

gulp.task('bump', function () {
	/// <summary>
	/// It bumps revisions
	/// Usage:
	/// 1. gulp bump : bumps the package.json and bower.json to the next prerelease revision.
	///   i.e. from 0.1.1-25 to 0.1.1-26
	/// 2. gulp bump --set-version 1.1.1 : bumps/sets the package.json and bower.json to the 
	///	specified revision.
	/// 3. gulp bump --type major	   : bumps 1.0.0 
	///	gulp bump --type minor	   : bumps 0.1.0
	///	gulp bump --type patch	   : bumps 0.0.2
	///	gulp bump --type prerelease  : bumps 0.0.1-2
	/// </summary>
	var args = yargs.argv;
	var type = args.type;
	var version = args['set-version'];
	var options = {};
	if (typeof version !== 'undefined') {
		options.version = version;
	} else if(typeof type !== 'undefined') {
		options.type = type;
	} else {
		options.type = 'prerelease';
	}
	return gulp
		.src(['package.json'])
		.pipe(bump(options))
		.pipe(gulp.dest('./'));
});

gulp.task('tag', function() {
	return gulp.src(['package.json']).pipe(tagVersion());
});
