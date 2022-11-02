import { randomUUID } from 'crypto';
import { CustomResource, custom_resources, Duration, IResolvable } from 'aws-cdk-lib';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';
import { AutorollbackFunction } from './autorollback-function';

export interface AutoRollbackProps {
  readonly monitoringTime: IResolvable;
  readonly searchTags: string[];
}

export class AutoRollback extends Construct {
  constructor(scope: Construct, id: string, props: AutoRollbackProps) {
    super(scope, id);

    const lambdaTimeout = Duration.minutes(15);

    const pollQueue = new Queue(this, 'PollQueue', {
      visibilityTimeout: lambdaTimeout,
    });

    const lambdaFunction = new AutorollbackFunction(this, 'Handler');

    // TODO: Limit the actions granted to this role
    pollQueue.grant(lambdaFunction.role!, '*');
    lambdaFunction.addEventSource(new SqsEventSource(pollQueue));

    lambdaFunction.addToRolePolicy(
      new PolicyStatement({
        actions: ['cloudwatch:DescribeAlarms'],
        resources: ['*'],
        effect: Effect.ALLOW,
      }),
    );

    const provider = new custom_resources.Provider(this, 'Provider', {
      onEventHandler: lambdaFunction,
      isCompleteHandler: lambdaFunction,
    });

    new CustomResource(this, 'Resource', {
      serviceToken: provider.serviceToken,
      properties: {
        ...props,
        queueUrl: pollQueue.queueUrl,
        nonce: randomUUID(), // this ensures that the resource is always a part of the stack update
      },
    });
  }
}