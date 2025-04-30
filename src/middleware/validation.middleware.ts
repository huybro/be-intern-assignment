import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { z } from 'zod';

type ValidationSchema = Joi.ObjectSchema | z.ZodType<any>;

export const validate = (schema: ValidationSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schema instanceof z.ZodType) {
        const result = schema.safeParse({
          body: req.body,
          query: req.query,
          params: req.params,
        });

        if (!result.success) {
          const errorMessage = result.error.errors.map((err) => err.message).join(', ');
          return res.status(400).json({ message: errorMessage });
        }

        // Update request with validated data
        req.body = result.data.body || req.body;
        req.query = result.data.query || req.query;
        req.params = result.data.params || req.params;
      } else {
        const { error } = schema.validate(req.body, {
          abortEarly: false,
          stripUnknown: true,
        });

        if (error) {
          const errorMessage = error.details.map((detail) => detail.message).join(', ');
          return res.status(400).json({ message: errorMessage });
        }
      }

      next();
    } catch (error) {
      return res.status(500).json({ message: 'Validation error' });
    }
  };
};
