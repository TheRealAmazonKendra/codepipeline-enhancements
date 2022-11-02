import * as fs from 'fs';
import * as path from 'path';
import { custom_resources, aws_lambda, CustomResource, Arn, Stack } from 'aws-cdk-lib';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { CalendarSetupFunction } from './calendar-setup-function';

export interface CalendarLocationOptionsBase {
  calendarName: string;
  calendarPath?: string;
};

export interface S3LocationOptions extends CalendarLocationOptionsBase {
  bucketName: string;
  roleArn?: string;
};

export enum CalendarSourceType {
  S3Object = 's3Object',
  PATH = 'path',
};

export abstract class Calendar {
  public static path(options: CalendarLocationOptionsBase) {
    return new class extends Calendar {
      public _bind(scope: Construct): Calendar {
        const localPath = options.calendarPath ? options.calendarPath : __dirname;
        const calendarBody = fs.readFileSync(path.join(localPath, options.calendarName), { encoding: 'utf-8' });
        return new CustomResourceCalendar(scope, {
          sourceType: CalendarSourceType.PATH,
          calendarBody,
          calendarName: options.calendarName,
        });
      }
    };
  }

  public static s3Location(options: S3LocationOptions): Calendar {
    return new class extends Calendar {
      public _bind(scope: Construct): Calendar {
        return new CustomResourceCalendar(scope, {
          sourceType: CalendarSourceType.S3Object,
          bucketName: options.bucketName,
          calendarName: options.calendarName,
          roleArn: options.roleArn,
        });
      }
    };
  }

  public get calendarName(): string {
    return this.calendarName;
  }

  protected constructor() {}

  /**
   *
   * @internal
   */
  public abstract _bind(scope: Construct): any;
}

interface CustomResourceCalendarOptions extends CalendarLocationOptionsBase {
  sourceType: CalendarSourceType;
  calendarBody?: string;
  bucketName?: string;
  roleArn?: string;
}

class CustomResourceCalendar extends Calendar {
  constructor(scope: Construct, options: CustomResourceCalendarOptions) {
    super();

    const onEvent: aws_lambda.Function = new CalendarSetupFunction(scope, 'OnEventHandler');
    onEvent.addToRolePolicy(new PolicyStatement({
      actions: ['ssm:CreateDocument'],
      resources: [Arn.format({
        service: 'ssm',
        resource: 'document',
        resourceName: options.calendarName,
      }, Stack.of(scope))],
    }));

    const provider = new custom_resources.Provider(scope, 'Provider', {
      onEventHandler: onEvent,
    });

    new CustomResource(scope, 'SSMCalendarCustomResource', {
      serviceToken: provider.serviceToken,
      properties: {
        sourceType: options.sourceType,
        calendarBody: options.calendarBody,
        calendarPath: options.calendarPath,
        calendarName: options.calendarName,
        roleArn: options.roleArn,
      },
    });
  }

  public _bind() {}
}