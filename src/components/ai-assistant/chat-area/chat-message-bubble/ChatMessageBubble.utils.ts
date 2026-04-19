export const formatTime = (timestamp: string): string => {
	const date = new Date(timestamp);
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const oneDayMs = 24 * 60 * 60 * 1000;
	const time = date.toLocaleTimeString([], {
		hour: "2-digit",
		minute: "2-digit",
	});
	if (diffMs >= oneDayMs) {
		const sameYear = date.getFullYear() === now.getFullYear();
		const dateStr = date.toLocaleDateString([], {
			month: "short",
			day: "numeric",
			...(sameYear ? {} : { year: "numeric" }),
		});
		return `${dateStr}, ${time}`;
	}
	return time;
};
