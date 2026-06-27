import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal, ActivityIndicator, Animated, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { ArrowLeft, Plus, Save, Trash2, ShoppingCart, Package, DollarSign, Receipt } from 'lucide-react-native';
import { api } from '../../src/api/api';
import { useThemeColors } from '../../src/theme/ThemeContext';
import type { Product, Sale } from '../../src/api/api';

function SaleItem({ sale, index, products, onDelete, getProductName }: { sale: Sale, index: number, products: Product[], onDelete: (sale: Sale) => void, getProductName: (id: number) => string }) {
  const itemFadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(itemFadeAnim, {
      toValue: 1,
      duration: 400,
      delay: index * 80,
      useNativeDriver: true,
    }).start();
  }, [itemFadeAnim, index]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Animated.View style={[
      styles.saleCard,
      { opacity: itemFadeAnim }
    ]}>
      <View style={styles.saleInfo}>
        <View style={styles.saleHeader}>
          <Package size={20} color="#059669" />
          <Text style={styles.productName}>{getProductName(sale.productId)}</Text>
        </View>
        <Text style={styles.saleDetail}>Quantité: {sale.quantity}</Text>
        <Text style={styles.saleDetail}>Paiement: {sale.paymentMethod}</Text>
        <Text style={styles.saleDate}>{formatDate(sale.createdAt || new Date().toISOString())}</Text>
      </View>
      <View style={styles.saleRight}>
        <Text style={styles.saleAmount}>{Number(sale.totalPrice).toLocaleString()} FCFA</Text>
        <TouchableOpacity style={styles.deleteButton} onPress={() => onDelete(sale)}>
          <Trash2 size={16} color="white" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

