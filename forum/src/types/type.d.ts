import { Timestamp } from "firebase/firestore";

 type Comment = {
  id: string;
  threadId: string;
  content: string;
  creator: string;
  createdAt: Timestamp;
  isAnswer: boolean;
  answeredBy?: string;
  answeredByName?: string;
};

type ThreadCategory = "THREAD" | "QNA";

 type Thread = {
  id: string;
  title: string;
  category: ThreadCategory;
  creationDate: string;
  description: string;
  creator: string; // UID of the creator
  locked: boolean;  
};

 type User = {
  id: string;
  firstName: string;
  userName: string;
  password: string;
  userUID: string;
};
