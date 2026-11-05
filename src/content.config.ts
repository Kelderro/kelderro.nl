import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';
import { iconPaths } from './components/IconPaths';

const DEFAULT_DATE = new Date(0);

type IconName = keyof typeof iconPaths;
const iconNames = Object.keys(iconPaths) as [IconName, ...IconName[]];

export const collections = {
    engagement: defineCollection({
        loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/engagement' }),
        schema: ({ image }) =>
            z.object({
                mission: z.string(),
                position: z.string(),
                employer: z.string().optional(),
                employerSite: z.string().optional(),
                department: z.string().optional(),
                description: z.string(),
                impact: z.string().optional(),
                assignments: z.array(z.object({ name: z.string(), period: z.string() })).optional(),
                stats: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
                startDate: z.coerce.date().default(DEFAULT_DATE),
                endDate: z.coerce.date().default(DEFAULT_DATE),
                tags: z.array(z.string()),
                img: image().optional(),
                imgAlt: z.string().optional(),
                location: z.string(),
                employment: z.string(),
                selectedWork: z.boolean().optional().default(false),
                caseStudy: z.boolean().optional().default(false),
                sectorIcon: z.enum(iconNames),
                sectorTitle: z.string(),
            }),
    }),
};
