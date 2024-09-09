import { Timestamp } from "firebase/firestore";

export type Comment = {
  id: string;
  threadId: string;
  content: string;
  creator: string;
  createdAt: Timestamp;
  isAnswer?: boolean;  // Nytt fält för att markera om det är ett svar
  answerTo?: string;
};

export type ThreadCategory = "THREAD" | "QNA";

export type Thread = {
  id: string;
  title: string;
  category: ThreadCategory;
  creationDate: string;
  description: string;
  creator: string; // UID of the creator
  locked: boolean;  
};

export type User = {
  id: string;
  firstName: string;
  userName: string;
  password: string;
  userUID: string;
};
