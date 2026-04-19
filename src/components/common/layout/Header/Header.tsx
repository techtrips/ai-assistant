import { Link } from "react-router";
import microsoftImg from "../../../resources/images/microsoft-logo.png";
import { makeStyles } from "@fluentui/react-components";
import { headerStyles } from "./Header.styles";

const useStyles = makeStyles(headerStyles);

export const Header = () => {
	const classes = useStyles();
	return (
		<header className={classes.header}>
			<Link to="/">
				<img className={classes.brand} src={microsoftImg} alt="Microsoft" />
			</Link>
			<nav className={classes.navbar}>
				<ul className={classes.navLinks}>
					<li>
						<Link to="/" className={classes.link}>
							Home
						</Link>
					</li>
				</ul>
			</nav>
		</header>
	);
};
