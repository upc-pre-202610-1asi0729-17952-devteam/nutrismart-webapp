import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment.development';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { User } from '../domain/model/user.entity';
import { IamApiEndpoint } from './iam-api-endpoint';
import { UserAssembler } from './user-assembler';
import { LoginResponse, UserResource } from './user-resource';

/**
 * Application-facing API façade for the IAM bounded context.
 *
 * Wraps {@link IamApiEndpoint} to expose domain-specific methods instead of
 * the generic CRUD interface. Components and the {@link IamStore} should
 * depend on this class, not on the endpoint directly.
 *
 * Provided in root so a single instance is shared across the application.
 */
@Injectable({ providedIn: 'root' })
export class IamApi extends BaseApi {
  private http = inject(HttpClient);
  private assembler = new UserAssembler();
  private endpoint: IamApiEndpoint;

  constructor() {
    super();
    this.endpoint = new IamApiEndpoint(this.http);
  }

  /**
   * Authenticates a user against the real backend.
   *
   * @param email    - The user's email address.
   * @param password - The user's password.
   * @returns Observable emitting the authenticated {@link User} with JWT token on success.
   */
  login(email: string, password: string): Observable<User> {
    return this.http
      .post<LoginResponse>(`${environment.apiBaseUrl}/auth/login`, { email, password })
      .pipe(
        switchMap((loginResp) => {
          const headers = new HttpHeaders({ Authorization: `Bearer ${loginResp.token}` });
          return this.http
            .get<UserResource>(
              `${environment.apiBaseUrl}${environment.iamEndpointPath}/${loginResp.userId}`,
              { headers },
            )
            .pipe(
              map((resource) => {
                const user = this.assembler.toEntityFromResource(resource);
                user.token = loginResp.token;
                return user;
              }),
            );
        }),
      );
  }

  /**
   * Checks whether an email address is already registered.
   *
   * @param email - The email address to check.
   * @returns Observable emitting `{ exists: boolean }`.
   */
  checkEmail(email: string): Observable<{ exists: boolean }> {
    return this.http.get<{ exists: boolean }>(
      `${environment.apiBaseUrl}/auth/check-email`,
      { params: { email } },
    );
  }

  /**
   * Fetches all registered users.
   *
   * @returns Observable emitting an array of {@link User} entities.
   */
  getUsers(): Observable<User[]> {
    return this.endpoint.getAll();
  }

  /**
   * Fetches a single user by their numeric ID.
   *
   * @param id - The numeric identifier of the user to retrieve.
   * @returns Observable emitting the matching {@link User} entity.
   */
  getUser(id: number): Observable<User> {
    return this.endpoint.getById(id);
  }

  /**
   * Creates a new user on the server.
   * When `password` is provided, it is included in the request body.
   *
   * @param user     - The {@link User} entity to persist.
   * @param password - Optional plain-text password for the new account.
   * @returns Observable emitting the created entity as returned by the server.
   */
  createUser(user: User, password?: string): Observable<User> {
    if (password !== undefined) {
      const resource: UserResource = { ...this.assembler.toResourceFromEntity(user), password };
      return this.http
        .post<UserResource>(`${environment.apiBaseUrl}${environment.iamEndpointPath}`, resource)
        .pipe(map((r) => this.assembler.toEntityFromResource(r)));
    }
    return this.endpoint.create(user);
  }

  /**
   * Replaces an existing user record with updated data.
   *
   * @param user - The updated {@link User} entity.
   * @returns Observable emitting the updated entity as returned by the server.
   */
  updateUser(user: User): Observable<User> {
    return this.endpoint.update(user, user.id);
  }

  /**
   * Deletes the user with the given ID.
   *
   * @param id - Numeric ID of the user to delete.
   * @returns Observable that completes when the deletion succeeds.
   */
  deleteUser(id: number): Observable<void> {
    return this.endpoint.delete(id);
  }

  /**
   * Requests a password reset email for the given address.
   * Always completes successfully regardless of whether the email is registered.
   *
   * @param email - The account email address.
   */
  forgotPassword(email: string): Observable<void> {
    return this.http.post<void>(`${environment.apiBaseUrl}/auth/forgot-password`, { email });
  }

  /**
   * Resets the password using a token received by email.
   *
   * @param token       - The UUID token from the reset link.
   * @param newPassword - The new plain-text password (min 8 chars).
   */
  resetPassword(token: string, newPassword: string): Observable<void> {
    return this.http.post<void>(`${environment.apiBaseUrl}/auth/reset-password`, { token, newPassword });
  }
}
