"use client"

import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { CreateWorkflowDialog } from "./components/create-workflow-dialog"
import { useRouter } from "next/navigation"

export default function WorkflowsPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [workflows, setWorkflows] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const fetchWorkflows = async () => {
    try {
      const response = await fetch("/api/workflows")
      if (!response.ok) throw new Error("Failed to fetch workflows")
      const data = await response.json()
      setWorkflows(data)
    } catch (error) {
      console.error("Failed to fetch workflows:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchWorkflows()
  }, [])

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Workflows
        </h1>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          Create Workflow
        </Button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        {isLoading ? (
          <div className="p-6 space-y-4">
            <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        ) : workflows.length === 0 ? (
          <div className="p-6">
            <div className="text-center text-gray-500 dark:text-gray-400">
              No workflows yet. Click "Create Workflow" to create one.
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {workflows.map((workflow) => (
              <div
                key={workflow._id}
                className="p-6 flex items-center justify-between"
              >
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {workflow.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Created {new Date(workflow.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => router.push(`/workflows/${workflow._id}`)}
                >
                  Configure →
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <CreateWorkflowDialog 
        open={isCreateDialogOpen} 
        onOpenChange={(open) => {
          setIsCreateDialogOpen(open)
          if (!open) fetchWorkflows()
        }}
      />
    </div>
  )
} 