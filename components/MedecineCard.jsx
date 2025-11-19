import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { MaterialIcons } from '@expo/vector-icons';
import images from '../constants/images';
import { router } from 'expo-router';

export default function MedecineCard() {
  return (
    <TouchableOpacity
      
      style={{display:'flex',flexDirection:'row',padding:5, margin:5,borderRadius:20,backgroundColor:'white', justifyContent:"space-between"}}
      onPress={() => router.push("../medicins")}
    >
      <View style={{display:'flex',flexDirection:'row' ,gap:5}}>
        <Image source={images.mainLogo} style={{height:60, width:60}} />
        <View>
          <Text style={{marginBottom:5,fontSize:18,fontWeight:'bold'}} >name</Text>
          <Text style={{fontSize:16}} >price</Text>
        </View>
      </View>
      <View style={{display:'flex',flexDirection:'row',alignItems:'center'}}>
        <Text style={{fontSize:16}}>quantity</Text>
        <MaterialIcons name="keyboard-arrow-right" size={20} color={"gray"} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({})