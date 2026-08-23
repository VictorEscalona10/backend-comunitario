import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Ingredient } from './entities/ingredient.entity';
import { Recipe } from './entities/recipe.entity';
import { RecipeIngredient } from './entities/recipe-ingredient.entity';
import { StockMovement } from './entities/stock-movement.entity';
import { IngredientsModule } from './ingredients/ingredients.module';
import { RecipesModule } from './recipes/recipes.module';

@Module({
  imports: [TypeOrmModule.forRoot({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: 'Diminombre',
    database: 'gestion_inventario2',
    entities: [User, Ingredient, Recipe, RecipeIngredient, StockMovement],
    synchronize: false, // ¡OJO! Solo para desarrollo (crea las tablas automáticamente
  }), IngredientsModule, RecipesModule, RecipesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
