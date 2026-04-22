// src/app/api/translate/route.js
import { NextResponse } from "next/server";

export async function POST(req) {
    try {
        const { text, targetLang } = await req.json();

        if (!text) {
            return NextResponse.json({ message: "No text provided" }, { status: 400 });
        }

        // We use a free public translation API for this demo!
        // (For production with millions of users, you would swap this for Google Cloud or OpenAI)
        const response = await fetch(
            `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=autodetect|${targetLang}`
        );
        
        const data = await response.json();

        return NextResponse.json({ 
            translatedText: data.responseData.translatedText 
        }, { status: 200 });

    } catch (error) {
        console.error("Translation Error:", error);
        return NextResponse.json({ message: "Failed to translate text" }, { status: 500 });
    }
}