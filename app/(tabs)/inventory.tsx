import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal, ActivityIndicator, Animated, RefreshControl } from 'react-native';
import { Package, Plus, Edit, Trash2, Save, ArrowLeft, Search } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { api } from '../../src/api/api';
import { useThemeColors } from '../../src/theme/ThemeContext';
import type { Product } from '../../src/api/api';
import { getBusinessConfig } from '../../src/config/businessTypes';
import { storage } from '../../src/utils/storage';

// Helper: affiche alertes sur web et mobile
const showAlert = (title: string, message?: string) => {
  if (typeof window !== 'undefined' && typeof (window as any).alert === 'function') {
    (window as any).alert(message ? (title + '\n\n' + message) : title);
  } else {
    Alert.alert(title, message);
  }
};

function ProductListItem({ product, index, onEdit, onDelete }: { 
  product: Product; 
  index: number; 
  onEdit: (product: Product) => void; 
  onDelete: (product: Product) => void; 
}) {
  const itemFadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(itemFadeAnim, {
      toValue: 1,
      duration: 400,
      delay: index * 80,
      useNativeDriver: true,
    }).start();
  }, [itemFadeAnim, index]);

  return (
    <Animated.View style={[
      styles.productCard,
      { opacity: itemFadeAnim }
    ]}>
      <View style={styles.productInfo}>
        <View style={styles.productHeader}>
          <Package size={20} color="#059669" />
          <Text style={styles.productName}>{product.name}</Text>
        </View>
        {product.description && (
          <Text style={styles.productDescription}>{product.description}</Text>
        )}
        <View style={styles.productDetails}>
          <Text style={styles.productDetail}>Prix: {Number(product.price)} FCFA</Text>
          <Text style={[
            styles.productDetail,
            Number(product.stock) <= (Number(product.lowStockAlert) || 5) ? styles.lowStock : null
          ]}>
            Stock: {Number(product.stock)}
          </Text>
        </View>
        {product.category && (
          <Text style={styles.productCategory}>Catégorie: {product.category}</Text>
        )}
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={() => onEdit(product)}>
          <Edit size={20} color="#059669" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => onDelete(product)}>
          <Trash2 size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

