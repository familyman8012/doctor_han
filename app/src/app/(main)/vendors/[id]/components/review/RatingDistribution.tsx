"use client";

import { Star } from "lucide-react";

interface RatingDistributionProps {
    distribution: Array<{ rating: number; count: number }>;
    totalCount: number;
}

export function RatingDistribution({ distribution, totalCount }: RatingDistributionProps) {
    if (totalCount === 0) return null;

    // Fill missing ratings with 0
    const distributionMap = new Map(distribution.map((d) => [d.rating, d.count]));
    const ratings = [5, 4, 3, 2, 1].map((rating) => ({
        rating,
        count: distributionMap.get(rating) ?? 0,
    }));

    return (
        <div className="space-y-2">
            {ratings.map(({ rating, count }) => {
                const pct = totalCount > 0 ? (count / totalCount) * 100 : 0;

                return (
                    <div key={rating} className="flex items-center gap-2 text-sm">
                        <div className="flex items-center gap-0.5 w-10 shrink-0 justify-end">
                            <span className="text-gray-600">{rating}</span>
                            <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                        </div>
                        <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-yellow-400 rounded-full transition-all duration-500"
                                style={{ width: `${pct}%` }}
                            />
                        </div>
                        <span className="w-8 text-right text-gray-500 text-xs tabular-nums">
                            {count}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}
