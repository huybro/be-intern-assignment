import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { Follow } from '../entities/Follow';
import { User } from '../entities/User';
import { UserActivity, ActivityType } from '../entities/UserActivity';
import { validate } from '../middleware/validation.middleware';
import { followUserSchema, getFollowersSchema, getFollowingSchema } from '../validations/follow.validation';

const followRepository = AppDataSource.getRepository(Follow);
const userRepository = AppDataSource.getRepository(User);
const activityRepository = AppDataSource.getRepository(UserActivity);

export class FollowController {
  // Follow a user
  followUser = async (req: Request, res: Response) => {
    try {
      const { followingId } = req.body;
      const followerId = req.body.userId;

      if (!followerId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      if (followerId === followingId) {
        return res.status(400).json({ message: 'Cannot follow yourself' });
      }

      const following = await userRepository.findOne({ where: { id: followingId } });
      if (!following) {
        return res.status(404).json({ message: 'User to follow not found' });
      }

      const existingFollow = await followRepository.findOne({
        where: {
          follower: { id: followerId },
          following: { id: followingId },
        },
      });

      if (existingFollow) {
        return res.status(400).json({ message: 'Already following this user' });
      }

      const follow = new Follow();
      follow.follower = { id: followerId } as any;
      follow.following = { id: followingId } as any;

      const savedFollow = await followRepository.save(follow);

      // Create activity for follower
      const followerActivity = new UserActivity();
      followerActivity.user = { id: followerId } as any;
      followerActivity.type = ActivityType.FOLLOW;
      followerActivity.follow = savedFollow;
      followerActivity.metadata = { action: 'user_followed' };
      await activityRepository.save(followerActivity);

      // Create activity for following user
      const followingActivity = new UserActivity();
      followingActivity.user = { id: followingId } as any;
      followingActivity.type = ActivityType.FOLLOW;
      followingActivity.follow = savedFollow;
      followingActivity.metadata = { action: 'user_followed_by' };
      await activityRepository.save(followingActivity);

      res.status(201).json(savedFollow);
    } catch (error) {
      res.status(500).json({ message: 'Error following user', error });
    }
  };

  // Unfollow a user
  unfollowUser = async (req: Request, res: Response) => {
    try {
      const followingId = parseInt(req.params.id);
      const followerId = req.body.userId;

      if (!followerId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const follow = await followRepository.findOne({
        where: {
          follower: { id: followerId },
          following: { id: followingId },
        },
      });

      if (!follow) {
        return res.status(404).json({ message: 'Follow relationship not found' });
      }

      // Create activity for follower
      const followerActivity = new UserActivity();
      followerActivity.user = { id: followerId } as any;
      followerActivity.type = ActivityType.UNFOLLOW;
      followerActivity.follow = follow;
      followerActivity.metadata = { action: 'user_unfollowed' };
      await activityRepository.save(followerActivity);

      // Create activity for following user
      const followingActivity = new UserActivity();
      followingActivity.user = { id: followingId } as any;
      followingActivity.type = ActivityType.UNFOLLOW;
      followingActivity.follow = follow;
      followingActivity.metadata = { action: 'user_unfollowed_by' };
      await activityRepository.save(followingActivity);

      await followRepository.remove(follow);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Error unfollowing user', error });
    }
  };

  // Get user's followers
  getFollowers = async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const { limit = 10, offset = 0 } = req.query;
      const currentUserId = req.body.userId;

      if (!currentUserId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const [followers, total] = await followRepository.findAndCount({
        where: { following: { id: userId } },
        relations: ['follower'],
        order: { createdAt: 'DESC' },
        take: Number(limit),
        skip: Number(offset),
      });

      res.json({
        followers: followers.map(f => f.follower),
        total,
      });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching followers', error });
    }
  };

  // Get users that a user is following
  getFollowing = async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const { limit = 10, offset = 0 } = req.query;
      const currentUserId = req.body.userId;

      if (!currentUserId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const [following, total] = await followRepository.findAndCount({
        where: { follower: { id: userId } },
        relations: ['following'],
        order: { createdAt: 'DESC' },
        take: Number(limit),
        skip: Number(offset),
      });

      res.json({
        following: following.map(f => f.following),
        total,
      });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching following', error });
    }
  };
} 