'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { CUSTOM_AMOUNT_TYPE } from '@/lib/amountTypes'
import { sendNtfyReqWithoutDelay } from '@/lib/ntfy'
import {addGrocery, clearAllGroceries, clearPurchasedGroceries, updateGrocery} from "@/services/grocery-service";
import {AppError} from "@/core/errors/base.error";
import {deleteById} from "@/repositories/grocery-repository";

export async function addGroceryItem(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return
    }

    const householdId = formData.get('householdId') as string
    const name = (formData.get('name') as string).trim()
    const amountRaw = formData.get('amount') as string | null
    const selectedAmountType = formData.get('amountType') as string | null
    const customAmountType = (formData.get('customAmountType') as string | null)?.trim()
    const amountType = selectedAmountType === CUSTOM_AMOUNT_TYPE ? customAmountType : selectedAmountType
    const groceriesPath = `/household/${householdId}/groceries`

    const amount = Number(amountRaw)

    try {
        await addGrocery(supabase, householdId, user.id, {
            name: name,
            amount: amount,
            amountType: amountType
        })
    } catch (e: unknown) {
        if (e instanceof AppError) {
            redirect(`${groceriesPath}?error=${encodeURIComponent(e.message)}`);
        }
        throw e;
    }

    revalidatePath(groceriesPath)
}

export async function editGroceryItem(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return
    }

    const householdId = formData.get('householdId') as string
    const itemId = formData.get('itemId') as string
    const name = (formData.get('name') as string).trim()
    const amountRaw = formData.get('amount') as string | null
    const selectedAmountType = formData.get('amountType') as string | null
    const customAmountType = (formData.get('customAmountType') as string | null)?.trim()
    const amountType = selectedAmountType === CUSTOM_AMOUNT_TYPE ? customAmountType : selectedAmountType
    const groceriesPath = `/household/${householdId}/groceries`

    try {
        await updateGrocery(supabase, itemId, householdId, {
            name: name,
            amount: Number(amountRaw),
            amountType: amountType
        });
    } catch (e: unknown) {
        if (e instanceof AppError) {
            redirect(`${groceriesPath}?error=${encodeURIComponent(e.message)}`);
        }
        throw e;
    }

    revalidatePath(groceriesPath)
}

export async function clearGroceryList(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return
    }

    const householdId = formData.get('householdId') as string
    const groceriesPath = `/household/${householdId}/groceries`

    try {
        await clearAllGroceries(supabase, householdId);
    } catch (e: unknown) {
        if (e instanceof AppError) {
            redirect(`${groceriesPath}?error=${encodeURIComponent(e.message)}`);
        }
        throw e;
    }

    revalidatePath(groceriesPath)
}

export async function clearCheckedGroceries(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return
    }

    const householdId = formData.get('householdId') as string
    const groceriesPath = `/household/${householdId}/groceries`

    try {
        await clearPurchasedGroceries(supabase, householdId)
    } catch (e: unknown) {
        if (e instanceof AppError) {
            redirect(`${groceriesPath}?error=${encodeURIComponent(e.message)}`)
        }
        throw e
    }

    revalidatePath(groceriesPath)
}

export async function deleteGrocery(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return
    }

    const householdId = formData.get('householdId') as string
    const itemId = formData.get('itemId') as string
    const groceriesPath = `/household/${householdId}/groceries`

    try {
        await deleteById(supabase, itemId, householdId);
    } catch (e: unknown) {
        if (e instanceof AppError) {
            redirect(`${groceriesPath}?error=${encodeURIComponent(e.message)}`)
        }
    }

    revalidatePath(groceriesPath)
}

export async function toggleGrocery(
  itemId: string,
  isPurchased: boolean,
  householdId: string
) {
    const supabase = await createClient()
    const groceriesPath = `/household/${householdId}/groceries`

    try {
        await updateGrocery(supabase, itemId, householdId, {
            isPurchased: isPurchased
        });
    } catch (e: unknown) {
        if (e instanceof AppError) {
            redirect(`${groceriesPath}?error=${encodeURIComponent(e.message)}`);
        }
        throw e;
    }

  revalidatePath(groceriesPath)
}

export async function sendReminder(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return
    }

    const householdId = formData.get('householdId') as string
    const householdName = formData.get('householdName') as string
    const groceriesPath = `/household/${householdId}/groceries`

    const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .maybeSingle()

    const sentBy = profile?.name ?? 'Someone'
    const notificationId = await sendNtfyReqWithoutDelay(`${sentBy} reminded you about groceries!`, householdName, householdId)

    if (!notificationId) {
        redirect(`${groceriesPath}?error=${encodeURIComponent('Could not send the reminder. Please try again.')}`)
    }

    revalidatePath(groceriesPath)
}
