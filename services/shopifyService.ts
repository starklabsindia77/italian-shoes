import axios from 'axios';

const SHOPIFY_STORE_URL = process.env.SHOPIFY_STORE_URL || '';
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN || '';

export const fetchShopifyProducts = async () => {
    const response = await axios.get(`${SHOPIFY_STORE_URL}/admin/api/2024-10/products.json`, {
        headers: { 'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN },
    });
    return response.data.products;
};

export const fetchShopifyCollections = async (id: any) => {
    const response = await axios.get(`${SHOPIFY_STORE_URL}/admin/api/2024-10/collections/${id}.json`, {
        headers: { 'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN },
    });
    return response.data.collection;
};


export const fetchShopifyCustomCollections = async () => {
    const response = await axios.get(`${SHOPIFY_STORE_URL}/admin/api/2024-10/custom_collections.json`, {
        headers: { 'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN },
    });
    return response.data.custom_collections;
};

export const fetchShopifyCollects = async () => {
    const response = await axios.get(`${SHOPIFY_STORE_URL}/admin/api/2024-10/collects.json`, {
        headers: { 'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN },
    });
    return response.data.collects;
};

export const fetchShopifyProductsImages = async (id: any) => {
    const response = await axios.get(`${SHOPIFY_STORE_URL}/admin/api/2024-10/products/${id}/images.json`, {
        headers: { 'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN },
    });
    return response.data.images;
};

