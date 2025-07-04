"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronDown, ChevronRight, Copy, Check, Search, X } from "lucide-react"
import JSONPretty from 'react-json-pretty'
import 'react-json-pretty/themes/monikai.css'

interface JSONViewerProps {
  data: any
  title?: string
  defaultExpanded?: boolean
  maxHeight?: string
  showCopyButton?: boolean
  showSearch?: boolean
}

export function JSONViewer({
  data,
  title,
  defaultExpanded = true,
  maxHeight = "400px",
  showCopyButton = true,
  showSearch = false
}: JSONViewerProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const [copied, setCopied] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [showSearchInput, setShowSearchInput] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }

  const filteredData = searchTerm ? filterObjectBySearch(data, searchTerm) : data

  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="mt-2 space-y-2">
        <div className="flex items-center justify-between">
          {title && <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">{title}</h4>}
          <span className="text-xs text-gray-500 dark:text-gray-400">No data available</span>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
          {title && <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">{title}</h4>}
        </div>
        
        <div className="flex items-center space-x-1">
          {showSearch && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setShowSearchInput(!showSearchInput)}
            >
              {showSearchInput ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
            </Button>
          )}
          {showCopyButton && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>

      {showSearch && showSearchInput && (
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Search in JSON..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-8 text-sm"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setSearchTerm("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
      
      {isExpanded && (
        <div className="w-full overflow-hidden">
          <div 
            className="bg-gray-100 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-600"
            style={{ maxHeight }}
          >
            <div className="overflow-y-auto overflow-x-auto" style={{ maxHeight }}>
              <JSONPretty
                data={filteredData}
                theme="monikai"
                style={{
                  backgroundColor: 'transparent',
                  fontSize: '0.75rem',
                  padding: '0.75rem',
                  margin: '0',
                  fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
                  minWidth: 'fit-content',
                  wordBreak: 'break-all',
                  whiteSpace: 'pre-wrap',
                  overflowWrap: 'break-word'
                }}
                mainStyle="padding: 0; margin: 0;"
                valueStyle="color: #a6e22e; word-break: break-all; white-space: pre-wrap; overflow-wrap: break-word;"
                keyStyle="color: #f92672;"
                stringStyle="color: #e6db74; word-break: break-all; white-space: pre-wrap; overflow-wrap: break-word;"
                booleanStyle="color: #ae81ff;"
                nullStyle="color: #f92672;"
                undefinedStyle="color: #f92672;"
                numberStyle="color: #ae81ff;"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Helper function to filter object by search term
function filterObjectBySearch(obj: any, searchTerm: string): any {
  if (typeof obj !== 'object' || obj === null) {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj
      .map(item => filterObjectBySearch(item, searchTerm))
      .filter(item => item !== null && item !== undefined)
  }

  const filtered: any = {}
  const searchLower = searchTerm.toLowerCase()

  for (const [key, value] of Object.entries(obj)) {
    // Check if key or value contains search term
    const keyMatches = key.toLowerCase().includes(searchLower)
    const valueMatches = typeof value === 'string' && value.toLowerCase().includes(searchLower)
    
    if (keyMatches || valueMatches) {
      filtered[key] = value
    } else if (typeof value === 'object' && value !== null) {
      const filteredValue = filterObjectBySearch(value, searchTerm)
      if (Object.keys(filteredValue).length > 0) {
        filtered[key] = filteredValue
      }
    }
  }

  return filtered
} 