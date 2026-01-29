import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { retryWithBackoff } from "@/server/notification/service";

describe("notification/service", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe("retryWithBackoff", () => {
		it("함수가 성공하면 결과를 반환하고 재시도하지 않는다", async () => {
			const mockFn = vi.fn().mockResolvedValue("success");

			const resultPromise = retryWithBackoff(mockFn, 3, 2000);
			await vi.runAllTimersAsync();
			const result = await resultPromise;

			expect(result).toEqual({
				success: true,
				result: "success",
				retryCount: 0,
			});
			expect(mockFn).toHaveBeenCalledTimes(1);
		});

		it("첫 번째 실패 후 성공하면 retryCount를 올바르게 반환한다", async () => {
			const mockFn = vi
				.fn()
				.mockRejectedValueOnce(new Error("temporary failure"))
				.mockResolvedValue("success");

			const resultPromise = retryWithBackoff(mockFn, 3, 2000);
			await vi.runAllTimersAsync();
			const result = await resultPromise;

			expect(result).toEqual({
				success: true,
				result: "success",
				retryCount: 1,
			});
			expect(mockFn).toHaveBeenCalledTimes(2);
		});

		it("두 번 실패 후 성공하면 retryCount를 올바르게 반환한다", async () => {
			const mockFn = vi
				.fn()
				.mockRejectedValueOnce(new Error("failure 1"))
				.mockRejectedValueOnce(new Error("failure 2"))
				.mockResolvedValue("success");

			const resultPromise = retryWithBackoff(mockFn, 3, 2000);
			await vi.runAllTimersAsync();
			const result = await resultPromise;

			expect(result).toEqual({
				success: true,
				result: "success",
				retryCount: 2,
			});
			expect(mockFn).toHaveBeenCalledTimes(3);
		});

		it("최대 재시도 횟수를 초과하면 실패를 반환한다", async () => {
			const mockFn = vi.fn().mockRejectedValue(new Error("persistent failure"));

			const resultPromise = retryWithBackoff(mockFn, 3, 2000);
			await vi.runAllTimersAsync();
			const result = await resultPromise;

			expect(result).toEqual({
				success: false,
				retryCount: 3,
				error: "persistent failure",
			});
			// 최초 1회 + 재시도 3회 = 총 4회 호출
			expect(mockFn).toHaveBeenCalledTimes(4);
		});

		it("maxRetries가 0이면 재시도하지 않는다", async () => {
			const mockFn = vi.fn().mockRejectedValue(new Error("failure"));

			const resultPromise = retryWithBackoff(mockFn, 0, 2000);
			await vi.runAllTimersAsync();
			const result = await resultPromise;

			expect(result).toEqual({
				success: false,
				retryCount: 0,
				error: "failure",
			});
			expect(mockFn).toHaveBeenCalledTimes(1);
		});

		it("Error가 아닌 예외도 처리한다", async () => {
			const mockFn = vi.fn().mockRejectedValue("string error");

			const resultPromise = retryWithBackoff(mockFn, 0, 2000);
			await vi.runAllTimersAsync();
			const result = await resultPromise;

			expect(result).toEqual({
				success: false,
				retryCount: 0,
				error: "Unknown error",
			});
		});
	});
});
