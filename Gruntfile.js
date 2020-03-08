/*jslint node:true */
module.exports = function (grunt) {

    "use strict";

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        // Copies remaining files to places other tasks can use
        copy: {
            public: {
                files: [
                    {
                        expand: true,
                        cwd: 'client/js/',
                        src: ['**/*.min.js', '**/*.min.js.map'],
                        dest: 'client/public'
                    },
                    {
                        expand: true,
                        cwd: 'client/node_modules/jquery/dist',
                        src: ['jquery.min.js'],
                        dest: 'client/public/lib'
                    },
                    {
                        expand: true,
                        cwd: 'client/node_modules/axios/dist',
                        src: ['*.min.js'],
                        dest: 'client/public/lib'
                    },
                    {
                        expand: true,
                        cwd: 'client/',
                        src: ['style/*.css'],
                        dest: 'client/public'
                    },
                    {
                        expand: true,
                        cwd: 'client/',
                        src: ['*.html'],
                        dest: 'client/public'
                    }
                ]
            }
        },
        clean: {
            client:  ['*.tmp*', 'client/public/*' ],
            backend: ['backend/**/*.js', 'backend/**/*.js.map', "!backend/node_modules/**/*.js"]
        },
        uglify: {
            client: {
                options: {
                    sourceMap: true
                },
                files: [{
                    expand: true, // Dynamic expansion
                    src: [ 'client/js/*.js', '!client/**/*.min.js'],
                    dest: '',
                    ext: '.min.js'
                }]
            }
        },
        // Compile TypeScript
        ts: {
            backend: {
                src: ['./backend/**/*.ts', './backend/node_modules/@types/**/*.d.ts'],
                options: {
                    esModuleInterop: true,
                    module: 'commonjs',
                    target: 'es6',
                    sourcemap: true,
                    declaration: false, // Generates .d.ts file
                    removeComments: false
                }
            }
        },
        // TSLint static testing
        tslint: {
            options: {
                configuration: grunt.file.readJSON("./tslint.json")
            },
            backend: {
                src: ['backend/**/*.ts, !backend/node_modules/**']
            }
        }
    });

    // Load the plugins that provide the tasks.

    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-uglify-es');
    grunt.loadNpmTasks('grunt-ts');
    grunt.loadNpmTasks('grunt-tslint');

    grunt.registerTask('client', [
        'clean:client', 'uglify', 'copy:public'
    ]);

    grunt.registerTask('backend', [
        'clean:backend', 'tslint:backend', 'ts:backend'
    ]);
    grunt.registerTask('default', [
        'clean', 'tslint', 'ts', 'uglify', 'copy:public'
    ]);
};
