import { Badge } from "./Badge";

export const TimeBadge = ({ time }: { time: number | string }) => {
    // Convert seconds to mm:ss format
    const seconds = typeof time === "string" ? parseInt(time) : time;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const formattedTime = `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;

    return (
        <Badge size="sm" color="gray">
            {formattedTime}
        </Badge>
    );
};
