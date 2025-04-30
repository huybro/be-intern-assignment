import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { Post } from '../entities/Post';
import { Hashtag } from '../entities/Hashtag';
import { Like } from '../entities/Like';
import { Follow } from '../entities/Follow';
import { UserActivity, ActivityType } from '../entities/UserActivity';
import { User } from '../entities/User';
import { validate } from '../middleware/validation.middleware';
import { createPostSchema, updatePostSchema, getPostsSchema, getPostsByHashtagSchema } from '../validations/post.validation';
import { In } from 'typeorm';

const postRepository = AppDataSource.getRepository(Post);
const hashtagRepository = AppDataSource.getRepository(Hashtag);
const likeRepository = AppDataSource.getRepository(Like);
const followRepository = AppDataSource.getRepository(Follow);
const activityRepository = AppDataSource.getRepository(UserActivity);

export class PostController {
  // Create a new post
  createPost = async (req: Request, res: Response) => {
    try {
      const { content, hashtags, userId } = req.body;

      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const post = new Post();
      post.content = content;
      post.author = { id: userId } as any;

      if (hashtags && hashtags.length > 0) {
        const hashtagEntities = await Promise.all(
          hashtags.map(async (name: string) => {
            let hashtag = await hashtagRepository.findOne({ where: { name } });
            if (!hashtag) {
              hashtag = new Hashtag();
              hashtag.name = name;
              await hashtagRepository.save(hashtag);
            }
            return hashtag;
          })
        );
        post.hashtags = hashtagEntities;
      }

      const savedPost = await postRepository.save(post);

      // Create activity
      const activity = new UserActivity();
      activity.user = { id: userId } as any;
      activity.type = ActivityType.POST;
      activity.post = savedPost;
      activity.metadata = { action: 'post_created' };
      await activityRepository.save(activity);

      res.status(201).json(savedPost);
    } catch (error) {
      res.status(500).json({ message: 'Error creating post', error });
    }
  };

  // Get a post by ID
  getPost = async (req: Request, res: Response) => {
    try {
      const post = await postRepository.findOne({
        where: { id: parseInt(req.params.id) },
        relations: ['author', 'hashtags', 'likes'],
      });

      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }

      res.json(post);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching post', error });
    }
  };

  // Update a post
  updatePost = async (req: Request, res: Response) => {
    try {
      const { content, hashtags, userId } = req.body;
      const postId = parseInt(req.params.id);

      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const post = await postRepository.findOne({
        where: { id: postId },
        relations: ['author', 'hashtags'],
      });

      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }

      if (post.author.id !== userId) {
        return res.status(403).json({ message: 'Not authorized to update this post' });
      }

      if (content) post.content = content;

      if (hashtags) {
        const hashtagEntities = await Promise.all(
          hashtags.map(async (name: string) => {
            let hashtag = await hashtagRepository.findOne({ where: { name } });
            if (!hashtag) {
              hashtag = new Hashtag();
              hashtag.name = name;
              await hashtagRepository.save(hashtag);
            }
            return hashtag;
          })
        );
        post.hashtags = hashtagEntities;
      }

      const updatedPost = await postRepository.save(post);

      // Create activity
      const activity = new UserActivity();
      activity.user = { id: userId } as any;
      activity.type = ActivityType.POST;
      activity.post = updatedPost;
      activity.metadata = { action: 'post_updated' };
      await activityRepository.save(activity);

      res.json(updatedPost);
    } catch (error) {
      res.status(500).json({ message: 'Error updating post', error });
    }
  };

  // Delete a post
  deletePost = async (req: Request, res: Response) => {
    try {
      const postId = parseInt(req.params.id);
      const { userId } = req.body;

      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const post = await postRepository.findOne({
        where: { id: postId },
        relations: ['author'],
      });

      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }

      if (post.author.id !== userId) {
        return res.status(403).json({ message: 'Not authorized to delete this post' });
      }

      // Create activity before deleting
      const activity = new UserActivity();
      activity.user = { id: userId } as any;
      activity.type = ActivityType.POST;
      activity.post = post;
      activity.metadata = { action: 'post_deleted' };
      await activityRepository.save(activity);

      await postRepository.remove(post);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Error deleting post', error });
    }
  };

  // Get user's feed (posts from followed users)
  getFeed = async (req: Request, res: Response) => {
    try {
      const { limit = 10, offset = 0 } = req.query;
      const { userId } = req.body;

      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const following = await followRepository.find({
        where: { follower: { id: Number(userId) } },
        relations: ['following'],
      });

      const followingIds = following.map(f => f.following.id);
      
      const [posts, total] = await Promise.all([
        postRepository.find({
          where: { author: { id: In(followingIds) } },
          relations: ['author', 'hashtags', 'likes'],
          order: { createdAt: 'DESC' },
          take: Number(limit),
          skip: Number(offset),
        }),
        postRepository.count({
          where: { author: { id: In(followingIds) } },
        }),
      ]);

      res.json({
        posts,
        total,
        limit: Number(limit),
        offset: Number(offset),
      });

    } catch (error) {
      console.error("getFeed error:", error); // ✅ Log full error to console
    
      res.status(500).json({
        message: 'Error fetching feed',
        error: error instanceof Error ? error.message : String(error)
      });
    }

  };

  // Get posts by hashtag
  getPostsByHashtag = async (req: Request, res: Response) => {
    try {
      const { tag } = req.params;
      const { limit = 10, offset = 0 } = req.query;
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const [posts, total] = await Promise.all([
        postRepository.find({
          where: { hashtags: { name: tag } },
          relations: ['author', 'hashtags', 'likes'],
          order: { createdAt: 'DESC' },
          take: Number(limit),
          skip: Number(offset),
        }),
        postRepository.count({
          where: { hashtags: { name: tag } },
        }),
      ]);

      res.json({
        posts,
        total,
        limit: Number(limit),
        offset: Number(offset),
      });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching posts by hashtag', error });
    }
  };
} 