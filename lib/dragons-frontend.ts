import * as cdk from '@aws-cdk/core';
import * as s3 from '@aws-cdk/aws-s3';
import * as s3Deployment from '@aws-cdk/aws-s3-deployment';
import * as route53 from '@aws-cdk/aws-route53';
import * as acm from '@aws-cdk/aws-certificatemanager';
import * as cloudfront from '@aws-cdk/aws-cloudfront';
import * as targets from '@aws-cdk/aws-route53-targets/lib';

export interface IStaticSiteProps {
  domainName: string;
  siteSubDomain: string;
}
export class DragonsFrontend extends cdk.Construct {
  constructor(scope: cdk.Construct, id: string, props: IStaticSiteProps) {
    super(scope, id);

    const zone = route53.HostedZone.fromLookup(this, 'Zone', { domainName: props.domainName });
    const siteDomain = props.siteSubDomain + '.' + props.domainName;

    const siteBucket = new s3.Bucket(this, 'SiteBucket', {
      bucketName: siteDomain,
      publicReadAccess: true,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'error.html',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const certificateArn = new acm.DnsValidatedCertificate(this, 'SiteCertificate', {
      domainName: siteDomain,
      hostedZone: zone,
      region: process.env.CDK_DEFAULT_REGION,
    }).certificateArn;

    const distribution = new cloudfront.CloudFrontWebDistribution(this, 'SiteDistribution', {
      aliasConfiguration: {
        acmCertRef: certificateArn,
        names: [siteDomain],
        sslMethod: cloudfront.SSLMethod.SNI,
        securityPolicy: cloudfront.SecurityPolicyProtocol.TLS_V1_1_2016,
      },
      originConfigs: [
        {
          s3OriginSource: {
            s3BucketSource: siteBucket,
          },
          behaviors: [{ isDefaultBehavior: true }],
        },
      ],
    });

    new route53.ARecord(this, 'SiteAliasRecord', {
      recordName: siteDomain,
      target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution)),
      zone,
    });

    new s3Deployment.BucketDeployment(this, 'DeploySite', {
      sources: [s3Deployment.Source.asset('frontend/build')],
      destinationBucket: siteBucket,
      distribution,
      distributionPaths: ['/*'],
    });

    new cdk.CfnOutput(this, 'Site', { value: 'https://' + siteDomain });
  }
}
