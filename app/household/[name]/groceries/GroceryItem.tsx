'use client'
import { useState, useTransition } from 'react'
import { toggleGrocery } from './actions'

export default function GroceryItem({
  item,
  householdName,
}: {
  item: { id: string; name: string; is_purchased: boolean }
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
      <span style={{ textDecoration: isPurchased ? 'line-through' : 'none' }}>
        {item.name}
      </span>
    </>
  )
}