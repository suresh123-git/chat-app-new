import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(user: Partial<User>): Promise<User> {
    const created = new this.userModel(user);
    return created.save();
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).lean();
  }

  async findById(id: string): Promise<User> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid user ID');
    }
    const user = await this.userModel.findById(id).lean();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async updateStatus(userId: string, status: 'online' | 'offline' | 'away') {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }
    const updated = await this.userModel.findByIdAndUpdate(userId, { status, lastSeen: new Date() }, { new: true }).lean();
    if (!updated) {
      throw new NotFoundException('User not found');
    }
    return updated;
  }

  async search(term: string, userId: string): Promise<User[]> {
    const trimmedTerm = term.trim();
    
    // If no search term, return first 20 users
    if (!trimmedTerm) {
      return this.userModel.find({ _id: { $ne: userId } }).limit(20).lean();
    }

    const query = {
      _id: { $ne: userId },
      $or: [
        { name: new RegExp(trimmedTerm, 'i') },
        { email: new RegExp(trimmedTerm, 'i') },
      ],
    };
    return this.userModel.find(query).limit(20).lean();
  }
}
