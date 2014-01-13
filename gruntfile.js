module.exports = function(grunt) {
  'use strict';

  require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    jshint: {
      src: ['gruntfile.js', 'src/js/**/*.js', 'test/spec/**/*.js'],
      options: {
        expr: true
      }
    },

    uglify: {
      build: {
        files: {
          'u$.accordion.js': 'src/js/u$.accordion.js'
        }
      }
    },

    watch: {
      js: {
        files: 'src/js/*.js',
        tasks: ['jshint', 'uglify']
      }
    }
  });

  grunt.registerTask('default', ['jshint', 'uglify']);
};