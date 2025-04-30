import { Router } from 'express';
import { PostController } from '../controllers/post.controller';
import { validate } from '../middleware/validation.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { createPostSchema, updatePostSchema, getPostsSchema, getPostsByHashtagSchema, getFeedSchema } from '../validations/post.validation';

export const postRouter = Router();
const postController = new PostController();

// Create a new post
postRouter.post('/', authenticate, validate(createPostSchema), postController.createPost.bind(postController));

// Get a post by ID
postRouter.get('/:id', authenticate, postController.getPost.bind(postController));

// Update a post
postRouter.put('/:id', authenticate, validate(updatePostSchema), postController.updatePost.bind(postController));

// Delete a post
postRouter.delete('/:id', authenticate, postController.deletePost.bind(postController));

// Get posts by hashtag
postRouter.get('/hashtag/:tag', authenticate, validate(getPostsByHashtagSchema), postController.getPostsByHashtag.bind(postController)); 