import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase";

// Supabase client initialization
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://zgdwrrsqjdlxfwjqamxk.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnZHdycnNxamRseGZ3anFhbXhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0MzkzNDUsImV4cCI6MjA3NjAxNTM0NX0._4EEFOEIJ6vZMc0aGbgXfmmVi-WedTX6HpTDW4dLeOs";

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "Missing Supabase environment variables. Authentication will not work correctly."
  );
  throw new Error("Supabase environment variables are missing");
}

// Supabase client with authentication options
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Auth helper functions
export const auth = {
  signUp: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw new Error(error.message);
    return data;
  },
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    return data;
  },
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
    return { message: "Signed out successfully" };
  },
  getUser: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw new Error(error.message);
    return data;
  },
  getSession: async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw new Error(error.message);
    return data;
  },
};

// Database helper functions
export const db = {
  // Users
  getUsers: async () => {
    const { data, error } = await supabase.from("users").select("*");
    if (error) throw new Error(error.message);
    return data;
  },
  getUserById: async (userId: string) => {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("user_id", userId)
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  // Products
  getProducts: async (limit = 50, offset = 0) => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .range(offset, offset + limit - 1);
    if (error) throw new Error(error.message);
    return data;
  },
  getProductById: async (productId: string) => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("products_id", productId)
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  searchProducts: async (query: string, language = "en") => {
    const searchPatterns = buildSearchPatterns(query);
    let queryBuilder = supabase.from("products").select("*");

    if (searchPatterns.length > 0) {
      queryBuilder = queryBuilder.or(searchPatterns.join(","));
    }

    if (language) {
      queryBuilder = queryBuilder.eq("language", language);
    }

    const { data, error } = await queryBuilder.order("name", { ascending: true });

    if (error) throw new Error(error.message);
    return data;
  },

  searchProductsAdvanced: async (params: {
    query?: string;
    language?: string;
    Category?: string;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: string;
    order?: "asc" | "desc";
    limit?: number;
    offset?: number;
  }) => {
    const {
      query = "",
      language = "en",
      Category,
      minPrice,
      maxPrice,
      sortBy = "name",
      order = "asc",
      limit = 12,
      offset = 0
    } = params;

    let queryBuilder = supabase.from("products").select("*");

    // Build search conditions if any query is provided
    if (query) {
      const searchPatterns = buildSearchPatterns(query);
      queryBuilder = queryBuilder.or(searchPatterns.join(','));
    }

    // Add filters if specified
    if (Category) queryBuilder = queryBuilder.eq("Category", Category);
    if (minPrice !== undefined) queryBuilder = queryBuilder.gte("price", minPrice);
    if (maxPrice !== undefined) queryBuilder = queryBuilder.lte("price", maxPrice);

    if (language) {
      queryBuilder = queryBuilder.eq("language", language);
    }

    // Sorting
    const sortField = sortBy === "price" ? "price" :
                     sortBy === "date_created" ? "date_created" : "name";
    queryBuilder = queryBuilder.order(sortField, { ascending: order === "asc" });

    // Pagination
    queryBuilder = queryBuilder.range(offset, offset + limit - 1);

    const { data, error } = await queryBuilder;
    if (error) throw new Error(error.message);
    return data;
  },

  // Orders
  getUserOrders: async (userId: string) => {
    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return data;
  },

  // Generic CRUD operations
  create: async (table: string, data: Record<string, unknown>) => {
    const { data: insertedData, error } = await supabase.from(table).insert(data).select();
    if (error) throw new Error(error.message);
    return insertedData;
  },
  update: async (table: string, id: string, data: Record<string, unknown>, idField = "products_id") => {
    const { data: updatedData, error } = await supabase.from(table).update(data).eq(idField, id).select();
    if (error) throw new Error(error.message);
    return updatedData;
  },
  delete: async (table: string, id: string, idField = "products_id") => {
    const { error } = await supabase.from(table).delete().eq(idField, id);
    if (error) throw new Error(error.message);
    return { message: "Record deleted successfully" };
  },
};

// Storage helper functions
export const storage = {
  uploadFile: async (bucket: string, path: string, file: File) => {
    const { data, error } = await supabase.storage.from(bucket).upload(path, file);
    if (error) throw new Error(error.message);
    return data;
  },
  getPublicUrl: (bucket: string, path: string) => {
    return supabase.storage.from(bucket).getPublicUrl(path);
  },
  deleteFile: async (bucket: string, path: string) => {
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) throw new Error(error.message);
    return { message: 'File deleted successfully' };
  },
};

// Helper function to build search patterns
function buildSearchPatterns(query: string) {
  const patterns = [];
  const words = query.split(' ').filter(word => word.length > 0);

  // Exact match patterns
  patterns.push(`name.ilike.%${query}%`);
  if (query.length > 0) patterns.push(`description.ilike.%${query}%`);

  // Multi-word patterns
  words.forEach(word => {
    patterns.push(`name.ilike.%${word}%`);
    patterns.push(`description.ilike.%${word}%`);
  });

  // Substring-based patterns for fuzzy matching
  if (query.length >= 2) {
    for (let i = 0; i <= query.length - 2; i++) {
      const substring = query.substring(i, i + 2);
      patterns.push(`name.ilike.%${substring}%`);
      patterns.push(`description.ilike.%${substring}%`);
    }
  }
  return patterns;
}
