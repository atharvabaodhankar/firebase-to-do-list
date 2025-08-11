import { useState, useEffect } from "react";
import { auth, db } from "./firebase";
import { signInAnonymously } from "firebase/auth";
import { collection, addDoc, onSnapshot, updateDoc, deleteDoc, doc } from "firebase/firestore";

export default function App() {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState("");

  // Sign in anonymously
  useEffect(() => {
    signInAnonymously(auth).catch(console.error);
  }, []);

  // Fetch todos in real time
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "todos"), (snapshot) => {
      setTodos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  // Add todo
  const addTodo = async () => {
    if (!newTodo.trim()) return;
    await addDoc(collection(db, "todos"), { text: newTodo, completed: false });
    setNewTodo("");
  };

  // Toggle completion
  const toggleTodo = async (id, completed) => {
    await updateDoc(doc(db, "todos", id), { completed: !completed });
  };

  // Delete todo
  const deleteTodo = async (id) => {
    await deleteDoc(doc(db, "todos", id));
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-6">
      <h1 className="text-3xl font-bold mb-6">Firebase To-Do List</h1>

      <div className="flex gap-2 mb-4">
        <input
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="Enter a task..."
          className="px-3 py-2 rounded bg-gray-800 text-white outline-none"
        />
        <button onClick={addTodo} className="px-4 py-2 bg-blue-500 rounded hover:bg-blue-600">
          Add
        </button>
      </div>

      <ul className="w-full max-w-md space-y-2">
        {todos.map((todo) => (
          <li key={todo.id} className="flex justify-between items-center bg-gray-800 px-4 py-2 rounded">
            <span
              onClick={() => toggleTodo(todo.id, todo.completed)}
              className={`cursor-pointer ${todo.completed ? "line-through text-gray-400" : ""}`}
            >
              {todo.text}
            </span>
            <button onClick={() => deleteTodo(todo.id)} className="text-red-400 hover:text-red-500">
              ❌
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
