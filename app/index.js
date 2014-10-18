'use strict';
var yeoman = require('yeoman-generator');
var yosay = require('yosay');
var _ = require('lodash');

var proxy = process.env.http_proxy || process.env.HTTP_PROXY || process.env.https_proxy ||
  process.env.HTTPS_PROXY || null;
/* jshint +W106 */
var githubOptions = {
  version: '3.0.0'
};

if (proxy) {
  var proxyUrl = url.parse(proxy);
  githubOptions.proxy = {
    host: proxyUrl.hostname,
    port: proxyUrl.port
  };
}

var GitHubApi = require('github');
var github = new GitHubApi(githubOptions);

if (process.env.GITHUB_TOKEN) {
  github.authenticate({
    type: 'oauth',
    token: process.env.GITHUB_TOKEN
  });
}

var githubUserInfo = function (name, cb, log) {
  github.user.getFrom({
    user: name
  }, function (err, res) {
    if (err) {
      log.error('Cannot fetch your github profile. Make sure you\'ve typed it correctly.');
      res = emptyGithubRes;
    }
    cb(JSON.parse(JSON.stringify(res)));
  });
};

var DanduleGenerator = yeoman.generators.Base.extend({
  initializing: function () {
    this.pkg = require('../package.json');
  },

  prompting: function () {
    var done = this.async();
    this.log(yosay(
      'Welcome to the superb Dandule generator!'
    ));
    var prompts = [{
      type: 'input',
      name: 'moduleName',
      message: 'What is the name of your module?',
      default: 'my-dandule'
    },
    {
      type: 'input',
      name: 'moduleDescription',
      message: 'What is the desription of your module?',
      default: 'My description.'
    },
    {
      type: 'input',
      name: 'githubUser',
      message: 'What is your GitHub username?',
      default: ''
    }];
    this.prompt(prompts, function (props) {
      _.extend(this, props);
      _.extend(this, {realname: '', email: '', githubUrl: ''});
      _.extend(this, {currentYear: (new Date()).getFullYear()});
      done();
    }.bind(this));
  },

  configuring: {
    userInfo: function () {
      var done = this.async();
      githubUserInfo(this.githubUser, function (res) {
        /*jshint camelcase:false */
        this.realname = res.name;
        this.email = res.email;
        this.githubUrl = res.html_url;
        done();
      }.bind(this), this.log);
    }
  },

  writing: {
    projectfiles: function () {
      this.template('_package.json', 'package.json');
      this.template('editorconfig', '.editorconfig');
      this.template('eslintrc', '.eslintrc');
      this.template('gitignore', '.gitignore');
      this.template('LICENSE');
    },
    lib: function () {
      this.dest.mkdir('lib');
      this.dest.mkdir('bin');
    },
    test: function () {
      this.dest.mkdir('test');
    }
  },

  end: function () {
    var done = this.async();
    this.npmInstall(['tape', 'npm-stare'], { 'saveDev': true }, done);
  }
});

module.exports = DanduleGenerator;
