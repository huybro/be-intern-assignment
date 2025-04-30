import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUserActivityTable1713427200003 implements MigrationInterface {
    name = 'CreateUserActivityTable1713427200003'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "user_activities" (
                "id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
                "type" TEXT NOT NULL CHECK(type IN ('post', 'like', 'follow', 'unfollow')),
                "metadata" TEXT,
                "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "userId" INTEGER,
                "postId" INTEGER,
                "likeId" INTEGER,
                "followId" INTEGER,
                CONSTRAINT "FK_user_activity_user" FOREIGN KEY ("userId")
                REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_user_activity_post" FOREIGN KEY ("postId")
                REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_user_activity_like" FOREIGN KEY ("likeId")
                REFERENCES "likes"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_user_activity_follow" FOREIGN KEY ("followId")
                REFERENCES "follows"("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "user_activities"`);
    }
} 