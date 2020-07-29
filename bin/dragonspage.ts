#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { DragonsBackendStack } from '../lib/dragons-backend-stack';
import { DragonsFrontendStack } from '../lib/dragons-frontend-stack';

const app = new cdk.App();
new DragonsBackendStack(app, 'DragonsBackendStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
new DragonsFrontendStack(app, 'DragonsFrontendStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
