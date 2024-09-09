"use client";

import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { collection, addDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase";
import Header from "@/components/layout/Header";

function CreateThread() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [creator, setCreator] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCreator(user.uid);
        setIsLoggedIn(true);
      } else {
        console.log("User is not logged in");
        setIsLoggedIn(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newThread = {
      title,
      description,
      category,
      creator,
      creationDate: new Date().toISOString(),
      locked: false, // All new threads are unlocked by default
    };

    try {
      await addDoc(collection(db, "threads"), newThread);
      console.log("Thread successfully created!");
      setTitle("");
      setDescription("");
      setCategory("");
    } catch (error) {
      console.error("Error creating thread: ", error);
    }
  };

  return (
    <div>
      <Header />
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Create a New Thread</h1>
        {isLoggedIn ? (
          <form
            onSubmit={handleSubmit}
            className="bg-white shadow-md rounded-lg p-6 mb-6"
          >
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
                required
                rows={4}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Category
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Create New Thread
            </button>
          </form>
        ) : (
          <p className="text-red-500 mb-4 text-center">
            You need to log in to create a New Thread
          </p>
        )}
      </div>
    </div>
  );
}

export default CreateThread;
