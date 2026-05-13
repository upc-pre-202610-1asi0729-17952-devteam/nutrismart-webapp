import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment.development';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { User } from '../domain/model/user.entity';
import { UserAssembler } from './user-assembler';
import { UserResource, UsersResponse } from './user-resource';

/**
 * HTTP endpoint for the IAM `/users` REST resource.
 *
 * Extends {@link BaseApiEndpoint} to inherit generic CRUD operations
 * (getAll, getById, create, update, delete) using the {@link UserAssembler}
 * for entity-resource conversion.
 *
 * @example
 * ```typescript
 * const endpoint = new IamApiEndpoint(httpClient);
 * endpoint.getAll().subscribe(users => console.log(users));
 * ```
 */
export class IamApiEndpoint extends BaseApiEndpoint<
  User,
  UserResource,
  UsersResponse,
  UserAssembler
> {
  /**
   * @param http - Angular's {@link HttpClient} injected by the parent service.
   */
  constructor(http: HttpClient) {
    super(http, environment.apiBaseUrl + environment.iamEndpointPath, new UserAssembler());
  }
}
