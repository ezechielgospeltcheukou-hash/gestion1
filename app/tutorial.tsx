import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowRight, Check, ShoppingCart, Package, Users, MessageSquare, DollarSign, PieChart, FileText, Calendar, ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';

const TUTORIAL_STEPS = [
  {
    id: 1,
    title: 'Bienvenue !',
    description: 'Cette application vous aide à gérer votre commerce, vos ventes, votre stock et vos employés.',
    icon: <ShoppingCart size={80} color="#059669" />,
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1000&q=80'
  },
  {
    id: 2,
    title: 'Gestion du Stock',
    description: 'Ajoutez vos produits, gérez les quantités et recevez des alertes pour les stocks bas.',
    icon: <Package size={80} color="#f59e0b" />,
    image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1000&q=80'
  },
  {
    id: 3,
    title: 'Enregistrer des Ventes',
    description: 'Enregistrez rapidement vos ventes, gérez les paiements multiples et suivez vos revenus.',
    icon: <DollarSign size={80} color="#10b981" />,
    image: 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=1000&q=80'
  },
  {
    id: 4,
    title: 'Gestion des Employés',
    description: 'Ajoutez vos employés, définissez leurs permissions et suivez leurs actions.',
    icon: <Users size={80} color="#3b82f6" />,
    image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1000&q=80'
  },
  {
    id: 5,
    title: 'Chat Interne',
    description: 'Communiquez avec vos employés directement depuis l\'application.',
    icon: <MessageSquare size={80} color="#8b5cf6" />,
    image: 'https://images.unsplash.com/photo-1531746790731-6c087fecd65a?w=1000&q=80'
  },
  {
    id: 6,
    title: 'Rapports et Bilans',
    description: 'Visualisez vos performances avec des graphiques et des rapports détaillés.',
    icon: <PieChart size={80} color="#ec4899" />,
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1000&q=80'
  },
  {
    id: 7,
    title: 'Factures & Rendez-vous',
    description: 'Gérez vos factures et vos rendez-vous clients en un seul endroit.',
    icon: <FileText size={80} color="#0ea5e9" />,
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1000&q=80'
  }
];

export default function TutorialScreen() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);

  const goToNext = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      router.replace('/(auth)');
    }
  };

  const goToPrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipToEnd = () => {
    router.replace('/(auth)');
  };

  const step = TUTORIAL_STEPS[currentStep];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#059669" barStyle="light-content" />

      <View style={styles.header}>
        {currentStep > 0 ? (
          <TouchableOpacity onPress={goToPrev} style={styles.headerBtn}>
            <ArrowLeft color="white" size={24} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 48 }} />
        )}
        <TouchableOpacity onPress={skipToEnd}>
          <Text style={styles.skipText}>Passer</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.stepContainer}>
          <View style={styles.imageContainer}>
            {step.image ? (
              <Image 
                source={{ uri: step.image }} 
                style={styles.stepImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.iconContainer}>{step.icon}</View>
            )}
          </View>

          <View style={styles.dotsContainer}>
            {TUTORIAL_STEPS.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  { backgroundColor: index === currentStep ? '#059669' : '#d1d5db' }
                ]}
              />
            ))}
          </View>

          <Text style={styles.title}>{step.title}</Text>
          <Text style={styles.description}>{step.description}</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.nextBtn} onPress={goToNext}>
          <Text style={styles.nextBtnText}>
            {currentStep === TUTORIAL_STEPS.length - 1 ? 'Commencer' : 'Suivant'}
          </Text>
          {currentStep < TUTORIAL_STEPS.length - 1 ? (
            <ArrowRight size={20} color="white" />
          ) : (
            <Check size={20} color="white" />
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 45
  },
  headerBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  skipText: {
    fontSize: 16,
    color: '#4b5563',
    fontWeight: '600'
  },
  content: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 10
  },
  stepContainer: {
    flex: 1,
    alignItems: 'center'
  },
  imageContainer: {
    width: '100%',
    height: 300,
    borderRadius: 25,
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
    marginBottom: 30
  },
  stepImage: {
    width: '100%',
    height: '100%'
  },
  iconContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center'
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 30
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 15
  },
  description: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 20
  },
  footer: {
    padding: 20,
    paddingBottom: 30
  },
  nextBtn: {
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 15,
    gap: 10
  },
  nextBtnText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold'
  }
});
