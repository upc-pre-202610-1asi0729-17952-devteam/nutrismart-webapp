import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { User } from '../domain/model/user.entity';
import { IamApiEndpoint } from './iam-api-endpoint';

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
  /** Underlying HTTP endpoint that performs the actual requests. */
  private endpoint: IamApiEndpoint;

  /**
   * @param http - Angular's {@link HttpClient} for making HTTP requests.
   */
  constructor() {
    super();
    const http = inject(HttpClient);
    this.endpoint = new IamApiEndpoint(http);
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
   *
   * @param user - The {@link User} entity to persist.
   * @returns Observable emitting the created entity as returned by the server.
   */
  createUser(user: User): Observable<User> {
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
}
