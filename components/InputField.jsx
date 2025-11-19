import { StyleSheet, Text, View } from "react-native";

export default function InputField() {
  return (
    <View className="flex-row w-full items-center gap-2 ">
      <Text style={styles.lable}>Quantité: </Text>
      <TextInput
        className="text-black bg-white flex-1 rounded-xl"
        keyboardType="number"
        onChangeText={(e) => setEmail(e)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
    inputContainer:{
        display:'flex',
        flexDirection:'row',
        width:'100%',
        alignItems:'center',
        gap:2
    },
    input:{
        color:'black',
        backgroundColor:'white',
        flex:1,
        borderRadius:50
    }
});
