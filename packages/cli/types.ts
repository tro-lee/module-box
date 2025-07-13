export interface Choice {
  name: string
  value: string
  description: string
  function: () => Promise<void>
}