export default function SalesScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [formData, setFormData] = useState({
    productId: 0,
    quantity: 1,
    paymentMethod: 'Espèces',
    discount: 0,
    notes: ''
  });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const [salesResponse, productsResponse] = await Promise.all([
        api.getSales(),
        api.getProducts()
      ]);
      if (salesResponse.success && salesResponse.data) {
        setSales(salesResponse.data);
      }
      if (productsResponse.success && productsResponse.data) {
        setProducts(productsResponse.data);
      }
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [salesResponse, productsResponse] = await Promise.all([
        api.getSales(),
        api.getProducts()
      ]);
      if (salesResponse.success && salesResponse.data) {
        setSales(salesResponse.data);
      }
      if (productsResponse.success && productsResponse.data) {
        setProducts(productsResponse.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Erreur', 'Impossible de charger les données');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleSubmit = async () => {
    if (!formData.productId || formData.quantity <= 0) {
      Alert.alert('Erreur', 'Veuillez sélectionner un produit et une quantité valide');
      return;
    }

    try {
      // Calculate total price
      const product = products.find(p => p.id === formData.productId);
      const totalPrice = product
        ? product.price * formData.quantity * (1 - formData.discount / 100)
        : 0;

      const response = await api.createSale({
        ...formData,
        totalPrice
      });
      if (response.success) {
        Alert.alert('Succès', 'Vente enregistrée');
        setModalVisible(false);
        loadData();
      } else {
        Alert.alert('Erreur', response.message || 'Impossible d\'enregistrer la vente');
      }
    } catch (error) {
      console.error('Error creating sale:', error);
      Alert.alert('Erreur', 'Impossible d\'enregistrer la vente');
    }
  };

  const handleDelete = (sale: Sale) => {
    Alert.alert(
      'Confirmation',
      'Êtes-vous sûr de vouloir annuler cette vente ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await api.deleteSale(sale.id!);
              if (response.success) {
                Alert.alert('Succès', 'Vente annulée');
                loadData();
              } else {
                Alert.alert('Erreur', response.message || 'Impossible d\'annuler la vente');
              }
            } catch (error) {
              console.error('Error deleting sale:', error);
              Alert.alert('Erreur', 'Impossible d\'annuler la vente');
            }
          }
        }
      ]
    );
  };

  const getProductName = (productId: number) => {
    const product = products.find(p => p.id === productId);
    return product?.name || 'Produit inconnu';
  };

  const filteredSales = sales.filter(sale => {
    const productName = getProductName(sale.productId).toLowerCase();
    const paymentMethod = sale.paymentMethod?.toLowerCase() || '';
    return (
      productName.includes(searchQuery.toLowerCase()) ||
      paymentMethod.includes(searchQuery.toLowerCase())
    );
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.headerBg }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="white" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.headerText }]}>Ventes</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Plus size={24} color="white" />
        </TouchableOpacity>
      </View>

      <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
        <Receipt size={20} color="#9ca3af" />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Rechercher une vente..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <View style={styles.loadingLogo}>
            <ShoppingCart size={40} color="#059669" />
          </View>
          <ActivityIndicator size="large" color="#059669" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      ) : (
        <ScrollView style={[styles.content, { backgroundColor: colors.background }]} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#059669']} tintColor="#059669" />}>
          {filteredSales.length === 0 ? (
            <Animated.View style={[
              styles.emptyContainer,
              { opacity: fadeAnim, transform: [{ scale: scaleAnim }]
            }]}>
              <ShoppingCart size={64} color="#059669" />
              <Text style={styles.emptyText}>
                {searchQuery ? 'Aucune vente trouvée' : 'Aucune vente'}
              </Text>
              {!searchQuery && (
                <Text style={styles.emptySubtext}>
                  Enregistrez votre première vente
                </Text>
              )}
            </Animated.View>
          ) : (
            filteredSales.map((sale, index) => (
              <SaleItem 
                key={sale.id} 
                sale={sale} 
                index={index} 
                products={products}
                onDelete={handleDelete}
                getProductName={getProductName}
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
            <Text style={styles.modalTitle}>Nouvelle vente</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Produit</Text>
              <ScrollView horizontal style={styles.productPicker} showsHorizontalScrollIndicator={false}>
                {products.map(product => (
                  <TouchableOpacity
                    key={product.id}
                    style={[
                      styles.productOption,
                      formData.productId === product.id && styles.productOptionSelected
                    ]}
                    onPress={() => setFormData({ ...formData, productId: product.id! })}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.productOptionText}>{product.name}</Text>
                    <Text style={styles.productOptionPrice}>{Number(product.price).toLocaleString()} FCFA</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Quantité</Text>
              <TextInput
                style={styles.input}
                value={formData.quantity.toString()}
                onChangeText={text => setFormData({ ...formData, quantity: parseInt(text) || 1 })}
                keyboardType="number-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Réduction (%)</Text>
              <TextInput
                style={styles.input}
                value={formData.discount.toString()}
                onChangeText={text => setFormData({ ...formData, discount: parseInt(text) || 0 })}
                keyboardType="number-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mode de paiement</Text>
              <ScrollView horizontal style={styles.paymentPicker} showsHorizontalScrollIndicator={false}>
                {['Espèces', 'Orange Money', 'MTN Mobile Money', 'Moov Money', 'Carte Bancaire'].map(method => (
                  <TouchableOpacity
                    key={method}
                    style={[
                      styles.paymentOption,
                      formData.paymentMethod === method && styles.paymentOptionSelected
                    ]}
                    onPress={() => setFormData({ ...formData, paymentMethod: method })}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.paymentOptionText,
                      formData.paymentMethod === method && styles.paymentOptionTextSelected
                    ]}>{method}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.notes}
                onChangeText={text => setFormData({ ...formData, notes: text })}
                placeholder="Notes supplémentaires"
                multiline
                numberOfLines={3}
              />
            </View>

            {formData.productId > 0 && (
              <View style={styles.previewCard}>
                <View style={styles.previewHeader}>
                  <Receipt size={20} color="#059669" />
                  <Text style={styles.previewTitle}>Aperçu</Text>
                </View>
                <Text style={styles.previewText}>
                  Produit: {getProductName(formData.productId)}
                </Text>
                <Text style={styles.previewText}>
                  Total: {Number(
                    (products.find(p => p.id === formData.productId)?.price || 0) *
                    formData.quantity *
                    (1 - formData.discount / 100)
                  ).toLocaleString()} FCFA
                </Text>
              </View>
            )}

            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} activeOpacity={0.7}>
              <Save size={20} color="white" />
              <Text style={styles.submitButtonText}>Enregistrer la vente</Text>
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
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 16 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingLogo: { 
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
  saleCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3
  },
  saleInfo: { flex: 1, marginRight: 16 },
  saleHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  productName: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginLeft: 8 },
  saleDetail: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  saleDate: { fontSize: 12, color: '#9ca3af', marginTop: 8 },
  saleRight: { alignItems: 'flex-end' },
  saleAmount: { fontSize: 20, fontWeight: 'bold', color: '#059669', marginBottom: 12 },
  deleteButton: {
    backgroundColor: '#ef4444',
    padding: 8,
    borderRadius: 10
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
  productPicker: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  productOption: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginRight: 8,
    backgroundColor: '#f9fafb',
    minWidth: 120
  },
  productOptionSelected: {
    borderColor: '#059669',
    backgroundColor: '#d1fae5'
  },
  productOptionText: { fontSize: 14, fontWeight: '500', color: '#111827' },
  productOptionPrice: { fontSize: 12, color: '#059669', marginTop: 4, fontWeight: 'bold' },
  paymentPicker: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  paymentOption: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginRight: 8,
    backgroundColor: '#f9fafb'
  },
  paymentOptionSelected: {
    borderColor: '#059669',
    backgroundColor: '#059669'
  },
  paymentOptionText: { fontSize: 14, fontWeight: '500', color: '#111827' },
  paymentOptionTextSelected: { color: 'white' },
  previewCard: {
    backgroundColor: '#f3f4f6',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20
  },
  previewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  previewTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  previewText: { fontSize: 14, color: '#6b7280', marginTop: 4 },
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
  submitButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' }
});