export default function InventoryScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [businessConfig, setBusinessConfig] = useState(getBusinessConfig('GENERAL'));
  const [extraValues, setExtraValues] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    purchasePrice: '',
    stock: '',
    category: '',
    barcode: '',
    lowStockAlert: '5',
  });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  // Charger la config du commerce de l'utilisateur
  useEffect(() => {
    const loadBusinessConfig = async () => {
      const userData = await storage.getUser();
      if (userData?.businessType) {
        setBusinessConfig(getBusinessConfig(userData.businessType));
      }
    };
    loadBusinessConfig();
  }, []);

  const filteredProducts = searchQuery.trim() === ''
    ? products
    : products.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.barcode?.includes(searchQuery)
      );

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.getProducts();
      if (response.success && response.data) {
        setProducts(response.data);
      }
    } catch (error) {
      console.error('Error loading products:', error);
      showAlert('Erreur', 'Impossible de charger les produits');
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const response = await api.getProducts();
      if (response.success && response.data) {
        setProducts(response.data);
      }
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!loading) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [loading, fadeAnim, scaleAnim]);

  useFocusEffect(
    useCallback(() => {
      loadProducts();
    }, [loadProducts])
  );

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.price) {
      showAlert('Erreur', 'Le nom et le prix du produit sont obligatoires');
      return;
    }

    try {
      const data = {
        name: formData.name,
        description: formData.description || undefined,
        price: parseFloat(formData.price),
        purchasePrice: formData.purchasePrice ? parseFloat(formData.purchasePrice) : 0,
        stock: formData.stock ? parseInt(formData.stock) : 0,
        category: formData.category || 'Général',
        barcode: formData.barcode || undefined,
        lowStockAlert: formData.lowStockAlert ? parseInt(formData.lowStockAlert) : 5,
      };

      let response;
      if (editingProduct) {
        response = await api.updateProduct(editingProduct.id!, data);
      } else {
        response = await api.createProduct(data);
      }

      if (response.success) {
        showAlert('Succès', editingProduct ? 'Produit mis à jour' : 'Produit ajouté');
        setModalVisible(false);
        resetForm();
        loadProducts();
      } else {
        showAlert('Erreur', response.message || 'Une erreur est survenue');
      }
    } catch (error) {
      console.error('Error saving product:', error);
      showAlert('Erreur', 'Impossible de sauvegarder le produit');
    }
  };

  const handleDelete = (product: Product) => {
    showAlert(
      'Confirmation',
      `Êtes-vous sûr de vouloir supprimer ${product.name} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await api.deleteProduct(product.id!);
              if (response.success) {
                showAlert('Succès', 'Produit supprimé');
                loadProducts();
              } else {
                showAlert('Erreur', response.message || 'Une erreur est survenue');
              }
            } catch (error) {
              console.error('Error deleting product:', error);
              showAlert('Erreur', 'Impossible de supprimer le produit');
            }
          }
        }
      ]
    );
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      purchasePrice: '',
      stock: '',
      category: businessConfig.categories[0] || 'Général',
      barcode: '',
      lowStockAlert: '5',
    });
    setExtraValues({});
    setEditingProduct(null);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: Number(product.price).toString(),
      purchasePrice: product.purchasePrice ? Number(product.purchasePrice).toString() : '',
      stock: Number(product.stock).toString(),
      category: product.category || 'Général',
      barcode: product.barcode || '',
      lowStockAlert: product.lowStockAlert ? Number(product.lowStockAlert).toString() : '5',
    });
    setModalVisible(true);
  };

  const openAddModal = () => {
    resetForm();
    setModalVisible(true);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.headerBg }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="white" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.headerText }]}>{businessConfig.productLabel}s en stock</Text>
        <TouchableOpacity onPress={openAddModal}>
          <Plus size={24} color="white" />
        </TouchableOpacity>
      </View>

      <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
        <Search size={20} color="#9ca3af" />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un produit..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <View style={styles.loadingIcon}>
            <Package size={40} color="#059669" />
          </View>
          <ActivityIndicator size="large" color="#059669" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      ) : (
        <ScrollView style={[styles.content, { backgroundColor: colors.background }]} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#059669']} tintColor="#059669" />}>
          {filteredProducts.length === 0 ? (
            <Animated.View style={[
              styles.emptyContainer,
              { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
            ]}>
              <Package size={64} color="#059669" />
              <Text style={styles.emptyText}>{searchQuery ? 'Aucun produit trouvé' : 'Aucun produit'}</Text>
              {!searchQuery && <Text style={styles.emptySubtext}>Ajoutez un produit avec le bouton +</Text>}
            </Animated.View>
          ) : (
            filteredProducts.map((product, index) => (
              <ProductListItem
                key={product.id}
                product={product}
                index={index}
                onEdit={openEditModal}
                onDelete={handleDelete}
              />
            ))
          )}
        </ScrollView>
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <ArrowLeft size={24} color="#059669" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{editingProduct ? 'Modifier Produit' : 'Nouveau Produit'}</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nom du {businessConfig.productLabel} *</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="Entrez le nom du produit"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                placeholder="Entrez la description"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Prix de vente *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.price}
                  onChangeText={(text) => setFormData({ ...formData, price: text })}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Prix d'achat</Text>
                <TextInput
                  style={styles.input}
                  value={formData.purchasePrice}
                  onChangeText={(text) => setFormData({ ...formData, purchasePrice: text })}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>{businessConfig.stockLabel} *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.stock}
                  onChangeText={(text) => setFormData({ ...formData, stock: text })}
                  placeholder="0"
                  keyboardType="number-pad"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Alerte stock bas</Text>
                <TextInput
                  style={styles.input}
                  value={formData.lowStockAlert}
                  onChangeText={(text) => setFormData({ ...formData, lowStockAlert: text })}
                  placeholder="5"
                  keyboardType="number-pad"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Catégorie</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
                <View style={{ flexDirection: 'row', gap: 8, paddingVertical: 4 }}>
                  {businessConfig.categories.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.categoryChip,
                        formData.category === cat && styles.categoryChipSelected
                      ]}
                      onPress={() => setFormData({ ...formData, category: cat })}
                    >
                      <Text style={[
                        styles.categoryChipText,
                        formData.category === cat && styles.categoryChipTextSelected
                      ]}>{cat}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Code-barres</Text>
              <TextInput
                style={styles.input}
                value={formData.barcode}
                onChangeText={(text) => setFormData({ ...formData, barcode: text })}
                placeholder="Entrez le code-barres"
              />
            </View>

            {/* Champs spécifiques à l'activité */}
            {businessConfig.extraFields.length > 0 && (
              <View style={styles.extraFieldsContainer}>
                <Text style={styles.extraFieldsTitle}>
                  🎯 Informations spécifiques {businessConfig.label}
                </Text>
                {businessConfig.extraFields.map((field) => (
                  <View key={field.key} style={styles.inputGroup}>
                    <Text style={styles.label}>{field.label}{field.required ? ' *' : ''}</Text>
                    {field.type === 'select' && field.options ? (
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
                        <View style={{ flexDirection: 'row', gap: 8, paddingVertical: 4 }}>
                          {field.options.map((opt) => (
                            <TouchableOpacity
                              key={opt}
                              style={[
                                styles.categoryChip,
                                extraValues[field.key] === opt && styles.categoryChipSelected
                              ]}
                              onPress={() => setExtraValues(prev => ({ ...prev, [field.key]: opt }))}
                            >
                              <Text style={[
                                styles.categoryChipText,
                                extraValues[field.key] === opt && styles.categoryChipTextSelected
                              ]}>{opt}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </ScrollView>
                    ) : (
                      <TextInput
                        style={styles.input}
                        value={extraValues[field.key] || ''}
                        onChangeText={(text) => setExtraValues(prev => ({ ...prev, [field.key]: text }))}
                        placeholder={field.placeholder}
                      />
                    )}
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} activeOpacity={0.7}>
              <Save size={20} color="white" />
              <Text style={styles.submitButtonText}>
                {editingProduct ? 'Mettre à jour' : 'Ajouter'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  header: {
    backgroundColor: '#059669',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 }
  },
  headerTitle: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3
  },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 16 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingIcon: { 
    width: 100, 
    height: 100, 
    backgroundColor: '#d1fae5', 
    borderRadius: 50, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 20 
  },
  loadingText: { marginTop: 10, color: '#6b7280', fontSize: 16 },
  content: { flex: 1, padding: 16, paddingTop: 0 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginTop: 16 },
  emptySubtext: { fontSize: 14, color: '#6b7280', marginTop: 8 },
  productCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3
  },
  productInfo: { flex: 1 },
  productHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  productName: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginLeft: 8 },
  productDescription: { fontSize: 14, color: '#6b7280', marginBottom: 8 },
  productDetails: { flexDirection: 'row', gap: 16, marginBottom: 8 },
  productDetail: { fontSize: 14, color: '#6b7280' },
  lowStock: { color: '#ef4444', fontWeight: 'bold' },
  productCategory: { fontSize: 14, color: '#059669' },
  actions: { flexDirection: 'row', gap: 8 },
  actionButton: {
    padding: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 12
  },
  modalContainer: { flex: 1, backgroundColor: 'white' },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb'
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  modalContent: { flex: 1, padding: 20 },
  inputGroup: { marginBottom: 20 },
  inputRow: { flexDirection: 'row', gap: 8 },
  label: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#f9fafb'
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  submitButton: {
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 10,
    gap: 8,
    elevation: 3,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3
  },
  submitButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  categoryChipSelected: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  categoryChipText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  categoryChipTextSelected: {
    color: 'white',
    fontWeight: 'bold',
  },
  extraFieldsContainer: {
    backgroundColor: '#f0fdf4',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  extraFieldsTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#065f46',
    marginBottom: 16,
  },
});
