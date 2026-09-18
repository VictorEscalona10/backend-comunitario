import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { Response } from 'express';
import { User } from '../entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    await this.seedDefaultAdmin();
  }

  async seedDefaultAdmin() {
    try {
      const count = await this.userRepository.count();
      if (count === 0) {
        this.logger.log('No users found. Creating default administrator account...');
        const hashedPassword = await this.hashPassword('Admin123456!');
        const admin = this.userRepository.create({
          email: 'admin@comunitario.local',
          name: 'Administrador',
          last_name: 'Principal',
          password: hashedPassword,
          role: 'ADMIN',
          isActive: true,
        });
        await this.userRepository.save(admin);
        this.logger.log('Default admin created -> Email: admin@comunitario.local | Password: Admin123456!');
      }
    } catch (error) {
      this.logger.warn('Could not verify/seed admin account:', error.message);
    }
  }

  private get saltRounds(): number {

    const rounds = this.configService.get<string>('BCRYPT_SALT_ROUNDS');
    const parsed = parseInt(rounds || '10', 10);
    return isNaN(parsed) ? 10 : parsed;
  }

  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(this.saltRounds);
    return bcrypt.hash(password, salt);
  }

  async comparePasswords(plain: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plain, hashed);
  }

  setAuthCookie(res: Response, token: string) {
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';
    res.cookie('jwt_token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
      path: '/',
    });
  }

  clearAuthCookie(res: Response) {
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';
    res.clearCookie('jwt_token', {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/',
    });
  }

  async register(registerDto: RegisterDto, res?: Response) {
    const normalizedEmail = registerDto.email.trim().toLowerCase();

    const existingUser = await this.userRepository.findOne({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new ConflictException('Ya existe un usuario registrado con este correo electrónico');
    }

    try {
      const hashedPassword = await this.hashPassword(registerDto.password);

      const newUser = this.userRepository.create({
        email: normalizedEmail,
        name: registerDto.name.trim(),
        last_name: registerDto.last_name.trim(),
        password: hashedPassword,
        role: registerDto.role || 'ADMIN',
        isActive: true,
      });

      const savedUser = await this.userRepository.save(newUser);

      // Generar JWT
      const payload: JwtPayload = {
        sub: savedUser.id,
        email: savedUser.email,
        role: savedUser.role,
      };
      const token = this.jwtService.sign(payload);

      if (res) {
        this.setAuthCookie(res, token);
      }

      // Devolver usuario sin contraseña
      const { password, ...safeUser } = savedUser;
      return {
        message: 'Usuario registrado exitosamente',
        user: safeUser,
        token, // También se envía en el cuerpo para clientes que lo prefieran
      };
    } catch (error) {
      this.logger.error('Error registrando usuario:', error);
      if (error instanceof ConflictException) throw error;
      throw new InternalServerErrorException('Error al crear la cuenta de usuario');
    }
  }

  async login(loginDto: LoginDto, res: Response) {
    const normalizedEmail = loginDto.email.trim().toLowerCase();

    // Consultamos usuario incluyendo el password (select: false en entity)
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('LOWER(user.email) = :email', { email: normalizedEmail })
      .getOne();

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('La cuenta de usuario se encuentra desactivada');
    }

    const isMatch = await this.comparePasswords(loginDto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    const token = this.jwtService.sign(payload);

    // Guardar cookie HttpOnly en la respuesta
    this.setAuthCookie(res, token);

    const { password, ...safeUser } = user;
    return {
      message: 'Inicio de sesión exitoso',
      user: safeUser,
      token,
    };
  }

  async logout(res: Response) {
    this.clearAuthCookie(res);
    return {
      message: 'Sesión cerrada correctamente',
    };
  }

  async getProfile(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId, isActive: true },
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    return user;
  }
}
