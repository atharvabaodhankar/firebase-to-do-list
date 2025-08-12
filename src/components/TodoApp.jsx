import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { signOut } from "firebase/auth";
import {
  collection,
  addDoc,
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy
} from "firebase/firestore";

export default function TodoApp({ user }) {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState("");
  const [error, setError] = useState(null);

  // Fetch todos in real time (only user's todos)
  useEffect(() => {
    if (!user) return;

    // Use simpler query to avoid composite index requirement
    const todosQuery = query(
      collection(db, "todos"), 
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(
      todosQuery,
      (snapshot) => {
        const todosData = snapshot.docs.map((doc) => ({ 
          id: doc.id, 
          ...doc.data() 
        }));
        
        // Sort on client side to avoid composite index
        const sortedTodos = todosData.sort((a, b) => {
          const aTime = a.createdAt?.toDate?.() || new Date(0);
          const bTime = b.createdAt?.toDate?.() || new Date(0);
          return bTime - aTime; // newest first
        });
        
        setTodos(sortedTodos);
        setError(null);
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
        userId: user.uid,
        userEmail: user.email || "anonymous"
      });
      setNewTodo("");
      setError(null);
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
      setError(null);
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
      setError(null);
    } catch (error) {
      console.error("Error deleting todo:", error);
      setError(`Failed to delete todo: ${error.message}`);
    }
  };

  // Sign out
  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
      setError(`Failed to sign out: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">My Todos</h1>
          <button
            onClick={handleSignOut}
            className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
          >
            Sign Out
          </button>
        </div>

        {/* User info */}
        <div className="bg-gray-800 p-3 rounded mb-6">
          <div className="text-sm text-gray-300">
            {user.isAnonymous ? (
              <span>👤 Signed in as Guest</span>
            ) : (
              <span>✉️ {user.email}</span>
            )}
          </div>
          {user.isAnonymous && (
            <div className="text-xs text-yellow-400 mt-1">
              ⚠️ Guest data may be lost. Consider creating an account.
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-600 text-white px-4 py-2 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Add todo form */}
        <div className="flex gap-2 mb-6">
          <input
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTodo()}
            placeholder="Enter a task..."
            className="flex-1 px-3 py-2 rounded bg-gray-800 text-white outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={addTodo}
            className="px-4 py-2 bg-blue-500 rounded hover:bg-blue-600 disabled:bg-gray-600"
            disabled={!newTodo.trim()}
          >
            Add
          </button>
        </div>

        {/* Todos list */}
        <ul className="space-y-2">
          {todos.map((todo) => (
            <li
              key={todo.id}
              className="flex items-center bg-gray-800 px-4 py-3 rounded gap-3"
            >
              {/* Checkbox */}
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => toggleTodo(todo.id, todo.completed)}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
              />
              
              {/* Task text */}
              <span
                className={`flex-1 ${
                  todo.completed ? "line-through text-gray-400" : "text-white"
                }`}
              >
                {todo.text}
              </span>
              
              {/* Delete button */}
              <button
                onClick={() => deleteTodo(todo.id)}
                className="text-red-400 hover:text-red-500 px-2 py-1 rounded hover:bg-gray-700 transition-colors"
                title="Delete task"
              >
                ❌
              </button>
            </li>
          ))}
        </ul>

        {todos.length === 0 && (
          <div className="text-gray-400 text-center mt-8">
            <p>No todos yet!</p>
            <p className="text-sm mt-1">Add your first task above.</p>
          </div>
        )}

        {/* Stats */}
        {todos.length > 0 && (
          <div className="mt-6 text-center text-sm text-gray-400">
            {todos.filter(t => !t.completed).length} of {todos.length} tasks remaining
          </div>
        )}
      </div>
    </div>
  );
}