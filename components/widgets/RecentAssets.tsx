import React from 'react';
import { PlusCircle, Upload, User } from 'lucide-react';

export const RecentAssets = () => {
  return (
    <div className="col-span-1 md:col-span-1 lg:col-span-1 rounded-2xl bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/5 p-6 shadow-sm flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Recent Assets</h3>
          <span className="bg-gray-100 dark:bg-white/10 text-xs px-2 py-0.5 rounded-md text-gray-500">New</span>
        </div>
        <button className="text-primary dark:text-[#4fd1d9] hover:opacity-80 transition-opacity">
          <PlusCircle size={24} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 flex-1 content-start">
        {/* Asset 1: School Dusk */}
        <div className="group relative aspect-square rounded-lg overflow-hidden bg-gray-800 cursor-pointer">
          <img 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAnj3ubDZwiGIvxXny3BlyTikpdTbQagXG2MIDIU8mX-HY59gFZaNtz2TtCyICxGWGVrX6kAWrx5VSJEv664AlHIj_G0ZCMPG2RNFT658ayoqVQOCktL6fuze_37Dt2lWTJnR_zEXXU3Idwof4CLGqLwD1fS094AH7812vKPAC4hS7c_OmTTOUt8z2pdmKo42c7zjz7O25FbO15uTNReqkXnyY_jUgKw8HpBvPAiD6yKTg8mkXRzVkGtXFdQ6i0I-uoq36Y2W0TgnoU" 
            alt="School Dusk" 
            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500"
          />
          <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/90 to-transparent">
            <p className="text-[10px] text-white font-medium truncate">bg_school_dusk.jpg</p>
          </div>
        </div>

        {/* Asset 2: Character Placeholder */}
        <div className="group relative aspect-square rounded-lg overflow-hidden bg-gray-800 cursor-pointer">
          <div className="w-full h-full bg-gradient-to-b from-purple-900 to-indigo-900 flex items-center justify-center opacity-80 group-hover:opacity-100 transition-all">
            <User size={48} className="text-white/50 group-hover:text-white/80" />
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/90 to-transparent">
            <p className="text-[10px] text-white font-medium truncate">char_yuki_happy.png</p>
          </div>
        </div>

        {/* Asset 3: Beach Day */}
        <div className="group relative aspect-square rounded-lg overflow-hidden bg-gray-800 cursor-pointer">
          <img 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCbDVv06DDRJGCbLfNLF0XBd86zBrTpwb2Z0OQwapJ_6OugeDUaub3pG5NJJhhhhTIVbTTyutMcJNT33qn1QLT4Uo6Wxc7y6MMZnXYpQm_LbgXF439uvl3_Y8US5UZccayNgE6OWdFOGf6PF-b1Y9zR8rGVwXw7mh2avpRDHhPcRoNWKhfz05zqjf9d9TebOC9XQsyClkbdxOhg7xqsTnQ7id1vMir8s6hoDyjcxAwlgs9DR8mYZfuqoGnP2HmCvH0FyautoCGnAI_l" 
            alt="Beach Day" 
            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500"
          />
          <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/90 to-transparent">
            <p className="text-[10px] text-white font-medium truncate">bg_beach_day.jpg</p>
          </div>
        </div>

        {/* Asset 4: Drop Zone */}
        <div className="group relative aspect-square rounded-lg border-2 border-dashed border-gray-600 hover:border-primary cursor-pointer flex flex-col items-center justify-center gap-2 transition-colors">
          <Upload size={24} className="text-gray-500 group-hover:text-primary transition-colors" />
          <span className="text-[10px] text-gray-500 group-hover:text-primary font-medium transition-colors">Drop file</span>
        </div>
      </div>
    </div>
  );
};