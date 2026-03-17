import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("clubs")
      .select("id, name")
      .order("name", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      clubs: data || []
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Неизвестная ошибка";
    console.error("Clubs fetch error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json();

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: "Название клуба обязательно" },
        { status: 400 }
      );
    }

    // Проверяем, существует ли уже такой клуб
    const { data: existing } = await supabase
      .from("clubs")
      .select("id")
      .eq("name", name.trim())
      .single();

    if (existing) {
      return NextResponse.json({ 
        success: true,
        club: existing,
        isNew: false 
      });
    }

    // Создаём новый клуб
    const { data, error } = await supabase
      .from("clubs")
      .insert([{ name: name.trim() }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      club: data,
      isNew: true,
      message: "Клуб добавлен"
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Неизвестная ошибка";
    console.error("Club creation error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
