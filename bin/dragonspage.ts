#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { DragonsBackendStack } from '../lib/dragons-backend-stack';
import { DragonsFrontendStack } from '../lib/dragons-frontend-stack';

const app = new cdk.App();
new DragonsBackendStack(app, 'DragonsBackendStack');
new DragonsFrontendStack(app, 'DragonsFrontendStack');
