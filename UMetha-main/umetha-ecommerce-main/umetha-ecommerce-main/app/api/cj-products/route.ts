import { NextRequest, NextResponse } from "next/server";

const CJ_API_URL = "https://developers.cjdropshipping.com/api2.0/v1/product/list";
const CJ_API_KEY = process.env.CJ_API_KEY || "";
const CJ_ACCESS_TOKEN = process.env.CJ_ACCESS_TOKEN || "";

// Simple in-memory cache (for low traffic dev/testing)
const cache = new Map<string, { data: any; timestamp: number }>();

// Helper: wait for a few milliseconds (used for retry)
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query")?.trim() || "";

    // Minimum search length
    if (query.length < 3) {
      return NextResponse.json(
        { products: [], message: "Enter at least 3 characters to search." },
        { status: 200 }
      );
    }

    // Check cache (valid for 3 minutes)
    const cached = cache.get(query);
    if (cached && Date.now() - cached.timestamp < 3 * 60 * 1000) {
      return NextResponse.json(cached.data, { status: 200 });
    }

    // Prepare request payload for CJ
    const payload = {
      keyword: query,
      pageNum: 1,
      pageSize: 20,
      language: "en",
      warehouse: "CN",
    };

    const fetchCJProducts = async (retry = 0): Promise<Response> => {
      const response = await fetch(CJ_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "CJ-Access-Token": CJ_ACCESS_TOKEN,
        },
        body: JSON.stringify(payload),
      });

      // Retry automatically if rate limited (429)
      if (response.status === 429 && retry < 3) {
        console.warn(`Rate limited by CJ API. Retrying... (${retry + 1}/3)`);
        await delay(3000); // wait 3 seconds
        return fetchCJProducts(retry + 1);
      }

      return response;
    };

    const res = await fetchCJProducts();
    const data = await res.json();

    // Handle response errors
    if (!res.ok) {
      const message =
        data?.message || `CJ API request failed with status ${res.status}`;
      console.error("CJ API error:", message);
      return NextResponse.json({ error: message }, { status: res.status });
    }

    // If CJ returns no products
    if (!data?.data?.list?.length) {
      return NextResponse.json(
        { products: [], message: "No products found for your query." },
        { status: 200 }
      );
    }

    // 🧩 Map CJ API products to your app’s structure
    const products = data.data.list.map((item: any) => ({
      id: item.id,
      name: item.productName || "",
      price: item.sellPrice || 0,
      image: item.productImage || "",
      sku: item.sku || "",
      category: item.categoryName || "",
      weight: item.packWeight || 0,
      status: item.status || "active",
      warehouse: item.warehouseName || "CN",
      created_at: new Date().toISOString(),
    }));

    const responseData = {
      products,
      total: products.length,
      hasMore: products.length >= 20,
    };

    // Store in cache
    cache.set(query, { data: responseData, timestamp: Date.now() });

    return NextResponse.json(responseData, { status: 200 });
  } catch (error) {
    console.error("Error in CJ products API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
