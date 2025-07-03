"use client"

import { Button } from "@/components/ui/button"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { WorkflowEditor } from "./components/workflow-editor"
import { Input } from "@/components/ui/input"
import { Pencil, Trash2, Save, X } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ActionsList } from "./components/actions-list"

interface Workflow {
  id: string
  name: string
  // Add other workflow properties as needed
}

export default function WorkflowDetailPage() {
  const router = useRouter()
  const { id } = useParams()
  const [workflow, setWorkflow] = useState<Workflow | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editedName, setEditedName] = useState("")
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const fetchWorkflow = async () => {
      try {
        const response = await fetch(`/api/workflows/${id}`)
        if (!response.ok) throw new Error("Failed to fetch workflow")
        const data = await response.json()
        setWorkflow(data)
        setEditedName(data.name)
      } catch (error) {
        console.error("Failed to fetch workflow:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchWorkflow()
  }, [id])

  const handleSaveName = async () => {
    try {
      setIsSaving(true)
      const response = await fetch(`/api/workflows/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: editedName }),
      })

      if (!response.ok) throw new Error("Failed to update workflow")

      const updatedWorkflow = await response.json()
      setWorkflow(updatedWorkflow)
      setIsEditing(false)
    } catch (error) {
      console.error("Failed to update workflow:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/workflows/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete workflow")

      router.push("/workflows")
    } catch (error) {
      console.error("Failed to delete workflow:", error)
    }
  }

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>
    )
  }

  if (!workflow) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            Workflow not found
          </h2>
          <Button
            className="mt-4"
            onClick={() => router.push("/workflows")}
          >
            Back to Workflows
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
        <div className="flex h-14 items-center justify-between px-4 space-x-4 max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="flex items-center ">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/workflows")}
            >
              ← Back
            </Button>
            {isEditing ? (
              <div className="flex items-center space-x-2">
                <Input
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="h-8 w-64"
                  placeholder="Enter workflow name"
                />
                <Button
                  size="sm"
                  onClick={handleSaveName}
                  disabled={!editedName || isSaving}
                >
                  <Save className="h-4 w-4 mr-1" />
                  {isSaving ? "Saving..." : "Save"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setIsEditing(false)
                    setEditedName(workflow.name)
                  }}
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {workflow.name}
                </h1>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsEditing(true)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsDeleteDialogOpen(true)}
            className="text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
      </div>

      <div className="flex-1 relative bg-gray-50 dark:bg-gray-900">
        <div className="flex h-full">
          <div className="flex-1">
            <WorkflowEditor />
          </div>
          <div className="w-[420px]">
            <ActionsList />
          </div>
        </div>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workflow</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this workflow? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 