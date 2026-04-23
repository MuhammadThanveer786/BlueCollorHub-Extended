import { NextResponse } from "next/server";
import Activity from "@/models/Activity";
import User from "@/models/User"; // make sure this exists
import connectDB from "@/lib/db"; // adjust path if needed

export async function POST(req) {
  try {
    await connectDB();

    const body = await req.json();
    const { name, email, password } = body;

    // Create user
    const newUser = await User.create({
      name,
      email,
      password,
    });

    // Create activity log
    await Activity.create({
      action: "new_user",
      details: `${newUser.name} just joined the platform!`,
      userId: newUser._id,
    });

    return NextResponse.json(
      { message: "User registered successfully" },
      { status: 201 }
    );

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Error registering user" },
      { status: 500 }
    );
  }
}