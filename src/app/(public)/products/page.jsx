import React from 'react';
import ProductPage from '@/components/product/ProductPage';
import PageLayoutWrapper from '@/components/layout/PageLayoutWrapper';
import ProductsLoading from './loading';
import { getActiveProducts } from '@/lib/products';
import { getActiveCategories } from '@/lib/categories';

export const revalidate = 30;

export default async function ProdukRoutePage() {
  const [products, categories] = await Promise.all([
    getActiveProducts(100),
    getActiveCategories()
  ]);

  return (
    <PageLayoutWrapper>
      <React.Suspense fallback={<ProductsLoading />}>
        <ProductPage initialProducts={products} initialCategories={categories} />
      </React.Suspense>
    </PageLayoutWrapper>
  );
}