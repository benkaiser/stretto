module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    'bower-install-simple': {
      options: {
        color: true,
        directory: 'bower_components',
      },
      def: {
        production: true,
      },
    },

    // because grunt-bower-task doesn't correctly move font-awesome
    copy: {
      fontawesome_fonts: {
        src: 'bower_components/font-awesome-bower/fonts/*',
        dest: 'static/lib/font-awesome-bower/fonts/',
        expand: true, flatten: true, filter: 'isFile',
      },
      fontawesome_css: {
        src: 'bower_components/font-awesome-bower/css/*',
        dest: 'static/lib/font-awesome-bower/css/',
        expand: true, flatten: true, filter: 'isFile',
      },
      headjs: {
        src: 'bower_components/headjs/dist/1.0.0/head.min.js',
        dest: 'static/lib/head.min.js',
      },
    },
    uglify: {
      options: {
        mangle: false,
      },
      my_target: {
        files: {
          'static/lib/libs.min.js': [
            'bower_components/jquery/dist/jquery.min.js',
            'bower_components/bootstrap/dist/js/bootstrap.min.js',
            'bower_components/jquery.ui/ui/core.js',
            'bower_components/jquery.ui/ui/widget.js',
            'bower_components/jquery.ui/ui/position.js',
            'bower_components/jquery.ui/ui/menu.js',
            'bower_components/jquery.ui/ui/mouse.js',
            'bower_components/jquery.ui/ui/sortable.js',
            'bower_components/underscore/underscore-min.js',
            'bower_components/backbone/backbone.js',
            'bower_components/backbone.babysitter/lib/backbone.babysitter.min.js',
            'bower_components/backbone.wreqr/lib/backbone.wreqr.min.js',
            'bower_components/marionette/lib/backbone.marionette.min.js',
            'bower_components/seiyria-bootstrap-slider/dist/bootstrap-slider.min.js',
            'bower_components/bootbox/bootbox.js',
            'bower_components/messenger/build/js/messenger.min.js',
            'bower_components/civswig/swig.min.js',
            'bower_components/DateJS/build/production/date.min.js',
            'bower_components/lastfm-api/lastfm-api.js',
          ],
        },
      },
    },
    cssmin: {
      options: {
        shorthandCompacting: false,
        roundingPrecision: -1,
      },
      target: {
        files: {
          'static/lib/libs.min.css': [
            'bower_components/bootswatch/cerulean/bootstrap.min.css',
            'bower_components/seiyria-bootstrap-slider/dist/css/bootstrap-slider.min.css',
            'bower_components/messenger/build/css/messenger.css',
            'bower_components/messenger/build/css/messenger-theme-air.css',
          ],
        },
      },
    },
  });

  grunt.loadNpmTasks('grunt-bower-install-simple');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-cssmin');

  grunt.registerTask('default', ['bower-install-simple:def', 'copy', 'uglify', 'cssmin']);
};
