import React, { useState, useEffect } from 'react';
import { StickyNote } from 'lucide-react';
import { TodoItem } from '../../../types';
import { useDatabase } from '../../../contexts/DatabaseContext';

export const Scratchpad = () => {
  const db = useDatabase();
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [newTaskText, setNewTaskText] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTodos = async () => {
      try {
        setIsLoading(true);
        const items = await db.getScratchpadItems();
        setTodos(items || []);
      } catch (error) {
        console.error('Failed to fetch scratchpad items:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTodos();
  }, [db]);

  const toggleTodo = async (id: string) => {
    const updated = todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    const todo = updated.find(t => t.id === id);
    
    if (todo) {
      try {
        await db.saveScratchpadItem(todo);
        setTodos(updated);
      } catch (error) {
        console.error('Failed to update scratchpad item:', error);
      }
    }
  };

  const addTask = async () => {
    if (!newTaskText.trim()) return;

    const newTodo: TodoItem = {
      id: crypto.randomUUID(),
      text: newTaskText,
      completed: false,
    };

    try {
      await db.createScratchpadItem(newTodo);
      setTodos([newTodo, ...todos]);
      setNewTaskText('');
    } catch (error) {
      console.error('Failed to save new scratchpad item:', error);
    }
  };

  const deleteTodo = async (id: string) => {
    try {
      await db.deleteScratchpadItem(id);
      setTodos(todos.filter(t => t.id !== id));
    } catch (error) {
      console.error('Failed to delete scratchpad item:', error);
    }
  };

  return (
    <div className="col-span-1 md:col-span-2 lg:col-span-1 xl:col-span-1 rounded-2xl bg-[#fffcee] dark:bg-[#1a1c1c] border border-gray-200 dark:border-white/5 p-6 shadow-sm flex flex-col relative overflow-hidden">
      {/* Decorative accent */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-secondary to-transparent"></div>
      
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <StickyNote className="text-secondary" size={20} />
        Scratchpad
      </h3>

      <div className="flex-1 flex flex-col gap-3">
        {isLoading ? (
          <div className="text-center py-4 text-gray-500">Loading...</div>
        ) : todos.length === 0 ? (
          <div className="text-center py-4 text-gray-500 dark:text-gray-400">No tasks yet</div>
        ) : (
          todos.map(todo => (
            <div key={todo.id} className="flex items-start gap-3 group cursor-pointer" onClick={() => toggleTodo(todo.id)}>
              <input 
                type="checkbox" 
                checked={todo.completed} 
                readOnly
                className="mt-1 w-4 h-4 rounded border-gray-500 text-primary focus:ring-primary bg-transparent cursor-pointer"
              />
              <label className={`text-sm cursor-pointer flex-1 ${todo.completed ? 'text-gray-500 dark:text-gray-400 line-through decoration-gray-600' : 'text-gray-800 dark:text-gray-300'}`}>
                {todo.text}
              </label>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  deleteTodo(todo.id);
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500 text-xs"
              >
                ✕
              </button>
            </div>
          ))
        )}
        
        <div className="mt-auto pt-4">
          <div className="flex gap-2">
            <input 
              type="text" 
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTask()}
              placeholder="+ Add a quick task..." 
              className="flex-1 bg-transparent border-b border-gray-300 dark:border-white/10 text-sm py-2 px-0 focus:ring-0 focus:border-primary placeholder-gray-500 dark:text-white transition-colors"
            />
            {newTaskText.trim() && (
              <button
                onClick={addTask}
                className="text-primary hover:text-primary/80 font-bold text-sm"
              >
                Add
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};