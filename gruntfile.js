/*global module:false, require:true */
module.exports = function (grunt) {
	"use strict";

	grunt.initConfig({

		'pkg': grunt.file.readJSON('package.json'),

		// JSHINT Javascript Linting
		// Task used to ensure the Javascript used in the app is top-notch and
		// doesn't contain any errors or dubious tricks. Should the linter find
		// issues with any of the code, a detailed report will be displayed.
		'jshint': {
		
			'options': {
				'immed': true,		// Complains about immediate function invocations not wrapped in parentheses
				'latedef': true,	// Prohibits using a variable before it was defined
				'forin': true,		// Requires usage of .hasOwnProperty() with 'for ... in ...' loops
				'noarg': true,		// Prohibits usage of arguments.caller and arguments.callee (both are deprecated)
				'newcap': true,
				'eqeqeq': true,		// Enforces the usage of triple sign comparison (=== and !==)
				'bitwise': true,	// Forbids usage of bitwise operators (rare and, most likely, & is just mistyped &&)
				'strict': true,		// Enforces usage of ES5's strict mode in all function scopes
				'undef': true,		// Raises error on usage of undefined variables
				'plusplus': true,	// Complains about ++ and -- operators, as they can cause confusion with their placement
				'unused': true,		// Complains about variables and globals that have been defined, but not used
				'curly': true,		// Requires curly braces for all loops and conditionals
				'smarttabs': true,	// Supresses mixed spaces and tabs warning if mixing is only for alignment
				'browser': true,	// Assumes browser enviroment and browser-specific globals

				// Set of globals to cover usage of Require.js
				'globals': {
					'require': true,
					'define': true
				}
			},
			
			// Lints all the scripts (escept for ones contained in "vendor" directory, as these
			// are third-party libraries), but doesn't throw errors on console calls and unused
			// variable names (common for scripts in work). Also lints gruntfile.
			'common-dev': {
				'options': {
					'debug': true,
					'devel': true,
					'unused': false
				},
				'src': ['gruntfile.js', 'src/common/scripts/*.js', 'src/common/scripts/!(vendor)/**/*.js']
			},
			// Lints all the scripts, this time throwing errors on console calls and unused
			// variables. Helps not to leave any logs behind in user-facing app.
			'common-release': {
				'options': {
					'debug': false,
					'devel': false,
					'unused': true
				},
				'src': ['src/common/scripts/*.js', 'src/common/scripts/!(vendor)/**/*.js']
			},

			'landing-page-dev': {
				'options': {
					'debug': true,
					'devel': true,
					'unused': false
				},
				'src': ['src/landing-page/scripts/*.js', 'src/landing-page/scripts/!(vendor)/**/*.js']
			},
			'landing-page-release': {
				'options': {
					'debug': false,
					'devel': false,
					'unused': true
				},
				'src': ['src/landing-page/scripts/*.js', 'src/landing-page/scripts/!(vendor)/**/*.js']
			},

			'hangout-app-dev': {
				'options': {
					'debug': true,
					'devel': true,
					'unused': false
				},
				'src': ['src/hangout-app/scripts/*.js', 'src/hangout-app/scripts/!(vendor)/**/*.js']
			},
			'hangout-app-release': {
				'options': {
					'debug': false,
					'devel': false,
					'unused': true
				},
				'src': ['src/hangout-app/scripts/*.js', 'src/hangout-app/scripts/!(vendor)/**/*.js']
			},

			'staging-app-dev': {
				'options': {
					'debug': true,
					'devel': true,
					'unused': false
				},
				'src': ['src/admin/staging-app/scripts/*.js', 'src/admin/staging-app/scripts/!(vendor)/**/*.js']
			},
			'staging-app-release': {
				'options': {
					'debug': false,
					'devel': false,
					'unused': true
				},
				'src': ['src/admin/staging-app/scripts/*.js', 'src/admin/staging-app/scripts/!(vendor)/**/*.js']
			},

			'node-backend-dev': {
				'options': {
					'debug': true,
					'devel': true,
					'unused': false,
					'browser': false,
					'node': true
				},
				'src': ['src/node-backend/*.js', 'src/node-backend/!(vendor)/**/*.js']
			},
			'node-backend-release': {
				'options': {
					'debug': false,
					'devel': false,
					'unused': true,
					'browser': false,
					'node': true
				},
				'src': ['src/node-backend/*.js', 'src/node-backend/!(vendor)/**/*.js']
			},

			'admin-dev': {
				'options': {
					'debug': true,
					'devel': true,
					'unused': false
				},
				'src': ['src/admin/**/scripts/*.js', 'src/admin/**/scripts/!(vendor)/**/*.js']
			},
			'admin-release': {
				'options': {
					'debug': false,
					'devel': false,
					'unused': true
				},
				'src': ['src/admin/**/scripts/*.js', 'src/admin/**/scripts/!(vendor)/**/*.js']
			}
		},

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
				'src': 'src/landing-page/styles/styles.less',
				'dest': 'build/landing-page/styles/styles.css'
			},
			'landing-page-release': {
				'options': {
					'compile': true,
					'compress': true
				},
				'src': 'src/landing-page/styles/styles.less',
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
			},

			'staging-app-lint': {
				'src': 'src/admin/staging-app/styles/*.less',
				'options': {
					'compile': false,
					'compress': false,
					'noIDs': false,
					'noOverqualifying': false,
					'noUniversalSelectors': false,
					'strictPropertyOrder': false
				}
			},
			'staging-app-dev': {
				'options': {
					'compile': true,
					'compress': false
				},
				'src': 'src/admin/staging-app/styles/*.less',
				'dest': 'build/admin/staging-app/styles/styles.css'
			},
			'staging-app-release': {
				'options': {
					'compile': true,
					'compress': true
				},
				'src': 'src/admin/staging-app/styles/*.less',
				'dest': 'build/admin/staging-app/styles/styles.css'
			},

			'admin-lint': {
				'src': 'src/admin/**/*.less',
				'options': {
					'compile': false,
					'compress': false,
					'noIDs': false,
					'noOverqualifying': false,
					'noUniversalSelectors': false
				}
			},
			'admin-dev': {
				'options': {
					'compile': true,
					'compress': false
				},
				'src': '**/*.less',
				'cwd': 'src/admin/',
				'dest': 'build/admin/',
				'ext': '.css',
				'expand': true,
				'filter': 'isFile'
			},
			'admin-release': {
				'options': {
					'compile': true,
					'compress': true
				},
				'src': '**/*.less',
				'cwd': 'src/admin/',
				'dest': 'build/admin/',
				'ext': '.css',
				'expand': true,
				'filter': 'isFile'
			}

		},

		'clean': {
			'build': { 'src': ['build'] },
			'common': { 'src': ['build/common'] },
			'landing-page': { 'src': ['build/landing-page'] },
			'landing-page-scripts-post': { 'src': ['src/landing-page/main.js'] },
			'hangout-app': { 'src': ['build/hangout-app'] },
			'hangout-app-scripts-post': { 'src': ['src/hangout-app/main.js'] },
			'hangout-app-cleanup': { 'src': ['build/hangout-app/index.html', 'build/hangout-app/styles'] },
			'staging-app': { 'src': ['build/admin/staging-app'] },
			'staging-app-scripts-post': { 'src': ['src/admin/staging-app/main.js'] },
			'staging-app-cleanup': { 'src': ['build/admin/staging-app/index.html', 'build/admin/staging-app/styles'] },
			'admin': { 'src': ['build/admin'] },
			'node-backend': { 'src': ['build/node-backend'] }
		},

		'copy': {

			'common-scripts': {
				'src': '**/*',
				'dest': 'build/common/scripts/',
				'expand': true,
				'cwd': 'src/common/scripts/',
				'filter': 'isFile'
			},
			'common-styling': {
				'src': '**/*.!(less)',
				'cwd': 'src/common/styles',
				'dest': 'build/common/styles',
				'expand': true,
				'filter': 'isFile'
			},
			'apache': {
				'src': ['**/.htaccess', '**/.htpasswd'],
				'cwd': 'src/',
				'dest': 'build/',
				'expand': true,
				'filter': 'isFile'
			},

			'landing-page-html-dev': {
				'src': '*.php',
				'cwd': 'src/landing-page/',
				'dest': 'build/landing-page/',
				'expand': true,
				'filter': 'isFile',
				'options': { 'processContent': grunt.template.process }
			},
			'landing-page-html-release': {
				'src': '*.php',
				'cwd': 'src/landing-page/',
				'dest': 'build/landing-page/',
				'expand': true,
				'filter': 'isFile',
				'options': {
					'processContent': function (content) {
						return grunt.template.process(content
							.replace( /src="..\/common\/scripts\/vendor\/([a-zA-Z0-9_-]+)\.js"/gi, 'src="scripts/$1.js"' )
						);
					}
				}
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
			'landing-page-scripts': {
				'src': '**/*.js',
				'dest': 'build/landing-page/scripts/',
				'expand': true,
				'cwd': 'src/landing-page/scripts/',
				'filter': 'isFile'
			},
			'landing-page-scripts-pre': {
				'src': 'src/landing-page/scripts/main.js',
				'dest': 'src/landing-page/main.js'
			},
			'landing-page-amd': {
				'src': ['require.js', 'modernizr.js', 'json3.js'],
				'cwd': 'src/common/scripts/vendor/',
				'dest': 'build/landing-page/scripts/',
				'expand': true,
				'filter': 'isFile'
			},
			'landing-page-compile-lint': {
				'src': 'build/landing-page/scripts/main.js',
				'dest': 'build/landing-page/scripts/main.js',
				'options': {
					'processContent': function (content) {
						/*jshint boss:true */
						var config;
						if (config = content.match(/require\.config\((\{[^\v]+?\})\);/i)) {
							config = JSON.parse(config[1]);
							if ('config' in config) { config = 'require.config(' + JSON.stringify({'config': config.config}) + ');'; }
							else { config = ''; }
						} else { config = ''; }
						return content
							.replace(/require\.config\(\{[^\v]+?\}\);/i, config)
							.replace(/define\("landing-page\/scripts\/main", function\(\)\{\}\);/i, "");
					}
				}
			},

			'hangout-app-html-dev': {
				'src': ['index.html', 'hangout.js'],
				'cwd': 'src/hangout-app/',
				'dest': 'build/hangout-app/',
				'expand': true,
				'filter': 'isFile',
				'options': {
					'processContent': function (content) {
						return grunt.template.process(content.replace('https://hangoutsapi.talkgadget.google.com/hangouts/api/', ''));
					}
				}
			},
			'hangout-app-html-release': {
				'src': 'src/hangout-app/index.html',
				'dest': 'build/hangout-app/index.html',
				'options': {
					'processContent': function (content) {
						return grunt.template.process(content
							.replace('<base href=""', '<base href="<%= pkg.app.hangoutUrl %>"')
							.replace( /src="..\/common\/scripts\/vendor\/([a-zA-Z0-9_-]+)\.js"/gi, 'src="scripts/$1.js"' )
							.replace(
								/<link(?:[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*|[^>]*href="([^"]+)"[^>]*rel="stylesheet"[^>]*)>/gi,
								function (match, file) {
									var baseUrl = grunt.config.get('pkg.app.hangoutUrl'),
										css = grunt.file.read('build/hangout-app/' + file)
											.replace(/\.\.\/images/gi, baseUrl + 'images')
											.replace(/\.\.\/\.\.\/common\/styles\/fonts/gi, grunt.config.get('pkg.app.baseSslUrl') + 'common/styles/fonts')
											.replace(/\s+/gi, ' ');
									return '<style type="text/css">' + css + '</style>';
								}
							)
						);
					}
				}
			},
			'hangout-app-xml': {
				'src': 'src/hangout-app/app.xml',
				'dest': 'build/hangout-app/app.xml',
				'options': { 'processContent': grunt.template.process }
			},

			'hangout-app-scripts': {
				'src': '**/*.js',
				'dest': 'build/hangout-app/scripts/',
				'expand': true,
				'cwd': 'src/hangout-app/scripts/',
				'filter': 'isFile'
			},
			'hangout-app-scripts-pre': {
				'src': 'src/hangout-app/scripts/main.js',
				'dest': 'src/hangout-app/main.js'
			},
			'hangout-app-amd': {
				'src': ['require.js', 'modernizr.js', 'json3.js'],
				'cwd': 'src/common/scripts/vendor/',
				'dest': 'build/hangout-app/scripts/',
				'expand': true,
				'filter': 'isFile'
			},
			'hangout-app-compile-lint': {
				'src': 'build/hangout-app/scripts/main.js',
				'dest': 'build/hangout-app/scripts/main.js',
				'options': {
					'processContent': function (content) {
						/*jshint boss:true */
						var config;
						if (config = content.match(/require\.config\((\{[^\v]+?\})\);/i)) {
							config = JSON.parse(config[1]);
							if ('config' in config) { config = 'require.config(' + JSON.stringify({'config': config.config}) + ');'; }
							else { config = ''; }
						} else { config = ''; }
						return content
							.replace(/require\.config\(\{[^\v]+?\}\);/i, config)
							.replace(/define\("hangout-app\/scripts\/main", function\(\)\{\}\);/i, "");
					}
				}
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
			},
			'hangout-app-branding': {
				'src': '**/*',
				'cwd': 'src/hangout-app/branding',
				'dest': 'build/hangout-app/branding',
				'expand': true,
				'filter': 'isFile'
			},

			'staging-app-html-dev': {
				'src': ['index.html', 'hangout.js'],
				'cwd': 'src/admin/staging-app/',
				'dest': 'build/admin/staging-app/',
				'expand': true,
				'filter': 'isFile'
			},
			'staging-app-html-release': {
				'src': 'src/admin/staging-app/index.html',
				'dest': 'build/admin/staging-app/index.html',
				'options': {
					'processContent': function (content) {
						return grunt.template.process(content
							.replace('<base href=""', '<base href="<%= pkg.app.stagingHangoutUrl %>"')
							.replace( /src="..\/..\/common\/scripts\/vendor\/([a-zA-Z0-9_-]+)\.js"/gi, 'src="scripts/$1.js"' )
							.replace(
								/<link(?:[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*|[^>]*href="([^"]+)"[^>]*rel="stylesheet"[^>]*)>/gi,
								function (match, file) {
									var baseUrl = grunt.config.get('pkg.app.stagingHangoutUrl'),
										css = grunt.file.read('build/admin/staging-app/' + file)
											.replace(/\.\.\/images/gi, baseUrl + 'images')
											.replace(/\.\.\/\.\.\/common\/styles\/fonts/gi, grunt.config.get('pkg.app.baseSslUrl') + 'common/styles/fonts')
											.replace(/\s+/gi, ' ');
									return '<style type="text/css">' + css + '</style>';
								}
							)
						);
					}
				}
			},
			'staging-app-xml': {
				'src': 'src/admin/staging-app/app.xml',
				'dest': 'build/admin/staging-app/app.xml',
				'options': { 'processContent': grunt.template.process }
			},

			'staging-app-scripts': {
				'src': '**/*.js',
				'dest': 'build/admin/staging-app/scripts/',
				'expand': true,
				'cwd': 'src/admin/staging-app/scripts/',
				'filter': 'isFile'
			},
			'staging-app-scripts-pre': {
				'src': 'src/admin/staging-app/scripts/main.js',
				'dest': 'src/admin/staging-app/main.js'
			},
			'staging-app-amd': {
				'src': ['require.js', 'modernizr.js', 'json3.js'],
				'cwd': 'src/common/scripts/vendor/',
				'dest': 'build/admin/staging-app/scripts/',
				'expand': true,
				'filter': 'isFile'
			},
			'staging-app-compile-lint': {
				'src': 'build/admin/staging-app/scripts/main.js',
				'dest': 'build/admin/staging-app/scripts/main.js',
				'options': {
					'processContent': function (content) {
						/*jshint boss:true */
						var config;
						if (config = content.match(/require\.config\((\{[^\v]+?\})\);/i)) {
							config = JSON.parse(config[1]);
							if ('config' in config) { config = 'require.config(' + JSON.stringify({'config': config.config}) + ');'; }
							else { config = ''; }
						} else { config = ''; }
						return content
							.replace(/require\.config\(\{[^\v]+?\}\);/i, config)
							.replace(/define\("admin\/staging-app\/scripts\/main", function\(\)\{\}\);/i, "");
					}
				}
			},

			'staging-app-styling': {
				'src': '**/*.!(less)',
				'cwd': 'src/admin/staging-app/styles/',
				'dest': 'build/admin/staging-app/styles/',
				'expand': true,
				'filter': 'isFile'
			},
			'staging-app-images': {
				'src': ['**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.png'],
				'cwd': 'src/admin/staging-app/images/',
				'dest': 'build/admin/staging-app/images/',
				'expand': true,
				'filter': 'isFile'
			},

			'node-backend-dev': {
				'src': '**/*',
				'cwd': 'src/node-backend',
				'dest': 'build/node-backend',
				'expand': true,
				'filter': 'isFile',
				'options': {
					'processContent': function (content, path) {
						if (!path.match(/\/vendor\//i)) { return grunt.template.process(content); }
						else { return content; }
					}
				}
			},
			'node-backend-release': {
				'src': '**/*',
				'cwd': 'src/node-backend/',
				'dest': 'build/node-backend/',
				'expand': true,
				'filter': 'isFile',
				'options': {
					'processContent': function (content, path) {
						if (!path.match(/\/vendor\//i)) { return grunt.template.process(content); }
						else { return content; }
					}
				}
			},

			'admin-html': {
				'src': ['**/*.html', '**/*.htm', '**/*.php'],
				'cwd': 'src/admin/',
				'dest': 'build/admin/',
				'expand': true,
				'filter': 'isFile',
				'options': {
					'processContent': grunt.template.process
				}
			},
			'admin-scripts': {
				'src': '**/*.js',
				'dest': 'build/admin/',
				'expand': true,
				'cwd': 'src/admin/',
				'filter': 'isFile'
			},
			'admin-misc': {
				'src': ['data/products.json', 'gateway/.htaccess'],
				'cwd': 'src/admin/',
				'dest': 'build/admin/',
				'expand': true,
				'filter': 'isFile'
			}
			
		},

		// Minifies and optimised both the compiled scripts file
		// and the require.js loader straight into the build directory.
		'uglify': {
			'options': {
				'mangle': true,
				'compress': true,
				'preserveComments': false
			},
			'landing-page': {
				'src': ['main.js', 'modernizr.js', 'require.js'],
				'cwd': 'build/landing-page/scripts/',
				'dest': 'build/landing-page/scripts/',
				'expand': true,
				'filter': 'isFile'
			},
			'hangout-app': {
				'src': ['main.js', 'modernizr.js', 'require.js'],
				'cwd': 'build/hangout-app/scripts/',
				'dest': 'build/hangout-app/scripts/',
				'expand': true,
				'filter': 'isFile'
			},
			'staging-app': {
				'src': ['main.js', 'modernizr.js', 'require.js'],
				'cwd': 'build/admin/staging-app/scripts/',
				'dest': 'build/admin/staging-app/scripts/',
				'expand': true,
				'filter': 'isFile'
			}
		},

		'requirejs': {
			// Compilation of modular scripts into one file for ease of
			// loading, less requests and minification (less space = more awesome)
			'landing-page': {
				'options': {
					'baseUrl': 'src',
					'mainConfigFile': 'src/landing-page/main.js',
					'optimize': 'none',
					'include': 'landing-page/scripts/main',
					'out': 'build/landing-page/scripts/main.js'
				}
			},
			'hangout-app': {
				'options': {
					'baseUrl': 'src',
					'mainConfigFile': 'src/hangout-app/main.js',
					'optimize': 'none',
					'include': 'hangout-app/scripts/main',
					'out': 'build/hangout-app/scripts/main.js'
				}
			},
			'staging-app': {
				'options': {
					'baseUrl': 'src',
					'mainConfigFile': 'src/admin/staging-app/main.js',
					'optimize': 'none',
					'include': 'admin/staging-app/scripts/main',
					'out': 'build/admin/staging-app/scripts/main.js'
				}
			}
		}

	});

	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-requirejs');
	grunt.loadNpmTasks('grunt-recess');

	grunt.registerTask('landing-page-scripts-dev', [
		'jshint:common-dev',
		'copy:common-scripts',
		'jshint:landing-page-dev',
		'copy:landing-page-scripts'
	]);
	grunt.registerTask('landing-page-scripts-release', [
		'jshint:common-dev',
		'copy:common-scripts',
		'jshint:landing-page-release',
		'copy:landing-page-scripts-pre',
		'requirejs:landing-page',
		'copy:landing-page-compile-lint',
		'clean:landing-page-scripts-post',
		'copy:landing-page-amd',
		'uglify:landing-page'
	]);
	grunt.registerTask('landing-page-dev', [
		'clean:landing-page',
		'copy:common-styling',
		'recess:landing-page-lint',
		'recess:landing-page-dev',
		'landing-page-scripts-dev',
		'copy:landing-page-styling',
		'copy:landing-page-images',
		'copy:landing-page-html-dev'
	]);
	grunt.registerTask('landing-page-release', [
		'clean:landing-page',
		'copy:common-styling',
		'recess:landing-page-lint',
		'recess:landing-page-release',
		'landing-page-scripts-release',
		'copy:landing-page-styling',
		'copy:landing-page-images',
		'copy:landing-page-html-release'
	]);

	grunt.registerTask('hangout-app-scripts-dev', [
		'jshint:common-dev',
		'copy:common-scripts',
		'jshint:hangout-app-dev',
		'copy:hangout-app-scripts'
	]);
	grunt.registerTask('hangout-app-scripts-compiled', [
		'jshint:common-dev',
		'jshint:hangout-app-dev',
		'copy:hangout-app-scripts-pre',
		'requirejs:hangout-app',
		'copy:hangout-app-compile-lint',
		'clean:hangout-app-scripts-post',
		'copy:hangout-app-amd'
	]);
	grunt.registerTask('hangout-app-scripts-release', [
		'jshint:hangout-app-release',
		'hangout-app-scripts-compiled',
		'uglify:hangout-app'
	]);
	grunt.registerTask('hangout-app-dev', [
		'clean:hangout-app',
		'recess:hangout-app-lint',
		'recess:hangout-app-dev',
		'hangout-app-scripts-dev',
		'copy:hangout-app-styling',
		'copy:hangout-app-images',
		'copy:hangout-app-html-dev'
	]);
	grunt.registerTask('hangout-app-compiled', [
		'clean:hangout-app',
		'recess:hangout-app-lint',
		'recess:hangout-app-dev',
		'hangout-app-scripts-compiled',
		'copy:hangout-app-styling',
		'copy:hangout-app-images',
		'copy:hangout-app-branding',
		'copy:hangout-app-html-release',
		'copy:hangout-app-xml',
		'clean:hangout-app-cleanup'
	]);
	grunt.registerTask('hangout-app-release', [
		'clean:hangout-app',
		'recess:hangout-app-lint',
		'recess:hangout-app-release',
		'hangout-app-scripts-release',
		'copy:hangout-app-styling',
		'copy:hangout-app-images',
		'copy:hangout-app-branding',
		'copy:hangout-app-html-release',
		'copy:hangout-app-xml',
		'clean:hangout-app-cleanup'
	]);

	grunt.registerTask('staging-app-scripts-dev', [
		'jshint:common-dev',
		'copy:common-scripts',
		'jshint:staging-app-dev',
		'copy:staging-app-scripts'
	]);
	grunt.registerTask('staging-app-scripts-compiled', [
		'jshint:common-dev',
		'jshint:staging-app-dev',
		'copy:staging-app-scripts-pre',
		'requirejs:staging-app',
		'copy:staging-app-compile-lint',
		'clean:staging-app-scripts-post',
		'copy:staging-app-amd'
	]);
	grunt.registerTask('staging-app-scripts-release', [
		'jshint:staging-app-release',
		'staging-app-scripts-compiled',
		'uglify:staging-app'
	]);
	grunt.registerTask('staging-app-dev', [
		'clean:staging-app',
		'recess:staging-app-lint',
		'recess:staging-app-dev',
		'staging-app-scripts-dev',
		'copy:staging-app-styling',
		'copy:staging-app-images',
		'copy:staging-app-html-dev'
	]);
	grunt.registerTask('staging-app-compiled', [
		'clean:staging-app',
		'recess:staging-app-lint',
		'recess:staging-app-dev',
		'staging-app-scripts-compiled',
		'copy:staging-app-styling',
		'copy:staging-app-images',
		'copy:hangout-app-branding',
		'copy:staging-app-html-release',
		'copy:staging-app-xml',
		'clean:staging-app-cleanup'
	]);
	grunt.registerTask('staging-app-release', [
		'clean:staging-app',
		'recess:staging-app-lint',
		'recess:staging-app-release',
		'staging-app-scripts-release',
		'copy:staging-app-styling',
		'copy:staging-app-images',
		'copy:hangout-app-branding',
		'copy:staging-app-html-release',
		'copy:staging-app-xml',
		'clean:staging-app-cleanup'
	]);

	grunt.registerTask('node-backend-dev', [
		'jshint:common-dev',
		'copy:common-scripts',
		'clean:node-backend',
		'jshint:node-backend-dev',
		'copy:node-backend-dev'
	]);
	grunt.registerTask('node-backend-release', [
		'jshint:common-release',
		'copy:common-scripts',
		'clean:node-backend',
		'jshint:node-backend-release',
		'copy:node-backend-release'
	]);

	grunt.registerTask('admin-dev', [
		'copy:common-scripts',
		'copy:common-styling',
		//'recess:admin-lint',
		'recess:admin-dev',
		'copy:admin-scripts',
		'copy:admin-html',
		'copy:admin-misc'
	]);

};