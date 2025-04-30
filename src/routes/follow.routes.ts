import { Router } from 'express';
import { FollowController } from '../controllers/follow.controller';
import { validate } from '../middleware/validation.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { followUserSchema, getFollowersSchema, getFollowingSchema } from '../validations/follow.validation';

export const followRouter = Router();
const followController = new FollowController();

// Follow a user
followRouter.post('/', authenticate, validate(followUserSchema), followController.followUser);

// Unfollow a user
followRouter.delete('/:id', authenticate, followController.unfollowUser);

// Get user's followers
followRouter.get('/:id/followers', authenticate, validate(getFollowersSchema), followController.getFollowers);

// Get users that a user is following
followRouter.get('/:id/following', authenticate, validate(getFollowingSchema), followController.getFollowing); 