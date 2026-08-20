'use client'
import { useState, useTransition } from 'react'
import { toggleGrocery } from './actions'

export default function GroceryItem({
  item,
  householdName,
}: {
  item: { id: string; name: string; is_purchased: boolean; amount: number | null; amount_type: string | null }
  householdName: string
}) {
  const [isPurchased, setIsPurchased] = useState(item.is_purchased)
  const [, startTransition] = useTransition()

  function handleToggle() {
    const next = !isPurchased
    setIsPurchased(next) // updates instantly, before the server responds
    startTransition(() => {
      toggleGrocery(item.id, next, householdName)
    })
  }

  return (
    <>
      <input
        type="checkbox"
        checked={isPurchased}
        onChange={handleToggle}
        autoComplete="off"
        style={{ accentColor: 'var(--primary)' }}
      />
      <span style={{ textDecoration: isPurchased ? 'line-through' : 'none', fontStyle: isPurchased ? 'italic' : 'normal' }}>
        {item.name}
        {item.amount != null && item.amount_type && ` (${item.amount} ${item.amount_type})`}
      </span>
    </>
  )
}