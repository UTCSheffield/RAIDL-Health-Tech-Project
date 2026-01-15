
// src/content/config.ts
import { defineCollection, z } from 'astro:content';

const articles = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    pubDate: z.coerce.date(),
    author: z.string().optional(),
    tags: z.array(z.string()).default([]),
    image: z
      .object({
        url: z.string().optional(),
        alt: z.string().optional()
      })
      .optional(),
  }),
});

export const collections = {
  articles, // <-- must match the folder name under src/content
};
``
