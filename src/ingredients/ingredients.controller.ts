import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { IngredientsService } from './ingredients.service';
import { CreateIngredientDto } from './dto/create-ingredient.dto';

@Controller('ingredients')
export class IngredientsController {
  constructor(private readonly ingredientsService: IngredientsService) {}

  @Get('getAll')
  async findAllIngredients() {
    return this.ingredientsService.findAll();
  }

  @Get('movements')
  async getMovements() {
    return this.ingredientsService.getMovements();
  }

  @Get('stats')
  async getStats() {
    return this.ingredientsService.getStats();
  }

  @Get('getOne/:id')
  async findOneIngredient(@Param('id') id: string) {
    return this.ingredientsService.findOneById(id);
  }

  @Post('create')
  async createIngredient(@Body() createIngredientDto: CreateIngredientDto) {
    return this.ingredientsService.createIngredient(createIngredientDto);
  }

  @Delete('delete/:name')
  async deleteIngredient(@Param('name') name: string) {
    return this.ingredientsService.delete(name);
  }

  @Patch('addStock')
  async addStock(
    @Query('ingredientId') ingredientId: string,
    @Query('amount') amount: number,
  ) {
    return this.ingredientsService.addStock(ingredientId, amount);
  }

  @Patch('restaStock')
  async restaStock(
    @Query('ingredientId') ingredientId: string,
    @Query('amount') amount: number,
  ) {
    return this.ingredientsService.restaStock(ingredientId, amount);
  }
}
