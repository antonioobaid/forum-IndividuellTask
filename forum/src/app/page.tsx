"use client";
import Header from "@/components/layout/Header";
import ListThreads from "@/components/ListThreads";
import { auth, testFirestore } from "@/firebase";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function HomePage() {

  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter(); // Update to useRouter from next/navigation

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    testFirestore();

    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.push("/");
      } else {
        router.push("/");
      }
    });

    return () => unsubscribe();
  }, [isMounted, router]);

  if (!isMounted) {
    return null; // or a loading spinner
  }


  const handleLogout = async () => {
    try {
      await signOut(auth);
      console.log("User signed out");
      router.push("/"); // Redirect to home page
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  return (
    <main className="container mx-auto">
      <Header />
      <div className="p-10">
        
        <h1 className="text-2xl font-bold pb-10 text-center">Cooool forum</h1>
        
        <div className="pt-2 mx-auto text-right">
          <a href="/create-thread" className="bg-black text-white py-3 px-5 rounded-md dark:text-black dark:bg-white hover:opacity-75">Create Thread</a>
        </div>

        <ListThreads/>

        <div className="pt-10 mx-auto text-center">
          <a href="/threads" className="bg-black text-white py-3 px-5 rounded-md dark:text-black dark:bg-white hover:opacity-75">View All Threads</a>
        </div>
        
      </div>
    </main>
  )
}
export default HomePage