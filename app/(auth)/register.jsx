import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScrollView } from 'react-native';
import { ImageBackground } from 'expo-image';
import images from '../../constants/images';
import Form from '../../components/Form';

export default function register() {
    const insets = useSafeAreaInsets();

  return (
  <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
            <ScrollView
                contentContainerStyle={{ height: '100%', flex: 1 }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <ImageBackground

                        source={images.identifier}
                        style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
                        contentFit="cover"

                    >
                        <Form  screen="register" />
                     
                    </ImageBackground>
                </KeyboardAvoidingView>
            </ScrollView>
        </SafeAreaView>
  )
}

const styles = StyleSheet.create({})