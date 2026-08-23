// recipes.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  UsePipes,
  ValidationPipe,
  Delete,
  Param
} from '@nestjs/common';
import { RecipesService } from './recipes.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { PrepareRecipeDto } from './dto/prepare-recipte.dto';

@Controller('recipes')
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) { }

  @Get()
  async getAllRecipes() {
    return this.recipesService.getAllRecipes();
  }

  @Post()
  async createRecipe(@Body() createRecipeDto: CreateRecipeDto) {
    return this.recipesService.createRecipe(createRecipeDto);
  }

  @Post(':id/prepare')
  async prepareRecipe(
    @Param('id') recipeId: string,
    @Body() dto: PrepareRecipeDto,
  ) {
    return this.recipesService.prepareRecipe(recipeId, dto.quantity);
  }

  @Delete(':id')
  async deleteRecipe(@Param('id') recipeId: string) {
    return this.recipesService.deleteRecipe(recipeId);
  }
}