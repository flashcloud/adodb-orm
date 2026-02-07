/**
 * Created by sungole on 2026/2/7.
 */

//发布的主目录
const release_main_folder = 'dist';

module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        copy: {
            main: {
                files: [
                    {expand: true, cwd: './', dest: release_main_folder, src: 'README.md'},
                    {expand: true, cwd: './', dest: release_main_folder, src: 'src/**'},
                    {expand: true, cwd: './', dest: release_main_folder, src: 'test/**'}
                ]
            },
            pkg: {
                options: {
                    process: function (content) {
                        const pkg = JSON.parse(content);
                        delete pkg.devDependencies;
                        return JSON.stringify(pkg, null, 2);
                    }
                },
                files: [
                    {src: 'package.json', dest: release_main_folder + '/package.json'}
                ]
            }
        },
        clean: {
            before_release: [release_main_folder]
        }
    });

    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-clean');

    // Default task(s).
    grunt.registerTask('default', ['clean:before_release', 'copy']);
};