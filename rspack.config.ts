import { defineConfig } from "@rspack/cli";
import { rspack, type SwcLoaderOptions } from "@rspack/core";
import { ReactRefreshRspackPlugin } from "@rspack/plugin-react-refresh";

const isDev = process.env.NODE_ENV === "development";

// Target browsers, see: https://github.com/browserslist/browserslist
const targets = ["last 2 versions", "> 0.2%", "not dead", "Firefox ESR"];

export default defineConfig({
	devServer: {
		port: 3000,
		historyApiFallback: true,
		hot: true,
		open: true,
	},
	entry: {
		main: "./src/main.tsx",
	},
	resolve: {
		extensions: ["...", ".ts", ".tsx", ".jsx"],
	},
	module: {
		rules: [
			{
				test: /\.svg$/,
				type: "asset",
			},
			{
				test: /\.(jsx?|tsx?)$/,
				use: [
					{
						loader: "builtin:swc-loader",
						options: {
							jsc: {
								parser: {
									syntax: "typescript",
									tsx: true,
								},
								transform: {
									react: {
										runtime: "automatic",
										development: isDev,
										refresh: isDev,
									},
								},
							},
							env: { targets },
						} satisfies SwcLoaderOptions,
					},
				],
			},
		],
	},
	plugins: [
		new rspack.HtmlRspackPlugin({
			template: "./public/index.html",
		}),
		new rspack.DefinePlugin({
			"process.env.NODE_ENV": JSON.stringify(
				process.env.NODE_ENV || "development",
			),
		}),
		new rspack.ProvidePlugin({
			process: "process/browser.js",
		}),
		isDev ? new ReactRefreshRspackPlugin() : null,
	],
	optimization: {
		minimizer: [
			new rspack.SwcJsMinimizerRspackPlugin(),
			new rspack.LightningCssMinimizerRspackPlugin({
				minimizerOptions: { targets },
			}),
		],
	},
	experiments: {
		css: true,
	},
	node: {
		global: true,
	},
});
