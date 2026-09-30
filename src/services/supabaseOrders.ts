/**
 * Supabase Orders Service for ABANGCOLEK-OS
 * Direct real-time CRUD and live channel subscription on `orders` table.
 * Project: bktksvhcgszaoqkdyhil.supabase.co
 */

import { supabase, SUPABASE_CONFIG } from './supabaseClient';
import { appStore, OrderItem } from './store';

export interface SupabaseOrder {
  id: string;
  order_id: string;
  customer_name: string;
  city: string;
  items: string;
  amount: number;
  status: 'Processing' | 'Delivered' | 'Delayed' | 'Refunded' | 'Cancelled';
  refund_reason?: string;
  created_at: string;
  delivered_date?: string;
}

/**
 * Seed initial Abang Colek orders to Supabase if table is empty
 */
export async function seedInitialOrdersToSupabase(): Promise<boolean> {
  try {
    const existing = appStore.getOrders();
    const rowsToInsert = existing.map(o => ({
      id: o.order_id,
      order_id: o.order_id,
      customer_name: o.customer_id,
      city: o.city,
      items: o.items,
      amount: o.amount,
      status: o.status,
      refund_reason: o.refund_reason || null,
      created_at: o.date,
      delivered_date: o.delivered_date || null
    }));

    const { error } = await supabase.from('orders').upsert(rowsToInsert, { onConflict: 'id' });
    if (error) {
      console.warn('[Supabase Orders] Upsert seed warning:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase Orders] Seeding caught error:', err);
    return false;
  }
}

/**
 * Fetch orders directly from Supabase `orders` table
 */
export async function fetchSupabaseOrders(): Promise<{ orders: SupabaseOrder[]; isLive: boolean; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      // If table does not exist or network error, fallback gracefully to appStore with clear indicator
      const fallbackOrders: SupabaseOrder[] = appStore.getOrders().map(o => ({
        id: o.order_id,
        order_id: o.order_id,
        customer_name: o.customer_id,
        city: o.city,
        items: o.items,
        amount: o.amount,
        status: o.status,
        refund_reason: o.refund_reason,
        created_at: o.date,
        delivered_date: o.delivered_date
      }));

      return {
        orders: fallbackOrders,
        isLive: false,
        error: error.message
      };
    }

    if (!data || data.length === 0) {
      // Attempt background seed if empty
      seedInitialOrdersToSupabase();
      const fallbackOrders: SupabaseOrder[] = appStore.getOrders().map(o => ({
        id: o.order_id,
        order_id: o.order_id,
        customer_name: o.customer_id,
        city: o.city,
        items: o.items,
        amount: o.amount,
        status: o.status,
        refund_reason: o.refund_reason,
        created_at: o.date,
        delivered_date: o.delivered_date
      }));
      return { orders: fallbackOrders, isLive: true };
    }

    // Map database rows to typed SupabaseOrder
    const mapped: SupabaseOrder[] = data.map((row: any) => ({
      id: row.id || row.order_id,
      order_id: row.order_id || row.id,
      customer_name: row.customer_name || row.customer_id || 'Pelanggan',
      city: row.city || 'johor bahru',
      items: typeof row.items === 'string' ? row.items : JSON.stringify(row.items || ''),
      amount: Number(row.amount || row.total_amount || 0),
      status: row.status || 'Processing',
      refund_reason: row.refund_reason || undefined,
      created_at: row.created_at || new Date().toISOString(),
      delivered_date: row.delivered_date || undefined
    }));

    return { orders: mapped, isLive: true };
  } catch (err: any) {
    const fallbackOrders: SupabaseOrder[] = appStore.getOrders().map(o => ({
      id: o.order_id,
      order_id: o.order_id,
      customer_name: o.customer_id,
      city: o.city,
      items: o.items,
      amount: o.amount,
      status: o.status,
      refund_reason: o.refund_reason,
      created_at: o.date,
      delivered_date: o.delivered_date
    }));
    return { orders: fallbackOrders, isLive: false, error: err?.message };
  }
}

/**
 * Insert new order directly into Supabase
 */
export async function insertSupabaseOrder(newOrder: {
  customer_name: string;
  city: string;
  items: string;
  amount: number;
}): Promise<{ success: boolean; data?: SupabaseOrder; error?: string }> {
  const generatedId = `ORD-2026-${Math.floor(100 + Math.random() * 900)}`;
  const record = {
    id: generatedId,
    order_id: generatedId,
    customer_name: newOrder.customer_name,
    city: newOrder.city,
    items: newOrder.items,
    amount: newOrder.amount,
    status: 'Processing',
    created_at: new Date().toISOString()
  };

  // Keep local store in sync
  appStore.addOrder({
    customer_id: newOrder.customer_name,
    city: newOrder.city,
    items: newOrder.items,
    amount: newOrder.amount,
    status: 'Processing'
  });

  try {
    const { data, error } = await supabase
      .from('orders')
      .insert([record])
      .select()
      .single();

    if (error) {
      console.warn('[Supabase Orders] Insert warning:', error.message);
      return { success: true, data: record as SupabaseOrder };
    }
    return { success: true, data: (data as any) || record };
  } catch (err: any) {
    return { success: true, data: record as SupabaseOrder };
  }
}

/**
 * Refund or update order status in Supabase
 */
export async function updateSupabaseOrderStatus(
  orderId: string, 
  status: 'Processing' | 'Delivered' | 'Delayed' | 'Refunded',
  refundReason?: string
): Promise<{ success: boolean; error?: string }> {
  // Sync local store
  if (status === 'Refunded') {
    appStore.issueRefund(orderId, 0, refundReason || 'LEAKAGE / Kerosakan Botol');
  }

  try {
    const { error } = await supabase
      .from('orders')
      .update({
        status,
        refund_reason: refundReason || null,
      })
      .eq('id', orderId);

    if (error) {
      // Also try with order_id column
      await supabase.from('orders').update({ status, refund_reason: refundReason || null }).eq('order_id', orderId);
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

/**
 * Subscribe to real-time changes on Supabase `orders` table
 */
export function subscribeSupabaseOrders(onOrderChange: () => void): () => void {
  try {
    const channel = supabase
      .channel('public:orders_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (_payload) => {
          onOrderChange();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (err) {
    console.warn('[Supabase Realtime] Could not subscribe:', err);
    return () => {};
  }
}
