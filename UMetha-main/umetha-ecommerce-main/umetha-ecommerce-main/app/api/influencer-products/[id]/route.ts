import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: product, error } = await supabase
      .from("influencer_products")
      .select("*")
      .eq("id", params.id)
      .single();

    if (error || !product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error("❌ Error fetching product:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ⛔ PUT and DELETE disabled
export async function PUT() {
  return NextResponse.json(
    { error: "PUT not allowed. Read-only mode enabled." },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: "DELETE not allowed. Read-only mode enabled." },
    { status: 405 }
  );
}
