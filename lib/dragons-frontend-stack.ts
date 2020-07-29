import * as cdk from '@aws-cdk/core';
import { DragonsFrontend } from './dragons-frontend';

export class DragonsFrontendStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new DragonsFrontend(this, 'DragonsFrontend', {
      domainName: this.node.tryGetContext('domain'),
      siteSubDomain: this.node.tryGetContext('subdomain'),
    });
  }
}
