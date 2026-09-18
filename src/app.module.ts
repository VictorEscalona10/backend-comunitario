import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { User } from './entities/user.entity';
import { Ingredient } from './entities/ingredient.entity';
import { Recipe } from './entities/recipe.entity';
import { RecipeIngredient } from './entities/recipe-ingredient.entity';
import { StockMovement } from './entities/stock-movement.entity';
import { IngredientsModule } from './ingredients/ingredients.module';
import { RecipesModule } from './recipes/recipes.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get<string>('DATABASE_URL');
        const isSsl = configService.get<string>('DB_SSL') === 'true' || Boolean(databaseUrl);

        if (databaseUrl) {
          // Limpiar parámetros no soportados por node-postgres si vienen en la URL copiada de Neon
          const cleanedUrl = databaseUrl
            .replace('&channel_binding=require', '')
            .replace('?channel_binding=require', '');

          return {
            type: 'postgres',
            url: cleanedUrl,
            entities: [User, Ingredient, Recipe, RecipeIngredient, StockMovement],
            synchronize: true, // Sincroniza esquema de tablas automáticamente en Neon
            ssl: {
              rejectUnauthorized: false,
            },
            extra: {
              ssl: {
                rejectUnauthorized: false,
              },
            },
          };
        }

        return {
          type: 'postgres',
          host: configService.get<string>('DB_HOST', 'localhost'),
          port: configService.get<number>('DB_PORT', 5432),
          username: configService.get<string>('DB_USER', 'postgres'),
          password: configService.get<string>('DB_PASS', 'Diminombre'),
          database: configService.get<string>('DB_NAME', 'gestion_inventario2'),
          entities: [User, Ingredient, Recipe, RecipeIngredient, StockMovement],
          synchronize: true, // Sincroniza esquema de entidades automáticamente en dev
          ssl: isSsl
            ? {
                rejectUnauthorized: false,
              }
            : false,
          extra: isSsl
            ? {
                ssl: {
                  rejectUnauthorized: false,
                },
              }
            : undefined,
        };
      },
    }),
    AuthModule,
    IngredientsModule,
    RecipesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
