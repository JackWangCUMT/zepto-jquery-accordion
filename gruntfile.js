module.exports = function(grunt) {
  require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    karma: {
      unit: {
        configFile: 'karma.conf.js',
        background: true
      }
    },

    uglify: {
      build: {
        files: {
          'accordion.js': 'src/js/accordion.js'
        }
      }
    },

    watch: {
      js: {
        files: 'src/js/accordion.js',
        tasks: ['uglify']
      },

      karma: {
        files: ['src/*.js', 'test/**/*.js'],
        tasks: ['karma:unit:run']
      }
    }
  });

  grunt.registerTask('default', []);
};