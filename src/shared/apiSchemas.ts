import { z } from "zod";

export const shortenUrlRequestSchema = z.object({
  url: z.string().url(),
});

export const shortenUrlResponseSchema = z.object({
  shortenUrl: z.string().url(),
});

export type ShortenUrlRequest = z.infer<typeof shortenUrlRequestSchema>;
export type ShortenUrlResponse = z.infer<typeof shortenUrlResponseSchema>;
