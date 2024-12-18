interface LoginResponse {
    token: string;
    user: {
        id: string;
        email: string;
        roles: string[];
    };
}

export const loginUser = async (email: string, password: string): Promise<LoginResponse> => {
    const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData?.message || 'Invalid credentials';
        throw new Error(errorMessage);
    }

    return response.json() as Promise<LoginResponse>;
};
