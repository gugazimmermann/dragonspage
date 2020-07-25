#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { DragonspageStack } from '../lib/dragonspage-stack';

const app = new cdk.App();
new DragonspageStack(app, 'DragonspageStack');
