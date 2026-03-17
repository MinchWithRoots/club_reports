import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const direction = searchParams.get('direction');

    let query = supabase.from("sections").select("id, direction, name, supervisor_name");

    if (direction) {
      query = query.eq("direction", direction);
    }

    const { data, error } = await query.order("name", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      sections: data || []
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Неизвестная ошибка";
    console.error("Sections fetch error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { direction, name, supervisor_name } = await request.json();

    if (!direction || !name || !supervisor_name) {
      return NextResponse.json(
        { error: "Все поля обязательны" },
        { status: 400 }
      );
    }

    // Проверяем, существует ли уже такая секция
    const { data: existing } = await supabase
      .from("sections")
      .select("id")
      .eq("name", name.trim())
      .eq("direction", direction)
      .single();

    if (existing) {
      return NextResponse.json({ 
        success: true,
        section: existing,
        isNew: false 
      });
    }

    // Создаём новую секцию
    const { data, error } = await supabase
      .from("sections")
      .insert([{ 
        direction, 
        name: name.trim(), 
        supervisor_name: supervisor_name.trim() 
      }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      section: data,
      isNew: true,
      message: "Секция добавлена"
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Неизвестная ошибка";
    console.error("Section creation error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
