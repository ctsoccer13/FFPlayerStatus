module.exports = function(grunt) {

	grunt.initConfig({
		ENV: {

		},

		less: {
			dev: {
				options: {
					strictImports: true,
					syncImport: true
				},
				files: {
					"main.css": "less/main.less"
				}
			}
		},

		handlebars: {
			options: {
				namespace: "Handlebars.templates",
				amd: false,
				src: 'handlebars`',
				processName: function (filePath) {
					var fileParts = filePath.split('/');
					var fileNameParts = fileParts[fileParts.length - 1].split('.');
					return fileNameParts[0];
				},
			},
			"templates.js": ["handlebars/**/*.handlebars"]

		},
		watch: {
			handlebars: {
				files: ['handlebars/**/*.handlebars'],
				tasks: ['handlebars'],
				options: {
				}
			},
			less: {
				files: ['less/**.less'],
				tasks: ['less:dev'],
				options: {
					//livereload: true
				}
			}
		}
	});

	
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-handlebars');
	grunt.loadNpmTasks('grunt-contrib-less');

	grunt.registerTask('buildDev', ['less:dev', 'handlebars', 'watch']);

};