import Joi from 'joi';
import { z } from 'zod';

export const createUserSchema = Joi.object({
  firstName: Joi.string().required().min(2).max(255).messages({
    'string.empty': 'First name is required',
    'string.min': 'First name must be at least 2 characters long',
    'string.max': 'First name cannot exceed 255 characters',
  }),
  lastName: Joi.string().required().min(2).max(255).messages({
    'string.empty': 'Last name is required',
    'string.min': 'Last name must be at least 2 characters long',
    'string.max': 'Last name cannot exceed 255 characters',
  }),
  email: Joi.string().required().email().max(255).messages({
    'string.empty': 'Email is required',
    'string.email': 'Please provide a valid email address',
    'string.max': 'Email cannot exceed 255 characters',
  }),
});

export const updateUserSchema = Joi.object({
  firstName: Joi.string().min(2).max(255).messages({
    'string.min': 'First name must be at least 2 characters long',
    'string.max': 'First name cannot exceed 255 characters',
  }),
  lastName: Joi.string().min(2).max(255).messages({
    'string.min': 'Last name must be at least 2 characters long',
    'string.max': 'Last name cannot exceed 255 characters',
  }),
  email: Joi.string().email().max(255).messages({
    'string.email': 'Please provide a valid email address',
    'string.max': 'Email cannot exceed 255 characters',
  }),
})
  .min(1)
  .messages({
    'object.min': 'At least one field must be provided for update',
  });

export const getFollowersSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  query: z.object({
    limit: z.string().optional().transform((val) => val ? parseInt(val) : 10),
    offset: z.string().optional().transform((val) => val ? parseInt(val) : 0),
  }),
});

export const getUserActivitySchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  query: z.object({
    limit: z.string().optional().transform((val) => val ? parseInt(val) : 10),
    offset: z.string().optional().transform((val) => val ? parseInt(val) : 0),
    type: z.enum(['post', 'like', 'follow']).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),
});
