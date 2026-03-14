import React, { useState } from 'react';
import { StickyNote } from 'lucide-react';
import { TodoItem } from '../../types';

export const Scratchpad = () => {
  const [todos, setTodos] = useState<TodoItem[]>([
    { id: '1', text: 'Fix typo in Scene 2 dialogue', completed: true },
    { id: '2', text: 'Request sprite variation for Akira (Angry)', completed: false },
    { id: '3', text: 'Review sound effects for rain scene', completed: false },
  ]);

  const toggleTodo = (id: string) => {
    setTodos(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
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
        {todos.map(todo => (
          <div key={todo.id} className="flex items-start gap-3 group cursor-pointer" onClick={() => toggleTodo(todo.id)}>
            <input 
              type="checkbox" 
              checked={todo.completed} 
              readOnly
              className="mt-1 w-4 h-4 rounded border-gray-500 text-primary focus:ring-primary bg-transparent cursor-pointer"
            />
            <label className={`text-sm cursor-pointer ${todo.completed ? 'text-gray-500 dark:text-gray-400 line-through decoration-gray-600' : 'text-gray-800 dark:text-gray-300'}`}>
              {todo.text}
            </label>
          </div>
        ))}
        
        <div className="mt-auto pt-4">
          <input 
            type="text" 
            placeholder="+ Add a quick task..." 
            className="w-full bg-transparent border-b border-gray-300 dark:border-white/10 text-sm py-2 px-0 focus:ring-0 focus:border-primary placeholder-gray-500 dark:text-white transition-colors"
          />
        </div>
      </div>
    </div>
  );
};