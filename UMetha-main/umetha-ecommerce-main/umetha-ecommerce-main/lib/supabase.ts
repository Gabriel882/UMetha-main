import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase";

// Supabase client initialization
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;


if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase environment variables.");
  throw new Error("Supabase environment variables are missing");
}

// Create a typed Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Authentication helpers
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
};

// Database helpers
export const db = {
  getProducts: async (limit = 50, offset = 0) => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .range(offset, offset + limit - 1);
    if (error) throw new Error(error.message);
    return data;
  },

  getProductById: async (productId: number) => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("products_id", productId)
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  getCategories: async () => {
    const { data, error } = await supabase.from("categories").select("*");
    if (error) throw new Error(error.message);
    return data;
  },

  getOrdersByUser: async (userId: number) => {
    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return data;
  },
};
