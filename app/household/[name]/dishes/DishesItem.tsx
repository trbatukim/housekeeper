'use client'
import { useState, useTransition } from 'react'
import { toggleDishesStatus } from './actions'

export default function DishesItem({
  householdId,
  status,
  householdName,
}: {
  householdId: string
  status: string
  householdName: string
}) {
  const [currentStatus, setCurrentStatus] = useState(status)
  const [, startTransition] = useTransition()

  function handleChange(newStatus: string) {
    setCurrentStatus(newStatus) // updates instantly, before the server responds
    startTransition(() => {
      toggleDishesStatus(householdId, newStatus, householdName)
    })
  }

  return (
    <>
      <p>Dishes Status: </p>
      <label>
        <input
          type="radio"
          name="status"
          value="clean"
          checked={currentStatus === 'clean'}
          onChange={() => handleChange('clean')}
          disabled={false}
        />
        Clean
      </label>
      <label>
        <input
          type="radio"
          name="status"
          value="dirty"
          checked={currentStatus === 'cleaning'}
          onChange={() => handleChange('cleaning')}
          disabled={true}
        />
        Cleaning
      </label>
      <label>
        <input
          type="radio"
          name="status"
          value="dirty"
          checked={currentStatus === 'dirty'}
          onChange={() => handleChange('dirty')}
          disabled={false}
        />
        Dirty
      </label>
    </>
  )
}
