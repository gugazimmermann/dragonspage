import * as cdk from '@aws-cdk/core';
import { DragonsBackend } from './dragons-backend';

export class DragonsBackendStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new DragonsBackend(this, 'DragonsBackend');
  }
}
