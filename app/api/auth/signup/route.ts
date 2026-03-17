import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const { email, password, full_name, role = "user" } = await request.json();

    if (!email || !password || !full_name) {
      return NextResponse.json(
        { error: "Email, пароль и ФИО обязательны" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Некорректный формат email" },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Пароль должен быть не менее 6 символов" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("email", email.toLowerCase())
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "Пользователь с таким email уже зарегистрирован" },
        { status: 400 }
      );
    }

    // Hash password (in production, use bcrypt)
    const passwordHash = crypto
      .createHash("sha256")
      .update(password)
      .digest("hex");

    // Create user
    const { data: user, error } = await supabase
      .from("users")
      .insert([{
        email: email.toLowerCase(),
        password_hash: passwordHash,
        full_name,
        role,
      }])
      .select("id, email, full_name, role")
      .single();

    if (error) throw error;

    // Create session token
    const sessionToken = crypto.randomBytes(32).toString("hex");

    return NextResponse.json({
      success: true,
      message: "Регистрация успешна",
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
    console.error("Signup error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
