module.exports = function(grunt) {

  // Configuration de Grunt
  grunt.initConfig({
        concat: {
              options: {
                separator: ';', // permet d'ajouter un point-virgule entre chaque fichier concat�n�.
              },
              dist: {
                src: ['src/datas/objects.js',
                       'src/datas/array.js',
                       'src/bindings/property_binding.js',
                       'src/bindings/textcontent_binding.js',
                       'src/bindings/attribute_binding.js',
                       'src/bindings/model_binding.js',
                       'src/bindings/array_binding.js',
                       'src/bindings/command_binding.js',
                       'src/bindings/input_binding.js',
                       'src/bindings/extras/webservice_binding.js',
                       'src/utils.js',
                        'src/ftw2.js'],
                dest: 'builds/concat.js'
              }
        },
        umd: {
                all: {
                    options: {
                        src: 'builds/concat.js',//comment supprimer le fichier une fois fini???
                        dest: 'builds/ftw2.js', // optional, if missing the src will be used
                        
                    }
                }
        },
    
        uglify: {
                options: {
                        separator: ';'
                      },
              dist: {
                src: ['builds/ftw2.js'],
                dest: 'builds/ftw2-min.js'
              }
        }
  })

  // D�finition des t�ches Grunt
  grunt.loadNpmTasks('grunt-contrib-concat'); // Voil� l'ajout.
  grunt.loadNpmTasks('grunt-contrib-uglify'); // Voil� l'ajout.
  grunt.loadNpmTasks('grunt-umd'); // Voil� l'ajout.
  
  grunt.registerTask('default', ['concat:dist','umd:all','uglify:dist'])

}