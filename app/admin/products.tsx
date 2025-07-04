import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, TextInput, Image } from 'react-native';
import { Plus, Search, Filter, Edit, Trash2 } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { productService, Product, ProductFilter } from '@/services/productService';
import { categoryService, Category } from '@/services/categoryService';

export default function ProductsScreen() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<ProductFilter>({
    categoryId: '',
    minPrice: undefined,
    maxPrice: undefined,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0
  });

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  const fetchCategories = async () => {
    try {
      const data = await categoryService.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProducts = async (page = 1, appliedFilters = filters) => {
    try {
      setLoading(true);
      const response = await productService.getProducts({ 
        ...appliedFilters,
        page,
        search: searchQuery
      });
      
      if (page === 1) {
        setProducts(response.products);
      } else {
        setProducts(prev => [...prev, ...response.products]);
      }
      
      setPagination({
        currentPage: response.currentPage,
        totalPages: response.totalPages,
        totalItems: response.totalItems
      });
    } catch (error) {
      console.error('Error fetching products:', error);
      Alert.alert('Error', 'Failed to load products');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchProducts(1);
  };

  const handleLoadMore = () => {
    if (pagination.currentPage < pagination.totalPages && !loading) {
      fetchProducts(pagination.currentPage + 1);
    }
  };

  const handleSearch = () => {
    fetchProducts(1);
  };

  const handleEdit = (productId: string) => {
    router.push(`/admin/products/edit/${productId}`);
  };

  const handleDelete = (productId: string, productName: string) => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete "${productName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await productService.deleteProduct(productId);
              setProducts(products.filter(product => product.id !== productId));
              Alert.alert('Success', 'Product deleted successfully');
            } catch (error) {
              console.error('Error deleting product:', error);
              Alert.alert('Error', 'Failed to delete product');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const applyFilters = () => {
    fetchProducts(1, filters);
    setShowFilters(false);
  };

  const resetFilters = () => {
    const resetFilters = {
      categoryId: '',
      minPrice: undefined,
      maxPrice: undefined,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    };
    setFilters(resetFilters);
    fetchProducts(1, resetFilters);
    setShowFilters(false);
  };

  const renderProductItem = ({ item }: { item: Product }) => (
    <View style={styles.productItem}>
      <Image 
        source={{ uri: item.imageUrl || 'https://via.placeholder.com/100' }}
        style={styles.productImage}
        resizeMode="cover"
      />
      
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productPrice}>${item.price.toFixed(2)}</Text>
        
        <View style={styles.productMeta}>
          {item.category && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{item.category.name}</Text>
            </View>
          )}
          
          <View style={[
            styles.statusBadge,
            item.isActive ? styles.activeBadge : styles.inactiveBadge
          ]}>
            <Text style={styles.statusText}>
              {item.isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>
      </View>
      
      <View style={styles.productActions}>
        <TouchableOpacity 
          style={styles.editButton} 
          onPress={() => handleEdit(item.id)}
        >
          <Edit size={16} color="#4CAF50" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => handleDelete(item.id, item.name)}
        >
          <Trash2 size={16} color="#FF3B30" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={18} color="#999999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
          />
        </View>
        
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Filter size={18} color="#666666" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => router.push('/admin/products/create')}
        >
          <Plus size={18} color="#FFFFFF" />
          <Text style={styles.addButtonText}>New</Text>
        </TouchableOpacity>
      </View>
      
      {showFilters && (
        <View style={styles.filtersContainer}>
          <Text style={styles.filtersTitle}>Filters</Text>
          
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Category</Text>
            <View style={styles.categoriesFilter}>
              <TouchableOpacity
                style={[
                  styles.categoryFilterButton,
                  filters.categoryId === '' && styles.selectedFilterButton
                ]}
                onPress={() => setFilters({ ...filters, categoryId: '' })}
              >
                <Text style={filters.categoryId === '' ? styles.selectedFilterText : styles.filterButtonText}>
                  All
                </Text>
              </TouchableOpacity>
              
              {categories.map(category => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryFilterButton,
                    filters.categoryId === category.id && styles.selectedFilterButton
                  ]}
                  onPress={() => setFilters({ ...filters, categoryId: category.id })}
                >
                  <Text style={filters.categoryId === category.id ? styles.selectedFilterText : styles.filterButtonText}>
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <View style={styles.filterGroupRow}>
            <View style={[styles.filterGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.filterLabel}>Min Price</Text>
              <TextInput
                style={styles.filterInput}
                placeholder="Min"
                keyboardType="numeric"
                value={filters.minPrice?.toString() || ''}
                onChangeText={(value) => setFilters({ 
                  ...filters, 
                  minPrice: value ? parseFloat(value) : undefined 
                })}
              />
            </View>
            
            <View style={[styles.filterGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.filterLabel}>Max Price</Text>
              <TextInput
                style={styles.filterInput}
                placeholder="Max"
                keyboardType="numeric"
                value={filters.maxPrice?.toString() || ''}
                onChangeText={(value) => setFilters({ 
                  ...filters, 
                  maxPrice: value ? parseFloat(value) : undefined 
                })}
              />
            </View>
          </View>
          
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Sort By</Text>
            <View style={styles.sortButtons}>
              <TouchableOpacity
                style={[
                  styles.sortButton,
                  filters.sortBy === 'name' && styles.selectedFilterButton
                ]}
                onPress={() => setFilters({ 
                  ...filters, 
                  sortBy: 'name',
                  sortOrder: filters.sortOrder
                })}
              >
                <Text style={filters.sortBy === 'name' ? styles.selectedFilterText : styles.filterButtonText}>
                  Name
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.sortButton,
                  filters.sortBy === 'price' && styles.selectedFilterButton
                ]}
                onPress={() => setFilters({ 
                  ...filters, 
                  sortBy: 'price',
                  sortOrder: filters.sortOrder
                })}
              >
                <Text style={filters.sortBy === 'price' ? styles.selectedFilterText : styles.filterButtonText}>
                  Price
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.sortButton,
                  filters.sortBy === 'createdAt' && styles.selectedFilterButton
                ]}
                onPress={() => setFilters({ 
                  ...filters, 
                  sortBy: 'createdAt',
                  sortOrder: filters.sortOrder
                })}
              >
                <Text style={filters.sortBy === 'createdAt' ? styles.selectedFilterText : styles.filterButtonText}>
                  Date
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.sortOrderButton,
                  filters.sortOrder === 'asc' && styles.selectedFilterButton
                ]}
                onPress={() => setFilters({ 
                  ...filters, 
                  sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' 
                })}
              >
                <Text style={filters.sortOrder === 'asc' ? styles.selectedFilterText : styles.filterButtonText}>
                  {filters.sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.filterActions}>
            <TouchableOpacity 
              style={styles.resetButton}
              onPress={resetFilters}
            >
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.applyButton}
              onPress={applyFilters}
            >
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B8A" />
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      ) : products.length > 0 ? (
        <FlatList
          data={products}
          renderItem={renderProductItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.productList}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.1}
          ListFooterComponent={
            pagination.currentPage < pagination.totalPages ? (
              <ActivityIndicator size="small" color="#FF6B8A" style={styles.loadMoreIndicator} />
            ) : null
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No products found</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 14,
    color: '#333333',
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B8A',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  filtersContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  filtersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 16,
  },
  filterGroup: {
    marginBottom: 16,
  },
  filterGroupRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 8,
  },
  filterInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  categoriesFilter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryFilterButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  sortButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  sortButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  sortOrderButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 8,
  },
  selectedFilterButton: {
    backgroundColor: '#FF6B8A',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#666666',
  },
  selectedFilterText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  filterActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  resetButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginRight: 8,
  },
  resetButtonText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  applyButton: {
    flex: 1,
    backgroundColor: '#FF6B8A',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginLeft: 8,
  },
  applyButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666666',
  },
  productList: {
    padding: 16,
    paddingTop: 8,
  },
  productItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#E1E1E1',
    marginRight: 16,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF6B8A',
    marginBottom: 8,
  },
  productMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryBadge: {
    backgroundColor: '#F0F0F0',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 12,
    color: '#666666',
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  activeBadge: {
    backgroundColor: '#E8F5E9',
  },
  inactiveBadge: {
    backgroundColor: '#FFEBEE',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333333',
  },
  productActions: {
    justifyContent: 'center',
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#999999',
  },
  loadMoreIndicator: {
    marginVertical: 16,
  },
});