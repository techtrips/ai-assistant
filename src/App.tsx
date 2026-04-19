import "./App.css";
import { BrowserRouter } from "react-router";
import { ThemeProvider } from "./resources/styles/theme";
import { Home } from "./components/common/layout/Home";

const App = () => {
	return (
		<BrowserRouter>
			<ThemeProvider>
				<Home />
			</ThemeProvider>
		</BrowserRouter>
	);
};

export default App;
