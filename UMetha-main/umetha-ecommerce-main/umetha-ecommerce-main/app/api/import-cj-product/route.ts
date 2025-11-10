import { NextRequest, NextResponse } from "next/server";

const CJ_API_URL = "https://developers.cjdropshipping.com/api2.0/v1/product/detail";
const CJ_ACCESS_TOKEN = process.env.CJ_ACCESS_TOKEN || "";

/**
 * POST /api/import-cj-product
 * Body: { cjProductId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { cjProductId } = await request.json();

    if (!cjProductId) {
      return NextResponse.json(
        { error: "Missing required field: cjProductId" },
        { status: 400 }
      );
    }

    const response = await fetch(CJ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "CJ-Access-Token": CJ_ACCESS_TOKEN,
      },
      body: JSON.stringify({ pid: cjProductId, language: "en" }),
    });

    const data = await response.json();

    if (!response.ok || !data?.data) {
      const message = data?.message || `CJ API failed with status ${response.status}`;
      console.error("❌ CJ API Error:", message);
      return NextResponse.json({ error: message }, { status: 500 });
    }

    const cjProduct = data.data;

    const product = {
      name: cjProduct.productName || "Unnamed CJ Product",
      description: cjProduct.description || "",
      price: parseFloat(cjProduct.sellPrice || "0"),
      stock: parseInt(cjProduct.packQuantity || "0"),
      sku: cjProduct.sku || `CJ-${cjProduct.id}`,
      images: cjProduct.productImages || [cjProduct.productImage],
      weight: parseFloat(cjProduct.packWeight || "0"),
      dimensions: {
        length: cjProduct.packLength || 0,
        width: cjProduct.packWidth || 0,
        height: cjProduct.packHeight || 0,
      },
    };

    return NextResponse.json({ product }, { status: 200 });
  } catch (error) {
    console.error("❌ Error fetching CJ product:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Optional GET route to check if API works
export async function GET() {
  return NextResponse.json({
    message: "Use POST with { cjProductId } to fetch CJ product details.",
  });
}
