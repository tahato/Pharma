import { StyleSheet, Text, View } from 'react-native'
import React from 'react'

export default function DetailField({label,info}) {
  return (
    <View style={styles.field}>
      <Text style={{fontSize:14}} >{label}</Text>
      <Text>{info}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
    field:{
        display:'flex',
        flexDirection:'row',
        justifyContent:'space-between',
        alignItems:'center',
        paddingVertical:10,
        paddingHorizontal:20,
    }
})