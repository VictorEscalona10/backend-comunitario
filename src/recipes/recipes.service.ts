// recipes.service.ts
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Recipe } from '../entities/recipe.entity';
import { RecipeIngredient } from '../entities/recipe-ingredient.entity';
import { Ingredient } from '../entities/ingredient.entity';
import { StockMovement } from '../entities/stock-movement.entity';
import { MovementType } from '../entities/enums';
import { CreateRecipeDto } from './dto/create-recipe.dto';

@Injectable()
export class RecipesService {
  constructor(
    @InjectRepository(Recipe)
    private recipesRepository: Repository<Recipe>,
    @InjectRepository(RecipeIngredient)
    private recipeIngredientRepository: Repository<RecipeIngredient>,
    @InjectRepository(Ingredient)
    private ingredientRepository: Repository<Ingredient>,
    @InjectRepository(StockMovement)
    private stockMovementRepository: Repository<StockMovement>,
  ) { }

  async getAllRecipes() {
    return this.recipesRepository.find({
      relations: ['ingredients', 'ingredients.ingredient'],
    });
  }

  async createRecipe(createRecipeDto: CreateRecipeDto) {
    // 1. Crear la receta
    const recipe = this.recipesRepository.create({
      name: createRecipeDto.name,
      description: createRecipeDto.description,
    });

    const savedRecipe = await this.recipesRepository.save(recipe);

    // 2. Crear los RecipeIngredient para cada ingrediente
    const recipeIngredients = await Promise.all(
      createRecipeDto.ingredients.map(async (ingredientDto) => {
        // Verificar que el ingrediente existe
        const ingredient = await this.ingredientRepository.findOne({
          where: { id: ingredientDto.ingredientId }
        });

        if (!ingredient) {
          throw new NotFoundException(`Ingrediente con ID ${ingredientDto.ingredientId} no encontrado`);
        }

        // Crear la relación RecipeIngredient
        const recipeIngredient = this.recipeIngredientRepository.create({
          quantity: ingredientDto.quantity,
          recipe: savedRecipe,
          ingredient: ingredient,
        });

        return this.recipeIngredientRepository.save(recipeIngredient);
      })
    );

    // 3. Retornar la receta con sus ingredientes
    return this.recipesRepository.findOne({
      where: { id: savedRecipe.id },
      relations: ['ingredients', 'ingredients.ingredient'],
    });
  }

  async deleteRecipe(recipeId: string) {
    const recipe = await this.recipesRepository.findOne({ where: { id: recipeId } });
    if (!recipe) {
      throw new NotFoundException(`Receta con ID ${recipeId} no encontrada`);
    }
    await this.recipesRepository.remove(recipe);
    return { message: 'Receta eliminada exitosamente' };
  }

  async prepareRecipe(recipeId: string, quantity: number) {
    // 1. Obtener receta con ingredientes
    const recipe = await this.recipesRepository.findOne({
      where: { id: recipeId },
      relations: ['ingredients', 'ingredients.ingredient'],
    });

    if (!recipe) {
      throw new NotFoundException('Receta no encontrada');
    }

    // 2. VALIDAR STOCK (ANTES DE TOCAR NADA)
    for (const recipeItem of recipe.ingredients) {
      const requiredAmount = recipeItem.quantity * quantity;
      const ingredient = recipeItem.ingredient;

      if (ingredient.currentStock < requiredAmount) {
        throw new BadRequestException(
          `Stock insuficiente para ${ingredient.name}. 
   Requerido: ${requiredAmount}, Disponible: ${ingredient.currentStock}`
        );
      }
    }

    // 3. DESCONTAR STOCK (ya sabemos que todos alcanzan)
    for (const recipeItem of recipe.ingredients) {
      const ingredient = recipeItem.ingredient;
      const requiredAmount = recipeItem.quantity * quantity;

      ingredient.currentStock -= requiredAmount;
      const savedIng = await this.ingredientRepository.save(ingredient);

      try {
        const movement = this.stockMovementRepository.create({
          type: MovementType.SALIDA_RECETA,
          quantity: requiredAmount,
          reason: `Preparación de receta "${recipe.name}" (x${quantity})`,
          ingredient: savedIng,
        });
        await this.stockMovementRepository.save(movement);
      } catch (e) {
        console.warn('Could not save stock movement log for recipe:', e.message);
      }
    }

    return {
      message: `Receta preparada ${quantity} vez/veces correctamente`,
    };
  }

}

