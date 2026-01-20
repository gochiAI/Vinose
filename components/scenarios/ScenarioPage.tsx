import React, { useState, useEffect } from 'react';
import { Search, Filter, MoreHorizontal, Image as ImageIcon, Plus } from 'lucide-react';
import { ScenarioEvent } from '../../types';
import { ActionEvent } from '../../App';
import { initialEvents } from '../../data';
import { StatusBadge } from '../common/StatusBadge';
import { Modal } from '../common/Modal';
import { Input, Label, Select, TextArea } from '../common/Form';

export const ScenarioPage = ({ lastAction }: { lastAction: ActionEvent | null }) => {
  const [events, setEvents] = useState<ScenarioEvent[]>(initialEvents);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ScenarioEvent | null>(null);

  useEffect(() => {
    if (lastAction?.type === 'EXPORT_CSV') {
      downloadCSV();
    }
  }, [lastAction]);

  const downloadCSV = () => {
    const headers = ['ID', 'Timing', 'Event Name', 'Details', 'Characters', 'Visual Type', 'Visual Name', 'Status', 'Notes'];
    const rows = events.map(e => [
      e.id,
      e.timing,
      e.eventName,
      `"${e.details.replace(/"/g, '""')}"`, // Escape quotes
      `"${e.characters.join(', ')}"`,
      e.visuals.type,
      e.visuals.name,
      e.status,
      `"${(e.notes || '').replace(/"/g, '""')}"`
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "scenario_table.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddEvent = () => {
    const newId = `SCN-00${events.length + 1}`;
    setEditingEvent({
      id: newId,
      timing: '',
      eventName: '',
      details: '',
      characters: [],
      visuals: { type: 'bg', name: '' },
      status: 'Draft',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleEditEvent = (event: ScenarioEvent) => {
    setEditingEvent({ ...event });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!editingEvent) return;
    setEvents(prev => {
      const exists = prev.some(e => e.id === editingEvent.id);
      if (exists) {
        return prev.map(e => e.id === editingEvent.id ? editingEvent : e);
      }
      return [...prev, editingEvent];
    });
    setIsModalOpen(false);
  };

  const handleDelete = () => {
    if (!editingEvent) return;
    if(confirm('Delete this event?')) {
        setEvents(prev => prev.filter(e => e.id !== editingEvent.id));
        setIsModalOpen(false);
    }
  };

  const filteredEvents = events.filter(event => 
    event.eventName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    event.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-background-light dark:bg-background-dark overflow-hidden relative">
       {/* Toolbar */}
       <div className="p-6 pb-2 flex flex-wrap items-center justify-between gap-4 sticky top-0 bg-inherit z-20">
         <div className="flex items-center gap-3">
            <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
             <input 
               type="text" 
               placeholder="Search events..." 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="pl-9 pr-4 py-1.5 text-sm bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/10 rounded-md focus:ring-1 focus:ring-primary focus:border-primary outline-none text-gray-900 dark:text-white w-64 shadow-sm"
             />
            </div>
            <button className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/10 rounded-md text-sm text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-white/20 transition-colors shadow-sm">
              <Filter size={16} />
              <span>Filter</span>
            </button>
         </div>

         <button 
           onClick={handleAddEvent}
           className="flex items-center gap-2 px-4 py-1.5 bg-primary hover:bg-primary-hover text-white rounded-md text-sm font-bold shadow-lg shadow-primary/20 transition-colors active:scale-95"
         >
            <Plus size={18} />
            <span>Add Event</span>
         </button>
       </div>

       {/* Table */}
       <div className="flex-1 overflow-auto p-6 pt-2">
         <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-white/5 shadow-sm overflow-hidden">
           <table className="w-full text-left border-collapse">
             <thead className="bg-gray-50 dark:bg-white/5 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold sticky top-0 z-10">
               <tr>
                 <th className="px-6 py-4 w-24">ID</th>
                 <th className="px-6 py-4 w-48">Timing</th>
                 <th className="px-6 py-4 w-64">Event Name</th>
                 <th className="px-6 py-4 min-w-[300px]">Details</th>
                 <th className="px-6 py-4 w-48">Characters</th>
                 <th className="px-6 py-4 w-32 text-center">Visuals</th>
                 <th className="px-6 py-4 w-48">Notes</th>
                 <th className="px-4 py-4 w-10"></th>
               </tr>
             </thead>
             <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-sm">
               {filteredEvents.map((event) => (
                 <tr 
                   key={event.id} 
                   className="group hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer"
                   onClick={() => handleEditEvent(event)}
                 >
                   <td className="px-6 py-4 text-gray-500 font-mono text-xs">{event.id}</td>
                   <td className="px-6 py-4 text-gray-900 dark:text-gray-300">{event.timing}</td>
                   <td className="px-6 py-4">
                     <div className="font-bold text-gray-900 dark:text-white mb-1">{event.eventName}</div>
                     <StatusBadge status={event.status} />
                   </td>
                   <td className="px-6 py-4 text-gray-600 dark:text-gray-400 leading-relaxed">
                     {event.details}
                   </td>
                   <td className="px-6 py-4">
                     <div className="flex flex-wrap gap-1">
                       {event.characters.map((char, idx) => (
                         <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 dark:bg-white/10 text-xs text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/5">
                           {char}
                         </span>
                       ))}
                     </div>
                   </td>
                   <td className="px-6 py-4">
                      {event.visuals.url ? (
                        <div className="w-16 h-10 rounded bg-gray-200 dark:bg-gray-800 overflow-hidden relative border border-gray-300 dark:border-white/10 group-hover:border-primary transition-colors cursor-pointer mx-auto">
                          <img src={event.visuals.url} alt={event.visuals.name} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                             <span className="text-[8px] text-white font-bold">{event.visuals.type.toUpperCase()}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="w-16 h-10 rounded bg-gray-100 dark:bg-white/5 border border-dashed border-gray-300 dark:border-white/10 flex items-center justify-center mx-auto text-gray-400">
                           <ImageIcon size={14} />
                        </div>
                      )}
                      <div className="text-[10px] text-center text-gray-500 mt-1 truncate max-w-[80px] mx-auto">{event.visuals.name}</div>
                   </td>
                   <td className="px-6 py-4 text-gray-500 italic text-xs">
                     {event.notes || '-'}
                   </td>
                   <td className="px-4 py-4 text-right">
                     <button className="p-1 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">
                       <MoreHorizontal size={16} />
                     </button>
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
         </div>
       </div>

       {/* Edit/Add Modal */}
       <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Event Details"
          footer={
             editingEvent && (
                <>
                  {events.some(e => e.id === editingEvent.id) ? (
                     <button onClick={handleDelete} className="text-red-400 hover:text-red-300 font-bold px-4 py-2 hover:bg-red-900/20 rounded">Delete</button>
                  ) : (
                     <div></div>
                  )}
                  <div className="flex gap-3">
                     <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-300 hover:bg-white/5 rounded">Cancel</button>
                     <button onClick={handleSave} className="px-6 py-2 bg-primary hover:bg-primary-hover text-white font-bold rounded shadow-lg shadow-primary/20">Save Event</button>
                  </div>
                </>
             )
          }
       >
          {editingEvent && (
             <div className="space-y-4">
               <div className="grid grid-cols-2 gap-4">
                   <div>
                       <Label>ID</Label>
                       <Input type="text" value={editingEvent.id} readOnly className="opacity-50 cursor-not-allowed" />
                   </div>
                   <div>
                       <Label>Status</Label>
                       <Select 
                           value={editingEvent.status}
                           onChange={(e) => setEditingEvent({...editingEvent, status: e.target.value as any})}
                       >
                           <option value="Draft">Draft</option>
                           <option value="Review">Review</option>
                           <option value="Final">Final</option>
                       </Select>
                   </div>
               </div>

               <div>
                   <Label>Event Name</Label>
                   <Input type="text" value={editingEvent.eventName} onChange={(e) => setEditingEvent({...editingEvent, eventName: e.target.value})} />
               </div>

               <div>
                   <Label>Timing</Label>
                   <Input type="text" value={editingEvent.timing} onChange={(e) => setEditingEvent({...editingEvent, timing: e.target.value})} />
               </div>

               <div>
                   <Label>Details</Label>
                   <TextArea className="h-24" value={editingEvent.details} onChange={(e) => setEditingEvent({...editingEvent, details: e.target.value})} />
               </div>

               <div>
                   <Label>Characters (comma separated)</Label>
                   <Input 
                     type="text" 
                     value={editingEvent.characters.join(', ')} 
                     onChange={(e) => setEditingEvent({...editingEvent, characters: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})} 
                   />
               </div>

               <div className="grid grid-cols-2 gap-4">
                   <div>
                       <Label>Visual Type</Label>
                       <Select 
                           value={editingEvent.visuals.type}
                           onChange={(e) => setEditingEvent({...editingEvent, visuals: {...editingEvent.visuals, type: e.target.value as any}})}
                       >
                           <option value="bg">Background (BG)</option>
                           <option value="cg">Event CG</option>
                       </Select>
                   </div>
                   <div>
                       <Label>Visual Name</Label>
                       <Input 
                         type="text" 
                         value={editingEvent.visuals.name} 
                         onChange={(e) => setEditingEvent({...editingEvent, visuals: {...editingEvent.visuals, name: e.target.value}})} 
                       />
                   </div>
               </div>
               
               <div>
                   <Label>Notes</Label>
                   <TextArea className="h-16" value={editingEvent.notes} onChange={(e) => setEditingEvent({...editingEvent, notes: e.target.value})} />
               </div>
             </div>
          )}
       </Modal>
    </div>
  );
};