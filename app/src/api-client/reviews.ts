import type { ReviewCreateBody } from "@/lib/schema/review";
import api from "./client";

export const reviewsApi = {
    create: (body: ReviewCreateBody) =>
        api.post("/api/reviews", body).then((r) => r.data),
};
