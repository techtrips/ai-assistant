import React from "react";
import {
	Button as FluentButton,
	mergeClasses,
} from "@fluentui/react-components";
import type { ResolvedSummaryTile } from "./Table.utils";
import { getFluentIconComponent } from "../icons/fluentIcons";

export interface ITableSummaryTilesClassNames {
	summaryTilesRow: string;
	summaryTiles: string;
	summaryTile: string;
	summaryTileActive: string;
	summaryTileIcon: string;
	summaryTileText: string;
	summaryTileCount: string;
	summaryTileLabel: string;
}

export interface ITableSummaryTilesProps {
	tiles: ResolvedSummaryTile[];
	activeTileId: string | null;
	onSelectTile: (tileId: string) => void;
	classes: ITableSummaryTilesClassNames;
}

export const TableSummaryTiles: React.FC<ITableSummaryTilesProps> = ({
	tiles,
	activeTileId,
	onSelectTile,
	classes,
}) => {
	if (tiles.length === 0) return null;

	return (
		<div className={classes.summaryTilesRow}>
			<div className={classes.summaryTiles}>
				{tiles.map((tile) => {
					const isActive = tile.id === activeTileId;
					const Icon = getFluentIconComponent(tile.iconName);
					return (
						<FluentButton
							key={tile.id}
							appearance="transparent"
							className={mergeClasses(
								classes.summaryTile,
								isActive && classes.summaryTileActive,
							)}
							onClick={() => onSelectTile(tile.id)}
							aria-pressed={isActive}
						>
							{Icon && (
								<span className={classes.summaryTileIcon}>
									<Icon aria-hidden />
								</span>
							)}
							<span className={classes.summaryTileText}>
								<span className={classes.summaryTileCount}>{tile.count}</span>
								<span className={classes.summaryTileLabel}>{tile.label}</span>
							</span>
						</FluentButton>
					);
				})}
			</div>
		</div>
	);
};
