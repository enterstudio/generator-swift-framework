'use strict';
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var yosay = require('yosay');
var yaml = require('yamljs');
var _ = require('underscore');

module.exports = yeoman.generators.Base.extend({
    constructor: function () {
        yeoman.generators.Base.apply(this, arguments);

        // This method adds support for a `--skip-install` flag
        this.option('skip-install', {
            desc: 'Do not install Carthage deps',
        });
    },

    prompting: {
        askFor: function () {
            var done = this.async();

            // Have Yeoman greet the user.
            this.log(yosay('Welcome to the outstanding ' + chalk.red('swift.framework') + ' generator!'));

            var prompts = [{
                type: 'input',
                name: 'projectName',
                message: 'Project Name',
                default: 'MyProject'
            }, {
                type: 'input',
                name: 'organizationName',
                message: 'Organization Name',
                default: 'MyOrg',
                store: true
            }, {
                type: 'input',
                name: 'organizationId',
                message: 'Organization Identifier',
                default: 'org.my',
                store: true
            }];

            this.prompt(prompts, function (props) {
                this.projectName = props.projectName;
                this.organizationName = props.organizationName;
                this.organizationId = props.organizationId;

                this.props = props;

                done();
            }.bind(this));
        },

        askForCocoaPods: function () {
            var done = this.async();

            var prompts = [{
                type: 'confirm',
                name: 'cocoapods',
                message: 'Would you like to distribute via CocoaPods?',
                default: true
            }];

            this.prompt(prompts, function (props) {
                this.cocoapods = props.cocoapods;
                done();
            }.bind(this));
        },

        askForGitHub: function () {
            var done = this.async();
            var cocoapods = this.cocoapods;

            var prompts = [{
                type: 'input',
                name: 'githubUser',
                message: 'Would you mind telling me your username on GitHub?',
                store: true,
                when: function () {
                    return cocoapods;
                }
            }];

            this.prompt(prompts, function (props) {
                this.githubUser = props.githubUser;
                this.props = _.extend(this.props, props);
                done();
            }.bind(this));
        },
    },

    writing: {
        xcode: function () {
            var files = [
                // The list is generated by `find . -type f -exec echo \'{}\', \;`
                'Example/AppDelegate.swift',
                'Example/Assets.xcassets/AppIcon.appiconset/Contents.json',
                'Example/Base.lproj/LaunchScreen.storyboard',
                'Example/Base.lproj/Main.storyboard',
                'Example/Info.plist',
                'Example/ViewController.swift',
                'PROJECT_NAME/Info.plist',
                'PROJECT_NAME/PROJECT_NAME.h',
                'PROJECT_NAME/PROJECT_NAME.swift',
                'PROJECT_NAME.xcodeproj/project.pbxproj',
                'PROJECT_NAME.xcodeproj/project.xcworkspace/contents.xcworkspacedata',
                'PROJECT_NAME.xcodeproj/xcshareddata/xcschemes/PROJECT_NAME.xcscheme',
                'README.md',
                'UnitTests/Info.plist',
                'UnitTests/UnitTests.swift',
            ];

            files.forEach(function (entry) {
                var source = entry.replace(/PROJECT_NAME/g, this.projectName);
                this.fs.copyTpl(this.templatePath(entry), this.destinationPath(source), this.props);
            }.bind(this));
        },

        license: function () {
            this.fs.copyTpl(this.templatePath('LICENSE'), this.destinationPath('LICENSE'), this.props);
        },

        projectFiles: function () {
            var files = [
                '.gitignore',
                'script/cert',
                'script/README.md',
                'Cartfile.private',
                'Cartfile.resolved',
            ];
            files.forEach(function (entry) {
                this.fs.copy(this.templatePath(entry), this.destinationPath(entry));
            }.bind(this));
        },

        travis: function () {
            var script = {
                language: 'objective-c',
                script: [
                    'xcodebuild test -sdk iphonesimulator -scheme ' + this.props.projectName,
                ],
            };
            this.fs.write(this.destinationPath('.travis.yml'), yaml.stringify(script, 2));
        },

        cocoapods: function () {
            if (!this.cocoapods) {
                return;
            }

            var podspec = this.destinationPath(this.projectName + '.podspec');
            this.fs.copyTpl(this.templatePath('PROJECT_NAME.podspec'), podspec, this.props);
        },
    },

    install: {
        carthageBootstrap: function () {
            if (this.options.skipInstall) {
                this.log('Please run `carthage bootstrap`');
                return;
            }

            var done = this.async();

            this.log('Carthage bootstraping');
            var child = this.spawnCommand('carthage', ['bootstrap']);
            child.on('exit', done);
        },

        openXcode: function () {
            if (this.options.openXcode !== false) {
                this.spawnCommand('open', [this.destinationPath(this.projectName + '.xcodeproj')]);
            }
        },
    }
});
