import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import EvilIcons from 'react-native-vector-icons/EvilIcons';
import React from 'react'

export default function SearchInput() {
  return (
    <View style={styles.container}>
        <TextInput style={{display:'flex',width:"70%",fontSize:14,marginHorizontal:15}} />
        <TouchableOpacity>
        <EvilIcons name='search' size={20}/>
        </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container:{
    borderWidth:1,
    backgroundColor:'white',
    borderColor:'light-gray',
    display:'flex',
    flexDirection:'row',
    borderRadius:50,
    justifyContent:'space-between',
    alignItems:'center',
  }
})