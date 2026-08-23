// src/entities/user.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { StockMovement } from './stock-movement.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid') // Usamos UUID en lugar de CUID (estándar en TypeORM)
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @Column()
  last_name: string;

  // Relación: Un usuario puede hacer muchos movimientos
  @OneToMany(() => StockMovement, (movement) => movement.user)
  stockMovements: StockMovement[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}