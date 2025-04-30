import express from 'express';
import dotenv from 'dotenv';
import { userRouter } from './routes/user.routes';
import { postRouter } from './routes/post.routes';
import { likeRouter } from './routes/like.routes';
import { followRouter } from './routes/follow.routes';
import { AppDataSource } from './data-source';
import "reflect-metadata"
import authRoutes from "./routes/auth.routes";
import { forEachLeadingCommentRange } from 'typescript';
import { createPostSchema, updatePostSchema, getPostsSchema, getPostsByHashtagSchema, getFeedSchema } from './validations/post.validation';
import { PostController } from './controllers/post.controller';
import { validate } from './middleware/validation.middleware';
import { authenticate } from './middleware/auth.middleware';

dotenv.config();

const app = express();
app.use(express.json());

AppDataSource.initialize()
  .then(() => {
    console.log('Data Source has been initialized!');
  })
  .catch((err) => {
    console.error('Error during Data Source initialization:', err);
  });

app.get('/', (req, res) => {
  res.send('Welcome to the Social Media Platform API! Server is running successfully.');
});

const postController = new PostController();
// Register all routes
app.use('/api/users', userRouter);
app.use('/api/posts', postRouter);
app.use('/api/likes', likeRouter);
app.use('/api/follows', followRouter);
app.use("/api/auth", authRoutes);
app.get(
  '/api/feed',
  authenticate,
  validate(getFeedSchema),
  postController.getFeed.bind(postController)
);
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
