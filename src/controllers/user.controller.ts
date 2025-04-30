import { Request, Response } from 'express';
import { User } from '../entities/User';
import { AppDataSource } from '../data-source';
import { Follow } from '../entities/Follow';
import { Post } from '../entities/Post';
import { Like } from '../entities/Like';
import { UserActivity, ActivityType } from '../entities/UserActivity';
import { Between } from 'typeorm';

export class UserController {
  private userRepository = AppDataSource.getRepository(User);
  private followRepository = AppDataSource.getRepository(Follow);
  private postRepository = AppDataSource.getRepository(Post);
  private likeRepository = AppDataSource.getRepository(Like);
  private activityRepository = AppDataSource.getRepository(UserActivity);

  async getAllUsers(req: Request, res: Response) {
    try {
      const users = await this.userRepository.find();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching users', error });
    }
  }

  async getUserById(req: Request, res: Response) {
    try {
      const user = await this.userRepository.findOneBy({
        id: parseInt(req.params.id),
      });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching user', error });
    }
  }

  async createUser(req: Request, res: Response) {
    try {
      const user = this.userRepository.create(req.body);
      const savedUser = await this.userRepository.save(user, { reload: true });
      await this.createActivity(savedUser, ActivityType.POST, { metadata: { action: 'user_created' } });
      res.status(201).json(savedUser);
    } catch (error) {
      res.status(500).json({ message: 'Error creating user', error });
    }
  }

  async updateUser(req: Request, res: Response) {
    try {
      const userId = req.body.userId; // Set by `authenticate` middleware
       const user = await this.userRepository.findOneBy({ id: userId });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      this.userRepository.merge(user, req.body);
      const result = await this.userRepository.save(user);
  
      await this.createActivity(result, ActivityType.POST, {
        metadata: { action: 'user_updated' },
      });
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: 'Error updating user', error });
    }
  }

  async deleteUser(req: Request, res: Response) {
    try {
      const result = await this.userRepository.delete(parseInt(req.params.id));
      if (result.affected === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Error deleting user', error });
    }
  }

  async getFollowers(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { limit = 10, offset = 0 } = req.query;

      const [followers, total] = await this.followRepository.findAndCount({
        where: { following: { id: Number(id) } },
        relations: ['follower'],
        order: { createdAt: 'DESC' },
        take: Number(limit),
        skip: Number(offset),
      });

      const followerUsers = followers.map(follow => follow.follower);

      res.json({
        followers: followerUsers,
        total,
        limit: Number(limit),
        offset: Number(offset),
      });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching followers', error });
    }
  }

  async getUserActivity(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { limit = 10, offset = 0, type, startDate, endDate } = req.query;

      const where: any = { user: { id: Number(id) } };

      if (type) {
        where.type = type;
      }

      if (startDate && endDate) {
        where.createdAt = Between(new Date(startDate as string), new Date(endDate as string));
      }

      const [activities, total] = await Promise.all([
        this.activityRepository.find({
          where,
          relations: ['user', 'post', 'post.author', 'post.hashtags', 'like', 'like.post', 'follow', 'follow.following'],
          order: { createdAt: 'DESC' },
          take: Number(limit),
          skip: Number(offset),
        }),
        this.activityRepository.count({ where }),
      ]);

      res.json({
        activities,
        total,
        limit: Number(limit),
        offset: Number(offset),
      });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching user activity', error });
    }
  }

  private async createActivity(user: User | User[], type: ActivityType, data: { post?: Post; like?: Like; follow?: Follow; metadata?: any }) {
    const users = Array.isArray(user) ? user : [user];
    const activities = users.map(u => this.activityRepository.create({
      user: u,
      type,
      ...data,
    }));
    return this.activityRepository.save(activities);
  }
}
