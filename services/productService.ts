

/**
 * Service to trigger the cron API with a token in the headers
 * @param token - Authorization token
 * @returns Response data or throws an error
 */
export const triggerProductSync = async (token: string): Promise<any> => {
    try {
        const response = await fetch(`/api/shopify/sync`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to trigger product sync');
        }

        const data = await response.json();
        console.log('Product sync triggered successfully:', data);
        return data;
    } catch (error: any) {
        console.error('Error triggering product sync:', error.message);
        throw new Error(error.message || 'Unexpected error occurred');
    }
};
