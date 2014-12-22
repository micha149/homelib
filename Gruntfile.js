module.exports = function(grunt) {

    grunt.initConfig({

        pkg: grunt.file.readJSON('package.json'),

        jshint: {
            options: {
                expr: true,
                "-W086": true
            },
            all: ['Gruntfile.js', 'src/**/*.js', 'test/**/*.js']
        },

        mochaTest: {
            default: {
                options: {
                    reporter: 'dot',
                    require: "test/setup.js"
                },
                src: ['test/**/*Test.js']
            },
            unitOnly: {
                options: {
                    reporter: 'spec',
                    require: "test/setup.js"
                },
                src: ['test/**/*Test.js']
            },
            "html-coverage": {
                options: {
                    reporter: 'html-cov',
                    require: "test/setup.js",
                    quiet: true,
                    captureFile: 'coverage.html'
                },
                src: ['test/**/*Test.js']
            },
            "lcov-coverage": {
                options: {
                    reporter: 'mocha-lcov-reporter',
                    require: "test/setup.js",
                    quiet: true,
                    captureFile: 'coverage.lcov'
                },
                src: ['test/**/*Test.js']
            }
        },

        shell: {
            options: {
                stderr: false
            },
            "upload-coverage-report": {
                command: './node_modules/.bin/codeclimate < coverage.lcov'
            }
        },

        jsduck: {
            main: {
                dest: 'docs/output',
                src: ['docs/external', 'src'],
                options: {
                    config: 'docs/config.json',
                    warnings: '-cat_class_missing,-cat_no_match',
                    warningsExitNonzero: true
                }
            }
        },

        watch: {
            scripts: {
                files: ['src/**/*.js', 'test/**/*Test.js'],
                tasks: ['unit']
            }
        },

        clean: ['docs/output', 'coverage.html']
    });

    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-mocha-test');
    grunt.loadNpmTasks('grunt-jsduck');
    grunt.loadNpmTasks('grunt-shell');

    grunt.registerTask('instrument', 'Enalbles instrumentation of source files for code coverage', function() {
        require('blanket')({
            pattern: '/src/'
        });
    });

    // Default task(s).
    grunt.registerTask('default', 'Run jshint and unit tests', ['jshint', 'mochaTest:default']);
    grunt.registerTask('unit', 'Run unit tests only, but with verbose output', ['mochaTest:unitOnly']);
    grunt.registerTask('coverage', 'Run tests and create code coverage', ['instrument', 'mochaTest:default', 'mochaTest:html-coverage']);
    grunt.registerTask('travis', 'Task run by travis ci', ['jshint', 'instrument', 'mochaTest:default', 'mochaTest:lcov-coverage', 'shell:upload-coverage-report']);
    grunt.registerTask('docs', 'Create API documentation', ['jsduck']);

};