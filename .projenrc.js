const { awscdk } = require('projen');
const project = new awscdk.AwsCdkConstructLibrary({
  author: 'Kendra Neil',
  authorAddress: '53584728+TheRealAmazonKendra@users.noreply.github.com',
  cdkVersion: '2.49.0',
  defaultReleaseBranch: 'main',
  name: 'codepipeline-enhancements',
  repositoryUrl: 'https://github.com/53584728+TheRealAmazonKendra/codepipeline-enhancements.git',
  publishToGo: {

  },
  publishToMaven: {},
  publishToNuget: {},
  publishToPypi: {},
  publishDryRun: true,
  deps: [],
  // description: undefined,  /* The description is just a string that helps people understand the purpose of the package. */
  devDeps: [],
  bundledDeps: [
    '@types/aws-lambda',
    'aws-sdk',
  ],
  // packageName: undefined,  /* The "name" in package.json. */
});
project.synth();