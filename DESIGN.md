# DESIGN.md

## 📦 Database Schema Design and Entity Relationships

This project uses **SQLite** with **TypeORM** as the ORM. The schema models a social media application with the following core entities:

### Entities:

- **User**: Basic user information with secure password hashing.
- **Post**: Content authored by a user.
- **Hashtag**: Tags associated with posts (Many-to-Many with `Post`).
- **Like**: A unique (User, Post) pair representing a like.
- **Follow**: Represents a (follower → following) relationship.
- **UserActivity**: Tracks actions (post, like, follow) for audit and analytics.

### Relationships:
- `User` 1:N `Post`
- `User` 1:N `Like`
- `User` 1:N `Follow` (both as `follower` and `following`)
- `Post` N:M `Hashtag`
- `Post` 1:N `Like`
- `UserActivity` N:1 `User` | `Post` | `Like` | `Follow` (nullable foreign keys for flexible tracking)

## 📈 Indexing Strategy for Performance Optimization

The following indexes were added to optimize common query patterns:

- `IDX_posts_author`: Filter posts by author ID
- `IDX_posts_created_at`: Order posts by recency
- `IDX_hashtags_name`: Search posts by hashtag name
- `IDX_likes_post`: Count or fetch likes for a given post
- `IDX_follows_follower`: Get following list for a user
- `IDX_follows_following`: Get follower list for a user

Additionally:
- `@Unique` constraints on `likes (userId, postId)` and `follows (followerId, followingId)` ensure data integrity and reduce duplication.

## 🚀 Scalability Considerations

- **Pagination**: All feed, hashtag, and followers endpoints use `limit` and `offset` to support large datasets and avoid overfetching.
- **JWT-based Authentication**: Scales independently of sessions and supports stateless APIs.
- **Activity Logging**: Instead of recalculating metrics in real-time, `UserActivity` records discrete actions for async analysis.
- **Join tables with composite keys**: Like `post_hashtags` and `follows`, reduce redundancy and improve join efficiency.

Future improvements could include:
- **Caching popular feeds or hashtags** using Redis
- **Horizontal scaling** by introducing a load balancer and moving from SQLite to PostgreSQL
- **Message queues** for asynchronous features (notifications, analytics)

## 🔐 Other Design Considerations

- **Authentication**:
  - Handled via JWT tokens
  - Middleware extracts and verifies tokens, attaching `userId` to each request

- **Validation**:
  - All request bodies validated using `Zod` schemas
  - Includes field-level and structure validation for security

- **Security**:
  - Passwords are hashed with `bcrypt` before insert/update
  - Foreign key constraints with `ON DELETE CASCADE` ensure orphaned records are cleaned

- **Extensibility**:
  - `UserActivity` model is flexible to support new activity types (e.g., comments, shares)
  - Modular route organization (`/auth`, `/likes`, `/follows`, etc.) simplifies scaling

