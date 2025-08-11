import { useState, useEffect } from "react";
import { auth, db } from "./firebase";
import { signInAnonymously, onAuthStateChanged } from "firebase/auth";
import {
  collection,
  addDoc,
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";

export default function App() {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState("");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Handle authentication
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        setError(null);
        setLoading(false);
      } else {
        try {
          await signInAnonymously(auth);
        } catch (error) {
          console.error("Authentication failed:", error);
          if (error.code === "auth/configuration-not-found") {
            setError(
              "Anonymous authentication is not enabled. Please enable it in Firebase Console."
            );
          } else {
            setError(`Authentication failed: ${error.message}`);
          }
          setLoading(false);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Fetch todos in real time
  useEffect(() => {
    if (!user) return;

    const unsubscribe = onSnapshot(
      collection(db, "todos"),
      (snapshot) => {
        setTodos(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      },
      (error) => {
        console.error("Firestore error:", error);
        setError(`Database error: ${error.message}`);
      }
    );
    return () => unsubscribe();
  }, [user]);

  // Add todo
  const addTodo = async () => {
    if (!newTodo.trim() || !user) return;
    try {
      await addDoc(collection(db, "todos"), {
        text: newTodo,
        completed: false,
        createdAt: new Date(),
      });
      setNewTodo("");
    } catch (error) {
      console.error("Error adding todo:", error);
      setError(`Failed to add todo: ${error.message}`);
    }
  };

  // Toggle completion
  const toggleTodo = async (id, completed) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, "todos", id), { completed: !completed });
    } catch (error) {
      console.error("Error updating todo:", error);
      setError(`Failed to update todo: ${error.message}`);
    }
  };

  // Delete todo
  const deleteTodo = async (id) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, "todos", id));
    } catch (error) {
      console.error("Error deleting todo:", error);
      setError(`Failed to delete todo: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl">Connecting to Firebase...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-6">
        <div className="bg-red-600 text-white px-6 py-4 rounded mb-4 max-w-lg text-center">
          <h2 className="text-xl font-bold mb-2">Firebase Setup Required</h2>
          <p className="mb-4">{error}</p>
          <div className="text-sm text-left">
            <p className="font-semibold mb-2">To fix this:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>
                Go to{" "}
                <a
                  href="https://console.firebase.google.com/"
                  className="text-blue-300 underline"
                  target="_blank"
                >
                  Firebase Console
                </a>
              </li>
              <li>Select your project: to-do-list-f6681</li>
              <li>Go to Authentication → Sign-in method</li>
              <li>Enable "Anonymous" authentication</li>
              <li>Refresh this page</li>
            </ol>
          </div>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-500 rounded hover:bg-blue-600"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-6">
      <h1 className="text-3xl font-bold mb-6">Firebase To-Do List</h1>

      {user && (
        <div className="text-sm text-green-400 mb-4">
          ✅ Connected as anonymous user
        </div>
      )}

      <div className="flex gap-2 mb-4">
        <input
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && addTodo()}
          placeholder="Enter a task..."
          className="px-3 py-2 rounded bg-gray-800 text-white outline-none"
          disabled={!user}
        />
        <button
          onClick={addTodo}
          className="px-4 py-2 bg-blue-500 rounded hover:bg-blue-600 disabled:bg-gray-600"
          disabled={!user || !newTodo.trim()}
        >
          Add
        </button>
      </div>

      <ul className="w-full max-w-md space-y-2">
        {todos.map((todo) => (
          <li
            key={todo.id}
            className="flex justify-between items-center bg-gray-800 px-4 py-2 rounded"
          >
            <span
              onClick={() => toggleTodo(todo.id, todo.completed)}
              className={`cursor-pointer flex-1 ${
                todo.completed ? "line-through text-gray-400" : ""
              }`}
            >
              {todo.text}
            </span>
            <button
              onClick={() => deleteTodo(todo.id)}
              className="text-red-400 hover:text-red-500 ml-2"
            >
              ❌
            </button>
          </li>
        ))}
      </ul>

      {todos.length === 0 && user && (
        <div className="text-gray-400 mt-4">No todos yet. Add one above!</div>
      )}
    </div>
  );
}
