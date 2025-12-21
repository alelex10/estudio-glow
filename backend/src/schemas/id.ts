import { z } from "zod";

export const IdSchema = z.uuid().openapi({
  example: "550e8400-e29b-41d4-a716-446655440000",
});