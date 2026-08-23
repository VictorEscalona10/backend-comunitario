import { IsInt, Min } from 'class-validator';

export class PrepareRecipeDto {
  @IsInt()
  @Min(1, { message: 'La cantidad debe ser al menos 1' })
  quantity: number;
}
