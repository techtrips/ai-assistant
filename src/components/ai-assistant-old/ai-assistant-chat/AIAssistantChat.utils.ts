export const getTimeAgo = (dateString: string): string => {
	const date = new Date(dateString);
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffMinutes = Math.floor(diffMs / 60000);
	const diffHours = Math.floor(diffMinutes / 60);
	const diffDays = Math.floor(diffHours / 24);

	if (diffMinutes < 1) return "Just now";
	if (diffMinutes < 60) return `${diffMinutes}m ago`;
	if (diffHours < 24) return `${diffHours}h ago`;
	if (diffDays < 7) return `${diffDays}d ago`;
	return date.toLocaleDateString();
};

export const formatMessageTime = (timestamp: string): string => {
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
