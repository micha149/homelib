module.exports = function(grunt) {

    grunt.initConfig({

        pkg: grunt.file.readJSON('package.json'),

        jshint: {
            all: ['Gruntfile.js', 'src/**/*.js', 'test/**/*.js']
        },

        mochaTest: {
            default: {
                options: {
                    reporter: 'dot'
                },
                src: ['test/**/*.js']
            },
            unitOnly: {
                options: {
                    reporter: 'spec'
                },
                src: ['test/**/*.js']
            },
            coverage: {
                options: {
                    reporter: 'html-cov',
                    quiet: true,
                    captureFile: 'coverage.html'
                },
                src: ['test/**/*.js']
            }
        },

        jsduck: {
            main: {
                dest: 'docs/output',
                src: ['docs/external', 'src'],
                options: {
                    config: 'docs/config.json'
                }
            }
        },

        clean: ['docs/output']
    });

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
    grunt.registerTask('default', ['jshint', 'mochaTest:default']);
    grunt.registerTask('unit', ['mochaTest:unitOnly']);
    grunt.registerTask('coverage', ['instrument', 'mochaTest:default', 'mochaTest:coverage']);
    grunt.registerTask('docs', ['jsduck']);

};