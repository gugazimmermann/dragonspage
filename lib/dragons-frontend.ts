import * as cdk from '@aws-cdk/core';
import * as s3 from '@aws-cdk/aws-s3';
import * as s3Deployment from '@aws-cdk/aws-s3-deployment';

export class DragonsFrontend extends cdk.Construct {
  constructor(scope: cdk.Construct, id: string) {
    super(scope, id);

    const drangonsWebsiteBucket = new s3.Bucket(this, 'DrangonsWebsiteBucket', {
      publicReadAccess: true,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'error.html',
    });

    new s3Deployment.BucketDeployment(this, 'DeployDrangonsWebsite', {
      destinationBucket: drangonsWebsiteBucket,
      sources: [s3Deployment.Source.asset('frontend/build')],
    });

    new cdk.CfnOutput(this, 'DrangonsWebsiteURL', {
      value: drangonsWebsiteBucket.bucketWebsiteUrl,
    });
  }
}
