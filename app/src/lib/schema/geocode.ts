import { z } from "zod";

export const GeocodeRequestSchema = z
    .object({
        address: z.string().trim().min(1, "주소를 입력해주세요."),
    })
    .strict();

export type GeocodeRequest = z.infer<typeof GeocodeRequestSchema>;

export const GeocodeResponseDataSchema = z.object({
    latitude: z.number(),
    longitude: z.number(),
});

export type GeocodeResponseData = z.infer<typeof GeocodeResponseDataSchema>;
