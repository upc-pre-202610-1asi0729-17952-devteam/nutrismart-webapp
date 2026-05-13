import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { DietaryRestriction } from '../../iam/domain/model/dietary-restriction.enum';
import { MenuAnalysis, RankedDish, RestrictedDish } from '../domain/model/menu-analysis.entity';
import { MenuAnalysisResource, MenuAnalysisResponse } from './restaurant-menu-resource';

/**
 * Maps between {@link MenuAnalysis} domain entities and their API resource DTOs.
 *
 * @author Del Aguila Del Aguila, Olenka Priscilla
 */
export class MenuAnalysisAssembler
  implements BaseAssembler<MenuAnalysis, MenuAnalysisResource, MenuAnalysisResponse>
{
  toEntityFromResource(r: MenuAnalysisResource): MenuAnalysis {
    const ranked: RankedDish[] = r.ranked_dishes.map(d => new RankedDish({
      rank:               d.rank,
      name:               d.name,
      nameKey:            d.name_key ?? null,
      calories:           d.calories,
      protein:            d.protein,
      carbs:              d.carbs,
      fat:                d.fat,
      compatibilityScore: d.compatibility_score,
      justification:      d.justification,
      justificationKey:   d.justification_key ?? null,
    }));
    const restricted: RestrictedDish[] = r.restricted_dishes.map(d => new RestrictedDish({
      name:        d.name,
      nameKey:     d.name_key ?? null,
      restriction: d.restriction as DietaryRestriction,
    }));
    return new MenuAnalysis({
      id:               r.id,
      rankedDishes:     ranked,
      restrictedDishes: restricted,
      scannedAt:        r.scanned_at,
      restaurantName:   r.restaurant_name,
    });
  }

  toResourceFromEntity(e: MenuAnalysis): MenuAnalysisResource {
    return {
      id:              e.id,
      ranked_dishes:   e.rankedDishes.map(d => ({
        rank:                d.rank,
        name:                d.name,
        name_key:            d.nameKey,
        calories:            d.calories,
        protein:             d.protein,
        carbs:               d.carbs,
        fat:                 d.fat,
        compatibility_score: d.compatibilityScore,
        justification:       d.justification,
        justification_key:   d.justificationKey,
      })),
      restricted_dishes: e.restrictedDishes.map(d => ({
        name:        d.name,
        name_key:    d.nameKey,
        restriction: d.restriction,
      })),
      scanned_at:      e.scannedAt,
      restaurant_name: e.restaurantName,
    };
  }

  toEntitiesFromResponse(response: MenuAnalysisResponse): MenuAnalysis[] {
    return response.analyses.map(r => this.toEntityFromResource(r));
  }
}
