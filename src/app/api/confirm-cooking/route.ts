// ─────────────────────────────────────────────
//  AILA — POST /api/confirm-cooking
//  Deducts pantry after user confirms meal
// ─────────────────────────────────────────────

import { NextResponse } from 'next/server'
import type { IngredientCheck } from '../../../types'
import { MOCK_PANTRY } from '../../../lib/mockData'
import { storeMemory } from '../../../lib/utils'

export async function POST(req: Request) {
  try {
    const { userId, meal, ingredientsToDeduct }: {
      userId: string
      meal: string
      ingredientsToDeduct: IngredientCheck[]
    } = await req.json()

    // TODO: fetch current pantry from Supabase
    const pantry = [...MOCK_PANTRY]

    // Deduct ingredients
    const updatedPantry = pantry.map(item => {
      const deduction = ingredientsToDeduct.find(
        i => i.item.toLowerCase() === item.itemName.toLowerCase()
      )
      if (!deduction) return item
      return { ...item, quantity: Math.max(0, item.quantity - deduction.qty) }
    })

    // Check for low stock after deduction
    const lowStockAlerts = updatedPantry
      .filter(p => p.quantity <= p.lowThreshold)
      .map(p => `${p.itemName} is running low (${p.quantity}${p.unit} remaining)`)

    // TODO: upsert updatedPantry to Supabase pantry_items
    // TODO: insert into meal_history table
    // await supabase.from('meal_history').insert({
    //   user_id: userId,
    //   meal_name: meal,
    //   ingredients_used: ingredientsToDeduct,
    //   was_suggested_by_ai: true,
    //   user_confirmed: true,
    // })

    // Store memory
    await storeMemory(userId, 'MealAgent', `User cooked ${meal} — confirmed cooking`, 'feedback_signal')

    console.log(`[Pantry] Deducted ingredients for "${meal}"`)
    console.log(`[Pantry] Low stock alerts:`, lowStockAlerts)

    return NextResponse.json({
      success: true,
      updatedPantry,
      lowStockAlerts,
    })

  } catch (error) {
    console.error('[Confirm Cooking Error]', error)
    return NextResponse.json({ error: 'Failed to update pantry' }, { status: 500 })
  }
}
