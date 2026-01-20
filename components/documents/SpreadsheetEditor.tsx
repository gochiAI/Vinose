import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Save, Plus, ChevronDown, Filter, Download, ArrowUpDown, ArrowUp, ArrowDown, Type, Hash, Calendar, CheckSquare, MoreVertical } from 'lucide-react';
import { FileItem } from '../../types';

interface SpreadsheetEditorProps {
  file: FileItem;
  onSave: (id: string, newContent: any, newName: string) => void;
  onClose: () => void;
}

type CellType = 'text' | 'number' | 'checkbox' | 'date';

interface CellMeta {
  type: CellType;
  format?: string;
}

interface SheetData {
  values: string[][];
  metadata: Record<string, CellMeta>; // key: "r,c"
}

// Helper to create grid with consistent column count
const createGrid = (rows: number, cols: number, existing?: string[][]): string[][] => {
  const grid = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      row.push(existing && existing[r] && existing[r][c] !== undefined ? existing[r][c] : '');
    }
    grid.push(row);
  }
  return grid;
};

// Ensure all rows have the same number of columns
const normalizeGrid = (data: string[][], minCols: number): string[][] => {
  const maxCols = Math.max(minCols, ...data.map(row => row.length));
  return data.map(row => {
    const normalized = [...row];
    while (normalized.length < maxCols) {
      normalized.push('');
    }
    return normalized;
  });
};

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export const SpreadsheetEditor = ({ file, onSave, onClose }: SpreadsheetEditorProps) => {
  const ROWS = 50;
  const COLS = 20;
  
  // Initialize data from file
  const initSheetData = (): SheetData => {
    if (file.content && typeof file.content === 'object' && 'values' in file.content) {
      const values = Array.isArray(file.content.values) ? file.content.values : createGrid(ROWS, COLS);
      return {
        values: normalizeGrid(values, COLS),
        metadata: file.content.metadata || {}
      };
    }
    const values = Array.isArray(file.content) ? file.content : createGrid(ROWS, COLS);
    return { 
      values: normalizeGrid(values, COLS), 
      metadata: {} 
    };
  };

  const [sheetData, setSheetData] = useState<SheetData>(initSheetData());
  const [name, setName] = useState(file.name);
  const [isDirty, setIsDirty] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{r: number, c: number} | null>(null);
  const [rangeStart, setRangeStart] = useState<{r: number, c: number} | null>(null);
  const [rangeEnd, setRangeEnd] = useState<{r: number, c: number} | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [columnMenu, setColumnMenu] = useState<number | null>(null);
  const [filterColumn, setFilterColumn] = useState<number | null>(null);
  const [sortColumn, setSortColumn] = useState<{col: number, direction: 'asc' | 'desc'} | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const columnMenuRef = useRef<HTMLDivElement>(null);

  // Auto-save after 2 seconds of inactivity
  useEffect(() => {
    if (!isDirty) return;
    
    const timeoutId = setTimeout(() => {
      handleSave();
    }, 2000);
    
    return () => clearTimeout(timeoutId);
  }, [sheetData, name, isDirty]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sheetData, name]);

  useEffect(() => {
    const handleMouseUp = () => {
      setIsDragging(false);
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (columnMenuRef.current && !columnMenuRef.current.contains(e.target as Node)) {
        setColumnMenu(null);
      }
    };
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('click', handleClickOutside);
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const handleSave = () => {
    onSave(file.id, sheetData, name);
    setIsDirty(false);
  };

  const getCellMeta = (r: number, c: number): CellMeta => {
    return sheetData.metadata[`${r},${c}`] || { type: 'text' };
  };

  const setCellMeta = (r: number, c: number, meta: CellMeta) => {
    const newMetadata = { ...sheetData.metadata };
    newMetadata[`${r},${c}`] = meta;
    setSheetData({ ...sheetData, metadata: newMetadata });
    setIsDirty(true);
  };

  const handleCellChange = (r: number, c: number, value: string) => {
    const newValues = [...sheetData.values];
    newValues[r] = [...newValues[r]];
    newValues[r][c] = value;
    setSheetData({ ...sheetData, values: newValues });
    setIsDirty(true);
  };

  const toggleCheckbox = (r: number, c: number) => {
    const currentValue = sheetData.values[r][c];
    const newValue = currentValue === 'TRUE' ? 'FALSE' : 'TRUE';
    handleCellChange(r, c, newValue);
  };

  const handleCellMouseDown = (r: number, c: number, e: React.MouseEvent) => {
    e.preventDefault();
    setSelectedCell({r, c});
    setRangeStart({r, c});
    setRangeEnd({r, c});
    setIsDragging(true);
  };

  const handleCellMouseEnter = (r: number, c: number) => {
    if (isDragging && rangeStart) {
      setRangeEnd({r, c});
    }
  };

  const isCellInRange = (r: number, c: number): boolean => {
    if (!rangeStart || !rangeEnd) return false;
    const minR = Math.min(rangeStart.r, rangeEnd.r);
    const maxR = Math.max(rangeStart.r, rangeEnd.r);
    const minC = Math.min(rangeStart.c, rangeEnd.c);
    const maxC = Math.max(rangeStart.c, rangeEnd.c);
    return r >= minR && r <= maxR && c >= minC && c <= maxC;
  };

  const getSelectedRangeText = (): string => {
    if (!rangeStart || !rangeEnd) return '';
    if (rangeStart.r === rangeEnd.r && rangeStart.c === rangeEnd.c) {
      return `${ALPHABET[rangeStart.c]}${rangeStart.r + 1}`;
    }
    const minR = Math.min(rangeStart.r, rangeEnd.r);
    const maxR = Math.max(rangeStart.r, rangeEnd.r);
    const minC = Math.min(rangeStart.c, rangeEnd.c);
    const maxC = Math.max(rangeStart.c, rangeEnd.c);
    return `${ALPHABET[minC]}${minR + 1}:${ALPHABET[maxC]}${maxR + 1}`;
  };

  const sortByColumn = (col: number, direction: 'asc' | 'desc') => {
    const newValues = [...sheetData.values];
    const headerRow = newValues[0];
    const dataRows = newValues.slice(1);
    
    dataRows.sort((a, b) => {
      const aVal = a[col] || '';
      const bVal = b[col] || '';
      
      // Try to parse as number
      const aNum = parseFloat(aVal);
      const bNum = parseFloat(bVal);
      
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return direction === 'asc' ? aNum - bNum : bNum - aNum;
      }
      
      // String comparison
      return direction === 'asc' 
        ? aVal.localeCompare(bVal) 
        : bVal.localeCompare(aVal);
    });
    
    setSheetData({ ...sheetData, values: [headerRow, ...dataRows] });
    setSortColumn({ col, direction });
    setIsDirty(true);
  };

  const setCellType = (type: CellType) => {
    if (!selectedCell) return;
    const meta = getCellMeta(selectedCell.r, selectedCell.c);
    setCellMeta(selectedCell.r, selectedCell.c, { ...meta, type });
    
    // Initialize checkbox value
    if (type === 'checkbox' && !sheetData.values[selectedCell.r][selectedCell.c]) {
      handleCellChange(selectedCell.r, selectedCell.c, 'FALSE');
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#1A1A1A] animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-200 dark:border-white/5 bg-white dark:bg-surface-dark sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <button 
            onClick={onClose}
            className="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-2">
            <div className="p-1 bg-green-500 rounded text-white">
              <span className="material-symbols-outlined text-[16px] block">table_chart</span>
            </div>
            <input 
              type="text" 
              value={name}
              onChange={(e) => { setName(e.target.value); setIsDirty(true); }}
              className="font-semibold text-base text-gray-900 dark:text-white bg-transparent border-none focus:ring-0 p-0 hover:underline decoration-dashed decoration-gray-400 cursor-text"
            />
            {isDirty && (
               <span className="text-xs text-gray-400 italic">•</span>
            )}
          </div>
        </div>

        <button 
          onClick={handleSave}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-medium text-sm transition-all ${
            isDirty 
              ? 'bg-green-600 hover:bg-green-700 text-white shadow-md' 
              : 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-300'
          }`}
        >
          <Save size={16} />
          {isDirty ? 'Save' : 'Saved'}
        </button>
      </div>

      {/* Formula Bar */}
      <div className="flex items-center gap-2 px-4 py-2 bg-[#F9FBFD] dark:bg-[#252525] border-b border-gray-200 dark:border-white/5">
         <div className="text-xs font-bold text-gray-500 w-20 text-center bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded py-1">
            {getSelectedRangeText()}
         </div>
         <div className="w-px h-6 bg-gray-300 dark:bg-white/20 mx-1"></div>
         
         {/* Cell Type Controls */}
         {selectedCell && (
           <div className="flex items-center gap-1 mr-2">
             <button
               onClick={() => setCellType('text')}
               className={`p-1 rounded ${getCellMeta(selectedCell.r, selectedCell.c).type === 'text' ? 'bg-green-100 dark:bg-green-900/30' : 'hover:bg-gray-100 dark:hover:bg-white/5'}`}
               title="Text"
             >
               <Type size={14} className="text-gray-600 dark:text-gray-400" />
             </button>
             <button
               onClick={() => setCellType('number')}
               className={`p-1 rounded ${getCellMeta(selectedCell.r, selectedCell.c).type === 'number' ? 'bg-green-100 dark:bg-green-900/30' : 'hover:bg-gray-100 dark:hover:bg-white/5'}`}
               title="Number"
             >
               <Hash size={14} className="text-gray-600 dark:text-gray-400" />
             </button>
             <button
               onClick={() => setCellType('checkbox')}
               className={`p-1 rounded ${getCellMeta(selectedCell.r, selectedCell.c).type === 'checkbox' ? 'bg-green-100 dark:bg-green-900/30' : 'hover:bg-gray-100 dark:hover:bg-white/5'}`}
               title="Checkbox"
             >
               <CheckSquare size={14} className="text-gray-600 dark:text-gray-400" />
             </button>
             <button
               onClick={() => setCellType('date')}
               className={`p-1 rounded ${getCellMeta(selectedCell.r, selectedCell.c).type === 'date' ? 'bg-green-100 dark:bg-green-900/30' : 'hover:bg-gray-100 dark:hover:bg-white/5'}`}
               title="Date"
             >
               <Calendar size={14} className="text-gray-600 dark:text-gray-400" />
             </button>
           </div>
         )}
         
         <span className="text-gray-400 font-serif italic">fx</span>
         <input 
            type="text" 
            className="flex-1 border border-gray-300 dark:border-white/10 rounded px-2 py-1 text-sm dark:bg-surface-dark dark:text-white focus:border-green-500 outline-none"
            value={selectedCell ? sheetData.values[selectedCell.r]?.[selectedCell.c] || '' : ''}
            onChange={(e) => selectedCell && handleCellChange(selectedCell.r, selectedCell.c, e.target.value)}
            disabled={!selectedCell}
         />
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto bg-gray-100 dark:bg-black/20 relative" ref={tableRef}>
         <table className="border-collapse w-max bg-white dark:bg-surface-darker text-sm table-fixed">
            <thead>
               <tr>
                  <th className="w-10 bg-[#F8F9FA] dark:bg-[#2A2A2A] border-r border-b border-gray-300 dark:border-gray-700 sticky top-0 left-0 z-10"></th>
                  {Array.from({ length: COLS }).map((_, i) => (
                     <th key={i} className="w-24 h-8 bg-[#F8F9FA] dark:bg-[#2A2A2A] border-r border-b border-gray-300 dark:border-gray-700 font-normal text-xs text-gray-500 select-none sticky top-0 z-0 relative">
                        <div className="flex items-center justify-center relative group">
                           {ALPHABET[i] || i}
                           {sortColumn?.col === i && (
                             <span className="absolute left-1">
                               {sortColumn.direction === 'asc' ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
                             </span>
                           )}
                           <button
                             onClick={(e) => {
                               e.stopPropagation();
                               setColumnMenu(columnMenu === i ? null : i);
                             }}
                             className="absolute right-1 opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-white/10 rounded p-0.5"
                           >
                             <ChevronDown size={10} />
                           </button>
                        </div>
                        
                        {/* Column Menu */}
                        {columnMenu === i && (
                          <div 
                            ref={columnMenuRef}
                            className="absolute top-full left-0 mt-1 bg-white dark:bg-surface-darker border border-gray-300 dark:border-gray-600 rounded shadow-lg py-1 z-50 w-48"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => {
                                sortByColumn(i, 'asc');
                                setColumnMenu(null);
                              }}
                              className="w-full px-3 py-1.5 text-left text-xs hover:bg-gray-100 dark:hover:bg-white/5 flex items-center gap-2"
                            >
                              <ArrowUp size={12} />
                              Sort A→Z
                            </button>
                            <button
                              onClick={() => {
                                sortByColumn(i, 'desc');
                                setColumnMenu(null);
                              }}
                              className="w-full px-3 py-1.5 text-left text-xs hover:bg-gray-100 dark:hover:bg-white/5 flex items-center gap-2"
                            >
                              <ArrowDown size={12} />
                              Sort Z→A
                            </button>
                            <div className="border-t border-gray-200 dark:border-gray-600 my-1"></div>
                            <button
                              onClick={() => {
                                setFilterColumn(filterColumn === i ? null : i);
                                setColumnMenu(null);
                              }}
                              className="w-full px-3 py-1.5 text-left text-xs hover:bg-gray-100 dark:hover:bg-white/5 flex items-center gap-2"
                            >
                              <Filter size={12} />
                              {filterColumn === i ? 'Clear Filter' : 'Filter'}
                            </button>
                          </div>
                        )}
                     </th>
                  ))}
               </tr>
            </thead>
            <tbody>
               {sheetData.values.map((row, r) => (
                  <tr key={r}>
                     <td className="h-8 bg-[#F8F9FA] dark:bg-[#2A2A2A] border-r border-b border-gray-300 dark:border-gray-700 text-center text-xs text-gray-500 select-none sticky left-0 z-0">
                        {r + 1}
                     </td>
                     {Array.from({ length: COLS }).map((_, c) => {
                        const isSelected = selectedCell?.r === r && selectedCell?.c === c;
                        const isInRange = isCellInRange(r, c);
                        const meta = getCellMeta(r, c);
                        const cellValue = row[c] || '';
                        
                        return (
                           <td 
                              key={c} 
                              className={`border-r border-b border-gray-200 dark:border-gray-700 p-0 relative min-w-[96px] cursor-cell
                                 ${isSelected ? 'ring-2 ring-green-500 z-10' : ''}
                                 ${isInRange && !isSelected ? 'bg-green-100/50 dark:bg-green-900/20' : ''}
                                 ${meta.type === 'number' ? 'text-right' : ''}
                              `}
                              onMouseDown={(e) => handleCellMouseDown(r, c, e)}
                              onMouseEnter={() => handleCellMouseEnter(r, c)}
                           >
                              {meta.type === 'checkbox' ? (
                                <div className="flex items-center justify-center h-full">
                                  <input
                                    type="checkbox"
                                    checked={cellValue === 'TRUE'}
                                    onChange={() => toggleCheckbox(r, c)}
                                    className="w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                                  />
                                </div>
                              ) : (
                                <input 
                                   type="text" 
                                   className={`w-full h-full px-2 py-1 border-none outline-none bg-transparent text-gray-900 dark:text-gray-200 text-sm ${meta.type === 'number' ? 'text-right' : ''}`}
                                   value={cellValue}
                                   onChange={(e) => handleCellChange(r, c, e.target.value)}
                                   onFocus={() => setSelectedCell({r, c})}
                                />
                              )}
                           </td>
                        );
                     })}
                  </tr>
               ))}
            </tbody>
         </table>
      </div>

      {/* Footer / Tabs */}
      <div className="bg-[#F8F9FA] dark:bg-[#2A2A2A] border-t border-gray-300 dark:border-gray-700 p-1 flex items-center gap-1">
         <button className="p-1 hover:bg-gray-200 dark:hover:bg-white/10 rounded">
            <Plus size={16} className="text-gray-600 dark:text-gray-400" />
         </button>
         <button className="px-4 py-1 bg-white dark:bg-surface-dark border-b-2 border-green-500 text-green-700 dark:text-green-400 text-xs font-bold shadow-sm rounded-t">
            Sheet1
         </button>
         <button className="px-4 py-1 hover:bg-gray-200 dark:hover:bg-white/5 text-gray-600 dark:text-gray-400 text-xs font-medium rounded-t">
            Sheet2
         </button>
      </div>
    </div>
  );
};