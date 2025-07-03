import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> } 
) {
  const { id } = await params;
  try {
    const { nodes } = await req.json()
    const { db } = await connectToDatabase()

    const result = await db
      .collection("workflows")
      .findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { nodes } },
        { returnDocument: "after" }
      )

    if (!result) {
      return NextResponse.json(
        { error: "Workflow not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Failed to update workflow nodes:", error)
    return NextResponse.json(
      { error: "Failed to update workflow nodes" },
      { status: 500 }
    )
  }
} 