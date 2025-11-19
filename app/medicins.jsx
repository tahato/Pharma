import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import DetailField from "../components/DetailField";
import images from "../constants/images";
import { ImageBackground } from "expo-image";

export default function medicins() {
  const mdts = [
    { label: "Quantité", info: "100" },
    { label: "Classe", info: "medicament" },
    { label: "Prix Ht", info: "1000 DA" },
    { label: "Prix vente", info: "1250 DA" },
  ];
  return (
    <View style={styles.container}>
      <ImageBackground
        source={images.identifier}
        contentFit="cover"
        style={{ flex: 1, position: "relative", backgroundColor: "#f0f0f0" }}
      >
        <View style={styles.image}>
          <Image source={images.mainLogo} />
          <Text style={{ fontSize: 16, fontWeight: "semibold", marginTop: 5 }}>
            Nom de medicament
          </Text>
        </View>

        <View className="p-4  bg-white rounded-xl ">
          <View>
            {mdts.map((mdt, i) => (
              <DetailField key={i} label={mdt.label} info={mdt.info} />
            ))}
          </View>
        </View>
        <View style={styles.buttonsContainer}>
          <TouchableOpacity style={styles.button}>
            <Text>Ajouter</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: "lightblue" }]}
          >
            <Text>Déstocker</Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "column",
   
  },
  image: {
    justifyContent: "center",
    alignItems: "center",
    margin: 10,
  },
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    width: "100%",
  },
  button: {
    backgroundColor: "lightgreen",
    width: "40%",
    padding: 10,
    borderRadius: 50,
    alignItems: "center",
  },
});
