import { GeocodeRequestSchema } from "@/lib/schema/geocode";
import { badRequest } from "@/server/api/errors";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withRole } from "@/server/auth/guards";
import { geocodeAddress } from "@/server/geocode/service";

export const POST = withApi(
    withRole(["vendor"], async (ctx) => {
        const body = GeocodeRequestSchema.parse(await ctx.req.json());

        const result = await geocodeAddress(body.address);

        if (!result) {
            throw badRequest("주소를 좌표로 변환할 수 없습니다.");
        }

        return ok(result);
    }),
);
