import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  Column,
} from 'typeorm';
import { User } from './User';
import { Post } from './Post';
import { Like } from './Like';
import { Follow } from './Follow';

export enum ActivityType {
  POST = 'post',
  LIKE = 'like',
  FOLLOW = 'follow',
  UNFOLLOW = 'unfollow',
}

@Entity('user_activities')
export class UserActivity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @ManyToOne(() => User, (user) => user.activities)
  user: User;

  @Column({
    type: 'text',
    enum: ActivityType,
  })
  type: ActivityType;

  @ManyToOne(() => Post, { nullable: true })
  post: Post | null;

  @ManyToOne(() => Like, { nullable: true })
  like: Like | null;

  @ManyToOne(() => Follow, { nullable: true })
  follow: Follow | null;

  @Column({ type: 'json', nullable: true })
  metadata: any;

  @CreateDateColumn()
  createdAt: Date;
} 