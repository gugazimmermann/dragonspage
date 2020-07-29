import * as cdk from '@aws-cdk/core';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import * as lambda from '@aws-cdk/aws-lambda';
import * as apigateway from '@aws-cdk/aws-apigateway';
import * as tablesJson from '../data/tables.json';

export class DragonsBackend extends cdk.Construct {
  public readonly handler: lambda.Function;

  constructor(scope: cdk.Construct, id: string) {
    super(scope, id);

    const defaultTableParams: dynamodb.TableProps = {
      partitionKey: { name: '', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    };

    const defaultLambdaParams: lambda.FunctionProps = {
      code: lambda.Code.fromAsset('src/lambda'),
      handler: 'dragonsHandler.handler',
      runtime: lambda.Runtime.NODEJS_12_X,
      memorySize: 256,
      timeout: cdk.Duration.seconds(10),
    };

    for (const table of tablesJson) {
      const { tableName, partitionKey, sortKey } = table;
      const tableParams = { ...defaultTableParams, tableName };
      tableParams.partitionKey = {
        name: partitionKey.name,
        type: partitionKey.type === 'S' ? dynamodb.AttributeType.STRING : dynamodb.AttributeType.NUMBER,
      };
      if (sortKey) {
        tableParams.sortKey = {
          name: sortKey.name,
          type: sortKey.type === 'S' ? dynamodb.AttributeType.STRING : dynamodb.AttributeType.NUMBER,
        };
      }
      const dragonsTable = new dynamodb.Table(this, tableName, tableParams);

      if (tableName === 'dragon_stats') {
        const dragonsHandler = new lambda.Function(this, `${tableName}_handler`, {
          ...defaultLambdaParams,
          functionName: `${dragonsTable.tableName}_handler`,
          environment: {
            TABLE_NAME: dragonsTable.tableName,
            PK: JSON.stringify(partitionKey),
            SK: JSON.stringify(sortKey),
          },
        });
        dragonsTable.grantReadWriteData(dragonsHandler);
        new apigateway.LambdaRestApi(this, `${tableName}_endpoint`, {
          restApiName: `${tableName}_endpoint`,
          handler: dragonsHandler,
        });
      }
    }
  }
}
