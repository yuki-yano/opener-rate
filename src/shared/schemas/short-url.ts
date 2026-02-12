import { z } from "zod";

const httpUrlSchema = z
  .string()
  .url()
  .refine((value) => {
    try {
      const protocol = new URL(value).protocol;
      return protocol === "http:" || protocol === "https:";
    } catch {
      return false;
    }
  }, "URLはhttp/httpsのみ対応しています");

export const shortenUrlRequestSchema = z.object({
  url: httpUrlSchema,
});

export const shortenUrlResponseSchema = z.object({
  shortenUrl: httpUrlSchema,
});

export type ShortenUrlRequest = z.infer<typeof shortenUrlRequestSchema>;
export type ShortenUrlResponse = z.infer<typeof shortenUrlResponseSchema>;
