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
					'noOverqualifying': false
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
			}
		},

		'clean': {
			'build': { 'src': ['build'] },
			'landing-page': { 'src': ['build/landing-page'] }
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
		'copy:landing-page-html'
	]);
	grunt.registerTask('landing-page', 'landing-page-dev');

};