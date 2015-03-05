module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
     bower: {
      install: {
        options: {
          targetDir: 'static/lib/'
        }
      }
    },
    // because grunt-bower-task doesn't correctly move font-awesome
    copy: {
      fontawesome_fonts: {
        src: 'bower_components/font-awesome-bower/fonts/*',
        dest: 'static/lib/font-awesome-bower/fonts/',
        expand: true, flatten: true, filter: 'isFile'
      },
      fontawesome_css: {
        src: 'bower_components/font-awesome-bower/css/*',
        dest: 'static/lib/font-awesome-bower/css/',
        expand: true, flatten: true, filter: 'isFile'
      },
    },
    uglify: {
      options: {
        mangle: false
      },
      my_target: {
        files: {
          'static/lib/libs.min.js': [
            'static/lib/jquery/jquery.js',
            'static/lib/bootstrap/bootstrap.js',
            'static/lib/jquery.ui/ui/core.js',
            'static/lib/jquery.ui/ui/widget.js',
            'static/lib/jquery.ui/ui/position.js',
            'static/lib/jquery.ui/ui/menu.js',
            'static/lib/jquery.ui/ui/mouse.js',
            'static/lib/jquery.ui/ui/sortable.js',
            'static/lib/underscore/underscore.js',
            'static/lib/backbone/backbone.js',
            'static/lib/backbone.babysitter/backbone.babysitter.js',
            'static/lib/backbone.wreqr/backbone.wreqr.js',
            'static/lib/marionette/backbone.marionette.js',
            'static/lib/bootstrap/bootstrap.js',
            'static/lib/seiyria-bootstrap-slider/bootstrap-slider.js',
            'static/lib/bootbox/bootbox.js',
            'static/lib/messenger/messenger.js',
            'static/lib/socket.io-client/dist/socket.io.min.js',
            'static/lib/civswig/swig.js',
            'static/lib/DateJS/date.min.js',
            'static/lib/lastfm-api/lastfm-api.js'
          ]
        }
      }
    },
    cssmin: {
      options: {
        shorthandCompacting: false,
        roundingPrecision: -1
      },
      target: {
        files: {
          'static/lib/libs.min.css': [
            'static/lib/bootswatch/cerulean/bootstrap.min.css',
            'static/lib/seiyria-bootstrap-slider/bootstrap-slider.css',
            'static/lib/messenger/messenger.css',
            'static/lib/messenger/messenger-theme-air.css',
          ]
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-bower-task');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-cssmin');

  grunt.registerTask('default', ['bower', 'copy', 'uglify', 'cssmin']);
};
