module.exports = function(grunt) {

    grunt.initConfig({

        pkg: grunt.file.readJSON('package.json'),

        jshint: {
            options: {
                expr: true
            },
            all: ['Gruntfile.js', 'src/**/*.js', 'test/**/*.js']
        },

        mochaTest: {
            default: {
                options: {
                    reporter: 'dot'
                },
                src: ['test/**/*Test.js']
            },
            unitOnly: {
                options: {
                    reporter: 'spec'
                },
                src: ['test/**/*Test.js']
            },
            coverage: {
                options: {
                    reporter: 'html-cov',
                    quiet: true,
                    captureFile: 'coverage.html'
                },
                src: ['test/**/*Test.js']
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

        clean: ['docs/output']
    });

    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-mocha-test');
    grunt.loadNpmTasks('grunt-jsduck');

    grunt.registerTask('instrument', 'Enalbles instrumentation of source files for code coverage', function() {
        require('blanket')({
            pattern: '/src/'
        });
    });

    // Default task(s).
    grunt.registerTask('default', 'Run jshint and unit tests', ['jshint', 'mochaTest:default']);
    grunt.registerTask('unit', 'Run unit tests only, but with verbose output', ['mochaTest:unitOnly']);
    grunt.registerTask('coverage', 'Run tests and create code coverage', ['instrument', 'mochaTest:default', 'mochaTest:coverage']);
    grunt.registerTask('docs', 'Create API documentation', ['jsduck']);

};