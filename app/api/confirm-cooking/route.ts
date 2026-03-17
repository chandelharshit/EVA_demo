import { NextResponse } from 'next/server'
import { MOCK_PANTRY } from '../../../lib/mockData'
import { storeMemory } from '../../../lib/utils'
import type { IngredientUsed, PantryItem } from '../../../types'

export async function POST(req: Request) {
  try {
    const { userId = 'priya_001', meal, ingredientsToDeduct } = await req.json()

    // ── 1. Load current pantry ──────────────────────────────────────────────
    // REAL: const { data: pantry } = await supabase.from('pantry_items').select().eq('user_id', userId)
    const pantry: PantryItem[] = [...MOCK_PANTRY]

    // ── 2. Deduct ingredients ───────────────────────────────────────────────
    // REAL: supabase.from('pantry_items').update({ quantity: newQty }).eq('user_id', userId).eq('item_name', item)

    const updatedPantry = pantry.map(p => {
      const deduction = (ingredientsToDeduct as IngredientUsed[])
        .find(d => d.item.toLowerCase() === p.item_name.toLowerCase())

      if (deduction) {
        return { ...p, quantity: Math.max(0, p.quantity - deduction.qty) }
      }
      return p
    })

    // ── 3. Log meal history ─────────────────────────────────────────────────
    // REAL: supabase.from('meal_history').insert({ user_id, meal_name, ingredients_used, was_suggested_by_ai: true, user_confirmed: true })
    console.log('[MOCK] Logging meal_history:', { userId, meal, ingredientsToDeduct })

    // ── 4. Check for low stock after deduction ──────────────────────────────
    const lowStockAlerts = updatedPantry
      .filter(p => p.quantity <= p.low_threshold)
      .map(p => `${p.item_name} is running low (${p.quantity}${p.unit} left)`)

    // ── 5. Store memory ─────────────────────────────────────────────────────
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' })
    await storeMemory(
      userId,
      'MealAgent',
      `User cooked ${meal} on ${today} evening`,
      'event_context'
    )

    return NextResponse.json({
      success: true,
      updatedPantry,
      lowStockAlerts,
      message: `${meal} confirmed! Pantry updated. ${lowStockAlerts.length > 0 ? 'Some items are running low.' : 'You\'re well stocked.'}`,
    })

  } catch (error) {
    console.error('[/api/confirm-cooking] Error:', error)
    return NextResponse.json({ error: 'Failed to confirm cooking' }, { status: 500 })
  }
}
