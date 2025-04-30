import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { Like } from '../entities/Like';
import { Post } from '../entities/Post';
import { UserActivity, ActivityType } from '../entities/UserActivity';
import { validate } from '../middleware/validation.middleware';
import { likePostSchema, getLikesSchema } from '../validations/like.validation';

const likeRepository = AppDataSource.getRepository(Like);
const postRepository = AppDataSource.getRepository(Post);
const activityRepository = AppDataSource.getRepository(UserActivity);

export class LikeController {
  // Like a post
  likePost = async (req: Request, res: Response) => {
    try {
      const postId = parseInt(req.params.postId);
      const { userId } = req.body;

      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const post = await postRepository.findOne({ where: { id: postId } });
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }

      const existingLike = await likeRepository.findOne({
        where: { user: { id: userId }, post: { id: postId } },
      });

      if (existingLike) {
        return res.status(400).json({ message: 'Post already liked' });
      }

      const like = new Like();
      like.user = { id: userId } as any;
      like.post = { id: postId } as any;

      const savedLike = await likeRepository.save(like);

      // Create activity
      const activity = new UserActivity();
      activity.user = { id: userId } as any;
      activity.type = ActivityType.LIKE;
      activity.like = savedLike;
      activity.metadata = { action: 'post_liked' };
      await activityRepository.save(activity);

      res.status(201).json(savedLike);
    } catch (error) {
      res.status(500).json({ message: 'Error liking post', error });
    }
  };

  // Unlike a post
  unlikePost = async (req: Request, res: Response) => {
    try {
      const postId = parseInt(req.params.postId);
      const { userId } = req.body;

      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const like = await likeRepository.findOne({
        where: { user: { id: userId }, post: { id: postId } },
      });

      if (!like) {
        return res.status(404).json({ message: 'Like not found' });
      }

      // Create activity before removing
      const activity = new UserActivity();
      activity.user = { id: userId } as any;
      activity.type = ActivityType.LIKE;
      activity.like = like;
      activity.metadata = { action: 'post_unliked' };
      await activityRepository.save(activity);

      await likeRepository.remove(like);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Error unliking post', error });
    }
  };

  // Get likes for a post
  getPostLikes = async (req: Request, res: Response) => {
    try {
      const { postId } = req.params;
      const { limit = 10, offset = 0 } = req.query;
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const likes = await likeRepository.find({
        where: { post: { id: parseInt(postId) } },
        relations: ['user'],
        order: { createdAt: 'DESC' },
        take: Number(limit),
        skip: Number(offset),
      });

      res.json(likes);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching likes', error });
    }
  };
} 