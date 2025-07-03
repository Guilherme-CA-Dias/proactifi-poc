"use client"

import { useState } from "react"
import { ChevronRight, ChevronDown } from "lucide-react"

interface JsonViewerProps {
  data: any
  level?: number
  expanded?: boolean
}

export function JsonViewer({ data, level = 0, expanded = true }: JsonViewerProps) {
  const [isExpanded, setIsExpanded] = useState(expanded)
  const type = Array.isArray(data) ? "array" : typeof data
  const isExpandable = type === "object" || type === "array"

  if (data === null) return <span className="text-gray-500">null</span>
  if (type === "undefined") return <span className="text-gray-500">undefined</span>
  if (type === "string") return <span className="text-green-600 dark:text-green-400">"{data}"</span>
  if (type === "number") return <span className="text-blue-600 dark:text-blue-400">{data}</span>
  if (type === "boolean") return <span className="text-purple-600 dark:text-purple-400">{data.toString()}</span>

  if (isExpandable) {
    const isEmpty = Object.keys(data).length === 0
    if (isEmpty) {
      return <span className="text-gray-500">{type === "array" ? "[]" : "{}"}</span>
    }

    return (
      <div className="relative">
        <div className="inline-flex items-center cursor-pointer hover:text-blue-500">
          <div onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </div>
          <span className="text-gray-500 dark:text-gray-400">
            {type === "array" ? "[" : "{"}
          </span>
        </div>
        
        {isExpanded && (
          <div className="ml-3 border-l border-gray-200 dark:border-gray-700 pl-2">
            {Object.entries(data).map(([key, value], index) => (
              <div key={key} className="leading-tight">
                <span className="text-gray-800 dark:text-gray-200">{type === "array" ? "" : `"${key}": `}</span>
                <JsonViewer data={value} level={level + 1} />
                {index < Object.entries(data).length - 1 && <span className="text-gray-500">,</span>}
              </div>
            ))}
          </div>
        )}
        <span className="text-gray-500 dark:text-gray-400">
          {type === "array" ? "]" : "}"}
        </span>
      </div>
    )
  }

  return <span>{String(data)}</span>
} 