import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSocialMediaTables1713427200001 implements MigrationInterface {
  name = 'CreateSocialMediaTables1713427200001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create posts table
    await queryRunner.query(`
      CREATE TABLE "posts" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        "content" TEXT NOT NULL,
        "authorId" INTEGER NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT (CURRENT_TIMESTAMP),
        "updatedAt" DATETIME NOT NULL DEFAULT (CURRENT_TIMESTAMP),
        FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    // Create hashtags table
    await queryRunner.query(`
      CREATE TABLE "hashtags" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        "name" VARCHAR(255) NOT NULL UNIQUE,
        "createdAt" DATETIME NOT NULL DEFAULT (CURRENT_TIMESTAMP),
        "updatedAt" DATETIME NOT NULL DEFAULT (CURRENT_TIMESTAMP)
      )
    `);

    // Create post_hashtags table
    await queryRunner.query(`
      CREATE TABLE "post_hashtags" (
        "postId" INTEGER NOT NULL,
        "hashtagId" INTEGER NOT NULL,
        PRIMARY KEY ("postId", "hashtagId"),
        FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE,
        FOREIGN KEY ("hashtagId") REFERENCES "hashtags"("id") ON DELETE CASCADE
      )
    `);

    // Create likes table
    await queryRunner.query(`
      CREATE TABLE "likes" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        "userId" INTEGER NOT NULL,
        "postId" INTEGER NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT (CURRENT_TIMESTAMP),
        UNIQUE ("userId", "postId"),
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
        FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE
      )
    `);

    // Create follows table
    await queryRunner.query(`
      CREATE TABLE "follows" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        "followerId" INTEGER NOT NULL,
        "followingId" INTEGER NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT (CURRENT_TIMESTAMP),
        UNIQUE ("followerId", "followingId"),
        FOREIGN KEY ("followerId") REFERENCES "users"("id") ON DELETE CASCADE,
        FOREIGN KEY ("followingId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);


    // Create indexes
    await queryRunner.query(`CREATE INDEX "IDX_posts_author" ON "posts"("authorId")`);
    await queryRunner.query(`CREATE INDEX "IDX_posts_created_at" ON "posts"("createdAt" DESC)`);
    await queryRunner.query(`CREATE INDEX "IDX_hashtags_name" ON "hashtags"("name")`);
    await queryRunner.query(`CREATE INDEX "IDX_likes_post" ON "likes"("postId")`);
    await queryRunner.query(`CREATE INDEX "IDX_follows_follower" ON "follows"("followerId")`);
    await queryRunner.query(`CREATE INDEX "IDX_follows_following" ON "follows"("followingId")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_follows_following"`);
    await queryRunner.query(`DROP INDEX "IDX_follows_follower"`);
    await queryRunner.query(`DROP INDEX "IDX_likes_post"`);
    await queryRunner.query(`DROP INDEX "IDX_hashtags_name"`);
    await queryRunner.query(`DROP INDEX "IDX_posts_created_at"`);
    await queryRunner.query(`DROP INDEX "IDX_posts_author"`);

    // Drop tables (automatically drops foreign keys)
    await queryRunner.query(`DROP TABLE "follows"`);
    await queryRunner.query(`DROP TABLE "likes"`);
    await queryRunner.query(`DROP TABLE "post_hashtags"`);
    await queryRunner.query(`DROP TABLE "hashtags"`);
    await queryRunner.query(`DROP TABLE "posts"`);
  }
}