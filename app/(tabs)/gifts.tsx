import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, ScrollView, FlatList, Alert } from 'react-native';
import { ShoppingBag, Gift, Star, Coins, Plus, Filter, Heart } from 'lucide-react-native';
import { useAppState } from '@/context/AppStateContext';
import PremiumFeatureModal from '@/components/PremiumFeatureModal';
import { getCategoryColor, getVirtualCurrencyPackages } from '@/data/giftData';
import { giftService, Gift as GiftType } from '@/services/giftService';

export default function GiftsScreen() {
  const { companion, updateCompanion, isPremium, virtualCurrency, setVirtualCurrency } = useAppState();
  const [selectedTab, setSelectedTab] = useState('shop');
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showCurrencyOptions, setShowCurrencyOptions] = useState(false);
  const [gifts, setGifts] = useState<GiftType[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await giftService.getGifts();
        setGifts(data);
      } catch (err) {
        console.warn('Failed to load gifts', err);
      }
    };
    load();
  }, []);

  const filteredGifts = gifts.filter(gift => {
    if (selectedFilter === 'all') return true;
    return gift.category === selectedFilter;
  });

  const purchasedGifts = companion.gifts ?
    gifts.filter(gift => companion.purchasedGifts?.includes(gift.id)) :
    [];

  const handleBuyGift = (gift: GiftType) => {
    if (gift.premium && !isPremium) {
      setShowPremiumModal(true);
      return;
    }

    if (virtualCurrency < gift.price) {
      Alert.alert(
        "Insufficient Funds",
        "You don't have enough coins to purchase this gift. Would you like to buy more?",
        [
          { text: "No", style: "cancel" },
          { text: "Yes", onPress: () => setShowCurrencyOptions(true) }
        ]
      );
      return;
    }

    Alert.alert(
      "Confirm Purchase",
      `Are you sure you want to buy "${gift.name}" for ${gift.price} coins?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Buy", 
          onPress: () => {
            // Update virtual currency
            setVirtualCurrency(prev => prev - gift.price);
            
            // Update purchased gifts
            const updatedPurchasedGifts = [...(companion.purchasedGifts || []), gift.id];
            
            // Add to recent activities
            const newActivity = {
              type: 'gift',
              description: `You gave ${companion.name} a ${gift.name}`,
              time: 'Just now'
            };
            
            const updatedActivities = [newActivity, ...(companion.recentActivities || []).slice(0, 9)];
            
            // Determine affection points based on gift category
            const affectionPoints =
              gift.category === 'rare'
                ? 3
                : gift.category === 'exclusive'
                  ? 5
                  : 1;

            const effectDuration = 24 * 60 * 60 * 1000; // 24h
            const newEffect = {
              giftId: gift.id,
              description: gift.effect,
              expiresAt: Date.now() + effectDuration
            };

            // Update companion data
            updateCompanion({
              ...companion,
              purchasedGifts: updatedPurchasedGifts,
              gifts: (companion.gifts || 0) + 1,
              recentActivities: updatedActivities,
              interactions: (companion.interactions || 0) + 5, // Gift giving is a significant interaction
              affection: (companion.affection || 0) + affectionPoints,
              activeGiftEffects: [...(companion.activeGiftEffects || []), newEffect]
            });
            
            // Show success message
            Alert.alert(
              "Gift Purchased!",
              `You've gifted ${gift.name} to ${companion.name}! ${gift.effect}.`,
              [{ text: "Great!" }]
            );
          } 
        }
      ]
    );
  };

  const handleBuyCurrency = (amount: number, price: string) => {
    Alert.alert(
      "Purchase Simulation",
      `This would initiate a real purchase for ${amount} coins (${price}) in a production app.`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Simulate Purchase", 
          onPress: () => {
            setVirtualCurrency(prev => prev + amount);
            setShowCurrencyOptions(false);
            Alert.alert("Success", `${amount} coins have been added to your account!`);
          }
        }
      ]
    );
  };

  const renderGiftItem = ({ item }: { item: GiftType }) => (
    <TouchableOpacity 
      style={styles.giftCard} 
      onPress={() => handleBuyGift(item)}
    >
      <View style={styles.giftImageContainer}>
        <Image 
          source={{ uri: item.imageUrl }} 
          style={styles.giftImage}
          resizeMode="cover"
        />
        {item.premium && !isPremium && (
          <View style={styles.premiumBadge}>
            <Star size={12} color="#FFFFFF" />
          </View>
        )}
        <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(item.category) }]}>
          <Text style={styles.categoryText}>{item.category}</Text>
        </View>
      </View>
      
      <View style={styles.giftInfo}>
        <Text style={styles.giftName}>{item.name}</Text>
        <Text style={styles.giftDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.giftPriceContainer}>
          <Coins size={14} color="#9C6ADE" />
          <Text style={styles.giftPrice}>{item.price}</Text>
        </View>
      </View>
      
      <TouchableOpacity 
        style={styles.buyButton}
        onPress={() => handleBuyGift(item)}
      >
        <Text style={styles.buyButtonText}>Buy</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Gifts</Text>
        
        <TouchableOpacity 
          style={styles.currencyContainer}
          onPress={() => setShowCurrencyOptions(true)}
        >
          <Coins size={18} color="#9C6ADE" />
          <Text style={styles.currencyText}>{virtualCurrency}</Text>
          <Plus size={14} color="#9C6ADE" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.tabs}>
        <TouchableOpacity 
          style={[styles.tab, selectedTab === 'shop' && styles.selectedTab]} 
          onPress={() => setSelectedTab('shop')}
        >
          <ShoppingBag size={20} color={selectedTab === 'shop' ? '#FF6B8A' : '#666666'} />
          <Text style={[styles.tabText, selectedTab === 'shop' && styles.selectedTabText]}>
            Gift Shop
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, selectedTab === 'inventory' && styles.selectedTab]} 
          onPress={() => setSelectedTab('inventory')}
        >
          <Gift size={20} color={selectedTab === 'inventory' ? '#FF6B8A' : '#666666'} />
          <Text style={[styles.tabText, selectedTab === 'inventory' && styles.selectedTabText]}>
            My Gifts
          </Text>
        </TouchableOpacity>
      </View>
      
      {selectedTab === 'shop' && (
        <>
          <View style={styles.filterContainer}>
            <Text style={styles.filterTitle}>
              <Filter size={16} color="#333333" style={{ marginRight: 8 }} /> Filter
            </Text>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
              <TouchableOpacity 
                style={[styles.filterOption, selectedFilter === 'all' && styles.selectedFilter]}
                onPress={() => setSelectedFilter('all')}
              >
                <Text style={[styles.filterText, selectedFilter === 'all' && styles.selectedFilterText]}>
                  All Gifts
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.filterOption, selectedFilter === 'common' && styles.selectedFilter]}
                onPress={() => setSelectedFilter('common')}
              >
                <Text style={[styles.filterText, selectedFilter === 'common' && styles.selectedFilterText]}>
                  Common
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.filterOption, selectedFilter === 'rare' && styles.selectedFilter]}
                onPress={() => setSelectedFilter('rare')}
              >
                <Text style={[styles.filterText, selectedFilter === 'rare' && styles.selectedFilterText]}>
                  Rare
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.filterOption, selectedFilter === 'exclusive' && styles.selectedFilter]}
                onPress={() => setSelectedFilter('exclusive')}
              >
                <Text style={[styles.filterText, selectedFilter === 'exclusive' && styles.selectedFilterText]}>
                  Exclusive
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
          
          <FlatList
            data={filteredGifts}
            renderItem={renderGiftItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.giftsList}
            numColumns={2}
            showsVerticalScrollIndicator={false}
          />
        </>
      )}
      
      {selectedTab === 'inventory' && (
        <View style={styles.inventoryContainer}>
          {purchasedGifts.length > 0 ? (
            <FlatList
              data={purchasedGifts}
              renderItem={({ item }) => (
                <View style={styles.inventoryItem}>
                  <Image source={{ uri: item.imageUrl }} style={styles.inventoryItemImage} />
                  <View style={styles.inventoryItemInfo}>
                    <Text style={styles.inventoryItemName}>{item.name}</Text>
                    <Text style={styles.inventoryItemDescription}>{item.description}</Text>
                  </View>
                  <TouchableOpacity style={styles.sendAgainButton}>
                    <Heart size={16} color="#FFFFFF" />
                    <Text style={styles.sendAgainText}>Send Again</Text>
                  </TouchableOpacity>
                </View>
              )}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.inventoryList}
            />
          ) : (
            <View style={styles.emptyInventory}>
              <Gift size={64} color="#CCCCCC" />
              <Text style={styles.emptyInventoryTitle}>No Gifts Yet</Text>
              <Text style={styles.emptyInventoryText}>
                You haven't purchased any gifts yet. Buy gifts to strengthen your relationship with {companion.name}.
              </Text>
              <TouchableOpacity 
                style={styles.shopNowButton}
                onPress={() => setSelectedTab('shop')}
              >
                <Text style={styles.shopNowButtonText}>Shop Now</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
      
      {showCurrencyOptions && (
        <View style={styles.modalOverlay}>
          <View style={styles.currencyModal}>
            <Text style={styles.currencyModalTitle}>Buy Coins</Text>
            <Text style={styles.currencyModalDescription}>
              Purchase coins to buy gifts for your companion
            </Text>
            
            {getVirtualCurrencyPackages().map(pkg => (
              <TouchableOpacity 
                key={pkg.id}
                style={styles.currencyPackage}
                onPress={() => handleBuyCurrency(pkg.amount + pkg.bonus, pkg.price)}
              >
                <View style={styles.packageInfo}>
                  <View style={styles.coinsContainer}>
                    <Coins size={18} color="#9C6ADE" />
                    <Text style={styles.packageAmount}>{pkg.amount}</Text>
                  </View>
                  {pkg.bonus > 0 && (
                    <Text style={styles.packageBonus}>+{pkg.bonus} bonus</Text>
                  )}
                </View>
                <View style={styles.packagePrice}>
                  <Text style={styles.priceText}>{pkg.price}</Text>
                </View>
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity 
              style={styles.closeModalButton}
              onPress={() => setShowCurrencyOptions(false)}
            >
              <Text style={styles.closeModalText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      <PremiumFeatureModal 
        visible={showPremiumModal} 
        onClose={() => setShowPremiumModal(false)}
        featureName="Premium Gifts"
        description="Unlock exclusive premium gifts to deepen your relationship with your AI companion."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 50,
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    position: 'relative',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  currencyContainer: {
    position: 'absolute',
    right: 16,
    top: 50,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    padding: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
  },
  currencyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginLeft: 4,
    marginRight: 2,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  selectedTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#FF6B8A',
  },
  tabText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 6,
  },
  selectedTabText: {
    color: '#FF6B8A',
    fontWeight: '600',
  },
  filterContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterScroll: {
    flexDirection: 'row',
  },
  filterOption: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  selectedFilter: {
    backgroundColor: '#FF6B8A',
  },
  filterText: {
    fontSize: 12,
    color: '#666666',
  },
  selectedFilterText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  giftsList: {
    padding: 8,
    paddingBottom: 80,
  },
  giftCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 6,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  giftImageContainer: {
    width: '100%',
    height: 120,
    position: 'relative',
  },
  giftImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E1E1E1',
  },
  premiumBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#9C6ADE',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  categoryText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  giftInfo: {
    padding: 10,
  },
  giftName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  giftDescription: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 8,
    lineHeight: 16,
    height: 32,
  },
  giftPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  giftPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333333',
    marginLeft: 4,
  },
  buyButton: {
    backgroundColor: '#FF6B8A',
    paddingVertical: 8,
    alignItems: 'center',
  },
  buyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  inventoryContainer: {
    flex: 1,
    padding: 16,
  },
  inventoryList: {
    paddingBottom: 20,
  },
  inventoryItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inventoryItemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#E1E1E1',
  },
  inventoryItemInfo: {
    flex: 1,
    marginHorizontal: 12,
  },
  inventoryItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  inventoryItemDescription: {
    fontSize: 12,
    color: '#666666',
    lineHeight: 16,
  },
  sendAgainButton: {
    backgroundColor: '#FF6B8A',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
  },
  sendAgainText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
    marginLeft: 4,
  },
  emptyInventory: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyInventoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyInventoryText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  shopNowButton: {
    backgroundColor: '#FF6B8A',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  shopNowButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: 20,
  },
  currencyModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  currencyModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 8,
    textAlign: 'center',
  },
  currencyModalDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 20,
    textAlign: 'center',
  },
  currencyPackage: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E1E1E1',
  },
  packageInfo: {
    flex: 1,
  },
  coinsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  packageAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginLeft: 8,
  },
  packageBonus: {
    fontSize: 12,
    color: '#4CAF50',
    marginTop: 4,
  },
  packagePrice: {
    backgroundColor: '#9C6ADE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  priceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  closeModalButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  closeModalText: {
    fontSize: 14,
    color: '#666666',
  },
});