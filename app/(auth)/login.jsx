import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ImageBackground } from 'expo-image'
import images from '../../constants/images'
import Form from '../../components/Form'
import { KeyboardAvoidingView } from 'react-native'

export default function login() {
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
                           <Form screen="login" />
                         
                       </ImageBackground>
                   </KeyboardAvoidingView>
               </ScrollView>
           </SafeAreaView>
  )
}

const styles = StyleSheet.create({})