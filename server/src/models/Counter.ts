import { Schema, model } from "mongoose";

/**
 * Generic atomic sequence counter used to generate collision-free,
 * human-readable IDs (client IDs, invoice numbers) even under concurrent
 * requests. Each `key` tracks its own independent sequence.
 */
interface CounterDocument {
  key: string;
  seq: number;
}

const counterSchema = new Schema<CounterDocument>({
  key: { type: String, required: true, unique: true },
  seq: { type: Number, required: true, default: 0 },
});

export const Counter = model<CounterDocument>("Counter", counterSchema);

export async function nextSequence(key: string): Promise<number> {
  const doc = await Counter.findOneAndUpdate(
    { key },
    { $inc: { seq: 1 } },
    { upsert: true, new: true }
  );
  return doc.seq;
}
