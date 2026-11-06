export type GroceryType = {
    id: string
    household_id: string
    name: string
    amount: number | null
    amount_type: string | null
    is_purchased: boolean
    added_by: string | null
    created_at: string
}

export type NewGroceryType = Omit<GroceryType, "id" | "is_purchased" | "created_at">
export type GroceryUpdate = Partial<Pick<GroceryType, "name" | "amount" | "amount_type" | "is_purchased">>