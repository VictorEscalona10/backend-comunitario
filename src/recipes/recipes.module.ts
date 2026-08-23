// recipes.module.ts
import { Module } from '@nestjs/common';
import { RecipesService } from './recipes.service';
import { RecipesController } from './recipes.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Recipe } from '../entities/recipe.entity';
import { RecipeIngredient } from '../entities/recipe-ingredient.entity';
import { Ingredient } from '../entities/ingredient.entity';
import { StockMovement } from '../entities/stock-movement.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Recipe, RecipeIngredient, Ingredient, StockMovement]),
  ],
  providers: [RecipesService],
  controllers: [RecipesController]
})
export class RecipesModule {}