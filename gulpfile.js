var 
	gulp = require('gulp'),
	jshint = require('gulp-jshint'),
	concat = require('gulp-concat'),
	rename = require('gulp-rename'),
	uglify = require('gulp-uglify'),
	yargs = require('yargs'),
	bump = require('gulp-bump'),
	fs = require('fs'),
	git = require('gulp-git'),
	tagVersion = require('gulp-tag-version');

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
	/// 2. gulp bump --version 1.1.1 : bumps/sets the package.json and bower.json to the 
	///	specified revision.
	/// 3. gulp bump --type major	   : bumps 1.0.0 
	///	gulp bump --type minor	   : bumps 0.1.0
	///	gulp bump --type patch	   : bumps 0.0.2
	///	gulp bump --type prerelease  : bumps 0.0.1-2
	/// </summary>
	var args = yargs.argv;
	var type = args.type;
	var version = args.version;
	var options = {};
	if (typeof version !== 'undefined') {
		options.version = version;
	} else if(typeof type !== 'undefined') {
		options.type = type;
	} else {
		options.type = 'prerelease';
	}
	return gulp
		.src(['package.json', 'bower.json'])
		.pipe(bump(options))
		.pipe(gulp.dest('./'));
});

gulp.task('tag', function() {
	return gulp.src(['package.json']).pipe(tagVersion());
});

//gulp.task('publish-git',  function() {
//	return gulp;
//});


gulp.task('publish', ['bump'], function() {
	var pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'))
	var args = yargs.argv;
	return gulp.src(['.'])
        	.pipe(git.add())
        	.pipe(git.commit(pkg.version + ' - ' +  args.message))
	        .pipe(tagVersion())
		.on('end', function() {
			git.push('origin', 'master', function(err) {
				if(err) throw (err);
			});

		});
});
