// Shared comment types. Moved out of src/components/Comments.tsx verbatim.

export interface CommentUser {
  id: string;
  slug: string;
  username: string;
  avatarUrl: string | null;
}

export interface Comment {
  id: string;
  parentId: string | null;
  user: CommentUser;
  body: string;
  likes: number;
  likedByMe: boolean;
  createdAt: string;
  replies: Comment[];
}
