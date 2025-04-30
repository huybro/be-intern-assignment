import { Router } from 'express';
import { LikeController } from '../controllers/like.controller';
import { validate } from '../middleware/validation.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { likePostSchema, getLikesSchema } from '../validations/like.validation';

export const likeRouter = Router();
const likeController = new LikeController();

// POST /api/likes/:postId
likeRouter.post('/:postId', authenticate, likeController.likePost);

// DELETE /api/likes/:postId
likeRouter.delete('/:postId', authenticate, likeController.unlikePost);

// GET /api/likes/:postId
likeRouter.get('/:postId', authenticate, likeController.getPostLikes);