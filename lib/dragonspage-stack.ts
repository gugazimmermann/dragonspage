import * as cdk from '@aws-cdk/core';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import * as lambda from '@aws-cdk/aws-lambda';
import * as apigateway from '@aws-cdk/aws-apigateway';
import * as s3 from '@aws-cdk/aws-s3';
import * as s3Deployment from '@aws-cdk/aws-s3-deployment';

export class DragonspageStack extends cdk.Stack {
  public readonly handler: lambda.Function;

  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const dragonsTable = new dynamodb.Table(this, 'dragons', {
      partitionKey: { name: 'dragon_name', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const dragonsLambda = new lambda.Function(this, 'DragonsHandler', {
      code: lambda.Code.fromAsset('src/lambda'),
      handler: 'dragonsHandler.handler',
      runtime: lambda.Runtime.NODEJS_12_X,
      memorySize: 256,
      timeout: cdk.Duration.seconds(10),
      environment: {
        TABLE_NAME: dragonsTable.tableName,
      },
    });

    dragonsTable.grantReadWriteData(dragonsLambda);

    new apigateway.LambdaRestApi(this, 'DragonsEndpoint', {
      handler: dragonsLambda,
    });

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
