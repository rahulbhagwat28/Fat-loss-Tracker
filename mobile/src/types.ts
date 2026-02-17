export type User = {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  age: number | null;
  sex: string | null;
  heightInches: number | null;
  weightLbs: number | null;
};

export type PostComment = {
  id: string;
  text: string;
  createdAt: string;
  user: { id: string; name: string; avatarUrl: string | null };
};

export type Post = {
  id: string;
  title: string | null;
  caption: string | null;
  imageUrl: string | null;
  createdAt: string;
  user: User;
  comments?: PostComment[];
  likes?: { userId: string }[];
  _count?: { likes: number; comments: number };
  liked?: boolean;
};

export type HealthLog = {
  id: string;
  logDate: string;
  weight: number | null;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  sleepHours: number | null;
  energyLevel: number | null;
  steps: number | null;
};

export type Friend = {
  id: string;
  name: string;
  avatarUrl: string | null;
};

export type FriendRequest = {
  id: string;
  from: Friend & { id: string };
};

export type Conversation = {
  userId: string;
  user: Friend & { id: string };
  lastAt: string;
  lastText: string;
  unreadCount?: number;
};

export type Message = {
  id: string;
  text: string;
  senderId: string;
  receiverId: string;
  createdAt: string;
  read?: boolean;
  sender: User;
};

export type Notification = {
  id: string;
  type: string;
  read: boolean;
  createdAt: string;
  actor?: User;
};
