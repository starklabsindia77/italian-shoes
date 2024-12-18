import axios from 'axios';

const SHOPIFY_STORE_URL = process.env.SHOPIFY_STORE_URL || '';
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN || '';

export const fetchShopifyProducts = async () => {
    try {
        const response = await axios.get(
            `${SHOPIFY_STORE_URL}/admin/api/2023-01/products.json`,
            {
                headers: {
                    'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
                    'Content-Type': 'application/json',
                },
            }
        );

        if (response.status !== 200) throw new Error('Failed to fetch products');
        return response.data.products;
    } catch (error: any) {
        console.error('Error fetching Shopify products:', error.message);
        throw error;
    }
};
