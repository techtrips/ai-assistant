import { Divider } from "@fluentui/react-components";
import type { ISeparatorControl } from "../../templates.models";
import { toReactStyle } from "../common.utils";

export const Separator = ({ label, style }: ISeparatorControl) => (
	<Divider style={{ gridColumn: "1 / -1", ...toReactStyle(style) }}>
		{label}
	</Divider>
);
