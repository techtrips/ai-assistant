import { useCallback, useEffect, useRef, useState } from "react";

interface IUseAuthOptions {
	apiBaseUrl: string;
	email?: string;
	password?: string;
}

export function useAuth({ apiBaseUrl, email, password }: IUseAuthOptions) {
	const [loginError, setLoginError] = useState<string>("");
	const tokenRef = useRef<string>("");
	const refreshTokenRef = useRef<string>("");

	useEffect(() => {
		const login = async () => {
			if (!email || !password) {
				setLoginError(
					"Set auth.email and auth.password in app.config.dev.json to test AG-UI.",
				);
				return;
			}
			try {
				const res = await fetch(`${apiBaseUrl}/auth/login`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ email, password }),
				});
				if (!res.ok) {
					const body = await res.json().catch(() => ({}));
					setLoginError(body.error || `Login failed (HTTP ${res.status})`);
					return;
				}
				const data = await res.json();
				tokenRef.current = data.token;
				refreshTokenRef.current = data.refreshToken;
				setLoginError("");
			} catch {
				setLoginError("Login error: unable to reach API.");
			}
		};
		login();
	}, [apiBaseUrl, email, password]);

	const getAccessToken = useCallback(async (): Promise<string> => {
		if (tokenRef.current) {
			return tokenRef.current;
		}
		if (refreshTokenRef.current) {
			try {
				const res = await fetch(`${apiBaseUrl}/auth/refresh`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ refreshToken: refreshTokenRef.current }),
				});
				if (res.ok) {
					const data = await res.json();
					tokenRef.current = data.token;
					refreshTokenRef.current = data.refreshToken;
					return data.token;
				}
			} catch (err) {
				console.error("Token refresh error:", err);
			}
		}
		return "";
	}, [apiBaseUrl]);

	return { loginError, getAccessToken };
}
