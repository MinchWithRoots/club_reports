import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email и пароль обязательны" },
        { status: 400 }
      );
    }

    // Fetch user from database
    const { data: user, error } = await supabase
      .from("users")
      .select("id, email, full_name, role")
      .eq("email", email.toLowerCase())
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: "Неверный email или пароль" },
        { status: 401 }
      );
    }

    // Verify password
    const { data: userWithHash } = await supabase
      .from("users")
      .select("password_hash")
      .eq("id", user.id)
      .single();

    if (!userWithHash) {
      return NextResponse.json(
        { error: "Неверный email или пароль" },
        { status: 401 }
      );
    }

    // Simple password verification (in production, use bcrypt)
    const passwordHash = crypto
      .createHash("sha256")
      .update(password)
      .digest("hex");

    if (passwordHash !== userWithHash.password_hash) {
      return NextResponse.json(
        { error: "Неверный email или пароль" },
        { status: 401 }
      );
    }

    // Create session token (JWT or similar in production)
    const sessionToken = crypto.randomBytes(32).toString("hex");

    // Store session token in a secure way (could use Redis, database, etc.)
    // For now, we'll just return it in the response
    // Client should store in httpOnly cookie or secure storage

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
      },
      token: sessionToken,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Неизвестная ошибка";
    console.error("Login error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
