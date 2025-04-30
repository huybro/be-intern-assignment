import Joi from 'joi';

export const followUserSchema = Joi.object({
  followingId: Joi.number().integer().required(),
});

export const getFollowersSchema = Joi.object({
  limit: Joi.number().integer().min(1).max(100).default(10),
  offset: Joi.number().integer().min(0).default(0),
});

export const getFollowingSchema = Joi.object({
  limit: Joi.number().integer().min(1).max(100).default(10),
  offset: Joi.number().integer().min(0).default(0),
}); 