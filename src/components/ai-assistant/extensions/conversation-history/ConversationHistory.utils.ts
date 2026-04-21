export function getTimeAgo(dateStr: string): string {
	const diff = Date.now() - new Date(dateStr).getTime();
	const minutes = Math.floor(diff / 60000);
	if (minutes < 1) return "just now";
	if (minutes < 60) return `${minutes}m ago`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.floor(hours / 24);
	if (days < 30) return `${days}d ago`;
	return new Date(dateStr).toLocaleDateString();
}

export type TimeGroup =
	| "Today"
	| "Yesterday"
	| "This Week"
	| "This Month"
	| "Older";

export function getTimeGroup(dateStr: string): TimeGroup {
	const now = new Date();
	const date = new Date(dateStr);
	const startOfToday = new Date(
		now.getFullYear(),
		now.getMonth(),
		now.getDate(),
	);
	const diff = startOfToday.getTime() - date.getTime();

	if (date >= startOfToday) return "Today";
	if (diff < 86400000) return "Yesterday";
	if (diff < 7 * 86400000) return "This Week";
	if (diff < 30 * 86400000) return "This Month";
	return "Older";
}

const GROUP_ORDER: TimeGroup[] = [
	"Today",
	"Yesterday",
	"This Week",
	"This Month",
	"Older",
];

export function groupByTime<T>(
	items: T[],
	getDate: (item: T) => string,
): { label: TimeGroup; items: T[] }[] {
	const map = new Map<TimeGroup, T[]>();
	for (const item of items) {
		const group = getTimeGroup(getDate(item));
		if (!map.has(group)) map.set(group, []);
		map.get(group)!.push(item);
	}
	return GROUP_ORDER.filter((g) => map.has(g)).map((g) => ({
		label: g,
		items: map.get(g)!,
	}));
}
