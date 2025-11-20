export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {

      
influencer_products: {
  Row: {
    id: string;
    influencer_id: string;
    name: string;
    description: string;
    price: number;
    category_id: string | null;
    stock: number | null;
    sku: string | null;
    images: any | null;
    featured: boolean | null;
    status: string | null;
    tags: any | null;
    weight: number | null;
    dimensions: any | null;
    seo_title: string | null;
    seo_description: string | null;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    influencer_id: string;
    name: string;
    description: string;
    price: number;
    category_id?: string | null;
    stock?: number | null;
    sku?: string | null;
    images?: any | null;
    featured?: boolean | null;
    status?: string | null;
    tags?: any | null;
    weight?: number | null;
    dimensions?: any | null;
    seo_title?: string | null;
    seo_description?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    influencer_id?: string;
    name?: string;
    description?: string;
    price?: number;
    category_id?: string | null;
    stock?: number | null;
    sku?: string | null;
    images?: any | null;
    featured?: boolean | null;
    status?: string | null;
    tags?: any | null;
    weight?: number | null;
    dimensions?: any | null;
    seo_title?: string | null;
    seo_description?: string | null;
    created_at?: string;
    updated_at?: string;
  };
};

shipping_tokens: {
  Row: {
    id: string;
    user_id: string;
    carrier: "ups" | "fedex" | "dhl";
    access_token: string;
    refresh_token: string | null;
    expires_at: number;
    created_at: string;
  };
  Insert: {
    id?: string;
    user_id: string;
    carrier: "ups" | "fedex" | "dhl";
    access_token: string;
    refresh_token?: string | null;
    expires_at: number;
  };
  Update: {
    id?: string;
    user_id?: string;
    carrier?: "ups" | "fedex" | "dhl";
    access_token?: string;
    refresh_token?: string | null;
    expires_at?: number;
  };
};

      
      users: {
        Row: {
          user_id: number;
          first_name: string;
          last_name: string;
          phone_number: string;
          email: string;
          date_joined: string;
        };
        Insert: {
          user_id?: number;
          first_name: string;
          last_name: string;
          phone_number: string;
          email: string;
          date_joined: string;
        };
        Update: {
          user_id?: number;
          first_name?: string;
          last_name?: string;
          phone_number?: string;
          email?: string;
          date_joined?: string;
        };
      };





      credentials: {
        Row: {
          credentials_id: number;
          user_id: number;
          password_hash: string;
          last_login: string;
        };
        Insert: {
          credentials_id?: number;
          user_id: number;
          password_hash: string;
          last_login: string;
        };
        Update: {
          credentials_id?: number;
          user_id?: number;
          password_hash?: string;
          last_login?: string;
        };
      };


     addresses: {
        Row: {
          address_id: number;
          user_id: number;
          street_address: string;
          city: string | null;
          state: string | null;
          postal_code: string | null;
          country: string | null;
        };
        Insert: {
          address_id?: number;
          user_id: number;
          street_address: string;
          city?: string | null;
          state?: string | null;
          postal_code?: string | null;
          country?: string | null;
        };
        Update: {
          address_id?: number;
          user_id?: number;
          street_address?: string;
          city?: string | null;
          state?: string | null;
          postal_code?: string | null;
          country?: string | null;
        };
      };
      products: {
        Row: {
          products_id: number;
          name: string;
          description: string | null;
          sku: string | null;
          price: number;
          supplier_id: number | null;
          date_created: string;
          url: string | null;
          category_id: string | null;
        };
        Insert: {
          products_id?: number;
          name: string;
          description?: string | null;
          sku?: string | null;
          price: number;
          supplier_id?: number | null;
          date_created?: string;
          url?: string | null;
          category_id?: string | null;
        };
        Update: {
          products_id?: number;
          name?: string;
          description?: string | null;
          sku?: string | null;
          price?: number;
          supplier_id?: number | null;
          date_created?: string;
          url?: string | null;
          category_id?: string | null;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          image: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          image?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          image?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      product_translations: {
        Row: {
          id: string;
          product_id: string;
          language: string;
          name: string;
          description: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          language: string;
          name: string;
          description: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          language?: string;
          name?: string;
          description?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      category_translations: {
        Row: {
          id: string;
          category_id: string;
          language: string;
          name: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category_id: string;
          language: string;
          name: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          category_id?: string;
          language?: string;
          name?: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      suppliers: {
        Row: {
          supplier_id: number;
          name: string;
          email: string;
          phone_number: string;
          api_endpoint: string;
          date_created: string;
        };
        Insert: {
          supplier_id?: number;
          name: string;
          email: string;
          phone_number: string;
          api_endpoint: string;
          date_created: string;
        };
        Update: {
          supplier_id?: number;
          name?: string;
          email?: string;
          phone_number?: string;
          api_endpoint?: string;
          date_created?: string;
        };
      };
      orders: {
        Row: {
          order_id: number;
          user_id: number;
          order_date: string;
          status: string;
          total_amount: number;
        };
        Insert: {
          order_id?: number;
          user_id: number;
          order_date?: string;
          status: string;
          total_amount: number;
        };
        Update: {
          order_id?: number;
          user_id?: number;
          order_date?: string;
          status?: string;
          total_amount?: number;
        };
      };
      order_items: {
        Row: {
          order_items_id: number;
          order_id: number;
          product_id: number;
          quantity: number;
          price_per_item: number;
          total_price: number;
        };
        Insert: {
          order_items_id?: number;
          order_id: number;
          product_id: number;
          quantity: number;
          price_per_item: number;
          total_price: number;
        };
        Update: {
          order_items_id?: number;
          order_id?: number;
          product_id?: number;
          quantity?: number;
          price_per_item?: number;
          total_price?: number;
        };

 


      };
    };
  };
}

// Helper types for insert and update
export type TablesInsert<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Update"];
export type Tables<T extends keyof Database["public"]["Tables"] = keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
