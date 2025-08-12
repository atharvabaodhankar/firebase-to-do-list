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

  const completedCount = todos.filter(t => t.completed).length;
  const totalCount = todos.length;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>
      
      <div className="relative z-10 flex flex-col items-center p-6 min-h-screen">
        {/* Header */}
        <div className="w-full max-w-2xl">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                TaskFlow
              </h1>
              <p className="text-slate-400 mt-1">Organize your life, one task at a time</p>
            </div>
            <button
              onClick={handleSignOut}
              className="group relative px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white hover:bg-white/20 transition-all duration-300 hover:scale-105"
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </span>
            </button>
          </div>

          {/* User info card */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 mb-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  {user.isAnonymous ? (
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                  )}
                </div>
                <div>
                  <p className="text-white font-medium">
                    {user.isAnonymous ? "Guest User" : user.email}
                  </p>
                  <p className="text-slate-400 text-sm">
                    {user.isAnonymous ? "Temporary session" : "Signed in"}
                  </p>
                </div>
              </div>
              {user.isAnonymous && (
                <div className="bg-amber-500/20 border border-amber-500/30 rounded-lg px-3 py-1">
                  <span className="text-amber-300 text-xs font-medium">⚠️ Guest Mode</span>
                </div>
              )}
            </div>
          </div>

          {/* Progress card */}
          {totalCount > 0 && (
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 mb-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold">Progress</h3>
                <span className="text-slate-300 text-sm">
                  {completedCount} of {totalCount} completed
                </span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-3 mb-2">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              <p className="text-slate-400 text-sm">
                {progressPercentage === 100 ? "🎉 All tasks completed!" : `${Math.round(progressPercentage)}% complete`}
              </p>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/30 backdrop-blur-sm rounded-2xl p-4 mb-6">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-red-300">{error}</span>
              </div>
            </div>
          )}

          {/* Add todo form */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 mb-6 shadow-2xl">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <input
                  value={newTodo}
                  onChange={(e) => setNewTodo(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addTodo()}
                  placeholder="What needs to be done?"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                />
                <div className="absolute inset-y-0 right-3 flex items-center">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
              </div>
              <button
                onClick={addTodo}
                disabled={!newTodo.trim()}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:from-purple-600 hover:to-pink-600 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105 shadow-lg"
              >
                Add Task
              </button>
            </div>
          </div>

          {/* Todos list */}
          <div className="space-y-3">
            {todos.map((todo, index) => (
              <div
                key={todo.id}
                className="group bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 shadow-xl hover:bg-white/15 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center gap-4">
                  {/* Custom checkbox */}
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={todo.completed}
                      onChange={() => toggleTodo(todo.id, todo.completed)}
                      className="sr-only"
                    />
                    <div
                      onClick={() => toggleTodo(todo.id, todo.completed)}
                      className={`w-6 h-6 rounded-full border-2 cursor-pointer transition-all duration-300 flex items-center justify-center ${
                        todo.completed
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 border-purple-500'
                          : 'border-slate-400 hover:border-purple-400'
                      }`}
                    >
                      {todo.completed && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                  
                  {/* Task text */}
                  <span
                    className={`flex-1 transition-all duration-300 ${
                      todo.completed 
                        ? "line-through text-slate-400" 
                        : "text-white"
                    }`}
                  >
                    {todo.text}
                  </span>
                  
                  {/* Delete button */}
                  <button
                    onClick={() => deleteTodo(todo.id)}
                    className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-all duration-300"
                    title="Delete task"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Empty state */}
          {todos.length === 0 && (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No tasks yet</h3>
              <p className="text-slate-400">Add your first task above to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}