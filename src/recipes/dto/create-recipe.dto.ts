// create-recipe.dto.ts
import { 
  IsArray, 
  IsString, 
  MinLength, 
  ArrayNotEmpty, 
  IsNotEmpty, 
  ValidateNested, 
  IsNumber, 
  Min 
} from "class-validator";
import { Type } from "class-transformer";

class RecipeIngredientDto {
  @IsString()
  @IsNotEmpty()
  ingredientId: string; // ID del ingrediente existente

  @IsNumber()
  @Min(0.01, { message: 'La cantidad debe ser mayor a 0' })
  quantity: number; // Cantidad en la unidad de medida del ingrediente
}

export class CreateRecipeDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
  name: string; // Cambié 'title' por 'name' para coincidir con la entidad Recipe

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => RecipeIngredientDto)
  ingredients: RecipeIngredientDto[];

  @IsString()
  @IsNotEmpty()
  description: string;
}