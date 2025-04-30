import Joi from 'joi';
import { z } from 'zod';

export const createPostSchema = Joi.object({
  content: Joi.string().required().min(1).max(10000),
  hashtags: Joi.array().items(Joi.string().min(1).max(255)).optional(),
});

export const updatePostSchema = Joi.object({
  content: Joi.string().min(1).max(10000).optional(),
  hashtags: Joi.array().items(Joi.string().min(1).max(255)).optional(),
});

export const getPostsSchema = Joi.object({
  limit: Joi.number().integer().min(1).max(100).default(10),
  offset: Joi.number().integer().min(0).default(0),
});

export const getFeedSchema = z.object({
  query: z.object({
    limit: z.string().optional().transform((val) => val ? parseInt(val) : 10),
    offset: z.string().optional().transform((val) => val ? parseInt(val) : 0),
  }),
});

export const getPostsByHashtagSchema = z.object({
  params: z.object({
    tag: z.string().min(1),
  }),
  query: z.object({
    limit: z.string().optional().transform((val) => val ? parseInt(val) : 10),
    offset: z.string().optional().transform((val) => val ? parseInt(val) : 0),
  }),
}); 