import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateUserTable1713427200002 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // First add the column as nullable
        await queryRunner.query(`
            ALTER TABLE users
            ADD COLUMN password VARCHAR(255) NOT NULL DEFAULT '';
          `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove password column
        await queryRunner.query(`
            ALTER TABLE users
            DROP COLUMN password
        `);
    }
} 