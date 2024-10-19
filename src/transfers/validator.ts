import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ async: false })
export class IsOneOfValidator implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const { object } = args;
    const fields = args.constraints[0];
    const definedFields = fields.filter(
      (field: string) => !!object[field],
    ).length;
    return definedFields === 1;
  }

  defaultMessage(args: ValidationArguments) {
    const fields = args.constraints[0];
    return `Only one of the following fields must be provided: ${fields.join(
      ', ',
    )}`;
  }
}

export function IsOneOf(
  fields: string[],
  validationOptions?: ValidationOptions,
) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [fields],
      validator: IsOneOfValidator,
    });
  };
}

@ValidatorConstraint({ async: false })
export class IsLessThanOrEqualConstraint
  implements ValidatorConstraintInterface
{
  validate(value: any, args: ValidationArguments) {
    const [property1, property2] = args.constraints;
    const obj = args.object as any;

    const firstValue = obj[property1];
    const secondValue = obj[property2];

    if (firstValue !== undefined && secondValue !== undefined) {
      return firstValue <= secondValue;
    }

    return true;
  }

  defaultMessage(args: ValidationArguments) {
    const [property1, property2] = args.constraints;
    return `${property1} must be less than or equal to ${property2}.`;
  }
}

export function IsLessThanOrEqual(
  property1: string,
  property2: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [property1, property2],
      validator: IsLessThanOrEqualConstraint,
    });
  };
}
