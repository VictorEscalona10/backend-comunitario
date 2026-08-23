import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, Unique } from 'typeorm';
import { UnitOfMeasure } from './enums';
import { RecipeIngredient } from './recipe-ingredient.entity';
import { StockMovement } from './stock-movement.entity';

@Entity()
@Unique(['name'])
export class Ingredient {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string; 

  @Column({
    type: 'enum',
    enum: UnitOfMeasure,
    default: UnitOfMeasure.GRAMOS
  })
  unit_of_measure: UnitOfMeasure;

  @Column('integer', { default: 0 })
  currentStock: number;

  @Column('integer', { default: 0 })
  minStock: number;

  @Column('integer', { default: 0 })
  costPerUnit: number;

  // Relación: Un ingrediente está en muchas recetas (a través de la tabla intermedia)
  @OneToMany(() => RecipeIngredient, (recipeIngredient) => recipeIngredient.ingredient)
  recipeItems: RecipeIngredient[];

  @Column({ default: true })
  isActive: boolean;

  // Relación: Un ingrediente tiene muchos movimientos de historial
  @OneToMany(() => StockMovement, (movement) => movement.ingredient)
  stockMovements: StockMovement[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}