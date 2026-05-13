import { BaseEntity } from '../../../shared/infrastructure/base-entity';
import { IngredientCategory } from './pantry-item.entity';

export class IngredientCatalogItem implements BaseEntity {
  private _id: number;
  private _nameKey: string;
  private _category: IngredientCategory;
  private _caloriesPer100g: number;

  constructor(id: number, nameKey: string, category: IngredientCategory, caloriesPer100g: number) {
    this._id              = id;
    this._nameKey         = nameKey;
    this._category        = category;
    this._caloriesPer100g = caloriesPer100g;
  }

  get id(): number { return this._id; }
  get nameKey(): string { return this._nameKey; }
  get category(): IngredientCategory { return this._category; }
  get caloriesPer100g(): number { return this._caloriesPer100g; }
}
