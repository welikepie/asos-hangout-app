/*global module:false, require:true */
module.exports = function (grunt) {
	"use strict";

	grunt.initConfig({

		'pkg': grunt.file.readJSON('package.json'),

		'recess': {

			'landing-page-lint': {
				'src': 'src/landing-page/styles/*.less',
				'options': {
					'compile': false,
					'compress': false,
					'noIDs': false,
					'noOverqualifying': false,
					'noUniversalSelectors': false,
					'strictPropertyOrder': false
				}
			},
			'landing-page-dev': {
				'options': {
					'compile': true,
					'compress': false
				},
				'src': 'src/landing-page/styles/*.less',
				'dest': 'build/landing-page/styles/styles.css'
			},
			'landing-page-release': {
				'options': {
					'compile': true,
					'compress': true
				},
				'src': 'src/landing-page/styles/*.less',
				'dest': 'build/landing-page/styles/styles.css'
			},

			'hangout-app-lint': {
				'src': 'src/hangout-app/styles/*.less',
				'options': {
					'compile': false,
					'compress': false,
					'noIDs': false,
					'noOverqualifying': false,
					'noUniversalSelectors': false,
					'strictPropertyOrder': false
				}
			},
			'hangout-app-dev': {
				'options': {
					'compile': true,
					'compress': false
				},
				'src': 'src/hangout-app/styles/*.less',
				'dest': 'build/hangout-app/styles/styles.css'
			},
			'hangout-app-release': {
				'options': {
					'compile': true,
					'compress': true
				},
				'src': 'src/hangout-app/styles/*.less',
				'dest': 'build/hangout-app/styles/styles.css'
			}

		},

		'clean': {
			'build': { 'src': ['build'] },
			'landing-page': { 'src': ['build/landing-page'] },
			'hangout-app': { 'src': ['build/hangout-app'] }
		},

		'copy': {
			'landing-page-html': {
				'src': 'src/landing-page/index.html',
				'dest': 'build/landing-page/index.html'
			},
			'landing-page-styling': {
				'src': '**/*.!(less)',
				'cwd': 'src/landing-page/styles/',
				'dest': 'build/landing-page/styles/',
				'expand': true,
				'filter': 'isFile'
			},
			'landing-page-images': {
				'src': ['**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.png'],
				'cwd': 'src/landing-page/images/',
				'dest': 'build/landing-page/images/',
				'expand': true,
				'filter': 'isFile'
			},

			'hangout-app-html': {
				'src': 'src/hangout-app/index.html',
				'dest': 'build/hangout-app/index.html'
			},
			'hangout-app-styling': {
				'src': '**/*.!(less)',
				'cwd': 'src/hangout-app/styles/',
				'dest': 'build/hangout-app/styles/',
				'expand': true,
				'filter': 'isFile'
			},
			'hangout-app-images': {
				'src': ['**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.png'],
				'cwd': 'src/hangout-app/images/',
				'dest': 'build/hangout-app/images/',
				'expand': true,
				'filter': 'isFile'
			}
		}

	});

	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-recess');

	grunt.registerTask('landing-page-dev', [
		'clean:landing-page',
		'recess:landing-page-lint',
		'recess:landing-page-dev',
		'copy:landing-page-styling',
		'copy:landing-page-images',
		'copy:landing-page-html'
	]);

	grunt.registerTask('hangout-app-dev', [
		'clean:hangout-app',
		'recess:hangout-app-lint',
		'recess:hangout-app-dev',
		'copy:hangout-app-styling',
		'copy:hangout-app-images',
		'copy:hangout-app-html'
	]);

};