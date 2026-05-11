import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment.development';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { BodyMetric } from '../domain/model/body-metric.entity';
import { BodyComposition } from '../domain/model/body-composition.entity';
import { BodyMetricAssembler, BodyCompositionAssembler } from './metabolic-assembler';
import {
  BodyMetricResource, BodyMetricsResponse,
  BodyCompositionResource, BodyCompositionResponse,
} from './metabolic-resource';

/**
 * HTTP endpoint for the `/body-metrics` REST resource.
 *
 * @author Espinoza Cruz, Angela Milagros
 */
export class BodyMetricEndpoint extends BaseApiEndpoint<
  BodyMetric, BodyMetricResource, BodyMetricsResponse, BodyMetricAssembler
> {
  constructor(http: HttpClient) {
    super(
      http,
      environment.apiBaseUrl + environment.bodyMetricsEndpointPath,
      new BodyMetricAssembler(),
    );
  }

  getByUserId(userId: number | string): Observable<BodyMetric[]> {
    return this.http.get<BodyMetricResource[]>(this.endpointUrl).pipe(
      map(resources =>
        resources
          .filter(r => String(r.user_id) === String(userId))
          .map(r => this.assembler.toEntityFromResource(r))
      ),
    );
  }
}

/**
 * HTTP endpoint for the `/body-compositions` REST resource.
 *
 * @author Espinoza Cruz, Angela Milagros
 */
export class BodyCompositionEndpoint extends BaseApiEndpoint<
  BodyComposition, BodyCompositionResource, BodyCompositionResponse, BodyCompositionAssembler
> {
  constructor(http: HttpClient) {
    super(
      http,
      environment.apiBaseUrl + environment.bodyCompositionsEndpointPath,
      new BodyCompositionAssembler(),
    );
  }

  getLatestByUserId(userId: number | string): Observable<BodyComposition | null> {
    return this.http.get<BodyCompositionResource[]>(this.endpointUrl).pipe(
      map(resources => {
        const matches = resources.filter(r => String(r.user_id) === String(userId));
        if (!matches.length) return null;
        const latest = [...matches].sort(
          (a, b) => new Date(b.measured_at).getTime() - new Date(a.measured_at).getTime(),
        )[0];
        return this.assembler.toEntityFromResource(latest);
      }),
    );
  }
}
