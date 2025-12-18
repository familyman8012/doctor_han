import React from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const SkeletonTd = ({ rowLengtd = 10, colLengtd }: { rowLengtd?: number; colLengtd: number }) => {
    return Array.from({ length: rowLengtd }).map((_, index) => (
        <tr key={index} className="border-b border-gray-100">
            {Array.from({ length: colLengtd }).map((_, thIndex) => (
                <td key={thIndex} className="px-4 py-3 align-middle">
                    <Skeleton height={20} width="30%" baseColor="#fcfcfc" />
                </td>
            ))}
        </tr>
    ));
};

export default SkeletonTd;
