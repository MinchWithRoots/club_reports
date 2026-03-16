"use client";

import { useState, useRef, useEffect } from "react";

interface ComboBoxItem {
  id: number | string;
  name: string;
  [key: string]: any;
}

interface ComboBoxProps {
  items: ComboBoxItem[];
  value: string;
  onChange: (value: string, item?: ComboBoxItem) => void;
  onAddNew?: (value: string) => Promise<ComboBoxItem | null>;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  displayKey?: string;
  allowNew?: boolean;
}

export default function ComboBox({
  items,
  value,
  onChange,
  onAddNew,
  placeholder = "Выберите или введите значение",
  className = "input",
  disabled = false,
  displayKey = "name",
  allowNew = true,
}: ComboBoxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [filteredItems, setFilteredItems] = useState(items);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Update inputValue when value prop changes
  useEffect(() => {
    const selectedItem = items.find(item => item[displayKey] === value);
    setInputValue(selectedItem ? selectedItem[displayKey] : value);
  }, [value, items, displayKey]);

  // Filter items based on input
  useEffect(() => {
    const filtered = items.filter(item =>
      item[displayKey]
        .toLowerCase()
        .includes(inputValue.toLowerCase())
    );
    setFilteredItems(filtered);
  }, [inputValue, items, displayKey]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setIsOpen(true);
  };

  const handleSelectItem = (item: ComboBoxItem) => {
    setInputValue(item[displayKey]);
    onChange(item[displayKey], item);
    setIsOpen(false);
  };

  const handleAddNew = async () => {
    if (!inputValue.trim() || !onAddNew) return;

    setIsLoading(true);
    try {
      const newItem = await onAddNew(inputValue.trim());
      if (newItem) {
        handleSelectItem(newItem);
      }
    } catch (error) {
      console.error("Error adding new item:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const showAddNewButton =
    allowNew &&
    onAddNew &&
    inputValue.trim() &&
    !filteredItems.some(item => item[displayKey].toLowerCase() === inputValue.toLowerCase());

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        className={className}
        disabled={disabled}
        autoComplete="off"
      />

      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            backgroundColor: "white",
            border: "1px solid #ddd",
            borderTop: "none",
            maxHeight: "200px",
            overflowY: "auto",
            zIndex: 1000,
            borderRadius: "0 0 4px 4px",
          }}
        >
          {filteredItems.length > 0 ? (
            filteredItems.map(item => (
              <div
                key={item.id}
                onClick={() => handleSelectItem(item)}
                style={{
                  padding: "10px",
                  cursor: "pointer",
                  backgroundColor:
                    item[displayKey] === inputValue ? "#f0f0f0" : "white",
                  borderBottom: "1px solid #f0f0f0",
                  fontSize: "14px",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.backgroundColor =
                    "#f0f0f0";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.backgroundColor =
                    item[displayKey] === inputValue ? "#f0f0f0" : "white";
                }}
              >
                {item[displayKey]}
              </div>
            ))
          ) : (
            <div style={{ padding: "10px", color: "#999", fontSize: "14px" }}>
              Нет результатов
            </div>
          )}

          {showAddNewButton && (
            <div
              onClick={handleAddNew}
              style={{
                padding: "10px",
                cursor: "pointer",
                backgroundColor: "#f9f9f9",
                borderTop: "1px solid #ddd",
                color: "#0066cc",
                fontWeight: "bold",
                fontSize: "14px",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.backgroundColor =
                  "#f0f0f0";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.backgroundColor =
                  "#f9f9f9";
              }}
            >
              {isLoading ? "..." : `➕ Добавить "${inputValue}"`}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
