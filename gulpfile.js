var 
	gulp = require('gulp'),
	bump = require('gulp-bump'),
	concat = require('gulp-concat'),
	filter = require('gulp-filter'),
	git = require('gulp-git'),
	jshint = require('gulp-jshint'),
	rename = require('gulp-rename'),
	tagVersion = require('gulp-tag-version'),
	uglify = require('gulp-uglify'),
	fs = require('fs'),
	yargs = require('yargs');

var
	mainVersionFile = 'package.json',
	versionFiles =[mainVersionFile, 'bower.json'],
	mainVersionFileFilter = filter(mainVersionFile),
	versionFilesFilter = filter(versionFiles);

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

gulp.task('publish', function() {
	/// <summary>
	/// Usage:
	///     gulp publish --type major          : bumps 1.0.0 
	///     gulp publish --type minor          : bumps 0.1.0
	///     gulp publish --type patch          : bumps 0.0.2
	///     gulp publish --type prerelease     : bumps 0.0.1-2
	/// </summary>
	var pkg = JSON.parse(fs.readFileSync(mainVersionFile, 'utf8'))
	var args = yargs.argv;
	var type = args.type;
	if((typeof type !== 'undefined') && ((type === 'major') || (type === 'minor') || (type === 'patch') || (type === 'prerelease'))) {
		var bumpOptions = {};
		bumpOptions.type = type;
		return gulp.src(['.'])
			.pipe(versionFilesFilter)
			.pipe(bump(bumpOptions))
			.pipe(gulp.dest('./'))
			.pipe(versionFilesFilter.restore())
	        	.pipe(git.add())
        		.pipe(git.commit('Release ' + pkg.version))
			.pipe(mainVersionFileFilter)
	        	.pipe(tagVersion())
			.pipe(mainVersionFileFilter.restore())
			.on('end', function() {
				git.push('origin', 'master', {args: '--tags'}, function(err) {
					if(err) throw (err);
				});
			});
	}
	var commitMessage=args.message;
	if(typeof commitMessage === 'undefined') {
		throw 'A commit message is required.';
	}
	return gulp.src(['.'])
        	.pipe(git.add())
       		.pipe(git.commit(commitMessage))
		.on('end', function() {
			git.push('origin', 'master', function(err) {
				if(err) throw (err);
			});
		});
});
