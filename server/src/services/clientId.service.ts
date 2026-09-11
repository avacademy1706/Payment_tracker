import { nextSequence } from "../models/Counter";

export async function generateClientId(): Promise<string> {
  const seq = await nextSequence("client");
  return `CL-${String(seq).padStart(4, "0")}`;
}
