import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { User } from '../schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService, private jwtService: JwtService) {}

  async validateUser(email: string, password: string): Promise<Partial<User> | null> {
    const user = await this.usersService.findByEmail(email);
    if (!user) return null;
    const match = await bcrypt.compare(password, user.password);
    if (!match) return null;
    const { password: _, ...result } = user as any;
    return result;
  }

  async login(user: Partial<User>) {
    const payload = { sub: (user as any)._id, email: user.email };
    return {
      accessToken: this.jwtService.sign(payload),
      user,
    };
  }

  async register(user: Partial<User>) {
    const existing = await this.usersService.findByEmail(user.email!);
    if (existing) {
      throw new ConflictException('Email already registered');
    }
    const hashed = await bcrypt.hash(user.password, 10);
    const created = await this.usersService.create({
      ...user,
      password: hashed,
      status: 'offline',
      lastSeen: new Date(),
    });
    const { password: _, ...result } = created as any;
    return result;
  }
}
