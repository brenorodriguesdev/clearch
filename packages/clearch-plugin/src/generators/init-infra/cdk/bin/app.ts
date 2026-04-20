#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { __PROJECT_NAME_PASCAL__Stack } from '../lib/__PROJECT_NAME_PASCAL__-stack';

const app = new cdk.App();
new __PROJECT_NAME_PASCAL__Stack(app, '__PROJECT_NAME__-stack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
});
