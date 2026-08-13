'use client'
import { useState, useTransition } from 'react'
import { toggleDishesStatus } from './actions'

export default function DishesItem({
  householdId,
  status,
  householdName,
  locked = false,
}: {
  householdId: string
  status: string
  householdName: string
  locked?: boolean
}) {
  const [currentStatus, setCurrentStatus] = useState(status)
  const [, startTransition] = useTransition()

  const displayStatus = locked ? 'cleaning' : currentStatus

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
          checked={displayStatus === 'clean'}
          onChange={() => handleChange('clean')}
          disabled={locked}
        />
        Clean
      </label>
      <label>
        <input
          type="radio"
          name="status"
          value="dirty"
          checked={displayStatus === 'cleaning'}
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
          checked={displayStatus === 'dirty'}
          onChange={() => handleChange('dirty')}
          disabled={locked}
        />
        Dirty
      </label>
    </>
  )
}
