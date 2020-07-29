import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as Dragonspage from '../lib/dragons-backend-stack';

test('Empty Stack', () => {
  const app = new cdk.App();
  // WHEN
  const stack = new Dragonspage.DragonsBackendStack(app, 'MyTestStack');
  // THEN
  expectCDK(stack).to(
    matchTemplate(
      {
        Resources: {},
      },
      MatchStyle.EXACT,
    ),
  );
});
