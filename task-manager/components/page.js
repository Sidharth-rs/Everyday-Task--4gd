"use client";
import { useState, useEffect } from "react";

export default function Home() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");
  const [priority, setPriority] = useState("Low");
  const [deadline, setDeadline] = useState("");
  const [filter, setFilter] = useState("All");
  const [darkMode, setDarkMode] = useState(false);
  const [sortBy, setSortBy] = useState("Date");

  // Load tasks from localStorage on mount
  useEffect(() => {
    const savedTasks = JSON.parse(localStorage.getItem("tasks")) || [];
    setTasks(savedTasks);
  }, []);

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);

  const addTask = () => {
    if (newTask.trim() === "") {
      alert("Task name cannot be empty.");
      return;
    }
    setTasks([
      ...tasks,
      { id: Date.now(), text: newTask, priority, deadline, completed: false },
    ]);
    setNewTask("");
    setPriority("Low");
    setDeadline("");
  };

  const toggleComplete = (id) => {
    setTasks(
      tasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const deleteTask = (id) => {
    if (confirm("Are you sure you want to delete this task?")) {
      setTasks(tasks.filter((task) => task.id !== id));
    }
  };

  const editTask = (id, newText) => {
    setTasks(
      tasks.map((task) =>
        task.id === id ? { ...task, text: newText } : task
      )
    );
  };

  const filteredTasks = tasks
    .filter((task) => {
      if (filter === "Completed") return task.completed;
      if (filter === "Pending") return !task.completed;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "Priority") {
        const priorityOrder = { High: 3, Medium: 2, Low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      if (sortBy === "Date") {
        return new Date(a.deadline) - new Date(b.deadline);
      }
      return 0;
    });

  return (
    <div className={`${darkMode ? "dark" : ""}`}>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 flex items-center justify-center">
        <div className="w-full max-w-md bg-white dark:bg-gray-700 shadow-lg rounded-lg p-6 relative">
          {/* Dark Mode Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="absolute top-4 right-4 bg-gray-200 dark:bg-gray-600 p-2 rounded-lg"
          >
            Toggle {darkMode ? "Light" : "Dark"} Mode
          </button>

          <h1 className="text-2xl font-bold mb-4 text-center">Task Manager</h1>

          {/* Add Task */}
          <div className="flex flex-col gap-4 mb-4">
            <div className="flex gap-2">
              <select
                className="border rounded-lg p-2"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
              <input
                type="date"
                className="border rounded-lg p-2 flex-1"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 border rounded-lg p-2"
                placeholder="Add a new task..."
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
              />
              <button
                onClick={addTask}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
              >
                Add
              </button>
            </div>
          </div>

          {/* Filter & Sort */}
          <div className="flex gap-2 mb-4">
            <select
              className="border rounded-lg p-2 flex-1"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="All">All</option>
              <option value="Completed">Completed</option>
              <option value="Pending">Pending</option>
            </select>
            <select
              className="border rounded-lg p-2 flex-1"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="Date">Sort by Deadline</option>
              <option value="Priority">Sort by Priority</option>
            </select>
          </div>

          {/* Task List */}
          <ul className="space-y-2">
            {filteredTasks.map((task) => (
              <li
                key={task.id}
                className={`flex items-center justify-between p-2 border rounded-lg bg-gray-100 dark:bg-gray-800 ${
                  task.completed ? "opacity-50" : ""
                }`}
              >
                <div className="flex-1">
                  <span
                    className={`text-xs font-bold mr-2 px-2 py-1 rounded-lg ${
                      task.priority === "High"
                        ? "bg-red-500 text-white"
                        : task.priority === "Medium"
                        ? "bg-yellow-500 text-white"
                        : "bg-green-500 text-white"
                    }`}
                  >
                    {task.priority}
                  </span>
                  <span
                    className={`${
                      task.completed ? "line-through text-gray-500" : ""
                    }`}
                    contentEditable={!task.completed}
                    onBlur={(e) => editTask(task.id, e.target.textContent)}
                  >
                    {task.text}
                  </span>
                  {task.deadline && (
                    <span className="text-sm text-gray-500 ml-2">
                      Due: {task.deadline}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleComplete(task.id)}
                    className="bg-green-200 text-green-800 px-2 py-1 rounded-lg border border-green-400 shadow-sm"
                  >
                    {task.completed ? "Undo" : "Complete"}
                  </button>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="bg-red-200 text-red-800 px-2 py-1 rounded-lg border border-red-400 shadow-sm"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
