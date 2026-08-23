import { ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ingredient } from '../entities/ingredient.entity';
import { StockMovement } from '../entities/stock-movement.entity';
import { MovementType } from '../entities/enums';
import { CreateIngredientDto } from './dto/create-ingredient.dto';

@Injectable()
export class IngredientsService {
    constructor(
        @InjectRepository(Ingredient)
        private ingredientsRepository: Repository<Ingredient>,
        @InjectRepository(StockMovement)
        private stockMovementsRepository: Repository<StockMovement>,
    ) { }

    async createIngredient(data: CreateIngredientDto) {
        try {
            const ingredient = this.ingredientsRepository.findBy({
                name: (data.name).toLowerCase()
            });
            if (ingredient && (await ingredient).length > 0) {
                throw new ConflictException('Ingredient with this name already exists');
            }

            const newIngredient = this.ingredientsRepository.create(data);
            const saved = await this.ingredientsRepository.save(newIngredient);

            if (saved.currentStock > 0) {
                try {
                    const movement = this.stockMovementsRepository.create({
                        type: MovementType.ENTRADA,
                        quantity: saved.currentStock,
                        reason: 'Ingreso inicial al crear ingrediente',
                        ingredient: saved,
                    });
                    await this.stockMovementsRepository.save(movement);
                } catch (e) {
                    console.warn('Could not save stock movement log:', e.message);
                }
            }

            return saved;

        } catch (error) {
            throw new InternalServerErrorException('Error creating ingredient: ' + error.message);
        }
    }

    async findAll(): Promise<Ingredient[]> {
        return this.ingredientsRepository.find({
            where: { isActive: true },
            order: { id: 'ASC' },
        });
    }

    async findOneById(id: string): Promise<Ingredient> {
        const ingredient = await this.ingredientsRepository.findOneBy({ id, isActive: true });
        if (!ingredient) {
            throw new NotFoundException('Ingredient not found');
        }
        return ingredient;
    }

    async delete(name: string): Promise<void> {
        try {
            const ingredient = await this.ingredientsRepository.update({ name }, { isActive: false });
            if (ingredient.affected === 0) {
                throw new NotFoundException('ingrediente no encontrado')
            }

        } catch (error) {
            console.error('Error deleting ingredient:', error);
            throw error;
        }
    }

    async addStock(ingredientId: string, amount: number): Promise<Ingredient> {
        const ingredient = await this.ingredientsRepository.findOneBy({ id: ingredientId });
        if (!ingredient) {
            throw new NotFoundException('Ingredient not found');
        }
        const numericAmount = Number(amount);
        ingredient.currentStock += numericAmount;
        const saved = await this.ingredientsRepository.save(ingredient);

        try {
            const movement = this.stockMovementsRepository.create({
                type: MovementType.ENTRADA,
                quantity: numericAmount,
                reason: 'Reabastecimiento manual de stock',
                ingredient: saved,
            });
            await this.stockMovementsRepository.save(movement);
        } catch (e) {
            console.warn('Could not save stock movement log:', e.message);
        }

        return saved;
    }

    async restaStock(ingredientId: string, amount: number): Promise<Ingredient> {
        const ingredient = await this.ingredientsRepository.findOneBy({ id: ingredientId });
        if (!ingredient) {
            throw new NotFoundException('Ingredient not found');
        }
        const numericAmount = Number(amount);
        ingredient.currentStock -= numericAmount;
        const saved = await this.ingredientsRepository.save(ingredient);

        try {
            const movement = this.stockMovementsRepository.create({
                type: MovementType.SALIDA_MANUAL,
                quantity: numericAmount,
                reason: 'Ajuste manual de salida de stock',
                ingredient: saved,
            });
            await this.stockMovementsRepository.save(movement);
        } catch (e) {
            console.warn('Could not save stock movement log:', e.message);
        }

        return saved;
    }

    async getMovements(): Promise<StockMovement[]> {
        try {
            return await this.stockMovementsRepository.find({
                relations: ['ingredient'],
                order: { createdAt: 'DESC' },
                take: 50,
            });
        } catch (e) {
            console.warn('Could not fetch stock movements:', e.message);
            return [];
        }
    }

    async getStats() {
        const ingredients = await this.findAll();
        const movements = await this.getMovements();

        let totalIngresado = 0;
        let totalUtilizado = 0;

        movements.forEach((m) => {
            if (m.type === MovementType.ENTRADA) {
                totalIngresado += Number(m.quantity || 0);
            } else {
                totalUtilizado += Number(m.quantity || 0);
            }
        });

        return {
            totalIngredientes: ingredients.length,
            stockTotal: ingredients.reduce((acc, i) => acc + (i.currentStock || 0), 0),
            lowStockCount: ingredients.filter((i) => (i.currentStock || 0) <= (i.minStock || 0)).length,
            totalIngresado,
            totalUtilizado,
            movements,
        };
    }
}

