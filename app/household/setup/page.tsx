import { createHousehold, joinHousehold } from './actions'

export default async function HouseholdSetupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams

  return (
    <div>
      <h1>Set up your household</h1>

      <section>
        <h2>Create a new household</h2>
        <form action={createHousehold}>
          <input type="text" name="name" placeholder="Household name" required />
          <button type="submit">Create</button>
        </form>
      </section>

      <section>
        <h2>Join an existing household</h2>
        <form action={joinHousehold}>
          <input type="text" name="householdId" placeholder="Household ID" required />
          <button type="submit">Join</button>
        </form>
      </section>

      {params.error && <p>{params.error}</p>}
    </div>
  )
}