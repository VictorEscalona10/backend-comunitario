import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { MovementType } from './enums';
import { Ingredient } from './ingredient.entity';
import { User } from './user.entity';

@Entity()
export class StockMovement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: MovementType
  })
  type: MovementType;

  @Column('float')
  quantity: number; // Positivo para entrada, negativo para salida

  @Column({ nullable: true })
  reason: string; // "Se cayó", "Producción del día"

  // Relación: Qué ingrediente se movió
  @ManyToOne(() => Ingredient, (ingredient) => ingredient.stockMovements, { nullable: true, onDelete: 'SET NULL' })
  ingredient: Ingredient;

  // Relación: Quién hizo el movimiento
  @ManyToOne(() => User, (user) => user.stockMovements, { nullable: true, onDelete: 'SET NULL' })
  user?: User;

  @CreateDateColumn()
  createdAt: Date;
}