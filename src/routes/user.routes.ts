import { Router } from 'express';
import { validate } from '../middleware/validation.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { createUserSchema, updateUserSchema, getFollowersSchema, getUserActivitySchema } from '../validations/user.validation';
import { UserController } from '../controllers/user.controller';

export const userRouter = Router();
const userController = new UserController();

// Get all users
userRouter.get('/', userController.getAllUsers.bind(userController));

// Get user by id
userRouter.get('/:id', userController.getUserById.bind(userController));

// Create new user
userRouter.post('/', validate(createUserSchema), userController.createUser.bind(userController));

// Update user
userRouter.put('/me', authenticate, validate(updateUserSchema), userController.updateUser.bind(userController));

// Delete user
userRouter.delete('/:id', authenticate, userController.deleteUser.bind(userController));

// Get user's followers
userRouter.get('/:id/followers', authenticate, validate(getFollowersSchema), userController.getFollowers.bind(userController));

// Get user's activity
userRouter.get('/:id/activity', authenticate, validate(getUserActivitySchema), userController.getUserActivity.bind(userController));
