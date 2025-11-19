import { ImageBackground } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import {
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import images from "../constants/images";
import * as FileSystem from "expo-file-system/legacy";


export default function addProducts() {
  const [name, setName] = useState();
  const [barCode, setBarCode] = useState();
  const [image, setImage] = useState();
  const [classe, setClasse] = useState();
  const [qt, setQt] = useState();
  const [htPerice, setHtPrice] = useState();
  const [ppa, setPpa] = useState();
  const pickImage = async () => {
    // No permissions request is necessary for launching the image library
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
        alert("Permission to access gallery is required!");
        return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    // console.log(result);

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      const uri = result.assets[0].uri;
      const fileName = uri.split("/").pop();
      const destPath = `${FileSystem.documentDirectory}${fileName}`;
      console.log("destpath", destPath);

      try {
        await FileSystem.copyAsync({
          from: uri,
          to: destPath,
        });
        console.log("Image saved to:", destPath);
      } catch (error) {
        console.error("Error saving image:", error);
      }
    }
  };
  return (
    <ImageBackground
      source={images.identifier}
      contentFit="cover"
      style={{ flex: 1, position: "relative", backgroundColor: "#f0f0f0" }}
    >
      <View style={styles.container}>
        {Image && <Image source={{ uri: image }} style={styles.image} />}
        <TouchableOpacity
          style={[styles.button, { backgroundColor: "lightblue" }]}
          onPress={pickImage}
        >
          <Text>Ajouter image</Text>
        </TouchableOpacity>
        <View style={styles.inputContainer}>
          <Text style={styles.lable}>Code Bar: </Text>
          <TextInput
            style={styles.input}
            // keyboardType='email'
            value=""
            // style={[styles.input, error && { borderColor: 'red' }]}
            onChangeText={(e) => setEmail(e)}
          />
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.lable}>Nom: </Text>
          <TextInput
            style={styles.input}
            // keyboardType='email'
            value=""
            // style={[styles.input, error && { borderColor: 'red' }]}
            onChangeText={(e) => setEmail(e)}
          />
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.lable}>Classe: </Text>
          <TextInput
            style={styles.input}
            // keyboardType='email'
            value=""
            // style={[styles.input, error && { borderColor: 'red' }]}
            onChangeText={(e) => setEmail(e)}
          />
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.lable}>Quantité: </Text>
          <TextInput
            style={styles.input}
            // keyboardType='email'
            value=""
            keyboardType="number"
            // style={[styles.input, error && { borderColor: 'red' }]}
            onChangeText={(e) => setEmail(e)}
          />
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.lable}>Date Per: </Text>
          <TextInput
            style={styles.input}
            // keyboardType='email'
            value=""
            // style={[styles.input, error && { borderColor: 'red' }]}
            onChangeText={(e) => setEmail(e)}
          />
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.lable}>Prix Ht: </Text>
          <TextInput
            style={styles.input}
            // keyboardType='email'
            value=""
            // style={[styles.input, error && { borderColor: 'red' }]}
            onChangeText={(e) => setEmail(e)}
          />
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.lable}>PPA: </Text>
          <TextInput
            style={styles.input}
            // keyboardType='email'
            value=""
            // style={[styles.input, error && { borderColor: 'red' }]}
            onChangeText={(e) => setEmail(e)}
          />
        </View>
      </View>
    </ImageBackground>
  );
}
// <View className="p-4 flex-col mx-4 items-center gap-4">

const styles = StyleSheet.create({
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: 20,
    marginVertical: 20,
    gap:20
  },
  lable: {
    width: "25%",
  },
  button: {
    backgroundColor: "lightgreen",
    width: "40%",
    padding: 10,
    borderRadius: 20,
    alignItems: "center",
  },
  image: {
    width: 150,
    height: 150,
  },
  inputContainer: {
    display: "flex",
    flexDirection: "row",
    width: "100%",
    alignItems: "center",
    gap: 2,
  },
  input: {
    color: "black",
    backgroundColor: "white",
    flex: 1,
    borderRadius: 50,
  },
});
