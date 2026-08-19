'use client'
import { useState, useTransition } from 'react'
import { toggleExpense } from './actions'

function formatDate(dateString: string) {
    const [year, month, day] = dateString.split('-')
    return `${day}/${month}/${year}`
}

function formatCategory(category: string) {
    return category.charAt(0).toUpperCase() + category.slice(1)
}

export default function ExpenseItem({
    expense,
    householdName,
}: {
    expense: {
        id: string
        description: string
        amount: number
        currency: string
        category: string
        paid_on: string
        is_paid: boolean
    }
    householdName: string
}) {
    const [isPaid, setIsPaid] = useState(expense.is_paid)
    const [, startTransition] = useTransition()

    const currencyMap = new Map<string, string>([
        ['euro', '€'], 
        ['tl', '₺'],
        ['dollar', '$'],
        ['pound', '£']
    ]);

    function handleToggle() {
        const next = !isPaid
        setIsPaid(next) // updates instantly, before the server responds
        startTransition(() => {
            toggleExpense(expense.id, next, householdName)
        })
    }

    return (
        <>
            <input
                type="checkbox"
                checked={isPaid}
                onChange={handleToggle}
                autoComplete="off"
                style={{ accentColor: 'var(--primary)' }}
            />
            <span style={{ textDecoration: isPaid ? 'line-through' : 'none' }}> 
                {expense.description}: {currencyMap.get(expense.currency)}{expense.amount} - Due: {formatDate(expense.paid_on)} ({formatCategory(expense.category)})
            </span>
        </>
    )
}
