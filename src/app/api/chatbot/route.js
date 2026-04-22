import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { message } = await req.json();
    const lowerMessage = message.toLowerCase();

    // Give the bot a fake "thinking" delay to feel more natural (1.5 seconds)
    await new Promise((resolve) => setTimeout(resolve, 1500));

    let reply = "I'm sorry, I didn't quite catch that. Could you rephrase your question?";

    // --- BLUECOLLORHUB RULE-BASED LOGIC ---
    if (lowerMessage.includes("hello") || lowerMessage.includes("hi")) {
      reply = "Hello! Welcome to BlueCollorHub. How can I assist you today?";
    } 
    else if (lowerMessage.includes("book") || lowerMessage.includes("hire") || lowerMessage.includes("find")) {
      reply = "To hire a worker, browse the 'Posts' feed and filter by Categories like 'Plumbing' or 'Mechanic'. Click 'Follow' on a worker's profile to connect with them!";
    } 
    else if (lowerMessage.includes("post") || lowerMessage.includes("create")) {
      reply = "You can create a new post by clicking the '+ Create' button at the top right of your dashboard. Make sure to include a clear title, description, and images of your work!";
    } 
    else if (lowerMessage.includes("admin") || lowerMessage.includes("support") || lowerMessage.includes("report")) {
      reply = "If you need human assistance or want to report an issue, please send a message directly to 'Admin Support' in your Chat tab.";
    } 
    else if (lowerMessage.includes("rating") || lowerMessage.includes("stars")) {
      reply = "Workers are rated on a 5-star scale based on past projects. You can leave a rating on a worker's post after your job is completed to build their reputation!";
    }

    return NextResponse.json({ reply }, { status: 200 });

  } catch (error) {
    console.error("Chatbot Error:", error);
    return NextResponse.json(
      { reply: "An error occurred. Please try again." }, 
      { status: 500 }
    );
  }
}