'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { db } from '@/firebase';
import { doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import Header from '@/components/layout/Header';
import { Thread, User, Comment } from '@/types/type';

const ThreadDetailPage: React.FC = () => {
  const pathname = usePathname();
  const [thread, setThread] = useState<Thread | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState<string>('');
  const [creatorName, setCreatorName] = useState<string>('');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [usernames, setUsernames] = useState<{ [key: string]: string }>({});
  const [currentUserUID, setCurrentUserUID] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string>('');

  // Funktion för att låsa/låsa upp tråden
  const toggleThreadLock = async () => {
    if (thread) {  
      try {
        console.log("Thread ID:", thread.id);
        const threadRef = doc(db, 'threads', thread.id);
        await updateDoc(threadRef, {
          locked: !thread.locked
        });
        setThread((prevThread) =>
          prevThread ? { ...prevThread, locked: !prevThread.locked } : null
        );
        console.log(`Thread is now ${!thread.locked ? 'locked' : 'unlocked'}`);
      } catch (error) {
        console.error('Error updating thread lock status:', error);
      }
    } else {
      console.error("Thread or thread ID is undefined");
    }
  };

  const markAsAnswer = async (commentId: string) => {
    if (!currentUserUID || !currentUserName) {
      console.error('No user logged in');
      return;
    }
  
    try {
      const commentRef = doc(db, 'comments', commentId);
      const commentDoc = await getDoc(commentRef);
  
      if (commentDoc.exists()) {
        const commentData = commentDoc.data() as Comment;
  
        // Kontrollera om den inloggade användaren är skaparen av kommentaren
        if (commentData.creator !== currentUserUID) {
          await updateDoc(commentRef, {
            isAnswer: true,
            answeredBy: currentUserUID,
            answeredByName: currentUserName,
          });
  
          // Uppdatera state så att det reflekterar förändringen direkt i UI
          setComments((prevComments) =>
            prevComments.map((comment) =>
              comment.id === commentId
                ? { ...comment, isAnswer: true, answeredByName: currentUserName }
                : comment
            )
          );
  
          console.log(`Comment ${commentId} marked as answer by ${currentUserName}.`);
        } else {
          console.log("You cannot mark your own comment as an answer.");
        }
      } else {
        console.log("Comment does not exist.");
      }
    } catch (error) {
      console.error('Error marking comment as answer:', error);
    }
  };
  
  
  useEffect(() => {
    const auth = getAuth();
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsLoggedIn(true);
        setCurrentUserUID(user.uid);

        // Hämta nuvarande användares namn
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data() as User;
          setCurrentUserName(userData.userName);
        }
      } else {
        setIsLoggedIn(false);
      }
    });

    const threadId = pathname?.split('/').pop();
    if (threadId) {
      const fetchThread = async () => {
        try {
          const threadDoc = await getDoc(doc(db, 'threads', threadId));
          if (threadDoc.exists()) {
            const threadData = threadDoc.data() as Thread;
            threadData.id = threadDoc.id;
            console.log("Fetched Thread Data:", threadData);
            setThread(threadData);

            // Hämta skaparen av tråden
            const userDoc = await getDoc(doc(db, 'users', threadData.creator));
            if (userDoc.exists()) {
              const userData = userDoc.data() as User;
              setCreatorName(userData.userName);
            } else {
              console.log('No such user!');
            }
          } else {
            console.log('No such thread!');
          }
        } catch (error) {
          console.error('Error fetching thread:', error);
        }
      };

      const fetchComments = async () => {
        try {
          const commentsQuery = query(
            collection(db, 'comments'),
            where('threadId', '==', threadId)
          );
          const commentsSnapshot = await getDocs(commentsQuery);
          const commentsData = commentsSnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              createdAt: (data.createdAt as Timestamp) || Timestamp.now(),
              isAnswer: data.isAnswer || false,
            };
          }) as Comment[];
          setComments(commentsData);

          // Hämta användarnamn för varje kommentarsskapare
          const usernamesMap: { [key: string]: string } = {};
          await Promise.all(
            commentsData.map(async (comment) => {
              if (!usernamesMap[comment.creator]) {
                const userDoc = await getDoc(doc(db, 'users', comment.creator));
                if (userDoc.exists()) {
                  const userData = userDoc.data() as User;
                  usernamesMap[comment.creator] = userData.userName;
                }
              }
            })
          );
          setUsernames(usernamesMap);
        } catch (error) {
          console.error('Error fetching comments:', error);
        }
      };

      fetchThread();
      fetchComments();
    }
  }, [pathname]);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const threadId = pathname?.split('/').pop();
    if (threadId && newComment.trim() && currentUserUID) {
      try {
        const newCommentData = {
          content: newComment,
          createdAt: serverTimestamp(),
          creator: currentUserUID,
          threadId: threadId,
        };
        const docRef = await addDoc(collection(db, 'comments'), newCommentData);
        const addedComment = {
          ...newCommentData,
          id: docRef.id,
          createdAt: Timestamp.now(), // Använd aktuell timestamp för omedelbar visning
        } as Comment;
        setComments([...comments, addedComment]);
        setNewComment('');

        // Hämta användarnamn för den nya kommentarens skapare
        if (!usernames[currentUserUID]) {
          const userDoc = await getDoc(doc(db, 'users', currentUserUID));
          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            setUsernames((prevUsernames) => ({
              ...prevUsernames,
              [currentUserUID]: userData.userName,
            }));
          }
        }
      } catch (error) {
        console.error('Error adding comment:', error);
      }
    }
  };

  const sortedComments = comments.sort(
    (a, b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime()
  );

  return (
    <div>
      <Header />
      <div className="container mx-auto p-4">
        {thread ? (
          <div className="bg-white shadow-md rounded-lg p-6 mb-6">
            <h1 className="text-2xl font-bold mb-4 dark:text-black">{thread.title}</h1>
            <p className="text-gray-700 mb-4" style={{ whiteSpace: 'pre-wrap' }}>
              {thread.description}
            </p>
            <p className="text-sm text-gray-500">Created by: {creatorName}</p>
            <p className="text-sm text-gray-500">
              Creation Date: {new Date(thread.creationDate).toLocaleString()}
            </p>
            <p className="text-sm text-gray-500">Category: {thread.category}</p>

            {/* Lås/lås upp knapp, endast synlig för trådskaparen */}
            {isLoggedIn && currentUserUID === thread.creator && (
              <button
                onClick={toggleThreadLock}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium ${
                  thread.locked ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                } text-white`}
              >
                {thread.locked ? 'Unlock Thread' : 'Lock Thread'}
              </button>
            )}
          </div>
        ) : (
          <p>Loading thread...</p>
        )}

        {/* Kommentarsformulär, visas bara om tråden inte är låst */}
        {isLoggedIn && !thread?.locked && (
          <form onSubmit={handleCommentSubmit} className="my-4">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded text-black bg-white dark:text-white dark:bg-black"
              placeholder="Add a comment..."
              required
            />
            <button type="submit" className="mt-2 bg-blue-500 text-white p-2 px-4 rounded hover:opacity-65">
              Submit
            </button>
          </form>
        )}

        {/* Meddelande om tråden är låst */}
        {thread?.locked && (
          <p className="text-red-500 mb-4">
            This thread is locked. No more comments can be added.
          </p>
        )}

        <div>
          <h2 className="text-xl font-bold mb-4">Comments</h2>
          {sortedComments.length > 0 ? (
            sortedComments.map((comment) => (
              <div key={comment.id} className="bg-white shadow-md rounded-lg p-5 px-6 mb-6">
                <p className="text-gray-800 pb-2" style={{ whiteSpace: 'pre-wrap' }}>
                  {comment.content}
                </p>
                <p className="text-sm text-gray-500 font-semibold pb-2">
                  {usernames[comment.creator] || 'Unknown'}
                </p>
                <p className="text-gray-500 text-xs p-1">
                  {comment.createdAt instanceof Timestamp
                    ? comment.createdAt.toDate().toLocaleString()
                    : 'Unknown Date'}
                </p>

                {/* Markera som svar knapp, endast synlig om inte redan markerad */}
                {isLoggedIn && !comment.isAnswer && (
                  <button
                    onClick={() => markAsAnswer(comment.id)}
                    className="bg-yellow-500 text-white p-2 px-4 rounded hover:opacity-80 "
                  >
                    Mark as Answer
                  </button>
                )}

                {/* Visa om kommentaren är markerad som svar */}
                {comment.isAnswer && (
                  <p className="text-green-500 text-xs font-bold">
                    Marked as answer by {comment.answeredByName}
                  </p>
                )}
              </div>
            ))
          ) : (
            <p>No comments yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ThreadDetailPage;
