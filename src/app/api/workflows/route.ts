import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function POST(req: Request) {
  try {
    const { name } = await req.json()
    const { db } = await connectToDatabase()

    const result = await db.collection("workflows").insertOne({
      name,
      createdAt: new Date(),
    })

    return NextResponse.json({ id: result.insertedId })
  } catch (error) {
    console.error("Failed to create workflow:", error)
    return NextResponse.json(
      { error: "Failed to create workflow" },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const { db } = await connectToDatabase()
    
    const workflows = await db
      .collection("workflows")
      .find({})
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json(workflows)
  } catch (error) {
    console.error("Failed to fetch workflows:", error)
    return NextResponse.json(
      { error: "Failed to fetch workflows" },
      { status: 500 }
    )
  }
} 