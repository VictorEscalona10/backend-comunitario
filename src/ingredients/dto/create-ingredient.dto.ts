// src/ingredients/dto/create-ingredient.dto.ts
import { 
  IsString, 
  IsEnum, 
  IsNumber, 
  Min, 
  MaxLength,
  IsNotEmpty,
  IsOptional
} from 'class-validator';
// Asegúrate de que la ruta a tu enum sea correcta
import { UnitOfMeasure } from '../../entities/enums'; 
import { Type, Transform } from 'class-transformer';

export class CreateIngredientDto {
  @IsString({ message: 'El nombre debe ser un texto' })
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @MaxLength(100, { message: 'El nombre no puede exceder los 100 caracteres' })
  @Transform(({ value }) => value?.trim())
  @Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    // 1. Todo a minúsculas
    // 2. Primera letra a mayúsculas + el resto en minúsculas
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
  })
  name: string;

  @IsEnum(UnitOfMeasure, { 
    message: `La unidad de medida es inválida. Opciones: ${Object.values(UnitOfMeasure).join(', ')}` 
  })
  unit_of_measure: UnitOfMeasure;

  @IsNumber({}, { message: 'El stock actual debe ser un número válido' })
  @Min(0, { message: 'El stock actual no puede ser negativo' })
  @IsOptional() // Hacemos opcional para que tome el default si no viene
  // Usamos Type para asegurar conversión correcta de string a number desde el JSON
  @Type(() => Number) 
  currentStock: number = 0;

  @IsNumber({}, { message: 'El stock mínimo debe ser un número válido' })
  @Min(0, { message: 'El stock mínimo no puede ser negativo' })
  @IsOptional()
  @Type(() => Number)
  minStock: number = 0;
}